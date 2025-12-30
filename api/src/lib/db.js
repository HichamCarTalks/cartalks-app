const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "cartalks";
const containerId = "users";
const eventsContainerId = "events";
const messagesContainerId = "messages";

let client = null;
let container = null;
let eventsContainer = null;
let messagesContainer = null;

async function getContainer() {
  if (!container) {
    if (!endpoint || !key) {
      throw new Error("Cosmos DB credentials not set in environment variables");
    }
    client = new CosmosClient({ endpoint, key });
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    
    // Users Container
    const { container: c } = await database.containers.createIfNotExists({ 
      id: containerId,
      partitionKey: "/licensePlate" 
    });
    container = c;

    // Events Container (for analytics)
    const { container: e } = await database.containers.createIfNotExists({ 
      id: eventsContainerId,
      partitionKey: "/eventType" 
    });
    eventsContainer = e;

    // Messages Container
    const { container: m } = await database.containers.createIfNotExists({ 
      id: messagesContainerId,
      partitionKey: "/conversationId" // Group messages by conversation (e.g., "USER1_USER2")
    });
    messagesContainer = m;

    // Conversations Container (for chat list)
    const { container: conv } = await database.containers.createIfNotExists({
      id: "conversations",
      partitionKey: "/id"
    });
    
    // Blocks Container
    const { container: b } = await database.containers.createIfNotExists({
      id: "blocks",
      partitionKey: "/blockerId" // Query by "who did the blocking"
    });

    // Reports Container
    const { container: r } = await database.containers.createIfNotExists({
      id: "reports",
      partitionKey: "/id"
    });

    return { 
      container, 
      eventsContainer, 
      messagesContainer, 
      conversationsContainer: conv,
      blocksContainer: b,
      reportsContainer: r
    };
  }
  return { 
    container, 
    eventsContainer, 
    messagesContainer, 
    conversationsContainer: container ? null : null,
    blocksContainer: container ? null : null,
    reportsContainer: container ? null : null
  };
}

module.exports = { getContainer };
