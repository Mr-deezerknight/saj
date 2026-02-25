import { useState, useCallback } from 'react';
import axios from 'axios';

export default function MultiFileUpload({ onUploadComplete }) {
    const [files, setFiles] = useState([]);
    const [mode, setMode] = useState('concat');
    const [targetColumn, setTargetColumn] = useState('');
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = Array.from(e.dataTransfer.files).filter(
            (f) => f.name.endsWith('.csv') || f.name.endsWith('.json')
        );
        if (dropped.length === 0) {
            setError('Please drop CSV or JSON files only.');
            return;
        }
        setFiles((prev) => [...prev, ...dropped]);
        setError('');
    }, []);

    const handleFileInput = (e) => {
        const selected = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selected]);
        setError('');
    };

    const removeFile = (idx) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleUpload = async () => {
        if (files.length === 0) return setError('Add at least one file.');
        if (!targetColumn.trim()) return setError('Enter the target column name.');
        setUploading(true);
        setError('');

        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        formData.append('mode', mode);
        formData.append('target_column', targetColumn.trim());

        try {
            const res = await axios.post('/api/upload', formData);
            onUploadComplete(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Check backend.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-card p-8 animate-in">
            <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Dataset Ingestion
            </h2>
            <p className="text-sm text-slate-400 mb-6">
                Drop your CSV / JSON files below to get started.
            </p>

            {/* Drop zone */}
            <div
                className={`drop-zone flex flex-col items-center justify-center py-16 px-6 text-center mb-6 ${dragging ? 'active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
            >
                <svg className="w-12 h-12 mb-4 text-indigo-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                <p className="text-slate-300 font-medium">Drag & drop files here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse • CSV / JSON</p>
                <input
                    id="file-input"
                    type="file"
                    accept=".csv,.json"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                />
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="mb-6 space-y-2">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <span className="text-indigo-400 text-lg">📄</span>
                                <span className="text-sm font-medium">{f.name}</span>
                                <span className="text-xs text-slate-500">({(f.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none">&times;</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mode selector */}
            <div className="flex flex-wrap gap-3 mb-5">
                {[
                    { value: 'concat', label: '🔗 Concatenate', desc: 'Merge all files, auto-split 80/20' },
                    { value: 'split', label: '✂️ Train / Test', desc: 'File 1 = Train, File 2 = Test' },
                ].map((opt) => (
                    <button
                        key={opt.value}
                        className={`toggle-chip ${mode === opt.value ? 'active' : ''}`}
                        onClick={() => setMode(opt.value)}
                    >
                        <span>{opt.label}</span>
                    </button>
                ))}
                <span className="text-xs text-slate-500 self-center ml-2">
                    {mode === 'concat' ? 'All files merged → 80/20 split' : '1st file = train, 2nd = test'}
                </span>
            </div>

            {/* Target column */}
            <div className="mb-6">
                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Target Column</label>
                <input
                    type="text"
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    placeholder="e.g. label, sentiment, class"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-200
                     placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Upload button */}
            <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
            >
                {uploading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing…
                    </>
                ) : (
                    <>🚀 Upload & Optimize</>
                )}
            </button>
        </div>
    );
}
