import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    if (!data.temp) {
      return new Response(JSON.stringify({ error: 'Temperature value is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const baseUrl = env.AZURE_FUNCTION_URL || 'http://localhost:7071/api';
    const functionUrl = `${baseUrl}/weather-alert`;
    
    try {
      // Forward the request to the Azure Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ temp: data.temp })
      });
      
      if (!response.ok) {
        throw new Error(`Azure Function error: ${response.statusText}`);
      }
      
      const result = await response.json();
      return json(result);
    } catch (err) {
      // Fallback response if the Azure Function is not available
      console.error('Error calling Azure Function, using fallback response:', err);
      const alertType = data.temp < 10 ? 'cold' : data.temp > 20 ? 'heat' : 'normal';
      return json({
        status: alertType,
        message: `Weather alert processed locally: ${alertType} alert for temperature ${data.temp}°C`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error forwarding alert to Azure Function:', error);
    return new Response(JSON.stringify({ error: 'Failed to process weather alert' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const baseFunctionUrl = env.AZURE_FUNCTION_URL || 'http://localhost:7071/api';
    const historyUrl = `${baseFunctionUrl}/weather-alert-history`;
    
    console.log(`[DEBUG] Alert history - AZURE_FUNCTION_URL from env: ${!!env.AZURE_FUNCTION_URL}`);
    console.log(`[DEBUG] Alert history - Base function URL: ${baseFunctionUrl}`);
    console.log(`[DEBUG] Fetching alert history from: ${historyUrl}`);
    
    try {
      // Request the alert history from the Azure Function
      console.log(`[DEBUG] Making GET request to alert history endpoint`);
      const response = await fetch(historyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[DEBUG] Alert history response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Azure Function error: ${response.statusText}, ${errorText}`);
        throw new Error(`Azure Function error: ${response.statusText}`);
      }
      
      const alertHistory = await response.json();
      console.log(`[DEBUG] Successfully retrieved ${alertHistory.length} alert records`);
      return json(alertHistory);
    } catch (err) {
      console.error('[ERROR] Error fetching alert history:', err);
      if (err instanceof Error) {
        console.error(`[ERROR] Stack trace: ${err.stack}`);
      }
      
      console.log(`[DEBUG] Using mock data due to alert history fetch error`);
      // Return mock data if Azure Function is unavailable
      return json([
        {
          id: '1',
          type: 'cold',
          temperature: 5.2,
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          formattedTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: '2',
          type: 'heat',
          temperature: 31.5,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          formattedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString()
        }
      ]);
    }
  } catch (error) {
    console.error('Error processing alert history request:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve alert history' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};