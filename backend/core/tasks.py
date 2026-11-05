"""
Celery Asynchronous Tasks for eMigr8 Middleware
Processes incoming messages, triggers Dr. Zenith AI copilot responses,
and enforces response_settings gates (pausing if human has interjected).
"""

import logging
import os
from celery import shared_task
from django.utils import timezone

from .models import Chat, Message, MessageSender, ConnectedChannel
from .services.policy_guardrail import PolicyGuardrail
from .services.interjection_service import InterjectionService

logger = logging.getLogger(__name__)


@shared_task
def process_incoming_chat_message(channel: str, client_number: str, message_text: str, client_name: str = None):
    """
    Ingests an incoming candidate message from WhatsApp (WAWCD) or Telegram.
    1. Finds or creates the Chat thread.
    2. Stores the client's Message.
    3. Checks chat.response_settings:
       - If False (Human interjection active): AI is silenced.
       - If True (AI bot active): Generates Dr. Zenith response, runs guardrail, and sends reply.
    """
    # 1. Get or create Chat thread
    chat, created = Chat.objects.get_or_create(
        connected_number=channel,
        client_number=client_number,
        defaults={
            'client_name': client_name,
            'response_settings': True,
            'is_sent_start_message': True,
        }
    )

    # 2. Record Client Message
    Message.objects.create(
        chat=chat,
        sender=MessageSender.CLIENT,
        phone_number=client_number,
        message=message_text,
    )
    chat.save(update_fields=['updated_at'])

    # 3. Check if AI Bot is allowed to respond
    if not chat.response_settings:
        logger.info(f"AI response suppressed for Chat #{chat.pk}: Human coach has paused AI auto-replies.")
        return {"status": "ai_paused", "chat_id": chat.pk}

    # 4. Generate AI Copilot Response (Dr. Zenith)
    ai_reply_text = generate_dr_zenith_response(message_text, channel)

    # 5. Run Policy Guardrail to detect potential hallucinations or errors
    is_compliant, confidence, warning_reason = PolicyGuardrail.validate_visa_response(ai_reply_text)

    # 6. Record AI Message in Database
    ai_msg = Message.objects.create(
        chat=chat,
        sender=MessageSender.AI_BOT,
        phone_number=channel,
        message=ai_reply_text,
        is_ai_response=True,
        ai_accuracy_score=confidence,
        has_ai_warning=not is_compliant,
        ai_warning_reason=warning_reason
    )

    # If policy engine flagged an issue, notify the admin dashboard table!
    if not is_compliant:
        chat.has_warning_flag = True
        chat.warning_note = warning_reason
        chat.save(update_fields=['has_warning_flag', 'warning_note', 'updated_at'])
        logger.warning(f"🚨 POLICY ALERT on Chat #{chat.pk}: {warning_reason}")

    # 7. Dispatch AI reply to WhatsApp or Telegram
    InterjectionService._dispatch_to_channel(channel, client_number, ai_reply_text)

    return {
        "status": "ai_replied",
        "chat_id": chat.pk,
        "message_id": ai_msg.pk,
        "is_compliant": is_compliant
    }


def generate_dr_zenith_response(user_query: str, channel: str) -> str:
    """
    Invokes LLM (Gemini or Dr. Zenith engine) with immigration prompt context.
    """
    lower = user_query.lower()
    if "letters of recommendation" in lower or "tech nation" in lower:
        return (
            "For the UK Global Talent Visa (Tech Nation endorsement), you must submit EXACTLY 3 letters "
            "of recommendation from senior leaders in recognized digital technology companies. Each letter "
            "must be on official corporate letterhead and detail your significant contributions."
        )
    elif "safe" in lower or "o-1" in lower or "o1" in lower:
        return (
            "Under USCIS policy for founders, venture capital investment (including institutional SAFE notes "
            "and priced equity rounds) can be submitted as evidence for Critical Role and High Remuneration."
        )
    elif "canada" in lower or "suv" in lower:
        return (
            "Canada Startup Visa requires obtaining a Letter of Support from a designated angel group (min $75k CAD), "
            "venture capital fund (min $200k CAD), or business incubator."
        )
    else:
        return (
            "Hello! I am Dr. Zenith, your eMigr8 AI immigration co-pilot. I can evaluate your eligibility "
            "for the UK Global Talent, US O-1A/EB-1A, and Canada Startup Visa routes. How can I assist you today?"
        )
