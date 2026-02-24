const { WebSocketServer } = require('ws');
const { pool } = require('../services/db.cjs');
const { chatService } = require('../services/chatService.cjs');

const PORT = process.env.WS_PORT || 8080;

// Store active connections
const connections = new Map(); // conversationId -> Set of WebSocket connections
const userConnections = new Map(); // userId -> Set of WebSocket connections

const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket server started on port ${PORT}`);

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  let conversationId = null;
  let userId = null;
  let isAdmin = false;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message.type);

      switch (message.type) {
        case 'join':
          // User joining a conversation
          conversationId = message.conversationId;
          userId = message.userId;
          isAdmin = message.isAdmin || false;

          if (!connections.has(conversationId)) {
            connections.set(conversationId, new Set());
          }
          connections.get(conversationId).add(ws);

          if (userId && !isAdmin) {
            if (!userConnections.has(userId)) {
              userConnections.set(userId, new Set());
            }
            userConnections.get(userId).add(ws);
          }

          // Send conversation history
          const messages = await chatService.getMessages(conversationId);
          ws.send(JSON.stringify({
            type: 'history',
            messages: messages
          }));

          // Mark messages as read
          await chatService.markMessagesAsRead(conversationId, isAdmin ? 'admin' : 'user');
          break;

        case 'message':
          // New message from user or admin
          if (!conversationId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not joined to a conversation'
            }));
            return;
          }

          const newMessage = await chatService.addMessage(
            conversationId,
            isAdmin ? 'admin' : 'user',
            userId,
            message.senderName || (isAdmin ? 'Admin' : 'User'),
            message.text,
            message.attachments || []
          );

          // Broadcast to all connections in this conversation
          const convConnections = connections.get(conversationId) || new Set();
          convConnections.forEach(client => {
            if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: newMessage
              }));
            }
          });

          // Mark messages as read for the sender
          await chatService.markMessagesAsRead(conversationId, isAdmin ? 'admin' : 'user');

          // If admin sent message, notify user
          if (isAdmin && userId) {
            const userWsSet = userConnections.get(userId) || new Set();
            userWsSet.forEach(client => {
              if (client.readyState === ws.OPEN && client !== ws) {
                client.send(JSON.stringify({
                  type: 'new_message',
                  message: newMessage
                }));
              }
            });
          }
          break;

        case 'typing':
          // Broadcast typing indicator
          if (conversationId) {
            const convConnections = connections.get(conversationId) || new Set();
            convConnections.forEach(client => {
              if (client !== ws && client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  type: 'typing',
                  isTyping: message.isTyping,
                  senderName: message.senderName
                }));
              }
            });
          }
          break;

        case 'read':
          // Mark messages as read
          if (conversationId) {
            await chatService.markMessagesAsRead(conversationId, isAdmin ? 'admin' : 'user');
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    if (conversationId && connections.has(conversationId)) {
      connections.get(conversationId).delete(ws);
      if (connections.get(conversationId).size === 0) {
        connections.delete(conversationId);
      }
    }
    if (userId && userConnections.has(userId)) {
      userConnections.get(userId).delete(ws);
      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Keep server running
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close();
  process.exit(0);
});

module.exports = wss;
