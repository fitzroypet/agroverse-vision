export interface Disease {
  id: string;
  disease_name: string;
  description: string;
  symptoms: string;
  recommendation: string;
  image_url: string;
  created_at: string;
}

export interface SymptomOverlap {
  disease: string;
  overlap_score: number;
}

export interface ConfidenceMetrics {
  relative_confidence: number;
  confidence_margin: number;
  diagnosis_clarity: number;
  symptom_overlap: SymptomOverlap[];
  seasonal_relevance: number;
}

export interface Diagnosis {
  primary_disease: string;
  confidence: number;
  description: string;
  symptoms: string;
  recommendation: string;
  confidence_metrics: ConfidenceMetrics;
}

export interface AlternativeDiagnosis {
  disease_name: string;
  confidence: number;
  description: string;
}

export interface DiagnosisResult {
  success: boolean;
  error?: string;
  diagnosis: Diagnosis;
  alternative_diagnoses: AlternativeDiagnosis[];
  id?: string;
  image_url?: string;
  timestamp?: string;
} 