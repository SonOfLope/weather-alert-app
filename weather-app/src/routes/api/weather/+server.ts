import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { env } from '$env/dynamic/private';

// Constants for temperature thresholds
const COLD_THRESHOLD = 10;
const HEAT_THRESHOLD = 20;

export const GET: RequestHandler = async ({ url }) => {
  try {
    const city = url.searchParams.get('city') || 'Montreal';
 
    let apiKey = env.OPENWEATHER_API_KEY || '';
    const keyVaultName = env.KEY_VAULT_NAME || '';
    const secretName = env.WEATHER_API_SECRET_NAME || 'OpenWeatherApiKey';
    
    console.log(`[DEBUG] Environment setup - OPENWEATHER_API_KEY set: ${!!env.OPENWEATHER_API_KEY}, KEY_VAULT_NAME: ${keyVaultName}`);
    
    if (!apiKey && keyVaultName) {
      console.log(`[DEBUG] No direct API key found, attempting to use Key Vault: ${keyVaultName}`);
      try {
        console.log(`[DEBUG] Creating DefaultAzureCredential...`);
        const credential = new DefaultAzureCredential();
        const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
        console.log(`[DEBUG] Key Vault URL: ${keyVaultUrl}`);
        
        console.log(`[DEBUG] Creating SecretClient...`);
        const secretClient = new SecretClient(keyVaultUrl, credential);
        
        console.log(`[DEBUG] Requesting secret: ${secretName}`);
        const secret = await secretClient.getSecret(secretName);
        
        if (secret && secret.value) {
          console.log(`[DEBUG] Secret retrieved successfully from Key Vault`);
          apiKey = secret.value as string;
        } else {
          console.error(`[ERROR] Secret ${secretName} was retrieved but has no value`);
        }
      } catch (error) {
        console.error(`[ERROR] Error fetching secret from Key Vault:`, error);
        if (error instanceof Error) {
          console.error(`[ERROR] Stack trace: ${error.stack}`);
          console.error(`[ERROR] Error name: ${error.name}, message: ${error.message}`);
        }
        
        // Try to identify specific authentication errors
        if (error.toString().includes('authentication')) {
          console.error(`[ERROR] This appears to be an authentication issue. Please check the managed identity configuration for the app service.`);
        }
      }
    }
    
    let weatherData;
    
    if (apiKey) {
      console.log(`[DEBUG] API key obtained, length: ${apiKey.length}, proceeding with OpenWeather API request`);
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        console.log(`[DEBUG] Making request to OpenWeather API for city: ${city}`);
        
        const response = await fetch(
          weatherUrl,
          { 
            timeout: 10000,
            signal: AbortSignal.timeout(10000)
          }
        );
        
        console.log(`[DEBUG] OpenWeather API response status: ${response.status}`);
        
        if (!response.ok) {
          const responseText = await response.text();
          console.error(`[ERROR] Weather API error: ${response.statusText} (${response.status}), Response body: ${responseText}`);
          throw new Error(`Weather API error: ${response.statusText} (${response.status})`);
        }
        
        const data = await response.json();
        console.log(`[DEBUG] OpenWeather API returned data successfully for ${data.name}`);
        
        weatherData = {
          temperature: data.main.temp,
          feelsLike: data.main.feels_like,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          wind: data.wind.speed,
          city: data.name
        };
        
        console.log(`[DEBUG] Processed weather data: temp=${weatherData.temperature}°C, desc=${weatherData.description}`);
      } catch (error) {
        console.error(`[ERROR] Error while fetching from OpenWeather API:`, error);
        if (error instanceof Error) {
          console.error(`[ERROR] Stack trace: ${error.stack}`);
        }
        console.log(`[DEBUG] Will fall through to mock data due to API error`);
      }
    } else {
      console.log(`[DEBUG] No API key available, using mock weather data`);
    }
    
    if (!weatherData) {
      console.log(`[DEBUG] Using mock weather data for ${city}`);
      weatherData = {
        temperature: 18.5,
        feelsLike: 17.3,
        humidity: 62,
        description: 'scattered clouds',
        icon: '03d',
        wind: 15,
        city: city
      };
    }
    
    // Check if temperature crosses threshold and trigger alert if needed
    if (weatherData.temperature < 10 || weatherData.temperature > 20) {
      console.log(`[DEBUG] Temperature threshold crossed: ${weatherData.temperature}°C, sending alert`);
      try {
        const functionUrl = env.AZURE_FUNCTION_URL || 'https://weather-alert-1742571987789.azurewebsites.net/api/weather-alert';
        console.log(`[DEBUG] Using Azure Function URL: ${functionUrl}`);
        
        // Send the alert in the background
        fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ temp: weatherData.temperature })
        })
        .then(response => {
          console.log(`[DEBUG] Alert function response status: ${response.status}`);
          return response.text();
        })
        .then(text => {
          console.log(`[DEBUG] Alert function response body: ${text}`);
        })
        .catch(err => {
          console.error('[ERROR] Error sending background alert:', err);
          if (err instanceof Error) {
            console.error(`[ERROR] Stack trace: ${err.stack}`);
          }
        });
      } catch (err) {
        console.error('[ERROR] Error setting up background alert:', err);
        if (err instanceof Error) {
          console.error(`[ERROR] Stack trace: ${err.stack}`);
        }
      }
    }
    
    // Return JSON response
    console.log(`[DEBUG] Returning JSON weather data response`);
    return json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch weather data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};