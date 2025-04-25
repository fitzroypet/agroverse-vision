# Agroverse Vision

A plant disease diagnosis system using CLIP embeddings and vector similarity search.

## Overview

This repository contains a full-stack application for diagnosing plant diseases using computer vision and machine learning. The system uses CLIP embeddings and vector similarity search to identify plant diseases from images and provide detailed diagnosis information.

## Features

- Upload and analyze plant images
- Real-time disease diagnosis
- Confidence metrics and alternative diagnoses
- Seasonal relevance indicators
- Symptom overlap analysis
- Diagnosis history tracking
- Detailed recommendations for treatment

## Tech Stack

- **Frontend**: React with TypeScript, Material-UI
- **Backend**: Python with FastAPI
- **Database**: Supabase (PostgreSQL with pgvector)
- **ML Model**: OpenAI's CLIP
- **Vector Search**: Cosine similarity with pgvector

## Prerequisites

- Node.js 16+
- Python 3.8+
- Supabase account and project
- CLIP model dependencies

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fitzroypet/agroverse-vision.git
cd agroverse-vision
```

2. Set up the frontend:
```bash
cd frontend
npm install
```

3. Set up the backend:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Running the Application

1. Start the frontend development server:
```bash
cd frontend
npm start
```

2. Start the backend server:
```bash
uvicorn scripts.api:app --reload
```

The application will be available at http://localhost:3000

## Project Structure

```
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── types/        # TypeScript type definitions
│   │   └── App.tsx       # Main application component
├── scripts/
│   ├── api.py            # FastAPI backend server
│   ├── diagnose.py       # Disease diagnosis logic
│   └── test_diagnosis.py # Test cases
├── supabase/
│   └── migrations/       # Database migrations
└── requirements.txt      # Python dependencies
```

## API Endpoints

- `POST /diagnose/upload`: Upload and analyze a plant image
- `GET /diseases`: List all known plant diseases
- `GET /diagnosis/{id}`: Get details of a specific diagnosis

## Features in Detail

### Diagnosis Metrics

The system provides several metrics for each diagnosis:

1. **Confidence Score**: Base confidence in the primary diagnosis
2. **Relative Confidence**: Comparison with alternative diagnoses
3. **Seasonal Relevance**: How common the disease is in the current season
4. **Symptom Overlap**: Similarity of symptoms with alternative diagnoses
5. **Diagnosis Clarity**: How distinct the primary diagnosis is

### History Tracking

- Save and view past diagnoses
- Track diagnosis accuracy over time
- Compare multiple diagnoses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the CLIP model
- Supabase for the database and vector search capabilities
- The plant pathology community for disease information 