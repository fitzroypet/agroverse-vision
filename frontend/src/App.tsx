import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  Button
} from '@mui/material';
import PlantDiagnosis from './components/PlantDiagnosis';
import DiseaseList from './components/DiseaseList';
import DiagnosisHistory from './components/DiagnosisHistory';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green color for the plant/nature theme
    },
    secondary: {
      main: '#ff9800', // Orange for accents
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Agroverse Vision LLM
              </Typography>
              <Button color="inherit" component={Link} to="/">
                Diagnose
              </Button>
              <Button color="inherit" component={Link} to="/diseases">
                Diseases
              </Button>
              <Button color="inherit" component={Link} to="/history">
                History
              </Button>
            </Toolbar>
          </AppBar>
          
          <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route path="/" element={<PlantDiagnosis />} />
              <Route path="/diseases" element={<DiseaseList />} />
              <Route path="/history" element={<DiagnosisHistory />} />
            </Routes>
          </Container>
          
          <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                © {new Date().getFullYear()} Agroverse Vision LLM. All rights reserved.
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 