import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const city = url.searchParams.get('city') || 'Montreal';
 
    let apiKey = env.OPENWEATHER_API_KEY || '';
    const keyVaultName = env.KEY_VAULT_NAME || '';
    const secretName = env.WEATHER_API_SECRET_NAME || 'OpenWeatherApiKey';
    
    if (!apiKey && keyVaultName) {
      console.log('No API key found in environment, trying Azure Key Vault');
      try {
        const credential = new DefaultAzureCredential();
        const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;
        const secretClient = new SecretClient(keyVaultUrl, credential);
        
        const secret = await secretClient.getSecret(secretName);
        apiKey = secret.value as string;
      } catch (error) {
        console.error('Error fetching secret from Key Vault:', error);
      }
    }
    if (apiKey) {
      try {
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.statusText} (${response.status})`);
        }
        
        const data = await response.json();
        
        return json({
          temperature: data.main.temp,
          feelsLike: data.main.feels_like,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          wind: data.wind.speed,
          city: data.name
        });
      } catch (error) {
        console.error('Error while fetching from OpenWeather API:', error);
        // Fall through to mock data
      }
    }
    
    return json({
      temperature: 18.5,
      feelsLike: 17.3,
      humidity: 62,
      description: 'scattered clouds',
      icon: '03d',
      wind: 15,
      city: city
    });
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