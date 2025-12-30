# CarTalks Database Design

This document outlines the database schema and design decisions for the CarTalks application, tailored for Azure Cosmos DB (NoSQL).

## 1. Overview
The database uses a multi-container strategy to separate **Operational State** (User Profiles) from **Analytical History** (Events).

## 2. Containers

### A. `users`
Stores user profiles and authentication data.
- **Partition Key**: `/licensePlate`
  - *Reason*: Primary access pattern is "Login by License Plate" and "Search by License Plate".
- **Schema**:
```json
{
  "id": "uuid",
  "type": "user",
  "username": "JohnDoe",
  "licensePlate": "AB-12-CD",
  "password": "hashed_password",
  "role": "user", // or "admin"
  "verificationStatus": "pending", // verified, disputed
  "kentekenkaartUrl": "https://blob...",
  "kentekenkaartIssueDate": "2024-01-01",
  "createdAt": "2024-01-01T10:00:00Z",
  "lastLoginAt": "2024-01-02T10:00:00Z"
}
```

### B. `events`
Stores immutable event logs for analytics.
- **Partition Key**: `/eventType`
  - *Reason*: Allows efficient aggregation by event type (e.g., "Count all USER_LOGIN events today").
- **Schema**:
```json
{
  "id": "uuid",
  "eventType": "USER_LOGIN", // USER_REGISTER, SEARCH_PERFORMED
  "timestamp": "2024-01-01T10:00:00Z",
  "userId": "uuid", // Optional, if user is logged in
  "licensePlate": "AB-12-CD", // Optional
  "metadata": {
    "query": "Tesla", // For search events
    "ip": "127.0.0.1"
  }
}
```

## 3. Analytics Strategy
By logging atomic events to the `events` container, we can answer questions like:
- **Daily Active Users**: Count distinct `userId` where `eventType = 'USER_LOGIN'` per day.
- **Registration Funnel**: Compare `USER_REGISTER` events vs `VERIFICATION_SUBMITTED`.
- **Search Trends**: Aggregate `metadata.query` where `eventType = 'SEARCH_PERFORMED'`.

Future improvements may include enabling **Azure Synapse Link** for near real-time analytics on these containers without ETL.
