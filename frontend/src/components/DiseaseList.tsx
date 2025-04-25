import React, { useState, useEffect, ChangeEvent } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Box, 
  CircularProgress, 
  Alert,
  Pagination,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Disease } from '../types';
import { supabase } from '../lib/supabase';

const DiseaseList: React.FC = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredDiseases, setFilteredDiseases] = useState<Disease[]>([]);
  
  const itemsPerPage = 9;
  
  useEffect(() => {
    fetchDiseases();
  }, []);
  
  useEffect(() => {
    // Filter diseases based on search term
    if (searchTerm.trim() === '') {
      setFilteredDiseases(diseases);
    } else {
      const filtered = diseases.filter(disease => 
        disease.disease_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disease.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disease.symptoms.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDiseases(filtered);
    }
    
    // Reset to first page when search term changes
    setPage(1);
  }, [searchTerm, diseases]);
  
  useEffect(() => {
    // Calculate total pages based on filtered diseases
    setTotalPages(Math.ceil(filteredDiseases.length / itemsPerPage));
  }, [filteredDiseases]);
  
  const fetchDiseases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_KEY) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }
      
      const { data, error } = await supabase
        .from('disease_reference_images')
        .select('id, disease_name, description, symptoms, recommendation, image_url, created_at')
        .order('disease_name');
      
      if (error) throw error;
      
      setDiseases(data || []);
      setFilteredDiseases(data || []);
    } catch (err) {
      console.error('Error fetching diseases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load diseases. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Calculate paginated diseases
  const paginatedDiseases = filteredDiseases.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Plant Diseases Database
      </Typography>
      
      <Typography variant="body1" paragraph>
        Browse our database of plant diseases, their symptoms, and recommended treatments.
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search diseases..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : filteredDiseases.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          No diseases found matching your search criteria.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedDiseases.map((disease) => (
              <Grid item xs={12} sm={6} md={4} key={disease.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={disease.image_url}
                    alt={disease.disease_name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {disease.disease_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {disease.description}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Symptoms:
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {disease.symptoms}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Recommendation:
                    </Typography>
                    <Typography variant="body2">
                      {disease.recommendation}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default DiseaseList; 