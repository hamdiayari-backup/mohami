const { pool } = require('./db.cjs');

const chatService = {
  // Create a new conversation
  createConversation: async (userId, userName, userEmail) => {
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
  getOrCreateConversation: async (userId, userName, userEmail) => {
    if (userId) {
      const existing = await pool.query(
        `SELECT * FROM chat_conversations WHERE user_id = $1 AND status = 'active' ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );
      
      if (existing.rows.length > 0) {
        return existing.rows[0];
      }
    }

    return await chatService.createConversation(userId, userName, userEmail);
  },

  // Add a message to a conversation
  addMessage: async (conversationId, senderType, senderId, senderName, message, attachments = []) => {
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
      attachments: attachments || []
    };
  },

  // Get all messages for a conversation
  getMessages: async (conversationId) => {
    const result = await pool.query(
      `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    // Parse attachments JSON if it exists
    return result.rows.map(row => ({
      ...row,
      attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : []
    }));
  },

  // Get all active conversations
  getAllConversations: async () => {
    const result = await pool.query(
      `SELECT * FROM chat_conversations WHERE status = 'active' ORDER BY last_message_at DESC NULLS LAST, updated_at DESC`
    );
    return result.rows;
  },

  // Get a single conversation with messages
  getConversationWithMessages: async (conversationId) => {
    const convResult = await pool.query(
      `SELECT * FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      throw new Error('Conversation not found');
    }

    const conversation = convResult.rows[0];
    const messages = await chatService.getMessages(conversationId);

    return { ...conversation, messages };
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId, senderType) => {
    const oppositeType = senderType === 'user' ? 'admin' : 'user';
    await pool.query(
      `UPDATE chat_messages SET read = TRUE WHERE conversation_id = $1 AND sender_type = $2`,
      [conversationId, oppositeType]
    );
  },

  // Close a conversation
  closeConversation: async (conversationId) => {
    await pool.query(
      `UPDATE chat_conversations SET status = 'closed', updated_at = $1 WHERE id = $2`,
      [new Date().toISOString(), conversationId]
    );
  }
};

module.exports = { chatService };
