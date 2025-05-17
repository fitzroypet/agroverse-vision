import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import uvicorn
from dotenv import load_dotenv
import tempfile
import shutil
import uuid
from datetime import datetime

# Import our diagnosis function
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

# Create FastAPI app
app = FastAPI(
    title="Agroverse Vision LLM API",
    description="API for plant disease diagnosis using vision models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class DiagnosisRequest(BaseModel):
    image_url: HttpUrl
    top_k: Optional[int] = 5

class DiagnosisResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    details: Optional[str] = None
    diagnosis: Optional[Dict[str, Any]] = None
    alternative_diagnoses: Optional[List[Dict[str, Any]]] = None
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str

# Routes
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(request: DiagnosisRequest):
    """
    Diagnose plant disease from an image URL
    """
    try:
        # Call the diagnosis function
        result = diagnose_plant_disease(str(request.image_url), request.top_k)
        
        # Add timestamp
        result["timestamp"] = datetime.now().isoformat()
        
        return result
    except Exception as e:
        logger.error(f"Error in diagnosis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/diagnose/upload")
async def diagnose_upload(
    file: UploadFile = File(...),
    top_k: int = 5,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Diagnose plant disease from an uploaded image
    """
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        # Generate a unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = f"diagnosis/{unique_filename}"
        
        # Upload to Supabase Storage
        with open(temp_file_path, "rb") as f:
            supabase.storage.from_("images").upload(file_path, f)
        
        # Get public URL
        public_url = supabase.storage.from_("images").get_public_url(file_path)
        
        # Clean up temp file
        background_tasks.add_task(os.unlink, temp_file_path)
        
        # Call the diagnosis function
        result = diagnose_plant_disease(public_url, top_k)
        
        # Add timestamp
        result["timestamp"] = datetime.now().isoformat()
        
        return result
    except Exception as e:
        logger.error(f"Error in diagnosis upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/diseases")
async def get_diseases(limit: int = 100, offset: int = 0):
    """
    Get a list of diseases from the database
    """
    try:
        result = supabase.table("disease_reference_images") \
            .select("id, disease_name, description, symptoms, recommendation, image_url, created_at") \
            .order("disease_name") \
            .range(offset, offset + limit - 1) \
            .execute()
        
        return {
            "success": True,
            "diseases": result.data,
            "count": len(result.data),
            "total": result.count if hasattr(result, 'count') else len(result.data)
        }
    except Exception as e:
        logger.error(f"Error getting diseases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Run the app
if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True) 