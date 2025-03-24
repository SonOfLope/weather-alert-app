<script lang="ts">
  import { onMount } from 'svelte';
  import * as m from "$lib/paraglide/messages";
  
  let weather = {
    temperature: 0,
    description: '',
    icon: '',
    city: 'Montreal',
    loading: true,
    error: '',
    feelsLike: null,
    humidity: null,
    wind: null,
    alertStatus: '' as string | null,
    lastAlertTime: '' as string | null
  };
  
  interface AlertRecord {
    id: string;
    type: string;
    temperature: number;
    timestamp: string;
    formattedTime?: string;
  }
  
  let alertHistory: AlertRecord[] = [];
  let loadingHistory = false;
  let historyError = '';

  const COLD_THRESHOLD = 10;
  const HEAT_THRESHOLD = 20;

  async function checkTemperatureThreshold(temperature: number) {
    if (temperature < COLD_THRESHOLD || temperature > HEAT_THRESHOLD) {
      try {
        const alertType = temperature < COLD_THRESHOLD ? 'cold' : 'heat';
        console.log(`Temperature threshold crossed (${alertType}): ${temperature}°C`);
        
        const response = await fetch('/api/weather-alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ temp: temperature })
        });
        
        if (!response.ok) {
          throw new Error('Failed to send alert');
        }
        
        const result = await response.json();
        weather.alertStatus = result.status || alertType;
        weather.lastAlertTime = new Date().toLocaleTimeString();
        
        console.log('Alert response:', result);
      } catch (err) {
        console.error('Error sending alert:', err);
      }
    } else {
      weather.alertStatus = 'normal';
    }
  }

  function getAlertClass(temperature: number) {
    if (temperature < COLD_THRESHOLD) return 'alert-cold';
    if (temperature > HEAT_THRESHOLD) return 'alert-heat';
    return 'normal';
  }

  async function updateWeather() {
    try {
      const response = await fetch('/api/weather?city=Montreal');
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      
      weather = {
        ...weather,
        temperature: data.temperature,
        description: data.description,
        icon: `https://openweathermap.org/img/wn/${data.icon}@2x.png`,
        city: data.city,
        loading: false,
        error: '',
        feelsLike: data.feelsLike,
        humidity: data.humidity,
        wind: data.wind
      };

      await checkTemperatureThreshold(data.temperature);
      
      return weather;
    } catch (err) {
      console.error('Error:', err);
      weather = {
        ...weather,
        loading: false,
        error: 'Failed to load weather data'
      };
      return weather;
    }
  }

  async function fetchAlertHistory() {
    loadingHistory = true;
    historyError = '';
    
    try {
      const response = await fetch('/api/weather-alert');
      
      if (!response.ok) {
        throw new Error('Failed to fetch alert history');
      }
      
      alertHistory = await response.json();
      loadingHistory = false;
    } catch (err) {
      console.error('Error fetching alert history:', err);
      historyError = 'Failed to load alert history';
      loadingHistory = false;
    }
  }
  
  onMount(async () => {
    await updateWeather();
    await fetchAlertHistory();
  });
</script>

<svelte:head>
  <title>Montreal Weather | Azure App Demo</title>
  <meta name="description" content="Current weather in Montreal" />
  <style>
    .alert-cold {
      background-color: #cce5ff !important;
      border-color: #b8daff !important;
      color: #004085 !important;
    }

    .alert-heat {
      background-color: #f8d7da !important; 
      border-color: #f5c6cb !important;
      color: #721c24 !important;
    }

    .temperature {
      transition: color 0.3s ease;
    }

    .temperature.alert-cold {
      color: #004085 !important;
    }

    .temperature.alert-heat {
      color: #721c24 !important;
    }

    .alert-info {
      padding: 0.75rem 1.25rem;
      margin-top: 1rem;
      border: 1px solid transparent;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .alert-info.alert-cold {
      background-color: #cce5ff;
      border-color: #b8daff;
      color: #004085;
    }

    .alert-info.alert-heat {
      background-color: #f8d7da;
      border-color: #f5c6cb;
      color: #721c24;
    }

    .alert-info.normal {
      background-color: #d4edda;
      border-color: #c3e6cb;
      color: #155724;
    }
  </style>
</svelte:head>

<div class="container mx-auto px-4 py-12">
  <div 
    class="max-w-lg mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
      <h1 class="text-3xl font-bold">
        {m.hello_world({ name: weather.city })}
      </h1>
      <p class="text-blue-100">
        {m.weather_deployment({ platform: "Azure App Service" })}
      </p>
    </div>
    
    <div class="p-6">
      {#if weather.loading}
        <div class="flex justify-center items-center h-40">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      {:else if weather.error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{weather.error}</p>
        </div>
      {:else}
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img src={weather.icon} alt={weather.description} class="w-24 h-24" />
            <div>
              <p class="capitalize text-lg">{weather.description}</p>
              <p class="text-gray-500">Current conditions</p>
            </div>
          </div>
          <div class="text-5xl font-bold text-gray-800 temperature {getAlertClass(weather.temperature)}">
            {weather.temperature}°C
          </div>
        </div>
        
        <div class="mt-6 border-t border-gray-200 pt-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Feels like</p>
              <p class="text-xl font-semibold">{weather.feelsLike ? Math.round(weather.feelsLike) : Math.round(weather.temperature - 1.2)}°C</p>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Humidity</p>
              <p class="text-xl font-semibold">{weather.humidity || '62'}%</p>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Wind</p>
              <p class="text-xl font-semibold">{weather.wind || '15'} km/h</p>
            </div>
          </div>
        </div>

        {#if weather.alertStatus}
          <div class="alert-info {getAlertClass(weather.temperature)}">
            {#if weather.temperature < COLD_THRESHOLD}
              <strong>Cold Alert:</strong> Temperature is below {COLD_THRESHOLD}°C threshold.
            {:else if weather.temperature > HEAT_THRESHOLD}
              <strong>Heat Alert:</strong> Temperature is above {HEAT_THRESHOLD}°C threshold.
            {:else}
              <strong>Normal:</strong> Temperature is within normal range.
            {/if}
            {#if weather.lastAlertTime}
              <div class="text-xs mt-1">Last alert check: {weather.lastAlertTime}</div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
    
    <div class="bg-gray-50 px-6 py-4">
      <p class="text-center text-gray-500 text-sm">
        Powered by <span class="font-semibold">SvelteKit</span> and deployed on <span class="font-semibold">Azure App Service</span>
      </p>
    </div>
  </div>
  
  <!-- Alert History Card -->
  <div class="max-w-lg mx-auto mt-8 bg-white rounded-lg shadow-xl overflow-hidden">
    <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white flex justify-between items-center">
      <h2 class="text-xl font-bold">Alert History (Last 7 Days)</h2>
      <button 
        on:click={fetchAlertHistory}
        class="bg-white text-indigo-600 px-3 py-1 rounded text-sm hover:bg-indigo-50 transition-colors"
      >
        Refresh
      </button>
    </div>
    
    <div class="p-4">
      {#if loadingHistory}
        <div class="flex justify-center items-center h-20">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      {:else if historyError}
        <div class="bg-red-50 text-red-600 p-3 rounded text-sm">
          {historyError}
        </div>
      {:else if alertHistory.length === 0}
        <div class="text-center py-6 text-gray-500">
          No alerts in the last 7 days
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each alertHistory as alert}
            <div class="py-3 flex items-center">
              <div class={`w-3 h-3 rounded-full mr-3 ${alert.type === 'cold' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
              <div class="flex-grow">
                <div class="flex justify-between">
                  <p class="font-medium">
                    {alert.type === 'cold' ? 'Cold Alert' : 'Heat Alert'}: {alert.temperature.toFixed(1)}°C
                  </p>
                  <p class="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>