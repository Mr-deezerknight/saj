import { useState, useEffect } from 'react'
import { getEmailConfig, saveEmailConfig } from '../api'

export default function Settings() {
    const [config, setConfig] = useState({
        smtp_host: '',
        smtp_port: 587,
        sender_email: '',
        sender_password: '',
        recipient_email: '',
        use_tls: true,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState({ type: '', message: '' })

    useEffect(() => {
        getEmailConfig()
            .then(data => {
                if (data.config) {
                    setConfig(prev => ({
                        ...prev,
                        smtp_host: data.config.smtp_host || '',
                        smtp_port: data.config.smtp_port || 587,
                        sender_email: data.config.sender_email || '',
                        recipient_email: data.config.recipient_email || '',
                        use_tls: data.config.use_tls !== false,
                        // Don't overwrite password field with masked value
                    }))
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }))
        setStatus({ type: '', message: '' })
    }

    const handleSave = async () => {
        setSaving(true)
        setStatus({ type: '', message: '' })
        try {
            await saveEmailConfig(config)
            setStatus({ type: 'success', message: '✅ Email configuration saved successfully!' })
        } catch (err) {
            setStatus({ type: 'error', message: `❌ ${err.message}` })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="fade-in">
                <div className="loading-overlay">
                    <div className="spinner spinner-lg"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">
                    Configure email alerts for cyberbullying detection notifications
                </p>
            </div>

            <div className="grid-2">
                {/* Email Configuration Form */}
                <div>
                    <div className="card section">
                        <div className="card-header">
                            <div className="card-title">📧 SMTP Email Configuration</div>
                        </div>

                        <div className="settings-form">
                            <div className="form-group">
                                <label className="form-label">SMTP Host</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g. smtp.gmail.com"
                                    value={config.smtp_host}
                                    onChange={e => handleChange('smtp_host', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">SMTP Port</label>
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="587"
                                    value={config.smtp_port}
                                    onChange={e => handleChange('smtp_port', parseInt(e.target.value) || 587)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sender Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="your-email@gmail.com"
                                    value={config.sender_email}
                                    onChange={e => handleChange('sender_email', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">App Password / SMTP Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    placeholder="Enter your app password"
                                    value={config.sender_password}
                                    onChange={e => handleChange('sender_password', e.target.value)}
                                />
                                <span className="form-hint">
                                    For Gmail, use an App Password from your Google Account settings
                                </span>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Recipient Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="recipient@example.com"
                                    value={config.recipient_email}
                                    onChange={e => handleChange('recipient_email', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label" style={{ padding: '10px 0', border: 'none', background: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={config.use_tls}
                                        onChange={e => handleChange('use_tls', e.target.checked)}
                                    />
                                    <span>Use TLS (recommended)</span>
                                </label>
                            </div>

                            {status.message && (
                                <div className={`form-status ${status.type === 'error' ? 'form-status-error' : 'form-status-success'}`}>
                                    {status.message}
                                </div>
                            )}

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSave}
                                disabled={saving}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                {saving ? (
                                    <><div className="spinner"></div> Saving...</>
                                ) : (
                                    '💾 Save Configuration'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <div>
                    <div className="card">
                        <div className="card-title mb-16">ℹ️ How Email Alerts Work</div>
                        <div className="settings-info">
                            <div className="settings-info-step">
                                <div className="settings-step-num">1</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Configure SMTP</div>
                                    <div className="text-sm text-muted">
                                        Enter your SMTP server details. For Gmail, use <code>smtp.gmail.com</code> with port <code>587</code>.
                                    </div>
                                </div>
                            </div>
                            <div className="settings-info-step">
                                <div className="settings-step-num">2</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Detect Cyberbullying</div>
                                    <div className="text-sm text-muted">
                                        When a text is flagged as cyberbullying, a popup alert will appear.
                                    </div>
                                </div>
                            </div>
                            <div className="settings-info-step">
                                <div className="settings-step-num">3</div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Send Alert</div>
                                    <div className="text-sm text-muted">
                                        Click "Send Email Alert" in the popup to email the flagged content to the configured recipient.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mt-24">
                        <div className="card-title mb-16">🔑 Gmail App Password</div>
                        <div className="text-sm text-muted" style={{ lineHeight: 1.8 }}>
                            <ol style={{ paddingLeft: 20 }}>
                                <li>Go to Google Account → Security</li>
                                <li>Enable 2-Step Verification</li>
                                <li>Search for "App Passwords"</li>
                                <li>Generate a new app password for "Mail"</li>
                                <li>Use the 16-character password above</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
