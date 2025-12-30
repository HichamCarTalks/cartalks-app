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
  }
  return { container, eventsContainer, messagesContainer };
}

module.exports = { getContainer };
