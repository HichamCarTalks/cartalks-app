const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const multipart = require('parse-multipart-data');

app.http('upload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      // Connect to Blob Storage
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('Storage connection string not found');
      }

      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = blobServiceClient.getContainerClient('verification-docs');
      await containerClient.createIfNotExists({ access: 'blob' });

      // Parse multipart form data
      // Note: In Azure Functions Node.js v4, getting raw body buffer can be tricky.
      // We assume standard multipart form data.
      const bodyBuffer = Buffer.from(await request.arrayBuffer());
      const boundary = multipart.getBoundary(request.headers.get('content-type'));
      const parts = multipart.parse(bodyBuffer, boundary);

      if (!parts || parts.length === 0) {
        return { status: 400, body: 'No file uploaded' };
      }

      const file = parts[0];
      const filename = `${Date.now()}-${file.filename || 'image.jpg'}`;
      const blockBlobClient = containerClient.getBlockBlobClient(filename);

      await blockBlobClient.upload(file.data, file.data.length);

      return {
        body: JSON.stringify({
          url: blockBlobClient.url
        })
      };

    } catch (error) {
      context.error(error);
      return { status: 500, body: `Upload failed: ${error.message}` };
    }
  }
});