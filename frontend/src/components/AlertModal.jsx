import { useState } from 'react'

export default function AlertModal({ isOpen, onClose, prediction, modelName, onSendEmail }) {
    const [emailSending, setEmailSending] = useState(false)
    const [emailStatus, setEmailStatus] = useState('')

    if (!isOpen || !prediction) return null

    const handleSendEmail = async () => {
        setEmailSending(true)
        setEmailStatus('')
        try {
            await onSendEmail()
            setEmailStatus('✅ Alert email sent successfully!')
        } catch (err) {
            setEmailStatus(`❌ ${err.message}`)
        } finally {
            setEmailSending(false)
        }
    }

    const confidencePct = prediction.confidence
        ? (prediction.confidence * 100).toFixed(1)
        : 'N/A'

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content alert-modal" onClick={e => e.stopPropagation()}>
                {/* Pulsing alert icon */}
                <div className="alert-icon-wrap">
                    <div className="alert-icon-pulse"></div>
                    <div className="alert-icon">🚨</div>
                </div>

                <h2 className="alert-title">Cyberbullying Detected!</h2>
                <p className="alert-subtitle">
                    Potentially harmful content has been identified
                </p>

                {/* Details */}
                <div className="alert-details">
                    <div className="alert-detail-row">
                        <span className="alert-detail-label">Classification</span>
                        <span className="alert-detail-value alert-danger-text">{prediction.label}</span>
                    </div>
                    <div className="alert-detail-row">
                        <span className="alert-detail-label">Confidence</span>
                        <span className="alert-detail-value">{confidencePct}%</span>
                    </div>
                    <div className="alert-detail-row">
                        <span className="alert-detail-label">Model Used</span>
                        <span className="alert-detail-value">{modelName}</span>
                    </div>
                </div>

                {/* Flagged text */}
                <div className="alert-flagged-text">
                    <div className="alert-flagged-label">Flagged Text</div>
                    <div className="alert-flagged-content">
                        {prediction.original_text || prediction.text}
                    </div>
                </div>

                {/* Email status */}
                {emailStatus && (
                    <div className="alert-email-status">{emailStatus}</div>
                )}

                {/* Actions */}
                <div className="alert-actions">
                    <button className="btn btn-danger btn-lg" onClick={handleSendEmail} disabled={emailSending}>
                        {emailSending ? (
                            <><div className="spinner"></div> Sending...</>
                        ) : (
                            '📧 Send Email Alert'
                        )}
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={onClose}>
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    )
}
