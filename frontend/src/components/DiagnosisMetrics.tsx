import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  styled
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

interface SymptomOverlap {
  disease: string;
  overlap_score: number;
}

interface ConfidenceMetrics {
  relative_confidence: number;
  confidence_margin: number;
  diagnosis_clarity: number;
  symptom_overlap: SymptomOverlap[];
  seasonal_relevance: number;
}

interface DiagnosisMetricsProps {
  metrics: ConfidenceMetrics;
}

const MetricRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(1)
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  minWidth: 160,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary
}));

const MetricValue = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const DiagnosisMetrics: React.FC<DiagnosisMetricsProps> = ({ metrics }) => {
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  
  const getConfidenceColor = (value: number) => {
    if (value >= 0.7) return 'success.main';
    if (value >= 0.4) return 'warning.main';
    return 'error.main';
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">Advanced Diagnosis Metrics</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <MetricRow>
          <MetricLabel>
            Diagnosis Clarity
            <Tooltip title="How distinct the primary diagnosis is from alternatives. Higher is better.">
              <InfoIcon fontSize="small" />
            </Tooltip>
          </MetricLabel>
          <MetricValue>
            <LinearProgress
              variant="determinate"
              value={metrics.diagnosis_clarity * 100}
              sx={{ flex: 1, backgroundColor: 'grey.200' }}
              color={metrics.diagnosis_clarity >= 0.7 ? "success" : "warning"}
            />
            <Typography variant="body2">
              {formatPercentage(metrics.diagnosis_clarity)}
            </Typography>
          </MetricValue>
        </MetricRow>

        <MetricRow>
          <MetricLabel>
            Seasonal Relevance
            <Tooltip title="How common this disease is in the current season">
              <InfoIcon fontSize="small" />
            </Tooltip>
          </MetricLabel>
          <MetricValue>
            <LinearProgress
              variant="determinate"
              value={metrics.seasonal_relevance * 100}
              sx={{ flex: 1, backgroundColor: 'grey.200' }}
              color={metrics.seasonal_relevance >= 0.7 ? "success" : "warning"}
            />
            <Typography variant="body2">
              {formatPercentage(metrics.seasonal_relevance)}
            </Typography>
          </MetricValue>
        </MetricRow>

        <MetricRow>
          <MetricLabel>
            Relative Confidence
            <Tooltip title="How much more confident the system is in the primary diagnosis compared to alternatives">
              <InfoIcon fontSize="small" />
            </Tooltip>
          </MetricLabel>
          <Typography variant="body2" color={getConfidenceColor(metrics.relative_confidence / 2)}>
            {metrics.relative_confidence.toFixed(1)}x more confident than alternatives
          </Typography>
        </MetricRow>

        {metrics.symptom_overlap.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Symptom Overlap with Alternatives
            </Typography>
            {metrics.symptom_overlap.map((overlap, index) => (
              <MetricRow key={index}>
                <MetricLabel>{overlap.disease}</MetricLabel>
                <MetricValue>
                  <LinearProgress
                    variant="determinate"
                    value={overlap.overlap_score * 100}
                    sx={{ flex: 1, backgroundColor: 'grey.200' }}
                    color={overlap.overlap_score >= 0.7 ? "warning" : "success"}
                  />
                  <Typography variant="body2">
                    {formatPercentage(overlap.overlap_score)}
                  </Typography>
                </MetricValue>
              </MetricRow>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default DiagnosisMetrics; 