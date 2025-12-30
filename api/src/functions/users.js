const { app } = require('@azure/functions');
const { getContainer } = require('../lib/db');

// Helper to validate Dutch license plates (Series 1-14)
// Based on: https://www.autoweek.nl/kentekencheck/kentekens/welke-kentekenseries-zijn-er-en-welke-info-geven-ze/
function isValidLicensePlate(plate) {
  if (!plate) return false;
  // Remove dashes and convert to upper
  const p = plate.replace(/-/g, '').toUpperCase();
  
  // Regex patterns for different sidecodes
  // X = Letter ([A-Z]), 9 = Digit ([0-9])
  const patterns = [
    /^[A-Z]{2}\d{2}\d{2}$/,       // 1: XX-99-99
    /^\d{2}\d{2}[A-Z]{2}$/,       // 2: 99-99-XX
    /^\d{2}[A-Z]{2}\d{2}$/,       // 3: 99-XX-99
    /^[A-Z]{2}\d{2}[A-Z]{2}$/,    // 4: XX-99-XX
    /^[A-Z]{2}[A-Z]{2}\d{2}$/,    // 5: XX-XX-99
    /^\d{2}[A-Z]{2}[A-Z]{2}$/,    // 6: 99-XX-XX
    /^\d{2}[A-Z]{3}\d{1}$/,       // 7: 99-XXX-9
    /^\d{1}[A-Z]{3}\d{2}$/,       // 8: 9-XXX-99
    /^[A-Z]{2}\d{3}[A-Z]{1}$/,    // 9: XX-999-X
    /^[A-Z]{1}\d{3}[A-Z]{2}$/,    // 10: X-999-XX
    /^[A-Z]{3}\d{2}[A-Z]{1}$/,    // 11: XXX-99-X
    /^[A-Z]{1}\d{2}[A-Z]{3}$/,    // 12: X-99-XXX
    /^\d{1}[A-Z]{2}\d{3}$/,       // 13: 9-XX-999
    /^\d{3}[A-Z]{2}\d{1}$/        // 14: 999-XX-9
  ];

  return patterns.some(regex => regex.test(p));
}

app.http('users', {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { container, eventsContainer } = await getContainer();

      if (request.method === 'GET') {
        const query = request.query.get('q');
        if (!query) {
          return { status: 400, body: "Query parameter 'q' is required" };
        }

        // Log search event
        await eventsContainer.items.create({
          id: Math.random().toString(36).substr(2, 9),
          eventType: 'SEARCH_PERFORMED',
          timestamp: new Date().toISOString(),
          metadata: { query }
        });

        // Search for cars by license plate
        const { resources } = await container.items
          .query({
            query: "SELECT c.id, c.licensePlate, c.username FROM c WHERE CONTAINS(UPPER(c.licensePlate), @query)",
            parameters: [{ name: "@query", value: query.toUpperCase() }]
          })
          .fetchAll();

        const cars = resources.map(r => ({
          id: r.id,
          plate: r.licensePlate,
          owner: r.username,
          model: 'Unknown'
        }));

        return { body: JSON.stringify(cars) };
      } 
      
      if (request.method === 'POST') {
        const body = await request.json();
        const { username, licensePlate, password, kentekenkaartUrl, kentekenkaartIssueDate } = body;

        if (!username || !licensePlate || !password || !kentekenkaartUrl) {
          return { status: 400, body: "Missing required fields (including kentekenkaart)" };
        }

        if (!isValidLicensePlate(licensePlate)) {
          return { status: 400, body: "Invalid Dutch license plate format" };
        }

        // Check if plate exists
        const { resources: existing } = await container.items
          .query({
            query: "SELECT * FROM c WHERE c.licensePlate = @plate",
            parameters: [{ name: "@plate", value: licensePlate.toUpperCase() }]
          })
          .fetchAll();

        let verificationStatus = 'pending';
        let status = 201;
        let message = '';

        if (existing.length > 0) {
          // Plate already exists - check if verified
          const currentOwner = existing[0];
          
          if (currentOwner.verificationStatus === 'verified' || currentOwner.verificationStatus === 'pending') {
            verificationStatus = 'disputed';
            status = 202; // Accepted but pending processing
            message = 'License plate already registered. Application flagged for dispute review.';
          } else {
             // Old owner was rejected or deleted, we can proceed as pending
             verificationStatus = 'pending';
          }
        }

        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'user', // Explicit type
          username,
          licensePlate: licensePlate.toUpperCase(),
          password, 
          role: 'user',
          verificationStatus,
          kentekenkaartUrl,
          kentekenkaartIssueDate,
          createdAt: new Date().toISOString()
        };

        const { resource } = await container.items.create(newUser);
        
        // Log registration event
        await eventsContainer.items.create({
          id: Math.random().toString(36).substr(2, 9),
          eventType: 'USER_REGISTER',
          timestamp: new Date().toISOString(),
          licensePlate: resource.licensePlate,
          userId: resource.id,
          metadata: { verificationStatus }
        });
        
        return { 
          status,  
          body: JSON.stringify({ 
            id: resource.id, 
            username: resource.username,
            licensePlate: resource.licensePlate,
            verificationStatus: resource.verificationStatus,
            message
          }) 
        };
        };
      }

      if (request.method === 'PUT') {
        const body = await request.json();
        const { id, password, username } = body;

        if (!id) return { status: 400, body: "User ID required" };

        const { resource: user } = await container.item(id, undefined).read();

        if (!user) return { status: 404, body: "User not found" };

        // Update fields
        if (password) user.password = password;
        if (username) user.username = username;

        const { resource: updated } = await container.item(id, undefined).replace(user);

        return {
          body: JSON.stringify({
            id: updated.id,
            username: updated.username,
            licensePlate: updated.licensePlate
          })
        };
      }

      if (request.method === 'DELETE') {
        const id = request.query.get('id');
        const licensePlate = request.query.get('licensePlate'); // Needed for partition key if used

        if (!id) return { status: 400, body: "User ID required" };

        // For this simple example, we might scan or need the PK. 
        // In Cosmos, you usually need the Partition Key to delete efficiently.
        // We'll assume the client sends the licensePlate (which is our PK).
        
        if (!licensePlate) {
             return { status: 400, body: "License Plate (Partition Key) required for deletion" };
        }

        await container.item(id, licensePlate).delete();
        return { status: 204 };
      }

    } catch (error) {
      context.error(error);
      return { status: 500, body: "Internal Server Error" };
    }
  }
});
