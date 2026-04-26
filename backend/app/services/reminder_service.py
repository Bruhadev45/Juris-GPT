"""
Reminder Service for JurisGPT
Handles automated email reminders for compliance deadlines and document reviews
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
import asyncio
from dataclasses import dataclass
from enum import Enum
import resend
from app.config import settings

# Configure Resend
resend.api_key = settings.resend_api_key


class ReminderType(str, Enum):
    COMPLIANCE_DEADLINE = "compliance_deadline"
    DOCUMENT_REVIEW = "document_review"
    SUBSCRIPTION_EXPIRY = "subscription_expiry"
    PAYMENT_DUE = "payment_due"


@dataclass
class Reminder:
    """Reminder data class"""
    id: str
    type: ReminderType
    recipient_email: str
    recipient_name: str
    subject: str
    due_date: datetime
    entity_id: str  # ID of compliance/document/subscription
    entity_name: str
    sent: bool = False
    sent_at: Optional[datetime] = None


# In-memory reminder storage (replace with database in production)
reminders_db: dict = {}
reminder_logs: list = []


# ============== Email Templates ==============

def get_compliance_reminder_html(
    recipient_name: str,
    deadline_title: str,
    due_date: datetime,
    days_remaining: int,
    category: str,
    description: str = ""
) -> str:
    """Generate compliance deadline reminder email HTML"""
    urgency_color = "#dc2626" if days_remaining <= 3 else "#f59e0b" if days_remaining <= 7 else "#16a34a"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1e3a5f; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ JurisGPT</h1>
                <p style="color: #94a3b8; margin: 10px 0 0 0;">Compliance Reminder</p>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #374151;">Hello {recipient_name},</p>

                <div style="background-color: #fef3c7; border-left: 4px solid {urgency_color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #92400e;">
                        ⏰ {days_remaining} days remaining
                    </p>
                </div>

                <h2 style="color: #1e3a5f; font-size: 20px; margin-bottom: 10px;">{deadline_title}</h2>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Category</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">{category}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Due Date</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: {urgency_color};">
                            {due_date.strftime('%B %d, %Y')}
                        </td>
                    </tr>
                </table>

                {f'<p style="color: #4b5563;">{description}</p>' if description else ''}

                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/dashboard/compliance"
                       style="background-color: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        View in Dashboard
                    </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                <p style="color: #6b7280; font-size: 14px;">
                    This is an automated reminder from JurisGPT. Please ensure timely compliance to avoid penalties.
                </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                <p>© 2026 JurisGPT. All rights reserved.</p>
                <p>
                    <a href="#" style="color: #6b7280;">Unsubscribe</a> |
                    <a href="#" style="color: #6b7280;">Preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def get_document_review_reminder_html(
    recipient_name: str,
    document_title: str,
    matter_id: str,
    status: str,
    created_date: datetime
) -> str:
    """Generate document review reminder email HTML"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1e3a5f; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ JurisGPT</h1>
                <p style="color: #94a3b8; margin: 10px 0 0 0;">Document Review Update</p>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #374151;">Hello {recipient_name},</p>

                <p style="color: #4b5563;">Your document is pending review:</p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <h3 style="color: #1e3a5f; margin: 0 0 10px 0;">📄 {document_title}</h3>
                    <p style="color: #6b7280; margin: 5px 0;">Matter ID: {matter_id}</p>
                    <p style="color: #6b7280; margin: 5px 0;">Status: <span style="color: #f59e0b; font-weight: bold;">{status}</span></p>
                    <p style="color: #6b7280; margin: 5px 0;">Created: {created_date.strftime('%B %d, %Y')}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/dashboard/lawyer-review"
                       style="background-color: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Review Document
                    </a>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                    Our legal team will review your document within 24-48 hours. You'll be notified once the review is complete.
                </p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
                <p>© 2026 JurisGPT. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_subscription_expiry_html(
    recipient_name: str,
    plan_name: str,
    expiry_date: datetime,
    days_remaining: int
) -> str:
    """Generate subscription expiry reminder email HTML"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1e3a5f; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚖️ JurisGPT</h1>
                <p style="color: #94a3b8; margin: 10px 0 0 0;">Subscription Reminder</p>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #374151;">Hello {recipient_name},</p>

                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-weight: bold; color: #991b1b;">
                        Your {plan_name} subscription expires in {days_remaining} days
                    </p>
                </div>

                <p style="color: #4b5563;">
                    Expiry Date: <strong>{expiry_date.strftime('%B %d, %Y')}</strong>
                </p>

                <p style="color: #4b5563;">
                    Renew now to continue enjoying uninterrupted access to all features.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000/dashboard/billing"
                       style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Renew Subscription
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


# ============== Reminder Functions ==============

async def send_reminder_email(
    to_email: str,
    subject: str,
    html_content: str
) -> bool:
    """Send reminder email using Resend"""
    try:
        params = {
            "from": "JurisGPT <reminders@jurisgpt.com>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Failed to send reminder email: {e}")
        return False


async def create_compliance_reminder(
    recipient_email: str,
    recipient_name: str,
    deadline_id: str,
    deadline_title: str,
    due_date: datetime,
    category: str,
    description: str = ""
) -> str:
    """Create a compliance deadline reminder"""
    import secrets

    reminder_id = f"rem_{secrets.token_hex(8)}"
    days_remaining = (due_date - datetime.now(timezone.utc)).days

    reminder = Reminder(
        id=reminder_id,
        type=ReminderType.COMPLIANCE_DEADLINE,
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        subject=f"Compliance Reminder: {deadline_title} - {days_remaining} days remaining",
        due_date=due_date,
        entity_id=deadline_id,
        entity_name=deadline_title
    )

    reminders_db[reminder_id] = reminder

    # Send email
    html_content = get_compliance_reminder_html(
        recipient_name=recipient_name,
        deadline_title=deadline_title,
        due_date=due_date,
        days_remaining=days_remaining,
        category=category,
        description=description
    )

    success = await send_reminder_email(
        to_email=recipient_email,
        subject=reminder.subject,
        html_content=html_content
    )

    if success:
        reminder.sent = True
        reminder.sent_at = datetime.now(timezone.utc)

    reminder_logs.append({
        "reminder_id": reminder_id,
        "type": ReminderType.COMPLIANCE_DEADLINE.value,
        "recipient": recipient_email,
        "sent": success,
        "timestamp": datetime.now(timezone.utc)
    })

    return reminder_id


async def check_and_send_compliance_reminders(
    deadlines: List[dict],
    user_email: str,
    user_name: str,
    reminder_days: List[int] = [7, 3, 1]
) -> List[str]:
    """Check deadlines and send reminders for upcoming ones"""
    sent_reminders = []

    for deadline in deadlines:
        due_date = deadline.get("due_date")
        if isinstance(due_date, str):
            due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))

        days_remaining = (due_date - datetime.now(timezone.utc)).days

        # Send reminder if within reminder threshold
        if days_remaining in reminder_days:
            reminder_id = await create_compliance_reminder(
                recipient_email=user_email,
                recipient_name=user_name,
                deadline_id=deadline.get("id", ""),
                deadline_title=deadline.get("title", "Compliance Deadline"),
                due_date=due_date,
                category=deadline.get("category", "General"),
                description=deadline.get("description", "")
            )
            sent_reminders.append(reminder_id)

    return sent_reminders


async def send_document_review_reminder(
    recipient_email: str,
    recipient_name: str,
    document_title: str,
    matter_id: str,
    status: str = "Pending Review"
) -> bool:
    """Send document review status reminder"""
    html_content = get_document_review_reminder_html(
        recipient_name=recipient_name,
        document_title=document_title,
        matter_id=matter_id,
        status=status,
        created_date=datetime.now(timezone.utc)
    )

    return await send_reminder_email(
        to_email=recipient_email,
        subject=f"Document Review Update: {document_title}",
        html_content=html_content
    )


async def send_subscription_expiry_reminder(
    recipient_email: str,
    recipient_name: str,
    plan_name: str,
    expiry_date: datetime
) -> bool:
    """Send subscription expiry reminder"""
    days_remaining = (expiry_date - datetime.now(timezone.utc)).days

    html_content = get_subscription_expiry_html(
        recipient_name=recipient_name,
        plan_name=plan_name,
        expiry_date=expiry_date,
        days_remaining=days_remaining
    )

    return await send_reminder_email(
        to_email=recipient_email,
        subject=f"Your JurisGPT {plan_name} subscription expires in {days_remaining} days",
        html_content=html_content
    )


# ============== Scheduler (for background tasks) ==============

async def run_daily_reminder_check():
    """
    Run daily check for reminders (to be called by scheduler/cron)
    In production, use Celery, APScheduler, or similar
    """
    # This would fetch users and their deadlines from database
    # and send appropriate reminders
    pass


def get_reminder_stats() -> dict:
    """Get reminder statistics"""
    return {
        "total_reminders": len(reminders_db),
        "sent_count": sum(1 for r in reminders_db.values() if r.sent),
        "pending_count": sum(1 for r in reminders_db.values() if not r.sent),
        "recent_logs": reminder_logs[-10:]
    }
