import os
import logging
import numpy as np
import torch
import clip
from PIL import Image
import requests
from io import BytesIO
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_KEY", "")
)

def load_image_from_url(url: str) -> Optional[Image.Image]:
    """Load an image from a URL."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        logger.error(f"Error loading image from URL {url}: {str(e)}")
        return None

def generate_clip_embedding(image_url: str, model, preprocess, device: str) -> Optional[np.ndarray]:
    """Generate CLIP embedding for an image."""
    try:
        # Load and preprocess image
        image = load_image_from_url(image_url)
        if image is None:
            return None
            
        image_input = preprocess(image).unsqueeze(0).to(device)
        
        # Generate embedding
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
        # Convert to numpy array
        embedding = image_features.cpu().numpy()[0]
        
        # Ensure 768 dimensions
        if embedding.shape[0] != 768:
            logger.warning(f"Embedding dimension mismatch. Expected 768, got {embedding.shape[0]}")
            # Pad or truncate to 768 dimensions if necessary
            if embedding.shape[0] < 768:
                embedding = np.pad(embedding, (0, 768 - embedding.shape[0]))
            else:
                embedding = embedding[:768]
                
        return embedding
        
    except Exception as e:
        logger.error(f"Error generating CLIP embedding for {image_url}: {str(e)}")
        return None

def find_similar_diseases(embedding, match_threshold=0.7, match_count=5):
    try:
        result = supabase.rpc(
            'match_disease_images',
            {
                'query_embedding': embedding.tolist(),
                'match_threshold': match_threshold,
                'match_count': match_count
            }
        ).execute()
        return result.data
    except Exception as e:
        print(f"Error finding similar diseases: {e}")
        return []

def calculate_symptom_overlap(primary_symptoms: str, alternative_symptoms: str) -> float:
    """Calculate symptom overlap score between two symptom descriptions."""
    if not primary_symptoms or not alternative_symptoms:
        return 0.0
    
    # Convert symptoms strings to sets of words for comparison
    # Remove common words and punctuation for better matching
    common_words = {'and', 'or', 'the', 'in', 'on', 'at', 'to', 'of', 'with', 'may', 'can'}
    
    def process_symptoms(symptoms: str) -> set:
        words = set(symptoms.lower().replace(',', ' ').replace('.', ' ').split())
        return words - common_words
    
    primary_set = process_symptoms(primary_symptoms)
    alternative_set = process_symptoms(alternative_symptoms)
    
    if not primary_set or not alternative_set:
        return 0.0
    
    # Calculate Jaccard similarity for symptom overlap
    overlap = len(primary_set.intersection(alternative_set))
    total = len(primary_set.union(alternative_set))
    
    return overlap / total if total > 0 else 0.0

def calculate_seasonal_relevance(disease_name: str) -> float:
    """Calculate how relevant a disease is for the current season."""
    # Get current month (1-12)
    current_month = datetime.now().month
    
    # Define seasonal patterns for diseases (example mapping)
    # You might want to move this to a database or configuration file
    seasonal_patterns = {
        "bacterial spot": {"peak_months": [6, 7, 8], "moderate_months": [5, 9]},  # Summer disease
        "early blight": {"peak_months": [7, 8], "moderate_months": [6, 9]},      # Late summer
        "late blight": {"peak_months": [8, 9], "moderate_months": [7, 10]},      # Late summer/early fall
        "leaf mold": {"peak_months": [6, 7, 8, 9], "moderate_months": [5, 10]},  # Warm and humid months
        "septoria leaf spot": {"peak_months": [7, 8], "moderate_months": [6, 9]} # Mid-summer
        # Add more diseases and their seasonal patterns
    }
    
    # Default to moderate relevance if pattern unknown
    if disease_name.lower() not in seasonal_patterns:
        return 0.5
    
    pattern = seasonal_patterns[disease_name.lower()]
    
    # Calculate relevance based on current month
    if current_month in pattern["peak_months"]:
        return 1.0
    elif current_month in pattern["moderate_months"]:
        return 0.7
    else:
        return 0.3

def calculate_confidence_metrics(similar_diseases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate additional confidence metrics for the diagnosis."""
    if not similar_diseases:
        return {}
    
    # Get all confidence scores
    confidences = [d.get("similarity", 0.0) for d in similar_diseases]
    primary_confidence = confidences[0]
    
    # Calculate basic metrics
    metrics = {
        "absolute_confidence": primary_confidence,
        "relative_confidence": 0.0,
        "confidence_margin": 0.0,
        "diagnosis_clarity": 0.0,
        "symptom_overlap": [],
        "seasonal_relevance": 0.0
    }
    
    if len(confidences) > 1:
        # Calculate existing metrics
        metrics["relative_confidence"] = primary_confidence / confidences[1] if confidences[1] > 0 else float('inf')
        metrics["confidence_margin"] = primary_confidence - confidences[1]
        
        avg_other_confidence = sum(confidences[1:]) / len(confidences[1:])
        metrics["diagnosis_clarity"] = (primary_confidence - avg_other_confidence) / primary_confidence if primary_confidence > 0 else 0.0
        
        # Calculate symptom overlap with alternatives
        primary_symptoms = similar_diseases[0].get("symptoms", "")
        for disease in similar_diseases[1:]:
            overlap = calculate_symptom_overlap(primary_symptoms, disease.get("symptoms", ""))
            metrics["symptom_overlap"].append({
                "disease": disease.get("disease_name", "Unknown"),
                "overlap_score": overlap
            })
        
        # Calculate seasonal relevance
        metrics["seasonal_relevance"] = calculate_seasonal_relevance(similar_diseases[0].get("disease_name", ""))
    
    return metrics

def diagnose_plant_disease(image_url: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Diagnose plant disease from an image URL.
    
    Args:
        image_url: URL of the plant image to diagnose
        top_k: Number of similar diseases to return
        
    Returns:
        Dictionary containing diagnosis results
    """
    # Load CLIP model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    try:
        model, preprocess = clip.load("ViT-L/14", device=device)
    except Exception as e:
        logger.error(f"Error loading CLIP model: {str(e)}")
        return {
            "success": False,
            "error": "Failed to load CLIP model",
            "details": str(e)
        }
    
    # Generate embedding
    embedding = generate_clip_embedding(image_url, model, preprocess, device)
    if embedding is None:
        return {
            "success": False,
            "error": "Failed to generate image embedding"
        }
    
    # Find similar diseases
    similar_diseases = find_similar_diseases(embedding, 0.7, top_k)
    
    if not similar_diseases:
        return {
            "success": False,
            "error": "No similar diseases found"
        }
    
    # Calculate confidence metrics
    confidence_metrics = calculate_confidence_metrics(similar_diseases)
    
    # Format results
    results = {
        "success": True,
        "diagnosis": {
            "primary_disease": similar_diseases[0].get("disease_name", "Unknown Disease"),
            "confidence": similar_diseases[0].get("similarity", 0.0),
            "description": similar_diseases[0].get("description", "No description available"),
            "symptoms": similar_diseases[0].get("symptoms", "No symptoms information available"),
            "recommendation": similar_diseases[0].get("recommendation", "No recommendations available"),
            "confidence_metrics": {
                "relative_confidence": confidence_metrics.get("relative_confidence", 0.0),
                "confidence_margin": confidence_metrics.get("confidence_margin", 0.0),
                "diagnosis_clarity": confidence_metrics.get("diagnosis_clarity", 0.0),
                "symptom_overlap": confidence_metrics.get("symptom_overlap", []),
                "seasonal_relevance": confidence_metrics.get("seasonal_relevance", 0.0)
            }
        },
        "alternative_diagnoses": [
            {
                "disease_name": disease.get("disease_name", "Unknown Disease"),
                "confidence": disease.get("similarity", 0.0),
                "description": disease.get("description", "No description available")
            }
            for disease in similar_diseases[1:]
        ]
    }
    
    return results

# Example usage
if __name__ == "__main__":
    # Example image URL
    test_image_url = "https://example.com/plant_disease.jpg"
    
    # Run diagnosis
    result = diagnose_plant_disease(test_image_url)
    
    # Print results
    if result["success"]:
        print(f"Primary Diagnosis: {result['diagnosis']['primary_disease']}")
        print(f"Confidence: {result['diagnosis']['confidence']:.2f}")
        print(f"Description: {result['diagnosis']['description']}")
        print(f"Symptoms: {result['diagnosis']['symptoms']}")
        print(f"Recommendation: {result['diagnosis']['recommendation']}")
        
        print("\nAlternative Diagnoses:")
        for alt in result["alternative_diagnoses"]:
            print(f"- {alt['disease_name']} (Confidence: {alt['confidence']:.2f})")
    else:
        print(f"Diagnosis failed: {result['error']}") 