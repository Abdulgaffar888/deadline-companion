from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

from ai_engine import analyze_pdf_with_ai, analyze_text_with_ai
from schemas import ExtractionResult

logging.basicConfig(level=logging.INFO)

app = FastAPI()

from datetime import datetime

@app.get("/ping")
async def ping():
    return {"status": "alive", "time": datetime.utcnow().isoformat()}

# ================== CORS ==================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://grik-ai.vercel.app",
        "http://localhost:5173",   # local dev
        "http://localhost:8081",   # local dev alt
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== MODELS ==================
class TextInput(BaseModel):
    content: str

# ================== ROUTES ==================

# Health check — Render needs this to confirm service is alive
@app.get("/")
async def health():
    return {"status": "ok", "service": "DeadlinePal API"}

@app.post("/analyze-text", response_model=ExtractionResult)
async def analyze_text(input: TextInput):
    return analyze_text_with_ai(input.content)

@app.post("/analyze-document", response_model=ExtractionResult)
async def analyze_document(file: UploadFile = File(...)):
    file_bytes = await file.read()
    return analyze_pdf_with_ai(file_bytes, file.filename)
