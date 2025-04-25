import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Box,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { DiagnosisResult } from '../types';

const DiagnosisHistory: React.FC = () => {
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [diagnosisToDelete, setDiagnosisToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem('diagnosisHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleOpenDetails = (diagnosis: DiagnosisResult) => {
    setSelectedDiagnosis(diagnosis);
    setDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDialogOpen(false);
    setSelectedDiagnosis(null);
  };

  const handleDeleteClick = (id: string) => {
    setDiagnosisToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!diagnosisToDelete) return;

    try {
      const updatedHistory = history.filter(item => item.id !== diagnosisToDelete);
      localStorage.setItem('diagnosisHistory', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (err) {
      console.error('Error deleting diagnosis:', err);
    }

    setDeleteDialogOpen(false);
    setDiagnosisToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDiagnosisToDelete(null);
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'Date not available';
    return format(new Date(timestamp), 'PPpp');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Diagnosis History
      </Typography>

      {history.length === 0 ? (
        <Alert severity="info">
          No diagnosis history available. Start by diagnosing a plant!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {history.map((diagnosis) => (
            <Grid item xs={12} sm={6} md={4} key={diagnosis.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {diagnosis.image_url && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={diagnosis.image_url}
                    alt="Plant image"
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton
                      onClick={() => diagnosis.id && handleDeleteClick(diagnosis.id)}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Typography gutterBottom variant="h6" component="h2">
                    {diagnosis.diagnosis?.primary_disease}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatDate(diagnosis.timestamp)}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    Confidence: {(diagnosis.diagnosis?.confidence ?? 0 * 100).toFixed(1)}%
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenDetails(diagnosis)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedDiagnosis && (
          <>
            <DialogTitle>
              Diagnosis Details
            </DialogTitle>
            <DialogContent>
              {selectedDiagnosis.image_url && (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={selectedDiagnosis.image_url}
                    alt="Plant"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                {selectedDiagnosis.diagnosis?.primary_disease}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDate(selectedDiagnosis.timestamp)}
              </Typography>

              <Typography variant="body1" paragraph>
                <strong>Description:</strong> {selectedDiagnosis.diagnosis?.description}
              </Typography>

              <Typography variant="body1" paragraph>
                <strong>Symptoms:</strong> {selectedDiagnosis.diagnosis?.symptoms}
              </Typography>

              <Typography variant="body1" paragraph>
                <strong>Recommendation:</strong> {selectedDiagnosis.diagnosis?.recommendation}
              </Typography>

              {selectedDiagnosis.alternative_diagnoses && selectedDiagnosis.alternative_diagnoses.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Alternative Diagnoses
                  </Typography>
                  <List>
                    {selectedDiagnosis.alternative_diagnoses.map((alt, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={`${alt.disease_name} (${(alt.confidence * 100).toFixed(1)}%)`}
                            secondary={alt.description}
                          />
                        </ListItem>
                        {index < selectedDiagnosis.alternative_diagnoses!.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this diagnosis from your history?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiagnosisHistory; 