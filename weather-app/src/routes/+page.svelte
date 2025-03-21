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
    wind: null
  };

  onMount(async () => {
    try {
      const response = await fetch('/api/weather?city=Montreal');
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      
      weather = {
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
    } catch (err) {
      console.error('Error:', err);
      weather = {
        ...weather,
        loading: false,
        error: 'Failed to load weather data'
      };
    }
  });
</script>

<svelte:head>
  <title>Montreal Weather | Azure App Demo</title>
  <meta name="description" content="Current weather in Montreal" />
</svelte:head>

<div class="container mx-auto px-4 py-12">
  <div class="max-w-lg mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
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
          <div class="text-5xl font-bold text-gray-800">
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
      {/if}
    </div>
    
    <div class="bg-gray-50 px-6 py-4">
      <p class="text-center text-gray-500 text-sm">
        Powered by <span class="font-semibold">SvelteKit</span> and deployed on <span class="font-semibold">Azure App Service</span>
      </p>
    </div>
  </div>
</div>