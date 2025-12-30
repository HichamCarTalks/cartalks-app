const { app } = require('@azure/functions');
const { getContainer } = require('../lib/db');

app.http('admin', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { container } = await getContainer();
      
      const userId = request.query.get('userId');
      if (!userId) {
          return { status: 401, body: "Unauthorized: Missing userId" };
      }

      // Verify Admin Role
      try {
          const { resource: user } = await container.item(userId, undefined).read();
          if (!user || user.role !== 'admin') {
              return { status: 403, body: "Forbidden: Admin access required" };
          }
      } catch (e) {
          return { status: 401, body: "Unauthorized: User not found" };
      }

      const type = request.query.get('type'); // 'stats' or 'users'

      if (type === 'stats') {
         // Count total users
         const { resources } = await container.items
           .query("SELECT VALUE COUNT(1) FROM c")
           .fetchAll();
         
         return {
           body: JSON.stringify({
             totalUsers: resources[0]
           })
         };
      } else {
        // List all users
        const { resources } = await container.items
          .query("SELECT c.id, c.username, c.licensePlate, c.role, c.createdAt FROM c")
          .fetchAll();
        
        return {
          body: JSON.stringify(resources)
        };
      }
    } catch (error) {
      context.error(error);
      return { status: 500, body: "Internal Server Error" };
    }
  }
});