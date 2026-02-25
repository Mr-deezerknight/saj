"""
Data loading, preprocessing, and splitting module for cyberbullying detection.
Handles both CSV datasets, unifies schema, cleans text, and provides train/test splits.
"""

import os
import re
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# Paths to datasets (relative to project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_1_PATH = os.path.join(BASE_DIR, "cyberbullying_dataset_1.csv")
DATASET_2_PATH = os.path.join(BASE_DIR, "cyberbullying_dataset_2.csv")


def clean_text(text: str) -> str:
    """Clean a single text string: lowercase, remove URLs, mentions, special chars."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\.\S+", "", text)          # remove URLs
    text = re.sub(r"@\w+", "", text)                       # remove @mentions
    text = re.sub(r"[^a-z\s]", "", text)                   # keep only letters & spaces
    text = re.sub(r"\s+", " ", text).strip()               # collapse whitespace
    return text


def load_dataset(dataset_id: str) -> pd.DataFrame:
    """
    Load a single dataset by id ("1", "2", or "combined").
    Returns DataFrame with columns: text, label
    """
    frames = []

    if dataset_id in ("1", "combined"):
        df1 = pd.read_csv(DATASET_1_PATH, on_bad_lines="skip")
        df1 = df1[["Text", "oh_label"]].rename(columns={"Text": "text", "oh_label": "label"})
        frames.append(df1)

    if dataset_id in ("2", "combined"):
        df2 = pd.read_csv(DATASET_2_PATH, on_bad_lines="skip")
        df2 = df2[["Text", "oh_label"]].rename(columns={"Text": "text", "oh_label": "label"})
        frames.append(df2)

    if not frames:
        raise ValueError(f"Unknown dataset_id: {dataset_id}")

    df = pd.concat(frames, ignore_index=True)

    # Binarize label at 0.5 threshold
    df["label"] = (df["label"] >= 0.5).astype(int)

    # Drop rows with missing text
    df = df.dropna(subset=["text"])
    df = df[df["text"].str.strip() != ""]

    # Clean text
    df["text"] = df["text"].apply(clean_text)
    df = df[df["text"].str.strip() != ""]

    return df.reset_index(drop=True)


def get_train_test_split(dataset_id: str, test_size: float = 0.2, max_samples: int = 50000):
    """
    Load data, optionally subsample for speed, and return stratified train/test split.
    Returns (X_train, X_test, y_train, y_test)
    """
    df = load_dataset(dataset_id)

    # Subsample if dataset is too large (for faster training)
    if len(df) > max_samples:
        df = df.sample(n=max_samples, random_state=42, replace=False).reset_index(drop=True)

    X = df["text"].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    return X_train, X_test, y_train, y_test


def get_dataset_stats(dataset_id: str) -> dict:
    """Return basic statistics about a dataset."""
    df = load_dataset(dataset_id)
    total = len(df)
    bullying = int(df["label"].sum())
    safe = total - bullying
    return {
        "dataset_id": dataset_id,
        "total_samples": total,
        "bullying_samples": bullying,
        "safe_samples": safe,
        "bullying_ratio": round(bullying / total, 4) if total > 0 else 0,
        "avg_text_length": round(df["text"].str.len().mean(), 1),
    }
