const { app } = require('@azure/functions');
const { getContainer } = require('../lib/db');

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { container, eventsContainer } = await getContainer();
      const body = await request.json();
      const { licensePlate, password } = body;

      if (!licensePlate || !password) {
        return { status: 400, body: "Missing credentials" };
      }

      const { resources } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.licensePlate = @plate",
          parameters: [{ name: "@plate", value: licensePlate.toUpperCase() }]
        })
        .fetchAll();

      const user = resources[0];

      if (!user || user.password !== password) {
        return { status: 401, body: "Invalid credentials" };
      }

      // Update lastLoginAt
      const now = new Date().toISOString();
      user.lastLoginAt = now;
      await container.item(user.id, undefined).replace(user);

      // Log Login Event
      await eventsContainer.items.create({
        id: Math.random().toString(36).substr(2, 9),
        eventType: 'USER_LOGIN',
        timestamp: now,
        userId: user.id,
        licensePlate: user.licensePlate
      });

      return {
        body: JSON.stringify({
          id: user.id,
          username: user.username,
          licensePlate: user.licensePlate,
          role: user.role || 'user'
        })
      };

    } catch (error) {
      context.error(error);
      return { status: 500, body: "Internal Server Error" };
    }
  }
});