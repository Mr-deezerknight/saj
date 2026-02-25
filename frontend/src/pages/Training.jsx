import { useState, useEffect } from 'react'
import { fetchModels, trainModel, trainAll } from '../api'

const DATASET_OPTIONS = [
    { id: 'combined', label: '📚 Combined (Both Datasets)' },
    { id: '1', label: '📄 Dataset 1' },
    { id: '2', label: '📑 Dataset 2' },
]

export default function Training({ onComplete }) {
    const [models, setModels] = useState([])
    const [selectedModels, setSelectedModels] = useState(new Set())
    const [datasetId, setDatasetId] = useState('combined')
    const [training, setTraining] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0, currentModel: '' })
    const [trainingResults, setTrainingResults] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        fetchModels()
            .then(data => {
                setModels(data.models || [])
                // Select all by default
                setSelectedModels(new Set((data.models || []).map(m => m.model_key)))
            })
            .catch(() => { })
    }, [])

    const toggleModel = (key) => {
        setSelectedModels(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const selectAll = () => setSelectedModels(new Set(models.map(m => m.model_key)))
    const selectNone = () => setSelectedModels(new Set())

    const handleTrainAll = async () => {
        setTraining(true)
        setError('')
        setTrainingResults([])
        setProgress({ current: 0, total: 6, currentModel: 'Starting...' })

        try {
            const data = await trainAll(datasetId)
            const results = data.results || []
            setTrainingResults(results)
            setProgress({ current: 6, total: 6, currentModel: 'Complete!' })
            onComplete(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setTraining(false)
        }
    }

    const handleTrainSelected = async () => {
        if (selectedModels.size === 0) return
        setTraining(true)
        setError('')
        setTrainingResults([])

        const keys = [...selectedModels]
        const allResults = []

        for (let i = 0; i < keys.length; i++) {
            setProgress({ current: i, total: keys.length, currentModel: keys[i] })
            try {
                const data = await trainModel(keys[i], datasetId)
                allResults.push(data.result)
            } catch (err) {
                setError(`Error training ${keys[i]}: ${err.message}`)
                break
            }
        }

        setProgress({ current: keys.length, total: keys.length, currentModel: 'Complete!' })
        allResults.sort((a, b) => b.metrics.f1_score - a.metrics.f1_score)
        setTrainingResults(allResults)
        onComplete({ results: allResults, best_model: allResults[0] || null })
        setTraining(false)
    }

    const metricColor = (val) => {
        if (val >= 0.85) return 'metric-good'
        if (val >= 0.7) return 'metric-ok'
        return 'metric-bad'
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Model Training</h1>
                <p className="page-subtitle">
                    Select models and dataset, then train to compare performance
                </p>
            </div>

            <div className="grid-2">
                {/* Left: Configuration */}
                <div>
                    {/* Dataset Selector */}
                    <div className="section">
                        <h2 className="section-title">📁 Dataset</h2>
                        <select
                            className="select"
                            value={datasetId}
                            onChange={e => setDatasetId(e.target.value)}
                            disabled={training}
                        >
                            {DATASET_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Model Selector */}
                    <div className="section">
                        <div className="flex-between mb-16">
                            <h2 className="section-title" style={{ marginBottom: 0 }}>🧠 Models</h2>
                            <div className="flex-row gap-8">
                                <button className="btn btn-secondary btn-sm" onClick={selectAll} disabled={training}>
                                    Select All
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={selectNone} disabled={training}>
                                    None
                                </button>
                            </div>
                        </div>
                        <div className="checkbox-group">
                            {models.map(m => (
                                <label key={m.model_key} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedModels.has(m.model_key)}
                                        onChange={() => toggleModel(m.model_key)}
                                        disabled={training}
                                    />
                                    <div className="checkbox-info">
                                        <div className="checkbox-title">{m.display_name}</div>
                                        <div className="checkbox-desc">{m.description}</div>
                                    </div>
                                    {m.is_trained && <span className="card-badge badge-trained">Trained</span>}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-row gap-8">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleTrainAll}
                            disabled={training}
                            style={{ flex: 1 }}
                        >
                            {training ? (
                                <><div className="spinner"></div> Training...</>
                            ) : (
                                '🚀 Train All Models'
                            )}
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={handleTrainSelected}
                            disabled={training || selectedModels.size === 0}
                        >
                            Train Selected ({selectedModels.size})
                        </button>
                    </div>

                    {error && (
                        <div className="prediction-result prediction-bully mt-16">
                            <p>❌ {error}</p>
                        </div>
                    )}
                </div>

                {/* Right: Progress & Results */}
                <div>
                    {/* Progress */}
                    {training && (
                        <div className="card section">
                            <div className="card-title">Training Progress</div>
                            <div className="mt-16">
                                <div className="flex-between mb-16">
                                    <span className="text-sm">
                                        Training: <strong>{progress.currentModel}</strong>
                                    </span>
                                    <span className="text-sm text-muted">
                                        {progress.current}/{progress.total}
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="loading-overlay" style={{ padding: '30px 20px' }}>
                                <div className="spinner spinner-lg"></div>
                                <p className="text-sm text-muted">
                                    This may take a few minutes depending on dataset size...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {trainingResults.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">✅ Training Results</div>
                                <span className="card-badge badge-best">{trainingResults.length} models</span>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Model</th>
                                            <th>F1</th>
                                            <th>Accuracy</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trainingResults.map((r, i) => (
                                            <tr key={r.model_key} className={i === 0 ? 'best-row' : ''}>
                                                <td>{i === 0 ? '🏆' : i + 1}</td>
                                                <td style={{ fontWeight: 600, fontSize: 13 }}>{r.display_name}</td>
                                                <td>
                                                    <span className={`metric-pill ${metricColor(r.metrics.f1_score)}`}>
                                                        {(r.metrics.f1_score * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`metric-pill ${metricColor(r.metrics.accuracy)}`}>
                                                        {(r.metrics.accuracy * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="text-sm">{r.timing.total_sec}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!training && trainingResults.length === 0 && (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon">🚀</div>
                                <div className="empty-state-title">Ready to Train</div>
                                <div className="empty-state-text">
                                    Select your models and dataset, then click "Train All" to start
                                    the comparative analysis.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
