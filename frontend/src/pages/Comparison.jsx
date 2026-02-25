import { useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter, ZAxis,
    ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#22d3ee', '#10b981', '#f59e0b', '#f43f5e']
const METRIC_KEYS = ['accuracy', 'precision', 'recall', 'f1_score']
const METRIC_LABELS = { accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1_score: 'F1 Score' }

export default function Comparison({ results, bestModel }) {
    const [tab, setTab] = useState('leaderboard')
    const [selectedModel, setSelectedModel] = useState(null)

    if (!results || results.length === 0) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h1 className="page-title">Comparison</h1>
                    <p className="page-subtitle">Train models first to see comparative analysis</p>
                </div>
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📈</div>
                        <div className="empty-state-title">No results available</div>
                        <div className="empty-state-text">
                            Go to the Training page and train all models to see the comparison charts.
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Prepare chart data
    const barData = results.map(r => ({
        name: r.display_name.replace(' + ', '\n'),
        shortName: r.model_key,
        accuracy: +(r.metrics.accuracy * 100).toFixed(1),
        precision: +(r.metrics.precision * 100).toFixed(1),
        recall: +(r.metrics.recall * 100).toFixed(1),
        f1_score: +(r.metrics.f1_score * 100).toFixed(1),
    }))

    const radarData = METRIC_KEYS.map(key => {
        const point = { metric: METRIC_LABELS[key] }
        results.forEach(r => {
            point[r.model_key] = +(r.metrics[key] * 100).toFixed(1)
        })
        return point
    })

    const scatterData = results.map((r, i) => ({
        name: r.display_name,
        x: r.timing.total_sec,
        y: +(r.metrics.f1_score * 100).toFixed(1),
        z: 100,
        fill: COLORS[i % COLORS.length],
    }))

    const metricColor = (val) => {
        if (val >= 85) return 'metric-good'
        if (val >= 70) return 'metric-ok'
        return 'metric-bad'
    }

    const detail = selectedModel || results[0]

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Comparative Analysis</h1>
                <p className="page-subtitle">
                    Side-by-side comparison of all trained models — ranked by F1 Score
                </p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {[
                    { id: 'leaderboard', label: '🏆 Leaderboard' },
                    { id: 'barchart', label: '📊 Bar Chart' },
                    { id: 'radar', label: '🕸️ Radar' },
                    { id: 'efficiency', label: '⚡ Efficiency' },
                    { id: 'detail', label: '🔍 Detail View' },
                ].map(t => (
                    <button
                        key={t.id}
                        className={`tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard */}
            {tab === 'leaderboard' && (
                <div className="card fade-in">
                    <div className="card-header">
                        <div className="card-title">Model Leaderboard</div>
                        <span className="text-sm text-muted">Sorted by F1 Score (descending)</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Model</th>
                                    <th>Feature Method</th>
                                    <th>Accuracy</th>
                                    <th>Precision</th>
                                    <th>Recall</th>
                                    <th>F1 Score</th>
                                    <th>Train Time</th>
                                    <th>Total Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr
                                        key={r.model_key}
                                        className={i === 0 ? 'best-row' : ''}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => { setSelectedModel(r); setTab('detail') }}
                                    >
                                        <td style={{ fontSize: 18 }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{r.display_name}</td>
                                        <td>{r.feature_method}</td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.accuracy * 100)}`}>
                                            {(r.metrics.accuracy * 100).toFixed(1)}%
                                        </span></td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.precision * 100)}`}>
                                            {(r.metrics.precision * 100).toFixed(1)}%
                                        </span></td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.recall * 100)}`}>
                                            {(r.metrics.recall * 100).toFixed(1)}%
                                        </span></td>
                                        <td><span className={`metric-pill ${metricColor(r.metrics.f1_score * 100)}`}>
                                            {(r.metrics.f1_score * 100).toFixed(1)}%
                                        </span></td>
                                        <td className="text-sm">{r.timing.training_sec}s</td>
                                        <td className="text-sm">{r.timing.total_sec}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bar Chart */}
            {tab === 'barchart' && (
                <div className="card fade-in">
                    <div className="card-title mb-16">Metrics Comparison (Bar Chart)</div>
                    <div className="chart-container" style={{ height: 420 }}>
                        <ResponsiveContainer>
                            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    interval={0}
                                    angle={-20}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} unit="%" />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        color: '#f1f5f9',
                                        fontSize: 13,
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: 13 }} />
                                <Bar dataKey="accuracy" name="Accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="precision" name="Precision" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="recall" name="Recall" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="f1_score" name="F1 Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Radar Chart */}
            {tab === 'radar' && (
                <div className="card fade-in">
                    <div className="card-title mb-16">Multi-Metric Radar Overlay</div>
                    <div className="chart-container" style={{ height: 450 }}>
                        <ResponsiveContainer>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis
                                    domain={[0, 100]}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                />
                                {results.map((r, i) => (
                                    <Radar
                                        key={r.model_key}
                                        name={r.display_name}
                                        dataKey={r.model_key}
                                        stroke={COLORS[i % COLORS.length]}
                                        fill={COLORS[i % COLORS.length]}
                                        fillOpacity={0.1}
                                        strokeWidth={2}
                                    />
                                ))}
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        color: '#f1f5f9',
                                        fontSize: 13,
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Efficiency Plot */}
            {tab === 'efficiency' && (
                <div className="card fade-in">
                    <div className="card-title mb-16">Efficiency: F1 Score vs Training Time</div>
                    <p className="text-sm text-muted mb-16">
                        Top-right is best — high F1 with low training time
                    </p>
                    <div className="chart-container" style={{ height: 420 }}>
                        <ResponsiveContainer>
                            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="x"
                                    name="Time"
                                    unit="s"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    label={{ value: 'Total Time (seconds)', position: 'bottom', fill: '#64748b', fontSize: 12 }}
                                />
                                <YAxis
                                    dataKey="y"
                                    name="F1"
                                    unit="%"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    domain={['auto', 'auto']}
                                    label={{ value: 'F1 Score (%)', angle: -90, position: 'left', fill: '#64748b', fontSize: 12 }}
                                />
                                <ZAxis dataKey="z" range={[200, 200]} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        color: '#f1f5f9',
                                        fontSize: 13,
                                    }}
                                    formatter={(value, name) => {
                                        if (name === 'Time') return `${value}s`
                                        if (name === 'F1') return `${value}%`
                                        return value
                                    }}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
                                />
                                <Scatter data={scatterData}>
                                    {scatterData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-row gap-16 mt-16" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                        {scatterData.map((s, i) => (
                            <div key={i} className="flex-row gap-8 text-sm">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.fill }}></div>
                                {s.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail View */}
            {tab === 'detail' && (
                <div className="fade-in">
                    {/* Model Selector */}
                    <div className="section">
                        <select
                            className="select"
                            value={detail?.model_key || ''}
                            onChange={e => {
                                const m = results.find(r => r.model_key === e.target.value)
                                if (m) setSelectedModel(m)
                            }}
                            style={{ maxWidth: 400 }}
                        >
                            {results.map(r => (
                                <option key={r.model_key} value={r.model_key}>{r.display_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid-2">
                        {/* Metrics Cards */}
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">{detail.display_name}</div>
                                {detail.model_key === bestModel?.model_key && (
                                    <span className="card-badge badge-best">🏆 Best</span>
                                )}
                            </div>
                            <p className="text-sm text-muted mb-16">{detail.description}</p>
                            <div className="grid-2">
                                {METRIC_KEYS.map(key => (
                                    <div className="stat-card" key={key}>
                                        <div className="stat-label">{METRIC_LABELS[key]}</div>
                                        <div className="stat-value">
                                            <span className={`metric-pill ${metricColor(detail.metrics[key] * 100)}`}>
                                                {(detail.metrics[key] * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-16">
                                <div className="text-sm text-muted">
                                    ⏱ Feature extraction: {detail.timing.feature_extraction_sec}s &nbsp;|&nbsp;
                                    Training: {detail.timing.training_sec}s &nbsp;|&nbsp;
                                    Prediction: {detail.timing.prediction_sec}s &nbsp;|&nbsp;
                                    Total: {detail.timing.total_sec}s
                                </div>
                                {detail.avg_confidence && (
                                    <div className="text-sm text-muted mt-16">
                                        🎯 Average Confidence: {(detail.avg_confidence * 100).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Confusion Matrix */}
                        <div className="card">
                            <div className="card-title mb-16">Confusion Matrix</div>
                            {detail.confusion_matrix && (
                                <div>
                                    <div className="confusion-matrix">
                                        <div className="cm-label"></div>
                                        <div className="cm-label">Pred Safe</div>
                                        <div className="cm-label">Pred Bully</div>
                                        <div className="cm-label" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                            Actual Safe
                                        </div>
                                        <div className="cm-cell cm-tn">{detail.confusion_matrix[0][0]}</div>
                                        <div className="cm-cell cm-fp">{detail.confusion_matrix[0][1]}</div>
                                        <div className="cm-label" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                            Actual Bully
                                        </div>
                                        <div className="cm-cell cm-fn">{detail.confusion_matrix[1][0]}</div>
                                        <div className="cm-cell cm-tp">{detail.confusion_matrix[1][1]}</div>
                                    </div>
                                    <div className="flex-row gap-16 mt-16" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <span className="text-sm"><span style={{ color: 'var(--accent-blue)' }}>■</span> TN</span>
                                        <span className="text-sm"><span style={{ color: 'var(--accent-emerald)' }}>■</span> TP</span>
                                        <span className="text-sm"><span style={{ color: 'var(--accent-amber)' }}>■</span> FP</span>
                                        <span className="text-sm"><span style={{ color: 'var(--accent-rose)' }}>■</span> FN</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
