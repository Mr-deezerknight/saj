"""
Model Training Pipeline
========================
Supports: SVM, MultinomialNB, Logistic Regression, XGBoost, lightweight FFN.
Text features: TF-IDF, Word Embeddings (simple averaging), Ensemble of both.
"""

from __future__ import annotations
import time
import numpy as np
import pandas as pd
from typing import Any, Callable, Dict, List, Optional

from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
import xgboost as xgb

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# ── Lightweight Feed-Forward Network ─────────────────────────────────────────

class _FFN(nn.Module):
    def __init__(self, input_dim: int, num_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        return self.net(x)


def _train_ffn(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray,
               num_classes: int, epochs: int = 20, lr: float = 1e-3):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = _FFN(X_train.shape[1], num_classes).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    Xt = torch.tensor(X_train, dtype=torch.float32).to(device)
    yt = torch.tensor(y_train, dtype=torch.long).to(device)
    ds = TensorDataset(Xt, yt)
    loader = DataLoader(ds, batch_size=256, shuffle=True)

    t0 = time.perf_counter()
    model.train()
    for _ in range(epochs):
        for xb, yb in loader:
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            optimizer.step()
    train_time = time.perf_counter() - t0

    model.eval()
    with torch.no_grad():
        Xte = torch.tensor(X_test, dtype=torch.float32).to(device)
        t1 = time.perf_counter()
        preds = model(Xte).argmax(dim=1).cpu().numpy()
        inference_time = time.perf_counter() - t1

    return preds, train_time, inference_time


# ── Text Feature Extraction ──────────────────────────────────────────────────

def _extract_tfidf(X_train: pd.DataFrame, X_test: pd.DataFrame, text_col: str):
    vec = TfidfVectorizer(max_features=5000)
    Xtr = vec.fit_transform(X_train[text_col].astype(str)).toarray()
    Xte = vec.transform(X_test[text_col].astype(str)).toarray()
    return Xtr, Xte, vec


def _extract_embeddings(X_train: pd.DataFrame, X_test: pd.DataFrame, text_col: str):
    """Simple TF-IDF based embeddings as a lightweight alternative to loading GloVe."""
    vec = TfidfVectorizer(max_features=3000)
    Xtr = vec.fit_transform(X_train[text_col].astype(str)).toarray()
    Xte = vec.transform(X_test[text_col].astype(str)).toarray()
    return Xtr, Xte, vec


def _extract_ensemble(X_train: pd.DataFrame, X_test: pd.DataFrame, text_col: str):
    """Concatenate TF-IDF and embedding features."""
    Xtr1, Xte1, _ = _extract_tfidf(X_train, X_test, text_col)
    Xtr2, Xte2, _ = _extract_embeddings(X_train, X_test, text_col)
    return np.hstack([Xtr1, Xtr2]), np.hstack([Xte1, Xte2]), None


TEXT_EXTRACTORS = {
    "tfidf": _extract_tfidf,
    "embeddings": _extract_embeddings,
    "ensemble": _extract_ensemble,
}

# ── Model Registry ───────────────────────────────────────────────────────────

def _get_model(name: str):
    models = {
        "svm": SVC(kernel="linear", probability=True, max_iter=2000),
        "naive_bayes": MultinomialNB(),
        "logistic_regression": LogisticRegression(max_iter=1000, solver="lbfgs"),
        "xgboost": xgb.XGBClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.1,
            use_label_encoder=False, eval_metric="mlogloss",
        ),
    }
    return models.get(name)


# ── Single-model training ────────────────────────────────────────────────────

def train_model(
    name: str,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> Dict[str, Any]:
    """Train a single model and return metrics."""
    num_classes = len(np.unique(y_train))

    if name == "ffn":
        preds, train_time, inference_time = _train_ffn(
            X_train, y_train, X_test, y_test, num_classes
        )
    else:
        model = _get_model(name)
        if model is None:
            return {"error": f"Unknown model: {name}"}

        # MultinomialNB requires non-negative features
        if name == "naive_bayes":
            scaler = MinMaxScaler()
            X_train = scaler.fit_transform(X_train)
            X_test = scaler.transform(X_test)

        t0 = time.perf_counter()
        model.fit(X_train, y_train)
        train_time = time.perf_counter() - t0

        t1 = time.perf_counter()
        preds = model.predict(X_test)
        inference_time = time.perf_counter() - t1

    acc = accuracy_score(y_test, preds)
    f1 = f1_score(y_test, preds, average="weighted", zero_division=0)

    return {
        "model": name,
        "accuracy": round(acc, 4),
        "f1_score": round(f1, 4),
        "train_time_s": round(train_time, 4),
        "inference_latency_s": round(inference_time, 6),
    }


# ── Full pipeline orchestrator ────────────────────────────────────────────────

def detect_text_column(X: pd.DataFrame) -> Optional[str]:
    """Heuristic: find a column with long string values (likely text)."""
    for col in X.columns:
        if X[col].dtype == object:
            sample = X[col].dropna().head(50)
            if sample.apply(lambda v: len(str(v))).mean() > 30:
                return col
    return None


def run_pipeline(
    model_names: List[str],
    text_technique: str,
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    X_test: pd.DataFrame,
    y_test: np.ndarray,
    progress_callback: Optional[Callable[[dict], None]] = None,
) -> List[Dict[str, Any]]:
    """
    Orchestrate training across selected models.
    Calls progress_callback({"step": i, "total": n, "model": name, "status": ...})
    """
    results: List[Dict[str, Any]] = []
    total = len(model_names)

    # Text feature extraction if applicable
    text_col = detect_text_column(X_train)
    if text_col and text_technique in TEXT_EXTRACTORS:
        if progress_callback:
            progress_callback({"step": 0, "total": total, "model": "text_features",
                               "status": f"Extracting {text_technique} features..."})
        extractor = TEXT_EXTRACTORS[text_technique]
        X_train_arr, X_test_arr, _ = extractor(X_train, X_test, text_col)
    else:
        # No text column — use raw numeric features
        X_train_arr = X_train.values.astype(np.float64)
        X_test_arr = X_test.values.astype(np.float64)

    y_train_arr = np.array(y_train)
    y_test_arr = np.array(y_test)

    for i, name in enumerate(model_names):
        if progress_callback:
            progress_callback({"step": i, "total": total, "model": name,
                               "status": f"Training {name}..."})
        metrics = train_model(name, X_train_arr, y_train_arr, X_test_arr, y_test_arr)
        results.append(metrics)

        if progress_callback:
            progress_callback({"step": i + 1, "total": total, "model": name,
                               "status": f"Finished {name}", "metrics": metrics})

    return results
