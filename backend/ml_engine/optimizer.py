"""
Automated Data Cleaning & Feature Engineering Module
=====================================================
Handles: duplicate removal, missing-value imputation,
outlier filtering, categorical encoding, and numerical scaling.
"""

from __future__ import annotations
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from typing import Tuple, Dict, Any, List


# ── Cleaning ──────────────────────────────────────────────────────────────────

def _impute_missing(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Impute missing values: mean for numeric, mode for categorical."""
    stats: Dict[str, int] = {}
    for col in df.columns:
        n_missing = int(df[col].isna().sum())
        if n_missing == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col].fillna(df[col].mean(), inplace=True)
        else:
            mode_val = df[col].mode()
            df[col].fillna(mode_val[0] if len(mode_val) > 0 else "UNKNOWN", inplace=True)
        stats[col] = n_missing
    return df, stats


def _remove_outliers(df: pd.DataFrame, factor: float = 1.5) -> Tuple[pd.DataFrame, int]:
    """Remove outliers using IQR method on numeric columns."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    mask = pd.Series(True, index=df.index)
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - factor * iqr
        upper = q3 + factor * iqr
        mask &= df[col].between(lower, upper)
    removed = int((~mask).sum())
    return df[mask].reset_index(drop=True), removed


def clean_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Full cleaning pipeline.
    Returns (cleaned_df, stats_dict).
    """
    stats: Dict[str, Any] = {"original_rows": len(df)}

    # 1. Drop duplicates
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    stats["duplicates_removed"] = before - len(df)

    # 2. Impute missing values
    df, impute_stats = _impute_missing(df)
    stats["values_imputed"] = impute_stats
    stats["total_imputed"] = sum(impute_stats.values())

    # 3. Filter outliers
    df, outlier_count = _remove_outliers(df)
    stats["outliers_removed"] = outlier_count
    stats["final_rows"] = len(df)

    return df, stats


# ── Feature Engineering ───────────────────────────────────────────────────────

def engineer_features(
    df: pd.DataFrame,
    target_col: str,
) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any], List[LabelEncoder], StandardScaler | None, LabelEncoder | None]:
    """
    Encode categoricals (label-encode), scale numericals.
    Returns (X, y, stats, encoders, scaler).
    """
    stats: Dict[str, Any] = {}

    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found. Available: {list(df.columns)}")

    y = df[target_col].copy()
    X = df.drop(columns=[target_col]).copy()

    # Encode target if categorical
    target_encoder = None
    if not pd.api.types.is_numeric_dtype(y):
        target_encoder = LabelEncoder()
        y = pd.Series(target_encoder.fit_transform(y), name=target_col)
        stats["target_classes"] = list(target_encoder.classes_)

    # Label-encode categorical feature columns
    cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    encoders: List[LabelEncoder] = []
    for col in cat_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders.append(le)
    stats["columns_encoded"] = cat_cols

    # Standard-scale numerical columns
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    scaler = None
    if num_cols:
        scaler = StandardScaler()
        X[num_cols] = scaler.fit_transform(X[num_cols])
    stats["columns_scaled"] = num_cols

    stats["feature_count"] = X.shape[1]
    stats["sample_count"] = X.shape[0]

    return X, y, stats, encoders, scaler, target_encoder
