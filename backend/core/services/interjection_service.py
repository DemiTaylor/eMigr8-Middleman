"""
eMigr8 Human Interjection Service
Handles manual message dispatch by human coaches, auto-pausing the AI bot,
and integrating with external WhatsApp (WAWCD) and Telegram gateways.
"""

import logging
import os
import requests
from typing import Tuple, Optional

from ..models import Chat, Message, MessageSender, ConnectedChannel, WawcdOutgoingMessage

logger = logging.getLogger(__name__)


class InterjectionService:
    """
    Orchestrates the dispatch of human admin messages directly to applicants'
    WhatsApp or Telegram clients and pauses automated bot responses.
    """

    @classmethod
    def send_human_interjection(
        cls,
        chat: Chat,
        message_text: str,
        pause_ai: bool = True,
        admin_user=None
    ) -> Tuple[bool, Optional[str]]:
        """
        Dispatches an authoritative message to the candidate's active channel,
        records the message in the database, and pauses automated AI responses.
        """
        admin_label = f"Admin {admin_user.username}" if admin_user and admin_user.is_authenticated else "Admin Coach"

        # 1. Dispatch to External Gateway (WhatsApp or Telegram)
        dispatch_success, error = cls._dispatch_to_channel(
            channel=chat.connected_number,
            recipient=chat.client_number,
            text=message_text
        )

        if not dispatch_success:
            logger.error(f"Failed to dispatch interjection to {chat.client_number} via {chat.connected_number}: {error}")
            # We still record in database or return error based on preference
            return False, error

        # 2. Record Message in Database
        msg = Message.objects.create(
            chat=chat,
            sender=MessageSender.HUMAN_ADMIN,
            phone_number="Admin Console",
            message=message_text,
            is_interjection=True,
            is_ai_response=False
        )

        # 3. Update Chat State: pause AI auto-reply if requested, clear warning flag
        chat.has_warning_flag = False
        chat.warning_note = None
        if pause_ai:
            chat.response_settings = False
            logger.info(f"Chat #{chat.pk} AI responses PAUSED following coach interjection.")

        chat.save(update_fields=['has_warning_flag', 'warning_note', 'response_settings', 'updated_at'])

        return True, None

    @classmethod
    def _dispatch_to_channel(cls, channel: str, recipient: str, text: str) -> Tuple[bool, Optional[str]]:
        """
        Sends payload to the respective external provider API.
        """
        if channel == ConnectedChannel.TELEGRAM_BOT:
            # Telegram Bot Send Message API
            token = os.environ.get("TELEGRAM_BOT_TOKEN", "mock_telegram_token")
            if token == "mock_telegram_token":
                # Simulated dispatch in dev
                logger.info(f"[SIMULATED TELEGRAM SEND] To {recipient}: {text}")
                return True, None

            url = f"https://api.telegram.org/bot{token}/sendMessage"
            payload = {
                "chat_id": recipient,
                "text": text,
                "parse_mode": "Markdown"
            }
            try:
                resp = requests.post(url, json=payload, timeout=10)
                if resp.status_code == 200:
                    return True, None
                return False, f"Telegram API error: {resp.text}"
            except Exception as e:
                return False, str(e)

        elif channel == ConnectedChannel.WAWCD:
            # WhatsApp Web Cloud Dispatch / Meta Cloud API
            wawcd_gateway_url = os.environ.get("WAWCD_GATEWAY_URL", "https://api.emigr8.internal/wawcd/send")
            wawcd_api_key = os.environ.get("WAWCD_API_KEY", "mock_key")

            # Audit log record
            WawcdOutgoingMessage.objects.create(
                to_number=recipient,
                body=text,
                status='sent'
            )

            if wawcd_api_key == "mock_key":
                # Simulated dispatch in dev
                logger.info(f"[SIMULATED WHATSAPP WAWCD SEND] To {recipient}: {text}")
                return True, None

            headers = {
                "Authorization": f"Bearer {wawcd_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "to": recipient,
                "type": "text",
                "text": {"body": text}
            }
            try:
                resp = requests.post(wawcd_gateway_url, json=payload, headers=headers, timeout=10)
                if resp.status_code in [200, 201]:
                    return True, None
                return False, f"WAWCD API error: {resp.text}"
            except Exception as e:
                return False, str(e)

        return True, None
