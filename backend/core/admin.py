"""
Django Administration Configuration for eMigr8 Middleware
Adds explicit Incoming and Outgoing message columns on the Chats table
and the live Interjection Workbench.
"""

from django.contrib import admin, messages
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect, get_object_or_404
from django.http import HttpResponseRedirect
from django.utils.timezone import localtime

from .models import Chat, Message, ConnectedChannel, MessageDirection


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    """
    Chats table with explicit Incoming and Outgoing message columns.
    """
    list_display = (
        'id',
        'connected_number_badge',
        'client_number',
        'last_update_formatted',
        'incoming_messages_column',
        'outgoing_messages_column',
        'view_messages_link',
        'response_settings_toggle',
        'is_sent_start_message_icon',
        'interject_action_button',
    )
    list_filter = (
        'response_settings',
        'connected_number',
    )
    search_fields = ('client_number', 'messages__message')
    actions = ['pause_ai_auto_responses', 'enable_ai_auto_responses']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:chat_id>/toggle-ai/', self.admin_site.admin_view(self.toggle_ai_setting_view), name='chat_toggle_ai'),
        ]
        return custom_urls + urls

    def toggle_ai_setting_view(self, request, chat_id):
        chat = get_object_or_404(Chat, pk=chat_id)
        chat.response_settings = not chat.response_settings
        chat.save(update_fields=['response_settings', 'updated_at'])
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', reverse('admin:core_chat_changelist')))

    @admin.display(description="CONNECTED NUMBER", ordering='connected_number')
    def connected_number_badge(self, obj):
        if obj.connected_number == ConnectedChannel.WAWCD:
            return format_html('<span style="background-color: #064e3b; color: #34d399; padding: 2px 8px; border-radius: 4px; font-weight: bold;">WAWCD (WhatsApp)</span>')
        return format_html('<span style="background-color: #1e3a8a; color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-weight: bold;">telegramBot</span>')

    @admin.display(description="LAST UPDATE", ordering='updated_at')
    def last_update_formatted(self, obj):
        local_time = localtime(obj.updated_at)
        return local_time.strftime("%b. %d, %Y, %I:%M %p").replace("AM", "a.m.").replace("PM", "p.m.")

    @admin.display(description="INCOMING MESSAGES ↙")
    def incoming_messages_column(self, obj):
        count = obj.incoming_count
        return format_html(
            '<span style="background-color: #1e3a8a; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: bold;">'
            '↙ {} incoming</span>',
            count
        )

    @admin.display(description="OUTGOING MESSAGES ↗")
    def outgoing_messages_column(self, obj):
        count = obj.outgoing_count
        return format_html(
            '<span style="background-color: #581c87; color: #d8b4fe; padding: 2px 8px; border-radius: 4px; font-weight: bold;">'
            '↗ {} outgoing</span>',
            count
        )

    @admin.display(description="MESSAGES")
    def view_messages_link(self, obj):
        messages_url = f"{reverse('admin:core_message_changelist')}?chat__id={obj.pk}"
        return format_html('<a href="{}" style="color: #2dd4bf; text-decoration: underline; font-weight: bold;">View Messages ({})</a>', messages_url, obj.messages_count)

    @admin.display(description="RESPONSE SETTINGS", ordering='response_settings')
    def response_settings_toggle(self, obj):
        toggle_url = reverse('admin:chat_toggle_ai', args=[obj.pk])
        if obj.response_settings:
            return format_html('<a href="{}" title="AI Active. Click to Pause"><span style="color: #10b981; font-size: 16px;">✔</span></a>', toggle_url)
        return format_html('<a href="{}" title="AI Paused. Click to Resume"><span style="color: #ef4444; font-size: 16px;">✖</span></a>', toggle_url)

    @admin.display(description="IS SENT START MESSAGE", ordering='is_sent_start_message')
    def is_sent_start_message_icon(self, obj):
        if obj.is_sent_start_message:
            return format_html('<span style="color: #10b981; font-size: 16px;">✔</span>')
        return format_html('<span style="color: #ef4444; font-size: 16px;">✖</span>')

    @admin.display(description="ACTION")
    def interject_action_button(self, obj):
        messages_url = f"{reverse('admin:core_message_changelist')}?chat__id={obj.pk}"
        return format_html('<a href="{}" style="background-color: #0f766e; color: #ffffff; padding: 3px 10px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold;">Interject</a>', messages_url)

    @admin.action(description="Pause AI auto-response for selected chats (Take Over)")
    def pause_ai_auto_responses(self, request, queryset):
        queryset.update(response_settings=False)

    @admin.action(description="Enable AI auto-response for selected chats")
    def enable_ai_auto_responses(self, request, queryset):
        queryset.update(response_settings=True)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    change_list_template = "admin/core/message/change_list.html"
    list_display = ('id', 'direction_badge', 'phone_number', 'message', 'created_at_formatted')
    list_filter = ('direction', 'is_interjection')
    search_fields = ('phone_number', 'message')

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        chat_id = request.GET.get('chat__id')
        if chat_id:
            try:
                extra_context['active_chat'] = Chat.objects.prefetch_related('messages').get(pk=chat_id)
            except Chat.DoesNotExist:
                pass

        # Handle Human Interjection Send
        if request.method == 'POST' and request.POST.get('action') == 'send_interjection':
            text = request.POST.get('interjection_text', '').strip()
            target_chat_id = request.POST.get('target_chat_id')
            pause_ai = request.POST.get('pause_ai') == 'on'

            if text and target_chat_id:
                target_chat = get_object_or_404(Chat, pk=target_chat_id)
                
                # 1. Create Outgoing Message
                Message.objects.create(
                    chat=target_chat,
                    direction=MessageDirection.OUTGOING,
                    phone_number="Admin Console",
                    message=text,
                    is_interjection=True
                )

                # 2. Automatically Pause AI if selected
                if pause_ai:
                    target_chat.response_settings = False
                target_chat.save(update_fields=['response_settings', 'updated_at'])

                self.message_user(request, f"Interjection dispatched to {target_chat.client_number} via {target_chat.connected_number}!", messages.SUCCESS)
                return redirect(f"{reverse('admin:core_message_changelist')}?chat__id={target_chat.pk}")

        return super().changelist_view(request, extra_context=extra_context)

    @admin.display(description="DIRECTION")
    def direction_badge(self, obj):
        if obj.direction == MessageDirection.INCOMING:
            return format_html('<span style="background-color: #1e3a8a; color: #93c5fd; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">INCOMING ↙ (Client)</span>')
        elif obj.is_interjection:
            return format_html('<span style="background-color: #0f766e; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">OUTGOING ↗ (Admin)</span>')
        return format_html('<span style="background-color: #581c87; color: #d8b4fe; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">OUTGOING ↗ (AI Bot)</span>')

    @admin.display(description="TIMESTAMP", ordering='created_at')
    def created_at_formatted(self, obj):
        local_time = localtime(obj.created_at)
        return local_time.strftime("%b. %d, %Y, %I:%M %p").replace("AM", "a.m.").replace("PM", "p.m.")
