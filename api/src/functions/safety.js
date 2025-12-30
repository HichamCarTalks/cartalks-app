const { app } = require('@azure/functions');
const { getContainer } = require('../lib/db');

app.http('safety', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { blocksContainer, reportsContainer } = await getContainer();
      
      const action = request.query.get('action'); // 'block', 'report', 'listBlocks'

      if (request.method === 'POST') {
        const body = await request.json();

        if (action === 'block') {
           const { blockerId, blockedId } = body;
           if (!blockerId || !blockedId) return { status: 400, body: "Missing IDs" };

           const blockDoc = {
             id: `${blockerId}_${blockedId}`,
             blockerId,
             blockedId,
             timestamp: new Date().toISOString()
           };
           await blocksContainer.items.upsert(blockDoc);
           return { status: 201, body: "User blocked" };
        }

        if (action === 'report') {
            const { reporterId, reportedId, reason, type } = body; // type: 'user' or 'conversation'
            if (!reporterId || !reportedId) return { status: 400, body: "Missing IDs" };

            const reportDoc = {
              id: Math.random().toString(36).substr(2, 9),
              reporterId,
              reportedId,
              reason,
              type,
              status: 'open',
              timestamp: new Date().toISOString()
            };
            await reportsContainer.items.create(reportDoc);
            return { status: 201, body: "Report submitted" };
        }
      }

      if (request.method === 'GET') {
          if (action === 'listBlocks') {
              const blockerId = request.query.get('blockerId');
              if (!blockerId) return { status: 400, body: "blockerId required" };

              const { resources } = await blocksContainer.items
                .query({
                    query: "SELECT c.blockedId FROM c WHERE c.blockerId = @id",
                    parameters: [{ name: "@id", value: blockerId }]
                })
                .fetchAll();
              
              // Return list of blocked user IDs
              return { body: JSON.stringify(resources.map(r => r.blockedId)) };
          }
      }

      return { status: 400, body: "Invalid action" };

    } catch (error) {
      context.error(error);
      return { status: 500, body: "Internal Server Error" };
    }
  }
});