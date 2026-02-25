import { useState } from 'react'
import { predictText, predictAll, sendEmailAlert } from '../api'
import AlertModal from '../components/AlertModal'

const SAMPLE_TEXTS = [
    "You're such a loser, nobody likes you",
    "Hey, great job on the presentation today!",
    "I'm going to find you and hurt you",
    "Thanks for being such a good friend",
    "You're so ugly and stupid, just go away",
    "Let's meet up for coffee this weekend",
    "Kill yourself you worthless piece of trash",
    "I really appreciate your help with the project",
]

export default function Predict({ results }) {
    const [text, setText] = useState('')
    const [modelKey, setModelKey] = useState('')
    const [prediction, setPrediction] = useState(null)
    const [allPredictions, setAllPredictions] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingAll, setLoadingAll] = useState(false)
    const [error, setError] = useState('')
    const [showAlert, setShowAlert] = useState(false)

    const trainedModels = results.filter(r => r.model_key)

    const handlePredict = async () => {
        if (!text.trim() || !modelKey) return
        setLoading(true)
        setError('')
        setPrediction(null)
        setAllPredictions([])

        try {
            const data = await predictText(text, modelKey)
            setPrediction(data.prediction)

            // Show popup alert if cyberbullying detected
            if (data.prediction.prediction === 1) {
                setShowAlert(true)
            }

            // Auto-fetch all-model comparison if multiple models trained
            if (trainedModels.length > 1) {
                setLoadingAll(true)
                try {
                    const allData = await predictAll(text)
                    setAllPredictions(allData.predictions || [])
                } catch {
                    // silently fail — comparison is optional
                }
                setLoadingAll(false)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSample = (sample) => {
        setText(sample)
        setPrediction(null)
        setAllPredictions([])
        setError('')
    }

    const handleSendEmail = async () => {
        if (!prediction) return
        const modelDisplay = trainedModels.find(m => m.model_key === modelKey)?.display_name || modelKey
        await sendEmailAlert(
            prediction.original_text || text,
            prediction.label,
            prediction.confidence || 0,
            modelDisplay,
        )
    }

    const currentModelName = trainedModels.find(m => m.model_key === modelKey)?.display_name || ''

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Live Prediction</h1>
                <p className="page-subtitle">
                    Test any text against trained models to detect cyberbullying in real-time
                </p>
            </div>

            {/* Cyberbullying Alert Modal */}
            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                prediction={prediction}
                modelName={currentModelName}
                onSendEmail={handleSendEmail}
            />

            {trainedModels.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <div className="empty-state-title">No trained models</div>
                        <div className="empty-state-text">
                            Train at least one model first to make predictions.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid-2">
                    {/* Input Panel */}
                    <div>
                        <div className="card section">
                            <div className="card-title mb-16">Input Text</div>
                            <textarea
                                className="textarea"
                                placeholder="Type or paste text to analyze for cyberbullying..."
                                value={text}
                                onChange={e => { setText(e.target.value); setPrediction(null); setAllPredictions([]); setError('') }}
                                rows={5}
                            />

                            <div className="mt-16">
                                <label className="text-sm text-muted" style={{ display: 'block', marginBottom: 8 }}>
                                    Select Model
                                </label>
                                <select
                                    className="select"
                                    value={modelKey}
                                    onChange={e => { setModelKey(e.target.value); setPrediction(null); setAllPredictions([]) }}
                                >
                                    <option value="">Choose a trained model...</option>
                                    {trainedModels.map(r => (
                                        <option key={r.model_key} value={r.model_key}>
                                            {r.display_name} (F1: {(r.metrics.f1_score * 100).toFixed(1)}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="btn btn-primary btn-lg mt-24"
                                onClick={handlePredict}
                                disabled={loading || !text.trim() || !modelKey}
                                style={{ width: '100%' }}
                            >
                                {loading ? <><div className="spinner"></div> Analyzing...</> : '🔍 Analyze Text'}
                            </button>
                        </div>

                        {/* Sample Texts */}
                        <div className="card">
                            <div className="card-title mb-16">💡 Sample Texts</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {SAMPLE_TEXTS.map((sample, i) => (
                                    <button
                                        key={i}
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleSample(sample)}
                                        style={{
                                            textAlign: 'left',
                                            justifyContent: 'flex-start',
                                            whiteSpace: 'normal',
                                            height: 'auto',
                                            padding: '10px 14px',
                                        }}
                                    >
                                        <span style={{ opacity: 0.5, marginRight: 8 }}>#{i + 1}</span>
                                        {sample}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div>
                        {error && (
                            <div className="prediction-result prediction-bully mb-16">
                                <div className="prediction-icon">❌</div>
                                <div className="prediction-label">Error</div>
                                <p className="text-sm text-muted">{error}</p>
                            </div>
                        )}

                        {prediction && (
                            <div className="card fade-in">
                                <div className={`prediction-result ${prediction.prediction === 1 ? 'prediction-bully' : 'prediction-safe'}`}>
                                    <div className="prediction-icon">
                                        {prediction.prediction === 1 ? '🚨' : '✅'}
                                    </div>
                                    <div className="prediction-label">
                                        {prediction.label}
                                    </div>
                                    {prediction.confidence && (
                                        <div className="prediction-confidence">
                                            Confidence: {(prediction.confidence * 100).toFixed(1)}%
                                        </div>
                                    )}
                                    {/* Show alert button inline for bullying */}
                                    {prediction.prediction === 1 && (
                                        <button
                                            className="btn btn-danger btn-sm mt-16"
                                            onClick={() => setShowAlert(true)}
                                            style={{ margin: '12px auto 0' }}
                                        >
                                            🚨 View Alert Details
                                        </button>
                                    )}
                                </div>

                                <div className="mt-24">
                                    <div className="text-sm text-muted mb-16">
                                        <strong>Model:</strong> {trainedModels.find(m => m.model_key === modelKey)?.display_name}
                                    </div>
                                    <div className="text-sm text-muted mb-16">
                                        <strong>Original Text:</strong>
                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-glass)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginTop: 8,
                                            lineHeight: 1.6,
                                        }}>
                                            {prediction.original_text || text}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted">
                                        <strong>Processed Text:</strong>
                                        <div style={{
                                            padding: '12px',
                                            background: 'var(--bg-glass)',
                                            borderRadius: 'var(--radius-sm)',
                                            marginTop: 8,
                                            lineHeight: 1.6,
                                            fontStyle: 'italic'
                                        }}>
                                            {prediction.text}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!prediction && !error && (
                            <div className="card">
                                <div className="empty-state">
                                    <div className="empty-state-icon">💬</div>
                                    <div className="empty-state-title">Enter text to analyze</div>
                                    <div className="empty-state-text">
                                        Type a message or select a sample text, choose a model, and click "Analyze" to see the prediction.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All-Models Comparison */}
                        {prediction && allPredictions.length > 1 && (
                            <div className="card mt-24 fade-in">
                                <div className="card-header">
                                    <div className="card-title">🔄 All Models Comparison</div>
                                    <span className="card-badge badge-trained">{allPredictions.length} models</span>
                                </div>
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Model</th>
                                                <th>Result</th>
                                                <th>Confidence</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allPredictions.map(p => (
                                                <tr key={p.model_key} className={p.model_key === modelKey ? 'best-row' : ''}>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {p.display_name}
                                                        {p.model_key === modelKey && (
                                                            <span className="text-sm text-muted" style={{ marginLeft: 8 }}>(selected)</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`metric-pill ${p.prediction === 1 ? 'metric-bad' : 'metric-good'}`}>
                                                            {p.prediction === 1 ? '🚨 Cyberbullying' : '✅ Safe'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {p.confidence
                                                            ? `${(p.confidence * 100).toFixed(1)}%`
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {loadingAll && (
                            <div className="card mt-24">
                                <div className="loading-overlay" style={{ padding: '20px' }}>
                                    <div className="spinner"></div>
                                    <p className="text-sm text-muted">Comparing across all models...</p>
                                </div>
                            </div>
                        )}

                        {/* Quick model switch */}
                        {prediction && trainedModels.length > 1 && !allPredictions.length && !loadingAll && (
                            <div className="card mt-24 fade-in">
                                <div className="card-title mb-16">🔄 Try with different models</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {trainedModels.map(m => (
                                        <button
                                            key={m.model_key}
                                            className={`btn ${m.model_key === modelKey ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                                            onClick={() => {
                                                setModelKey(m.model_key)
                                                setPrediction(null)
                                                setAllPredictions([])
                                            }}
                                        >
                                            {m.display_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
