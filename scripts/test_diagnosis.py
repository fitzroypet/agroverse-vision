import os
import logging
import json
from dotenv import load_dotenv
from diagnose import diagnose_plant_disease
from supabase import create_client, Client

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

# Test images of tomato diseases
TEST_IMAGES = [
    {
        "url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Early_blight.JPG",
        "expected_disease": "Tomato Early Blight"
    },
    {
        "url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Late_blight.JPG",
        "expected_disease": "Tomato Late Blight"
    },
    {
        "url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Leaf_Mold.JPG",
        "expected_disease": "Tomato Leaf Mold"
    },
    {
        "url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Septoria_leaf_spot.JPG",
        "expected_disease": "Tomato Septoria Leaf Spot"
    },
    {
        "url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_healthy.JPG",
        "expected_disease": "Healthy"
    }
]

def add_test_diseases_to_db():
    """Add test tomato diseases to the database if they don't exist."""
    diseases = [
        {
            "disease_name": "Tomato Early Blight",
            "description": "A fungal disease caused by Alternaria solani that affects tomato leaves, stems, and fruits.",
            "symptoms": "Dark brown spots with concentric rings, yellowing around spots, older leaves affected first.",
            "recommendation": "Remove affected leaves, improve air circulation, apply fungicide if severe.",
            "image_url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Early_blight.JPG"
        },
        {
            "disease_name": "Tomato Late Blight",
            "description": "A devastating water mold disease caused by Phytophthora infestans.",
            "symptoms": "Dark brown to black lesions on leaves, white fuzzy growth underneath, rapid spread.",
            "recommendation": "Remove infected plants, improve drainage, use protective fungicides.",
            "image_url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Late_blight.JPG"
        },
        {
            "disease_name": "Tomato Leaf Mold",
            "description": "A fungal disease caused by Passalora fulva that primarily affects greenhouse tomatoes.",
            "symptoms": "Yellow to brown spots on leaves, fuzzy growth on underside, leaves eventually die.",
            "recommendation": "Improve ventilation, reduce humidity, remove affected leaves, apply fungicide.",
            "image_url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Leaf_Mold.JPG"
        },
        {
            "disease_name": "Tomato Septoria Leaf Spot",
            "description": "A fungal disease caused by Septoria lycopersici that affects tomato leaves.",
            "symptoms": "Small, circular spots with gray centers and dark borders, leaves turn yellow and drop.",
            "recommendation": "Remove infected leaves, improve air circulation, apply fungicide, rotate crops.",
            "image_url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_Septoria_leaf_spot.JPG"
        },
        {
            "disease_name": "Healthy",
            "description": "A healthy tomato plant with no signs of disease.",
            "symptoms": "None - plant is healthy.",
            "recommendation": "Continue regular maintenance and monitoring.",
            "image_url": "https://raw.githubusercontent.com/plantvillage/PlantVillage-Dataset/master/raw/color/Tomato_healthy.JPG"
        }
    ]
    
    for disease in diseases:
        # Check if disease already exists
        result = supabase.table("disease_reference_images").select("id").eq("disease_name", disease["disease_name"]).execute()
        
        if not result.data:
            logger.info(f"Adding {disease['disease_name']} to database...")
            supabase.table("disease_reference_images").insert(disease).execute()
        else:
            logger.info(f"{disease['disease_name']} already exists in database.")

def test_diagnosis():
    """Test the diagnosis system with sample tomato disease images."""
    results = []
    
    for test_case in TEST_IMAGES:
        logger.info(f"\nTesting image: {test_case['url']}")
        logger.info(f"Expected disease: {test_case['expected_disease']}")
        
        # Get diagnosis
        result = diagnose_plant_disease(test_case['url'])
        
        if result['success']:
            diagnosis = result['diagnosis']
            logger.info(f"Predicted disease: {diagnosis['primary_disease']}")
            logger.info(f"Confidence: {diagnosis['confidence']:.2f}")
            logger.info(f"Description: {diagnosis['description']}")
            
            # Store result
            results.append({
                'expected': test_case['expected_disease'],
                'predicted': diagnosis['primary_disease'],
                'confidence': diagnosis['confidence'],
                'correct': test_case['expected_disease'].lower() in diagnosis['primary_disease'].lower()
            })
        else:
            logger.error(f"Diagnosis failed: {result.get('error', 'Unknown error')}")
    
    # Print summary
    logger.info("\n=== Test Summary ===")
    correct = sum(1 for r in results if r['correct'])
    total = len(results)
    logger.info(f"Accuracy: {correct}/{total} ({(correct/total)*100:.1f}%)")
    
    logger.info("\nDetailed Results:")
    for r in results:
        status = "✅" if r['correct'] else "❌"
        logger.info(f"{status} Expected: {r['expected']}")
        logger.info(f"   Predicted: {r['predicted']} (Confidence: {r['confidence']:.2f})")
    
    # Save results to file
    with open('diagnosis_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    logger.info("\nResults saved to diagnosis_test_results.json")

if __name__ == "__main__":
    # First, add test diseases to the database
    add_test_diseases_to_db()
    
    # Then run the tests
    test_diagnosis() 