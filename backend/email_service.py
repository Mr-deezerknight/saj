"""
Email alert service for cyberbullying detection.
Provides SMTP configuration management and alert email sending.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel
from typing import Optional


class EmailConfig(BaseModel):
    smtp_host: str = ""
    smtp_port: int = 587
    sender_email: str = ""
    sender_password: str = ""
    recipient_email: str = ""
    use_tls: bool = True


# In-memory config store
_email_config: Optional[EmailConfig] = None


def save_config(config: EmailConfig):
    """Save email configuration in memory."""
    global _email_config
    _email_config = config


def get_config() -> Optional[dict]:
    """Return current config with password masked."""
    if _email_config is None:
        return None
    return {
        "smtp_host": _email_config.smtp_host,
        "smtp_port": _email_config.smtp_port,
        "sender_email": _email_config.sender_email,
        "sender_password": "••••••••" if _email_config.sender_password else "",
        "recipient_email": _email_config.recipient_email,
        "use_tls": _email_config.use_tls,
        "is_configured": bool(_email_config.smtp_host and _email_config.sender_email),
    }


def send_alert_email(text: str, label: str, confidence: float, model_name: str) -> dict:
    """Send a cyberbullying alert email using the stored SMTP config."""
    if _email_config is None:
        raise ValueError("Email is not configured. Please set up SMTP settings first.")

    if not _email_config.smtp_host or not _email_config.sender_email:
        raise ValueError("Incomplete email configuration. Please fill in all SMTP fields.")

    # Build email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "🚨 Cyberbullying Alert — CyberShield Detection"
    msg["From"] = _email_config.sender_email
    msg["To"] = _email_config.recipient_email

    confidence_pct = f"{confidence * 100:.1f}%" if confidence else "N/A"

    html_body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #f1f5f9; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid rgba(244,63,94,0.3);">
        <h1 style="color: #f43f5e; text-align: center; font-size: 24px;">🚨 Cyberbullying Detected</h1>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
        <table style="width: 100%; font-size: 14px; color: #94a3b8;">
          <tr><td style="padding: 8px 0; font-weight: 600;">Classification:</td><td style="color: #f43f5e; font-weight: 700;">{label}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600;">Confidence:</td><td>{confidence_pct}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: 600;">Model Used:</td><td>{model_name}</td></tr>
        </table>
        <div style="margin-top: 20px;">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Flagged Text:</div>
          <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6;">
            {text}
          </div>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
          Sent by CyberShield ML Analysis System
        </p>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html_body, "html"))

    try:
        if _email_config.use_tls:
            server = smtplib.SMTP(_email_config.smtp_host, _email_config.smtp_port)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(_email_config.smtp_host, _email_config.smtp_port)

        server.login(_email_config.sender_email, _email_config.sender_password)
        server.sendmail(
            _email_config.sender_email,
            _email_config.recipient_email,
            msg.as_string(),
        )
        server.quit()
        return {"success": True, "message": f"Alert email sent to {_email_config.recipient_email}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send email: {str(e)}"}
