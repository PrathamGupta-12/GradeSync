from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from analyze import GradeAnalyzer

app = FastAPI(
    title="GradeSync API",
    description="Academic Performance Analysis API",
    version="1.0.0"
)

# Configure CORS so your frontend can communicate smoothly with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "GradeSync API is running",
        "status": "active"
    }

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    
    analyzer = GradeAnalyzer()
    analysis_result = await analyzer.fileAnalyzer(file)

    return analysis_result

# Run command: uvicorn main:app --reload