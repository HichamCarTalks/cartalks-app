const { app } = require('@azure/functions');
const { getContainer } = require('../lib/db');

app.http('messages', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { messagesContainer } = await getContainer();

      if (request.method === 'GET') {
        const conversationId = request.query.get('conversationId');
        if (!conversationId) {
          return { status: 400, body: "conversationId is required" };
        }

        // Fetch messages for conversation
        const { resources } = await messagesContainer.items
          .query({
            query: "SELECT * FROM c WHERE c.conversationId = @id ORDER BY c.timestamp ASC",
            parameters: [{ name: "@id", value: conversationId }]
          })
          .fetchAll();

        return { body: JSON.stringify(resources) };
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const { conversationId, text, senderId, senderName } = body;

        if (!conversationId || !text || !senderId) {
          return { status: 400, body: "Missing fields" };
        }

        const newMessage = {
          id: Date.now().toString(),
          conversationId,
          text,
          senderId,
          senderName,
          timestamp: new Date().toISOString(),
          read: false
        };

        const { resource } = await messagesContainer.items.create(newMessage);

        return { status: 201, body: JSON.stringify(resource) };
      }

    } catch (error) {
      context.error(error);
      return { status: 500, body: "Internal Server Error" };
    }
  }
});