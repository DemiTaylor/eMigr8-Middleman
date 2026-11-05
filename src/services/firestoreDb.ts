import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { ChatThread, ChatMessage } from '../types/djangoChat';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function persistChatThread(thread: ChatThread): Promise<void> {
  const path = `chat_threads/${thread.id}`;
  try {
    const threadRef = doc(db, 'chat_threads', String(thread.id));
    await setDoc(threadRef, {
      id: String(thread.id),
      connectedNumber: thread.connectedNumber,
      clientNumber: String(thread.clientNumber),
      lastUpdate: thread.lastUpdate || 'Just now',
      incomingCount: Number(thread.incomingCount) || 0,
      outgoingCount: Number(thread.outgoingCount) || 0,
      latestDirection: thread.latestDirection || 'incoming',
      latestMessageSnippet: (thread.latestMessageSnippet || '').slice(0, 1000),
      messagesCount: Number(thread.messagesCount) || (thread.messages ? thread.messages.length : 0),
      responseSettings: Boolean(thread.responseSettings),
      isSentStartMessage: Boolean(thread.isSentStartMessage),
      hasWarningFlag: Boolean(thread.hasWarningFlag),
      warningReason: thread.warningReason || ''
    }, { merge: true });

    // Also persist latest messages in subcollection
    if (thread.messages && Array.isArray(thread.messages)) {
      for (const msg of thread.messages.slice(-10)) {
        await persistChatMessage(thread.id, msg);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistChatMessage(threadId: number | string, msg: ChatMessage): Promise<void> {
  const path = `chat_threads/${threadId}/messages/${msg.id}`;
  try {
    const msgRef = doc(db, 'chat_threads', String(threadId), 'messages', String(msg.id));
    await setDoc(msgRef, {
      id: String(msg.id),
      chatId: String(threadId),
      direction: msg.direction === 'outgoing' ? 'outgoing' : 'incoming',
      sender: msg.sender || 'client',
      senderLabel: msg.senderLabel || 'Client',
      phoneNumber: String(msg.phoneNumber || ''),
      message: (msg.message || '').slice(0, 10000),
      timestamp: msg.timestamp || new Date().toISOString(),
      isInterjection: Boolean(msg.isInterjection)
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadChatThreadsFromFirestore(): Promise<ChatThread[]> {
  const path = 'chat_threads';
  try {
    const threadsCol = collection(db, 'chat_threads');
    const snapshot = await getDocs(threadsCol);
    if (snapshot.empty) return [];

    const threads: ChatThread[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const threadId = Number(data.id) || data.id;

      // Fetch messages for thread
      const messagesCol = collection(db, 'chat_threads', String(docSnap.id), 'messages');
      const msgSnap = await getDocs(messagesCol);
      const messages: ChatMessage[] = [];
      msgSnap.forEach(mDoc => {
        const mData = mDoc.data();
        messages.push({
          id: Number(mData.id) || mData.id,
          chatId: Number(mData.chatId) || mData.chatId,
          direction: mData.direction,
          sender: mData.sender,
          senderLabel: mData.senderLabel,
          phoneNumber: mData.phoneNumber,
          message: mData.message,
          timestamp: mData.timestamp,
          isInterjection: mData.isInterjection
        });
      });

      threads.push({
        id: typeof threadId === 'number' ? threadId : Number(threadId) || 1,
        connectedNumber: data.connectedNumber,
        clientNumber: data.clientNumber,
        lastUpdate: data.lastUpdate || 'Just now',
        incomingCount: data.incomingCount || 0,
        outgoingCount: data.outgoingCount || 0,
        latestDirection: data.latestDirection || 'incoming',
        latestMessageSnippet: data.latestMessageSnippet || '',
        messagesCount: data.messagesCount || messages.length,
        responseSettings: data.responseSettings !== undefined ? data.responseSettings : true,
        isSentStartMessage: Boolean(data.isSentStartMessage),
        hasWarningFlag: Boolean(data.hasWarningFlag),
        warningReason: data.warningReason,
        messages: messages.length > 0 ? messages : []
      });
    }

    return threads;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function persistWebhookLog(log: any): Promise<void> {
  const path = `webhook_logs/${log.id}`;
  try {
    const logRef = doc(db, 'webhook_logs', String(log.id));
    await setDoc(logRef, {
      id: String(log.id),
      timestamp: log.timestamp || new Date().toISOString(),
      method: String(log.method || 'POST'),
      path: String(log.path || '/'),
      phone: String(log.phone || ''),
      messageSnippet: (log.messageSnippet || '').slice(0, 500),
      status: String(log.status || 'received'),
      rawSnippet: (log.rawSnippet || '').slice(0, 500)
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadRecentWebhookLogsFromFirestore(maxCount = 20): Promise<any[]> {
  const path = 'webhook_logs';
  try {
    const logsCol = collection(db, 'webhook_logs');
    const q = query(logsCol, limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
