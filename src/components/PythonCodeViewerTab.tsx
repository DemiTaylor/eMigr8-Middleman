import React, { useState } from 'react';
import { Code, Copy, Check, FileText } from 'lucide-react';

interface PythonFile {
  name: string;
  path: string;
  description: string;
  code: string;
}

const PYTHON_FILES: PythonFile[] = [
  {
    name: 'models.py',
    path: 'backend/core/models.py',
    description: 'Chat and Message models with explicit incoming and outgoing direction tracking and response_settings for AI pausing.',
    code: `from django.db import models


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
        ordering = ['created_at']`
  },
  {
    name: 'admin.py',
    path: 'backend/core/admin.py',
    description: 'Django Admin registering the Chats table with Incoming Messages and Outgoing Messages columns, plus the Interjection view.',
    code: `from django.contrib import admin, messages
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect, get_object_or_404
from django.http import HttpResponseRedirect
from django.utils.timezone import localtime

from .models import Chat, Message, ConnectedChannel, MessageDirection


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
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
    list_filter = ('response_settings', 'connected_number')
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
            '<span style="background-color: #1e3a8a; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: bold;">↙ {} incoming</span>',
            count
        )

    @admin.display(description="OUTGOING MESSAGES ↗")
    def outgoing_messages_column(self, obj):
        count = obj.outgoing_count
        return format_html(
            '<span style="background-color: #581c87; color: #d8b4fe; padding: 2px 8px; border-radius: 4px; font-weight: bold;">↗ {} outgoing</span>',
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
                Message.objects.create(
                    chat=target_chat,
                    direction=MessageDirection.OUTGOING,
                    phone_number="Admin Console",
                    message=text,
                    is_interjection=True
                )
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
        return local_time.strftime("%b. %d, %Y, %I:%M %p").replace("AM", "a.m.").replace("PM", "p.m.")`
  },
  {
    name: 'change_list.html',
    path: 'backend/templates/admin/core/message/change_list.html',
    description: 'Custom Django template embedding the "Send to <client> via <channel>" Interjection Box directly above the messages table.',
    code: `{% extends "admin/change_list.html" %}
{% load i18n admin_urls static admin_list %}

{% block content %}
<div id="content-main">
  {% if active_chat %}
    <!-- Human Interjection Box -->
    <div style="margin-bottom: 20px; padding: 18px; background-color: #141a24; border: 1px solid #334155; border-radius: 8px;">
      
      <div style="font-size: 14px; font-weight: bold; color: #f8fafc; font-family: monospace; margin-bottom: 10px;">
        Send to <span style="color: #2dd4bf;">{{ active_chat.client_number }}</span> via <span style="color: #60a5fa;">{{ active_chat.connected_number }}</span>
      </div>

      <!-- Interjection Form -->
      <form method="post" action="">
        {% csrf_token %}
        <input type="hidden" name="action" value="send_interjection" />
        <input type="hidden" name="target_chat_id" value="{{ active_chat.pk }}" />

        <div style="margin-bottom: 10px;">
          <textarea 
            name="interjection_text" 
            placeholder="Type message..." 
            rows="3" 
            style="width: 100%; box-sizing: border-box; background-color: #0f172a; border: 1px solid #475569; border-radius: 6px; padding: 10px; color: #f8fafc; font-size: 13px;"
            required
          ></textarea>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 12px; color: #94a3b8; font-family: monospace; cursor: pointer;">
            <input type="checkbox" name="pause_ai" checked style="accent-color: #2dd4bf;" /> Automatically pause AI bot after interjecting
          </label>

          <button 
            type="submit" 
            style="background-color: #2563eb; color: #ffffff; border: none; padding: 8px 24px; border-radius: 6px; font-weight: bold; font-size: 13px; font-family: monospace; cursor: pointer;"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  {% endif %}

  <!-- Standard Django Table -->
  {{ block.super }}
</div>
{% endblock %}`
  },
  {
    name: 'requirements.txt',
    path: 'backend/requirements.txt',
    description: 'Minimum packages required to run the Django app.',
    code: `Django>=5.1.0,<6.0.0
djangorestframework>=3.15.2
requests>=2.32.3
python-dotenv>=1.0.1`
  }
];

export const PythonCodeViewerTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonFile>(PYTHON_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* File Switcher & Code Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left File List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Python Source Files
          </div>

          <div className="space-y-1.5">
            {PYTHON_FILES.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? 'bg-slate-800 border-teal-500/50 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-mono font-bold text-teal-400">{file.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    {file.path}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {file.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Block */}
        <div className="lg:col-span-8 space-y-2">
          <div className="bg-[#12161f] border border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-[#0f131a] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="font-mono text-white font-bold">{selectedFile.path}</span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#0d1117] font-mono text-xs text-slate-200 overflow-x-auto max-h-[580px] scrollbar-thin leading-relaxed">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
