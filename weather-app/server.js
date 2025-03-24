import { handler } from './build/handler.js';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Log important environment information at startup
console.log('[SERVER STARTUP] ===== Weather App Starting =====');
console.log(`[SERVER STARTUP] Node environment: ${process.env.NODE_ENV}`);
console.log(`[SERVER STARTUP] PORT: ${port}`);
console.log(`[SERVER STARTUP] WEBSITE_SLOT_NAME: ${process.env.WEBSITE_SLOT_NAME || 'Not set (local)'}`);
console.log(`[SERVER STARTUP] OPENWEATHER_API_KEY present: ${!!process.env.OPENWEATHER_API_KEY}`);
console.log(`[SERVER STARTUP] KEY_VAULT_NAME present: ${!!process.env.KEY_VAULT_NAME}`);
console.log(`[SERVER STARTUP] KEY_VAULT_NAME value: ${process.env.KEY_VAULT_NAME || 'Not set'}`);
console.log(`[SERVER STARTUP] AZURE_FUNCTION_URL present: ${!!process.env.AZURE_FUNCTION_URL}`);

// Check for Azure-specific environment variables that indicate we're running in App Service
if (process.env.WEBSITE_SITE_NAME) {
  console.log(`[SERVER STARTUP] Running in Azure App Service`);
  console.log(`[SERVER STARTUP] WEBSITE_SITE_NAME: ${process.env.WEBSITE_SITE_NAME}`);
  console.log(`[SERVER STARTUP] WEBSITE_RESOURCE_GROUP: ${process.env.WEBSITE_RESOURCE_GROUP || 'Not set'}`);
  
  // Check for managed identity configuration
  console.log(`[SERVER STARTUP] IDENTITY_ENDPOINT present: ${!!process.env.IDENTITY_ENDPOINT}`);
  console.log(`[SERVER STARTUP] IDENTITY_HEADER present: ${!!process.env.IDENTITY_HEADER}`);
}

// Use the SvelteKit handler for all routes
app.use(handler);

app.listen(port, () => {
    console.log(`[SERVER STARTUP] Server is running on port ${port}`);
});
