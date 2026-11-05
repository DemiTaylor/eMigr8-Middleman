export type ConnectedChannel = 'telegramBot' | 'WAWCD';
export type MessageDirection = 'incoming' | 'outgoing';

export interface ChatMessage {
  id: number;
  chatId: number;
  direction: MessageDirection; // 'incoming' or 'outgoing'
  sender: 'client' | 'ai_bot' | 'human_admin';
  senderLabel: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  isInterjection?: boolean;
}

export interface ChatThread {
  id: number;
  connectedNumber: ConnectedChannel;
  clientNumber: string;
  lastUpdate: string;
  incomingCount: number;
  outgoingCount: number;
  latestDirection: MessageDirection;
  latestMessageSnippet: string;
  messagesCount: number;
  responseSettings: boolean; // true = AI auto-reply on, false = AI paused (human interjection)
  isSentStartMessage: boolean;
  hasWarningFlag?: boolean;
  warningReason?: string;
  messages: ChatMessage[];
}
