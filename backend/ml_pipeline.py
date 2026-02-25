"""
ML Pipeline module — trains and evaluates 6 model configurations:
  TF-IDF + {Naive Bayes, SVM, Logistic Regression}
  Word Embeddings (SVD dense vectors) + {GaussianNB, SVM, Logistic Regression}

Uses only scikit-learn (no Gensim / C compiler needed).
Word Embeddings are approximated via CountVectorizer + TruncatedSVD to create
dense semantic vectors from bag-of-words, similar to LSA/LSI embeddings.
"""

import time
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import Normalizer
from sklearn.pipeline import make_pipeline
from sklearn.naive_bayes import MultinomialNB, GaussianNB
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.calibration import CalibratedClassifierCV

# ─── Global caches ─────────────────────────────────────────────
_tfidf_vectorizer = None
_embedding_pipeline = None   # CountVectorizer + TruncatedSVD
_trained_models = {}          # key -> (model, feature_type, vectorizer)


# ─── Feature Extraction ────────────────────────────────────────

def build_tfidf(X_train, X_test, max_features=15000):
    """Fit TF-IDF on training data, transform both sets."""
    global _tfidf_vectorizer
    _tfidf_vectorizer = TfidfVectorizer(
        max_features=max_features, ngram_range=(1, 2), sublinear_tf=True
    )
    X_train_vec = _tfidf_vectorizer.fit_transform(X_train)
    X_test_vec = _tfidf_vectorizer.transform(X_test)
    return X_train_vec, X_test_vec


def build_word_embeddings(X_train, X_test, n_components=200, max_features=20000):
    """
    Create dense word-embedding-like vectors using LSA (TruncatedSVD on count matrix).
    This produces semantic dense vectors similar to Word2Vec but using only sklearn.
    """
    global _embedding_pipeline
    count_vec = CountVectorizer(max_features=max_features, ngram_range=(1, 2))
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    normalizer = Normalizer(copy=False)
    _embedding_pipeline = make_pipeline(count_vec, svd, normalizer)

    X_train_vec = _embedding_pipeline.fit_transform(X_train)
    X_test_vec = _embedding_pipeline.transform(X_test)
    return X_train_vec, X_test_vec


# ─── Model Configurations ──────────────────────────────────────

MODEL_CONFIGS = {
    "tfidf_naive_bayes": {
        "display_name": "TF-IDF + Naive Bayes",
        "feature": "tfidf",
        "classifier": "naive_bayes",
        "description": "Multinomial Naive Bayes with TF-IDF features — fast probabilistic baseline"
    },
    "tfidf_svm": {
        "display_name": "TF-IDF + SVM",
        "feature": "tfidf",
        "classifier": "svm",
        "description": "Linear SVM with TF-IDF features — strong margin-based classifier"
    },
    "tfidf_logistic_regression": {
        "display_name": "TF-IDF + Logistic Regression",
        "feature": "tfidf",
        "classifier": "logistic_regression",
        "description": "Logistic Regression with TF-IDF — interpretable linear model"
    },
    "w2v_naive_bayes": {
        "display_name": "Word Embeddings + Naive Bayes",
        "feature": "word_embeddings",
        "classifier": "naive_bayes",
        "description": "Gaussian Naive Bayes with dense LSA embeddings — semantic feature baseline"
    },
    "w2v_svm": {
        "display_name": "Word Embeddings + SVM",
        "feature": "word_embeddings",
        "classifier": "svm",
        "description": "Linear SVM with dense LSA embeddings — semantic margin classifier"
    },
    "w2v_logistic_regression": {
        "display_name": "Word Embeddings + Logistic Regression",
        "feature": "word_embeddings",
        "classifier": "logistic_regression",
        "description": "Logistic Regression with dense LSA embeddings — interpretable semantic model"
    },
}


def _create_classifier(classifier_type: str, feature_type: str):
    """Instantiate a classifier."""
    if classifier_type == "naive_bayes":
        if feature_type == "tfidf":
            return MultinomialNB(alpha=1.0)
        else:
            return GaussianNB()
    elif classifier_type == "svm":
        return CalibratedClassifierCV(
            LinearSVC(max_iter=2000, random_state=42, C=1.0, dual="auto"), cv=3
        )
    elif classifier_type == "logistic_regression":
        return LogisticRegression(max_iter=1000, random_state=42, C=1.0, solver="lbfgs")
    else:
        raise ValueError(f"Unknown classifier: {classifier_type}")


# ─── Training & Evaluation ─────────────────────────────────────

def train_model(model_key: str, X_train, X_test, y_train, y_test) -> dict:
    """
    Train a single model configuration and return metrics.
    """
    config = MODEL_CONFIGS[model_key]
    feature_type = config["feature"]
    classifier_type = config["classifier"]

    # Feature extraction
    feat_start = time.time()
    if feature_type == "tfidf":
        X_train_vec, X_test_vec = build_tfidf(X_train, X_test)
    else:
        X_train_vec, X_test_vec = build_word_embeddings(X_train, X_test)
    feat_time = time.time() - feat_start

    # Training
    clf = _create_classifier(classifier_type, feature_type)
    train_start = time.time()
    clf.fit(X_train_vec, y_train)
    train_time = time.time() - train_start

    # Prediction
    pred_start = time.time()
    y_pred = clf.predict(X_test_vec)
    pred_time = time.time() - pred_start

    # Probabilities (if available)
    confidence = None
    if hasattr(clf, "predict_proba"):
        probas = clf.predict_proba(X_test_vec)
        confidence = float(np.mean(np.max(probas, axis=1)))

    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()

    total_time = feat_time + train_time + pred_time

    # Cache trained model
    _trained_models[model_key] = {
        "model": clf,
        "feature_type": feature_type,
        "tfidf_vec": _tfidf_vectorizer if feature_type == "tfidf" else None,
        "embedding_pipeline": _embedding_pipeline if feature_type == "word_embeddings" else None,
    }

    return {
        "model_key": model_key,
        "display_name": config["display_name"],
        "description": config["description"],
        "feature_method": "TF-IDF" if feature_type == "tfidf" else "Word Embeddings",
        "classifier": classifier_type.replace("_", " ").title(),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
        },
        "timing": {
            "feature_extraction_sec": round(feat_time, 3),
            "training_sec": round(train_time, 3),
            "prediction_sec": round(pred_time, 3),
            "total_sec": round(total_time, 3),
        },
        "confusion_matrix": cm,
        "avg_confidence": round(confidence, 4) if confidence else None,
        "train_samples": len(y_train),
        "test_samples": len(y_test),
    }


def predict_text(model_key: str, text: str) -> dict:
    """Predict a single text with a trained model."""
    if model_key not in _trained_models:
        raise ValueError(f"Model '{model_key}' is not trained yet. Train it first.")

    cached = _trained_models[model_key]
    model = cached["model"]
    feature_type = cached["feature_type"]

    # Vectorize
    if feature_type == "tfidf":
        vec = cached["tfidf_vec"].transform([text])
    else:
        vec = cached["embedding_pipeline"].transform([text])

    prediction = int(model.predict(vec)[0])

    confidence = None
    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(vec)[0]
        confidence = float(max(probas))

    return {
        "model_key": model_key,
        "text": text,
        "prediction": prediction,
        "label": "Cyberbullying" if prediction == 1 else "Not Cyberbullying",
        "confidence": round(confidence, 4) if confidence else None,
    }


def predict_all_models(text: str) -> list:
    """Predict a single text with ALL trained models for comparison."""
    results = []
    for model_key in _trained_models:
        try:
            result = predict_text(model_key, text)
            result["display_name"] = MODEL_CONFIGS[model_key]["display_name"]
            results.append(result)
        except Exception:
            pass  # skip models that fail
    return results


def get_available_models() -> list:
    """Return list of all model configurations with their training status."""
    result = []
    for key, config in MODEL_CONFIGS.items():
        result.append({
            "model_key": key,
            "display_name": config["display_name"],
            "description": config["description"],
            "feature": config["feature"],
            "classifier": config["classifier"],
            "is_trained": key in _trained_models,
        })
    return result
