import { useState, useEffect } from 'react'
import { fetchDatasets, fetchResults } from '../api'

export default function Dashboard({ results, bestModel, onNavigate }) {
    const [datasets, setDatasets] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDatasets()
            .then(data => setDatasets(data.datasets || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const metricColor = (val) => {
        if (val >= 0.85) return 'metric-good'
        if (val >= 0.7) return 'metric-ok'
        return 'metric-bad'
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                    Overview of datasets and model performance for cyberbullying detection
                </p>
            </div>

            {/* Dataset Stats */}
            <div className="section">
                <h2 className="section-title">📁 Datasets</h2>
                {loading ? (
                    <div className="loading-overlay">
                        <div className="spinner spinner-lg"></div>
                        <p>Loading dataset info...</p>
                    </div>
                ) : (
                    <div className="grid-3">
                        {datasets.map(ds => (
                            <div className="stat-card" key={ds.dataset_id}>
                                <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                                    {ds.dataset_id === '1' ? '📄' : ds.dataset_id === '2' ? '📑' : '📚'}
                                </div>
                                <div className="stat-label">
                                    {ds.dataset_id === 'combined' ? 'Combined' : `Dataset ${ds.dataset_id}`}
                                </div>
                                <div className="stat-value">{ds.total_samples?.toLocaleString()}</div>
                                <div className="text-sm text-muted mt-16">
                                    🔴 {ds.bullying_samples?.toLocaleString()} bullying &nbsp;·&nbsp;
                                    🟢 {ds.safe_samples?.toLocaleString()} safe
                                </div>
                                <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                                    Avg length: {ds.avg_text_length} chars &nbsp;·&nbsp;
                                    Ratio: {(ds.bullying_ratio * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Best Model Summary */}
            <div className="section">
                <h2 className="section-title">🏆 Best Model</h2>
                {bestModel ? (
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">{bestModel.display_name}</div>
                                <div className="text-sm text-muted">{bestModel.description}</div>
                            </div>
                            <span className="card-badge badge-best">🏆 Best</span>
                        </div>
                        <div className="grid-4">
                            <div className="stat-card">
                                <div className="stat-label">Accuracy</div>
                                <div className="stat-value">
                                    <span className={`metric-pill ${metricColor(bestModel.metrics.accuracy)}`}>
                                        {(bestModel.metrics.accuracy * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Precision</div>
                                <div className="stat-value">
                                    <span className={`metric-pill ${metricColor(bestModel.metrics.precision)}`}>
                                        {(bestModel.metrics.precision * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Recall</div>
                                <div className="stat-value">
                                    <span className={`metric-pill ${metricColor(bestModel.metrics.recall)}`}>
                                        {(bestModel.metrics.recall * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">F1 Score</div>
                                <div className="stat-value">
                                    <span className={`metric-pill ${metricColor(bestModel.metrics.f1_score)}`}>
                                        {(bestModel.metrics.f1_score * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-muted mt-16">
                            ⏱️ Total training time: {bestModel.timing.total_sec}s &nbsp;·&nbsp;
                            📊 {bestModel.train_samples?.toLocaleString()} training samples
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">🧠</div>
                            <div className="empty-state-title">No models trained yet</div>
                            <div className="empty-state-text">
                                Go to the Training page to train models and find the best performer.
                            </div>
                            <button className="btn btn-primary mt-24" onClick={() => onNavigate('training')}>
                                Start Training →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Results Table */}
            {results.length > 0 && (
                <div className="section">
                    <div className="flex-between mb-16">
                        <h2 className="section-title" style={{ marginBottom: 0 }}>📋 All Results</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('comparison')}>
                            View Charts →
                        </button>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Model</th>
                                    <th>Feature</th>
                                    <th>Accuracy</th>
                                    <th>Precision</th>
                                    <th>Recall</th>
                                    <th>F1 Score</th>
                                    <th>Time (s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={r.model_key} className={i === 0 ? 'best-row' : ''}>
                                        <td>{i === 0 ? '🏆' : i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{r.display_name}</td>
                                        <td>{r.feature_method}</td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.accuracy)}`}>
                                            {(r.metrics.accuracy * 100).toFixed(1)}%
                                        </span></td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.precision)}`}>
                                            {(r.metrics.precision * 100).toFixed(1)}%
                                        </span></td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.recall)}`}>
                                            {(r.metrics.recall * 100).toFixed(1)}%
                                        </span></td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.f1_score)}`}>
                                            {(r.metrics.f1_score * 100).toFixed(1)}%
                                        </span></td>
                                        <td>{r.timing.total_sec}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
