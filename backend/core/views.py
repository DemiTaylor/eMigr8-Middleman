"""
eMigr8 Inbound Webhook Views
Receives incoming WhatsApp (WAWCD) and Telegram webhook events
and routes them into the Celery processing queue.
"""

import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import WawcdIncomingMessage, ConnectedChannel
from .tasks import process_incoming_chat_message

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def telegram_webhook_view(request):
    """
    Receives incoming updates from Telegram Bot Webhook API:
    https://core.telegram.org/bots/api#update
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        message = data.get('message', {})
        chat_info = message.get('chat', {})
        client_chat_id = str(chat_info.get('id', ''))
        text = message.get('text', '')
        first_name = chat_info.get('first_name', '')
        last_name = chat_info.get('last_name', '')
        full_name = f"{first_name} {last_name}".strip() or "Telegram User"

        if client_chat_id and text:
            # Dispatch to asynchronous worker
            process_incoming_chat_message.delay(
                channel=ConnectedChannel.TELEGRAM_BOT,
                client_number=client_chat_id,
                message_text=text,
                client_name=full_name
            )

        return JsonResponse({"status": "ok"})
    except Exception as e:
        logger.error(f"Error handling Telegram webhook: {e}")
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_POST
def wawcd_webhook_view(request):
    """
    Receives incoming WhatsApp Web Cloud Dispatch (WAWCD) / Meta WhatsApp Business Cloud Webhook:
    https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
    """
    try:
        data = json.loads(request.body.decode('utf-8'))

        # Record raw payload in audit table
        wawcd_log = WawcdIncomingMessage.objects.create(
            raw_payload=data,
            from_number="",
            body=""
        )

        entry = data.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0]
        value = changes.get('value', {})
        messages = value.get('messages', [])

        if messages:
            msg_obj = messages[0]
            from_number = msg_obj.get('from', '')
            text_body = msg_obj.get('text', {}).get('body', '')

            contacts = value.get('contacts', [{}])
            contact_name = contacts[0].get('profile', {}).get('name', 'WhatsApp Client')

            wawcd_log.from_number = from_number
            wawcd_log.body = text_body
            wawcd_log.is_processed = True
            wawcd_log.save()

            if from_number and text_body:
                # Dispatch to background task
                process_incoming_chat_message.delay(
                    channel=ConnectedChannel.WAWCD,
                    client_number=from_number,
                    message_text=text_body,
                    client_name=contact_name
                )

        return JsonResponse({"status": "processed"})
    except Exception as e:
        logger.error(f"Error handling WAWCD WhatsApp webhook: {e}")
        return JsonResponse({"error": str(e)}, status=400)
