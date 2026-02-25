const API_BASE = '/api';

export async function fetchDatasets() {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    return res.json();
}

export async function fetchModels() {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
}

export async function trainModel(modelKey, datasetId = 'combined') {
    const res = await fetch(`${API_BASE}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_key: modelKey, dataset_id: datasetId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Training failed');
    }
    return res.json();
}

export async function trainAll(datasetId = 'combined') {
    const res = await fetch(`${API_BASE}/train-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Training failed');
    }
    return res.json();
}

export async function predictText(text, modelKey) {
    const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_key: modelKey }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
}

export async function fetchResults() {
    const res = await fetch(`${API_BASE}/results`);
    if (!res.ok) throw new Error('Failed to fetch results');
    return res.json();
}

export async function predictAll(text) {
    const res = await fetch(`${API_BASE}/predict-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
}

export async function getEmailConfig() {
    const res = await fetch(`${API_BASE}/email/config`);
    if (!res.ok) throw new Error('Failed to fetch email config');
    return res.json();
}

export async function saveEmailConfig(config) {
    const res = await fetch(`${API_BASE}/email/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save config');
    }
    return res.json();
}

export async function sendEmailAlert(text, label, confidence, modelName) {
    const res = await fetch(`${API_BASE}/email/send-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text,
            label,
            confidence: confidence || 0,
            model_name: modelName || '',
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to send alert');
    }
    return res.json();
}

