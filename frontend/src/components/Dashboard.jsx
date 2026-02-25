import { useState, useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

const SORT_KEYS = [
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'f1_score', label: 'F1-Score' },
    { key: 'train_time_s', label: 'Train Time' },
    { key: 'inference_latency_s', label: 'Inference Latency' },
];

export default function Dashboard({ results, progress }) {
    const [sortKey, setSortKey] = useState('accuracy');
    const [sortAsc, setSortAsc] = useState(false);

    const sorted = useMemo(() => {
        if (!results || results.length === 0) return [];
        return [...results].sort((a, b) =>
            sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
        );
    }, [results, sortKey, sortAsc]);

    const handleSort = (key) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(false); }
    };

    const scatterData = useMemo(() => {
        if (!results) return [];
        return results.map((r, i) => ({
            x: r.inference_latency_s * 1000, // milliseconds
            y: r.accuracy * 100,
            model: r.model,
            color: COLORS[i % COLORS.length],
        }));
    }, [results]);

    return (
        <div className="space-y-6 animate-in" style={{ animationDelay: '0.2s' }}>
            {/* Progress bar */}
            {progress && !progress.done && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">{progress.status}</span>
                        <span className="text-xs text-slate-500">
                            {progress.step}/{progress.total}
                        </span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${((progress.step || 0) / (progress.total || 1)) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Leaderboard */}
            {sorted.length > 0 && (
                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Model Leaderboard
                    </h2>
                    <p className="text-sm text-slate-400 mb-5">Click column headers to sort</p>

                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="!cursor-default">#</th>
                                    <th className="!cursor-default">Model</th>
                                    {SORT_KEYS.map((s) => (
                                        <th key={s.key} onClick={() => handleSort(s.key)}>
                                            {s.label}
                                            {sortKey === s.key && (
                                                <span className="ml-1 text-indigo-400">{sortAsc ? '↑' : '↓'}</span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((r, i) => (
                                    <tr key={r.model}>
                                        <td>
                                            <span
                                                className="inline-block w-6 h-6 rounded-full text-center text-xs leading-6 font-bold"
                                                style={{ background: COLORS[i % COLORS.length] + '22', color: COLORS[i % COLORS.length] }}
                                            >
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="font-medium">{r.model}</td>
                                        <td>{(r.accuracy * 100).toFixed(2)}%</td>
                                        <td>{(r.f1_score * 100).toFixed(2)}%</td>
                                        <td>{r.train_time_s.toFixed(3)}s</td>
                                        <td>{(r.inference_latency_s * 1000).toFixed(2)}ms</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Efficiency scatter plot */}
            {scatterData.length > 0 && (
                <div className="glass-card p-8">
                    <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Efficiency Plot
                    </h2>
                    <p className="text-sm text-slate-400 mb-5">Accuracy vs Inference Latency — top-left is best</p>

                    <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="x" type="number" name="Latency (ms)"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                label={{ value: 'Inference Latency (ms)', position: 'bottom', fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                dataKey="y" type="number" name="Accuracy (%)"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3', stroke: '#6366f1' }}
                                contentStyle={{
                                    background: 'rgba(15,15,26,0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, fontSize: 13,
                                }}
                                formatter={(value, name) => {
                                    if (name === 'Latency (ms)') return [`${value.toFixed(2)} ms`, name];
                                    return [`${value.toFixed(2)}%`, name];
                                }}
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.model || ''}
                            />
                            <Scatter data={scatterData} nameKey="model">
                                {scatterData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.color} r={8} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                        {scatterData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                                {d.model}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
