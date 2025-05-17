# Agroverse Vision: A Plant Disease Diagnosis System Using CLIP Embeddings and Vector Similarity Search

## Abstract

Agroverse Vision is a full-stack application that leverages computer vision and machine learning to diagnose plant diseases. The system utilizes OpenAI's CLIP model for image embeddings and implements vector similarity search through Supabase's pgvector extension to provide accurate disease diagnoses with comprehensive confidence metrics.

## 1. Introduction

Plant disease diagnosis is crucial for agricultural productivity and food security. Traditional diagnosis methods often require expert knowledge and can be time-consuming. Agroverse Vision addresses these challenges by providing an automated, accurate, and user-friendly solution for plant disease diagnosis.

## 2. System Architecture

### 2.1 Technology Stack
- **Frontend**: React with TypeScript and Material-UI
- **Backend**: Python with FastAPI
- **Database**: Supabase (PostgreSQL with pgvector)
- **ML Model**: OpenAI's CLIP (ViT-L/14)
- **Vector Search**: Cosine similarity with pgvector

### 2.2 Core Components

#### 2.2.1 Image Processing Pipeline
1. Image upload through web interface
2. CLIP model processing (ViT-L/14 variant)
3. Embedding generation
4. Vector similarity search
5. Confidence metrics calculation

#### 2.2.2 Diagnosis Engine
The system implements a sophisticated diagnosis engine that provides:
- Primary disease identification
- Confidence scoring
- Alternative diagnoses
- Symptom overlap analysis
- Seasonal relevance assessment

## 3. Methodology

### 3.1 Image Embedding Generation
The system uses CLIP's ViT-L/14 model to generate 768-dimensional embeddings for plant images. The model is loaded on GPU when available, falling back to CPU when necessary.

### 3.2 Vector Similarity Search
The system implements a vector similarity search using cosine similarity through pgvector:
```sql
1 - (disease_reference_images.embedding <=> query_embedding) AS similarity
```
A match threshold of 0.7 is used to filter results, with a default of 5 matches returned.

### 3.3 Confidence Metrics

The system implements a comprehensive set of confidence metrics to provide a multi-dimensional assessment of diagnosis reliability. Each metric is calculated using specific mathematical formulas and thresholds.

#### 3.3.1 Absolute Confidence
The raw similarity score from vector search, calculated using cosine similarity:

\[
\text{Absolute Confidence} = 1 - \frac{\vec{a} \cdot \vec{b}}{|\vec{a}| |\vec{b}|}
\]

Where:
- \(\vec{a}\) is the query image embedding vector
- \(\vec{b}\) is the reference disease image embedding vector
- The result is normalized between 0 and 1

#### 3.3.2 Relative Confidence
Measures how much more confident the system is in the primary diagnosis compared to the next best match:

\[
\text{Relative Confidence} = \frac{C_{primary}}{C_{secondary}}
\]

Where:
- \(C_{primary}\) is the confidence score of the primary diagnosis
- \(C_{secondary}\) is the confidence score of the second-best match
- Values > 1 indicate the primary diagnosis is more confident
- Values approaching 1 suggest uncertainty between diagnoses

#### 3.3.3 Confidence Margin
Quantifies the absolute difference between the primary and secondary diagnosis scores:

\[
\text{Confidence Margin} = C_{primary} - C_{secondary}
\]

Where:
- \(C_{primary}\) is the confidence score of the primary diagnosis
- \(C_{secondary}\) is the confidence score of the second-best match
- Range: 0 to 1
- Higher values indicate stronger distinction between diagnoses

#### 3.3.4 Diagnosis Clarity
Measures how distinct the primary diagnosis is from all alternatives:

\[
\text{Diagnosis Clarity} = \frac{C_{primary} - \bar{C}_{alternatives}}{C_{primary}}
\]

Where:
- \(C_{primary}\) is the confidence score of the primary diagnosis
- \(\bar{C}_{alternatives}\) is the mean confidence score of all alternative diagnoses
- Range: 0 to 1
- Higher values indicate clearer distinction from alternatives

#### 3.3.5 Symptom Overlap
Uses Jaccard similarity to measure symptom similarity between diagnoses:

\[
\text{Symptom Overlap} = \frac{|S_{primary} \cap S_{alternative}|}{|S_{primary} \cup S_{alternative}|}
\]

Where:
- \(S_{primary}\) is the set of symptoms from the primary diagnosis
- \(S_{alternative}\) is the set of symptoms from an alternative diagnosis
- The sets are preprocessed by:
  - Converting to lowercase
  - Removing punctuation
  - Removing common words (e.g., 'and', 'or', 'the', 'in', 'on', 'at', 'to', 'of', 'with', 'may', 'can')
- Range: 0 to 1
- Higher values indicate more similar symptoms

#### 3.3.6 Seasonal Relevance
Time-based relevance score that considers the current season:

\[
\text{Seasonal Relevance} = \begin{cases}
1.0 & \text{if current month } \in \text{ peak months} \\
0.7 & \text{if current month } \in \text{ moderate months} \\
0.3 & \text{otherwise}
\end{cases}
\]

Where:
- Peak months: Months of highest disease prevalence
- Moderate months: Months of moderate disease prevalence
- Current month is determined using the system's datetime

#### 3.3.7 Confidence Score Interpretation

The system uses the following thresholds for confidence interpretation:

\[
\text{Confidence Level} = \begin{cases}
\text{High} & \text{if } C \geq 0.8 \\
\text{Medium} & \text{if } 0.6 \leq C < 0.8 \\
\text{Low} & \text{if } C < 0.6
\end{cases}
\]

Where:
- \(C\) is any confidence metric score
- High confidence is indicated by green in the UI
- Medium confidence is indicated by yellow
- Low confidence is indicated by red

#### 3.3.8 Combined Confidence Assessment

The system provides a comprehensive confidence assessment by considering all metrics together:

\[
\text{Overall Confidence} = w_1C_{absolute} + w_2C_{relative} + w_3C_{clarity} + w_4(1 - O_{symptoms}) + w_5R_{seasonal}
\]

Where:
- \(w_1, w_2, w_3, w_4, w_5\) are weights for each metric
- \(C_{absolute}\) is the absolute confidence
- \(C_{relative}\) is the relative confidence
- \(C_{clarity}\) is the diagnosis clarity
- \(O_{symptoms}\) is the maximum symptom overlap
- \(R_{seasonal}\) is the seasonal relevance

#### 3.3.9 Implementation Notes

1. **Vector Similarity Search**:
   - Uses pgvector's cosine similarity operator (<=>)
   - Match threshold set to 0.7
   - Returns top 5 matches by default

2. **Symptom Processing**:
   - Implements text preprocessing for symptom comparison
   - Uses set operations for efficient overlap calculation
   - Handles edge cases (empty symptoms, missing data)

3. **Seasonal Patterns**:
   - Stored in a database table for easy updates
   - Considers both peak and moderate months
   - Can be adjusted based on geographical location

4. **Confidence Visualization**:
   - Uses color coding for quick interpretation
   - Provides detailed metrics in expandable UI components
   - Shows alternative diagnoses with their confidence scores

## 4. Results and Performance

### 4.1 Test Results
The system was tested with a dataset of tomato diseases:
- Early Blight
- Late Blight
- Leaf Mold
- Septoria Leaf Spot
- Healthy plants

### 4.2 Performance Metrics

#### 4.2.1 Confidence Scoring
- High confidence: ≥ 0.8 (green)
- Medium confidence: 0.6-0.8 (yellow)
- Low confidence: < 0.6 (red)

#### 4.2.2 Diagnosis Clarity
- High clarity: ≥ 0.7
- Medium clarity: 0.4-0.7
- Low clarity: < 0.4

### 4.3 Seasonal Relevance
The system implements a seasonal relevance scoring system:
- Peak season: 1.0
- Moderate season: 0.7
- Off-season: 0.3

## 5. User Interface

### 5.1 Diagnosis Display
The frontend provides a comprehensive diagnosis display:
- Primary diagnosis with confidence score
- Detailed description and symptoms
- Treatment recommendations
- Advanced metrics visualization
- Alternative diagnoses with confidence scores

### 5.2 History Tracking
The system maintains a history of diagnoses:
- Stores up to 20 recent diagnoses
- Includes timestamps and images
- Provides comparison capabilities

## 6. API Endpoints

### 6.1 Core Endpoints
- `POST /diagnose/upload`: Upload and analyze plant images
- `GET /diseases`: List known plant diseases
- `GET /diagnosis/{id}`: Retrieve specific diagnosis details

### 6.2 Response Format
```typescript
interface DiagnosisResponse {
  success: boolean;
  diagnosis: {
    primary_disease: string;
    confidence: number;
    description: string;
    symptoms: string;
    recommendation: string;
    confidence_metrics: {
      relative_confidence: number;
      confidence_margin: number;
      diagnosis_clarity: number;
      symptom_overlap: Array<{
        disease: string;
        overlap_score: number;
      }>;
      seasonal_relevance: number;
    }
  };
  alternative_diagnoses: Array<{
    disease_name: string;
    confidence: number;
    description: string;
  }>;
}
```

## 7. Future Improvements

1. **Model Enhancement**
   - Fine-tune CLIP model on plant disease dataset
   - Implement ensemble methods for improved accuracy

2. **Feature Expansion**
   - Add disease progression tracking
   - Implement treatment effectiveness monitoring
   - Include weather-based risk assessment

3. **Performance Optimization**
   - Implement caching for frequent diagnoses
   - Optimize vector search performance
   - Add batch processing capabilities

## 8. Conclusion

Agroverse Vision demonstrates the effective application of modern computer vision and vector similarity search techniques in plant disease diagnosis. The system provides accurate diagnoses with comprehensive confidence metrics, making it a valuable tool for agricultural professionals and enthusiasts.

## References

1. OpenAI CLIP: Learning Transferable Visual Models From Natural Language Supervision
2. Supabase pgvector: Vector similarity search in PostgreSQL
3. PlantVillage Dataset: A large-scale dataset for plant disease classification 