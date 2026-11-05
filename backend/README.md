# eMigr8 Middleware Django Backend

Enterprise middleware gateway connecting candidate channels (**WhatsApp WAWCD** & **Telegram**) to the **Dr. Zenith AI Copilot**, with live human coach interjection and policy guardrails.

---

## Architecture Overview

```
[ WhatsApp (WAWCD) ]       [ Telegram (telegramBot) ]
         │                              │
         ▼                              ▼
  /api/v1/wawcd/webhook/      /api/v1/telegram/webhook/
         │                              │
         └──────────────┬───────────────┘
                        ▼
            process_incoming_chat_message (Celery Task)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
  chat.response_settings?        chat.response_settings?
      (== False)                     (== True)
         │                             │
   [AI IS SILENCED]             [DR. ZENITH GENERATES REPLY]
   Human Coach Takeover                │
                                       ▼
                              PolicyGuardrail Scan
                               (Checks 3-referee rule,
                               10-piece ceiling, O-1A SAFE)
                                       │
                                       ▼
                              If Misinformation Detected:
                              → Flag chat.has_warning_flag = True
                              → Alert in Django Admin Table!
```

---

## File Structure

```
backend/
├── requirements.txt                         # Python packages (Django, Celery, Redis, requests)
├── core/
│   ├── models.py                            # Chat, Message, WawcdIncomingMessage models
│   ├── admin.py                             # Replicates the Chats table & Interjection box
│   ├── views.py                             # Inbound webhooks for WhatsApp & Telegram
│   ├── tasks.py                             # Celery async worker for AI responses & routing
│   └── services/
│       ├── interjection_service.py          # Sends human coach messages & auto-pauses AI
│       └── policy_guardrail.py              # Immigration statutory rule checker & hallucination detector
└── templates/
    └── admin/
        └── core/
            └── message/
                └── change_list.html         # Custom template embedding the Interjection Box
```

---

## Setup & Execution

### 1. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Create `.env`:
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
WAWCD_GATEWAY_URL=https://graph.facebook.com/v19.0/your-phone-id/messages
WAWCD_API_KEY=your-meta-or-wawcd-token
CELERY_BROKER_URL=redis://localhost:6379/0
```

### 3. Run Database Migrations
```bash
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
```

### 4. Start Celery Worker
```bash
celery -A your_project worker -l info
```

### 5. Launch Django Server
```bash
python manage.py runserver 0.0.0.0:8000
```
Visit `http://localhost:8000/admin/core/chat/` to view the Chats table and interject in active conversations!
