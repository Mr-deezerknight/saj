export default function OptimizationStats({ cleanStats, feStats, trainShape, testShape }) {
    if (!cleanStats) return null;

    const statCards = [
        { label: 'Original Rows', value: cleanStats.original_rows?.toLocaleString(), icon: '📊' },
        { label: 'Duplicates Removed', value: cleanStats.duplicates_removed?.toLocaleString(), icon: '🗑️' },
        { label: 'Values Imputed', value: cleanStats.total_imputed?.toLocaleString(), icon: '🔧' },
        { label: 'Outliers Removed', value: cleanStats.outliers_removed?.toLocaleString(), icon: '📐' },
        { label: 'Clean Rows', value: cleanStats.final_rows?.toLocaleString(), icon: '✅' },
    ];

    return (
        <div className="glass-card p-8 animate-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Data Optimization Report
            </h2>
            <p className="text-sm text-slate-400 mb-6">
                Automated cleaning & feature engineering results
            </p>

            {/* Stat cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {statCards.map((s, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className="text-xl font-bold text-slate-100">{s.value ?? '—'}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Feature Engineering details */}
            {feStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h3 className="text-sm font-semibold text-indigo-300 mb-3">Feature Engineering</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex justify-between">
                                <span className="text-slate-400">Total Features</span>
                                <span className="font-medium">{feStats.feature_count}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Encoded Columns</span>
                                <span className="font-medium">{feStats.columns_encoded?.length ?? 0}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Scaled Columns</span>
                                <span className="font-medium">{feStats.columns_scaled?.length ?? 0}</span>
                            </li>
                            {feStats.target_classes && (
                                <li className="flex justify-between">
                                    <span className="text-slate-400">Target Classes</span>
                                    <span className="font-medium">{feStats.target_classes.length}</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                        <h3 className="text-sm font-semibold text-purple-300 mb-3">Dataset Split</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex justify-between">
                                <span className="text-slate-400">Train Samples</span>
                                <span className="font-medium">{trainShape?.[0]?.toLocaleString()}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Test Samples</span>
                                <span className="font-medium">{testShape?.[0]?.toLocaleString()}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-slate-400">Features</span>
                                <span className="font-medium">{trainShape?.[1]}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
