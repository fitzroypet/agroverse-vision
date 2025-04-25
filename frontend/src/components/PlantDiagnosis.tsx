import React, { useState, ChangeEvent } from 'react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Alert,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { v4 as uuidv4 } from 'uuid';
import { DiagnosisResult } from '../types';
import DiagnosisMetrics from './DiagnosisMetrics';

// Styled components
const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ResultCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

interface ConfidenceBadgeProps {
  confidence: number;
}

const ConfidenceBadge = styled(Box)<ConfidenceBadgeProps>(({ theme, confidence }) => ({
  display: 'inline-block',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: confidence > 0.8 
    ? theme.palette.success.light 
    : confidence > 0.6 
      ? theme.palette.warning.light 
      : theme.palette.error.light,
  color: theme.palette.common.white,
  fontWeight: 'bold',
}));

const PlantDiagnosis: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
      setError(null);
    }
  };

  const handleDiagnose = async () => {
    if (!image) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', image);
      
      // Call our API endpoint
      const response = await fetch('/diagnose/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add detailed debug logging
      console.log('Raw diagnosis response:', data);
      console.log('Diagnosis details:', {
        primary_disease: data.diagnosis?.primary_disease,
        confidence: data.diagnosis?.confidence,
        description: data.diagnosis?.description,
        symptoms: data.diagnosis?.symptoms,
        recommendation: data.diagnosis?.recommendation
      });
      
      // Add an ID for history tracking
      const resultWithId: DiagnosisResult = {
        ...data,
        id: uuidv4(),
        image_url: imagePreview || '',
        timestamp: new Date().toISOString()
      };
      
      setResult(resultWithId);
      
      // Save to history
      saveToHistory(resultWithId);
      
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveToHistory = (diagnosisResult: DiagnosisResult) => {
    try {
      // Get existing history
      const existingHistory = localStorage.getItem('diagnosisHistory');
      let history: DiagnosisResult[] = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add new diagnosis to history (limit to 20 entries)
      history = [diagnosisResult, ...history].slice(0, 20);
      
      // Save back to localStorage
      localStorage.setItem('diagnosisHistory', JSON.stringify(history));
    } catch (err) {
      console.error('Error saving to history:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Plant Disease Diagnosis
      </Typography>
      
      <Typography variant="body1" paragraph>
        Upload a photo of your plant to diagnose potential diseases.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="image-upload"
          type="file"
          onChange={handleImageChange}
        />
        
        <label htmlFor="image-upload">
          <UploadBox component="span">
            {imagePreview ? (
              <Box sx={{ position: 'relative' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} 
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Click to change image
                </Typography>
              </Box>
            ) : (
              <Typography>
                Click to upload an image or drag and drop
              </Typography>
            )}
          </UploadBox>
        </label>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDiagnose}
            disabled={!image || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Diagnosing...' : 'Diagnose Plant'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && result.success && result.diagnosis && (
        <ResultCard>
          <CardHeader 
            title="Diagnosis Results" 
            subheader={result.success ? "Analysis complete" : "Analysis failed"}
          />
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Primary Diagnosis: {result.diagnosis.primary_disease}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <ConfidenceBadge confidence={result.diagnosis.confidence}>
                Confidence: {(result.diagnosis.confidence * 100).toFixed(1)}%
              </ConfidenceBadge>
            </Box>
            
            <Typography variant="body1" paragraph>
              <strong>Description:</strong> {result.diagnosis.description}
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>Symptoms:</strong> {result.diagnosis.symptoms}
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>Recommendation:</strong> {result.diagnosis.recommendation || 'No recommendations available'}
            </Typography>
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <DiagnosisMetrics metrics={result.diagnosis.confidence_metrics} />
            </Box>
            
            {result.alternative_diagnoses && result.alternative_diagnoses.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Alternative Diagnoses
                </Typography>
                <List>
                  {result.alternative_diagnoses.map((alt, index) => (
                    <ListItem key={index} divider={index < result.alternative_diagnoses!.length - 1}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {alt.disease_name}
                            </Typography>
                            <ConfidenceBadge confidence={alt.confidence}>
                              {(alt.confidence * 100).toFixed(1)}%
                            </ConfidenceBadge>
                          </Box>
                        }
                        secondary={alt.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </ResultCard>
      )}
    </Box>
  );
};

export default PlantDiagnosis; 