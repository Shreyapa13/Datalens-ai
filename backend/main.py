import json
import os
import shutil

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from services.cleaner import (
    analyze_missing_values,
    analyze_outliers,
    clean_dataset,
)
from services.eda import generate_eda
from services.loader import load_dataset
from services.ml_engine import train_models
from services.profiler import profile_dataset

app = FastAPI(
    title="DataLens AI",
    description="AI-powered data analysis and machine learning platform",
    version="1.0.0",
)


# -----------------------------------------
# CORS
# -----------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------
# UPLOAD DIRECTORY
# -----------------------------------------

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


# -----------------------------------------
# HOME
# -----------------------------------------

@app.get("/")
def home():
    return {"message": "DataLens AI backend is running"}


# -----------------------------------------
# ANALYZE DATASET
# -----------------------------------------

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load dataset
    df = load_dataset(file_path)

    # Profile original dataset
    profile = profile_dataset(df)

    # Detect missing values without modifying the dataset
    missing_analysis = analyze_missing_values(df)

    # Detect outliers without modifying the dataset
    outlier_analysis = analyze_outliers(df)

    # Generate EDA using original data
    eda = generate_eda(df)

    return {
        "success": True,
        "filename": file.filename,
        "profile": profile,
        "missing_analysis": missing_analysis,
        "outlier_analysis": outlier_analysis,
        "eda": eda,
        "preview": (
            df.head(10).replace({np.nan: ""}).to_dict(orient="records")
        ),
    }


# -----------------------------------------
# CLEAN DATASET
# -----------------------------------------

@app.post("/clean")
async def clean(
    file: UploadFile = File(...),
    missing_actions: str = Form("{}"),
    outlier_actions: str = Form("{}"),
):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Load dataset
    df = load_dataset(file_path)

    # -------------------------------------
    # MISSING VALUE ACTIONS
    # -------------------------------------

    try:
        missing_action_data = json.loads(missing_actions)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid missing_actions JSON.",
        }

    # -------------------------------------
    # OUTLIER ACTIONS
    # -------------------------------------

    try:
        outlier_action_data = json.loads(outlier_actions)
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Invalid outlier_actions JSON.",
        }

    # -------------------------------------
    # APPLY CLEANING
    # -------------------------------------

    cleaned_df, cleaning_report = clean_dataset(
        df,
        missing_actions=missing_action_data,
        outlier_actions=outlier_action_data,
    )

    # Generate EDA after cleaning
    eda = generate_eda(cleaned_df)

    return {
        "success": True,
        "filename": file.filename,
        "cleaning": cleaning_report,
        "eda": eda,
        "preview": (
            cleaned_df.head(10)
            .replace({np.nan: ""})
            .to_dict(orient="records")
        ),
    }


# -----------------------------------------
# TRAIN MODELS
# -----------------------------------------

@app.post("/train")
async def train(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    df = load_dataset(file_path)

    cleaned_df, cleaning_report = clean_dataset(df)

    ml_results = train_models(cleaned_df)

    return {
        "success": True,
        "cleaning_report": cleaning_report,
        "ml": ml_results,
    }