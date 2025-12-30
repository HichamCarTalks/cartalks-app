const { app } = require('@azure/functions');
const { getContainer } = require('../lib/db');

app.http('conversations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { conversationsContainer } = await getContainer();
      
      const userId = request.query.get('userId');
      const licensePlate = request.query.get('licensePlate');
      
      if (!userId && !licensePlate) {
        return { status: 400, body: "userId or licensePlate is required" };
      }

      // We need to find conversations where the user is a participant.
      // Since our conversation ID is "PlateA_PlateB", we can search for documents
      // where the participants array contains the user's plate.
      
      // Note: In a large scale app, we would use a proper junction table or duplicate data.
      // For this MVP, ARRAY_CONTAINS is acceptable if the volume is low.
      
      // If we have licensePlate, use that. If only userId, we might need to fetch user first 
      // but let's assume the client sends the identifier used in 'participants'.
      // Based on our plan, we store "participants" as plates.
      
      const identifier = licensePlate ? licensePlate.toUpperCase() : null;
      
      if (!identifier) {
         return { status: 400, body: "License Plate is required for conversation lookup" };
      }

      const querySpec = {
        query: "SELECT * FROM c WHERE ARRAY_CONTAINS(c.participants, @id) ORDER BY c.timestamp DESC",
        parameters: [{ name: "@id", value: identifier }]
      };

      const { resources } = await conversationsContainer.items.query(querySpec).fetchAll();

      return { body: JSON.stringify(resources) };
      
    } catch (error) {
      context.error(error);
      return { status: 500, body: "Internal Server Error" };
    }
  }
});