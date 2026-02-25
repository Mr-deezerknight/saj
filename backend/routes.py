"""
API routes for the cyberbullying detection app.
Provides dataset info, model training, comparison, and prediction endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import data_loader
import ml_pipeline
import email_service

router = APIRouter(prefix="/api")

# ─── Request / Response Models ──────────────────────────────────

class TrainRequest(BaseModel):
    model_key: str
    dataset_id: str = "combined"  # "1", "2", or "combined"

class TrainAllRequest(BaseModel):
    dataset_id: str = "combined"

class PredictRequest(BaseModel):
    text: str
    model_key: str

class PredictAllRequest(BaseModel):
    text: str

class EmailAlertRequest(BaseModel):
    text: str
    label: str
    confidence: float = 0.0
    model_name: str = ""

# ─── In-memory results cache ───────────────────────────────────

_comparison_results: list = []


# ─── Endpoints ──────────────────────────────────────────────────

@router.get("/datasets")
def get_datasets():
    """Return stats for all datasets."""
    try:
        stats = []
        for did in ["1", "2", "combined"]:
            stats.append(data_loader.get_dataset_stats(did))
        return {"datasets": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
def get_models():
    """Return all available model configurations and their training status."""
    return {"models": ml_pipeline.get_available_models()}


@router.post("/train")
def train_model(req: TrainRequest):
    """Train a single model and return its metrics."""
    global _comparison_results

    if req.model_key not in ml_pipeline.MODEL_CONFIGS:
        raise HTTPException(status_code=400, detail=f"Unknown model: {req.model_key}")

    try:
        X_train, X_test, y_train, y_test = data_loader.get_train_test_split(req.dataset_id)
        result = ml_pipeline.train_model(req.model_key, X_train, X_test, y_train, y_test)
        result["dataset_id"] = req.dataset_id

        # Update comparison cache
        _comparison_results = [r for r in _comparison_results if r["model_key"] != req.model_key]
        _comparison_results.append(result)
        _comparison_results.sort(key=lambda x: x["metrics"]["f1_score"], reverse=True)

        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train-all")
def train_all(req: TrainAllRequest):
    """Train all 6 models and return comparison results."""
    global _comparison_results

    try:
        X_train, X_test, y_train, y_test = data_loader.get_train_test_split(req.dataset_id)

        results = []
        for model_key in ml_pipeline.MODEL_CONFIGS:
            result = ml_pipeline.train_model(model_key, X_train, X_test, y_train, y_test)
            result["dataset_id"] = req.dataset_id
            results.append(result)

        # Sort by F1 score (best first)
        results.sort(key=lambda x: x["metrics"]["f1_score"], reverse=True)

        # Mark the best model
        if results:
            results[0]["is_best"] = True

        _comparison_results = results
        return {"results": results, "best_model": results[0] if results else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
def predict(req: PredictRequest):
    """Predict cyberbullying on custom text using a trained model."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # Clean the input text
        cleaned = data_loader.clean_text(req.text)
        result = ml_pipeline.predict_text(req.model_key, cleaned)
        result["original_text"] = req.text
        return {"prediction": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-all")
def predict_all(req: PredictAllRequest):
    """Predict cyberbullying using ALL trained models for comparison."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        cleaned = data_loader.clean_text(req.text)
        results = ml_pipeline.predict_all_models(cleaned)
        for r in results:
            r["original_text"] = req.text
        return {"predictions": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results")
def get_results():
    """Return cached comparison results."""
    return {
        "results": _comparison_results,
        "best_model": _comparison_results[0] if _comparison_results else None,
    }


# ─── Email Configuration Endpoints ─────────────────────────────

@router.post("/email/config")
def save_email_config(config: email_service.EmailConfig):
    """Save SMTP email configuration."""
    try:
        email_service.save_config(config)
        return {"success": True, "message": "Email configuration saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/email/config")
def get_email_config():
    """Return current email config (password masked)."""
    config = email_service.get_config()
    return {"config": config}


@router.post("/email/send-alert")
def send_email_alert(req: EmailAlertRequest):
    """Send a cyberbullying alert email."""
    try:
        result = email_service.send_alert_email(
            text=req.text,
            label=req.label,
            confidence=req.confidence,
            model_name=req.model_name,
        )
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
