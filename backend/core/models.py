"""
eMigr8 Middleware Core Models (Simplified & Direction-Aware)
"""

from django.db import models


class ConnectedChannel(models.TextChoices):
    TELEGRAM_BOT = 'telegramBot', 'telegramBot'
    WAWCD = 'WAWCD', 'WAWCD (WhatsApp)'


class MessageDirection(models.TextChoices):
    INCOMING = 'incoming', 'Incoming (From Client)'
    OUTGOING = 'outgoing', 'Outgoing (From AI or Coach)'


class Chat(models.Model):
    """
    Represents an ongoing candidate conversation on WhatsApp (WAWCD) or Telegram.
    """
    connected_number = models.CharField(
        max_length=50,
        choices=ConnectedChannel.choices,
        default=ConnectedChannel.WAWCD
    )
    client_number = models.CharField(max_length=100)
    response_settings = models.BooleanField(
        default=True,
        verbose_name="Response Settings",
        help_text="True = AI bot replies automatically. False = AI is PAUSED (Human admin interjection active)."
    )
    is_sent_start_message = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Last Update")

    class Meta:
        verbose_name = "Chat"
        verbose_name_plural = "Chats"
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat #{self.pk} - {self.client_number} via {self.connected_number}"

    @property
    def incoming_count(self):
        return self.messages.filter(direction=MessageDirection.INCOMING).count()

    @property
    def outgoing_count(self):
        return self.messages.filter(direction=MessageDirection.OUTGOING).count()

    @property
    def messages_count(self):
        return self.messages.count()

    @property
    def latest_message(self):
        return self.messages.order_by('-created_at').first()


class Message(models.Model):
    """
    Message in a chat thread with explicit incoming or outgoing direction.
    """
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    direction = models.CharField(
        max_length=10,
        choices=MessageDirection.choices,
        default=MessageDirection.INCOMING,
        verbose_name="Direction"
    )
    phone_number = models.CharField(max_length=100)
    message = models.TextField()
    is_interjection = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Timestamp")

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.direction.upper()}] {self.phone_number}: {self.message[:30]}"
