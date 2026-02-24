import { pool } from './db';

export interface ChatConversation {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded file data
  url?: string; // Optional URL if stored externally
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'admin';
  senderId?: string;
  senderName: string;
  message: string;
  createdAt: string;
  read: boolean;
  attachments?: ChatAttachment[];
}

export const chatService = {
  // Create a new conversation
  createConversation: async (userId?: string, userName?: string, userEmail?: string): Promise<ChatConversation> => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    await pool.query(
      `INSERT INTO chat_conversations (id, user_id, user_name, user_email, status, created_at, updated_at, last_message_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, userId || null, userName || 'Guest', userEmail || null, 'active', now, now, now]
    );

    return {
      id,
      userId,
      userName,
      userEmail,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now
    };
  },

  // Get or create conversation for a user
  getOrCreateConversation: async (userId?: string, userName?: string, userEmail?: string): Promise<ChatConversation> => {
    if (userId) {
      const existing = await pool.query(
        `SELECT * FROM chat_conversations WHERE user_id = $1 AND status = 'active' ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );
      
      if (existing.rows.length > 0) {
        return existing.rows[0] as ChatConversation;
      }
    }

    return await chatService.createConversation(userId, userName, userEmail);
  },

  // Add a message to a conversation
  addMessage: async (
    conversationId: string,
    senderType: 'user' | 'admin',
    senderId: string | undefined,
    senderName: string,
    message: string,
    attachments: ChatAttachment[] = []
  ): Promise<ChatMessage> => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO chat_messages (id, conversation_id, sender_type, sender_id, sender_name, message, created_at, read, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, conversationId, senderType, senderId || null, senderName, message, now, false, JSON.stringify(attachments)]
    );

    // Update conversation's last_message_at and updated_at
    await pool.query(
      `UPDATE chat_conversations SET updated_at = $1, last_message_at = $1 WHERE id = $2`,
      [now, conversationId]
    );

    return {
      id,
      conversationId,
      senderType,
      senderId,
      senderName,
      message,
      createdAt: now,
      read: false,
      attachments
    };
  },

  // Get all messages for a conversation
  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const result = await pool.query(
      `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    return result.rows.map(row => ({
      ...row,
      attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : []
    })) as ChatMessage[];
  },

  mapConversationRow: (row: any): ChatConversation => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || (row.user_id ? 'مستخدم متصل' : 'ضيف'),
    userEmail: row.user_email || null,
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at
  }),

  // Get all active conversations
  getAllConversations: async (): Promise<ChatConversation[]> => {
    const result = await pool.query(
      `SELECT * FROM chat_conversations WHERE status = 'active' ORDER BY last_message_at DESC NULLS LAST, updated_at DESC`
    );
    return result.rows.map((row: any) => chatService.mapConversationRow(row));
  },

  // Get a single conversation with messages
  getConversationWithMessages: async (conversationId: string): Promise<ChatConversation & { messages: ChatMessage[] }> => {
    const convResult = await pool.query(
      `SELECT * FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      throw new Error('Conversation not found');
    }

    const conversation = chatService.mapConversationRow(convResult.rows[0]);
    const messages = await chatService.getMessages(conversationId);

    return { ...conversation, messages };
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string, senderType: 'user' | 'admin'): Promise<void> => {
    const oppositeType = senderType === 'user' ? 'admin' : 'user';
    await pool.query(
      `UPDATE chat_messages SET read = TRUE WHERE conversation_id = $1 AND sender_type = $2`,
      [conversationId, oppositeType]
    );
  },

  // Close a conversation
  closeConversation: async (conversationId: string): Promise<void> => {
    await pool.query(
      `UPDATE chat_conversations SET status = 'closed', updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), conversationId]
    );
  }
};
