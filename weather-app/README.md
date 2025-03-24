# Montreal Weather App with Alerting - Azure App Service Demo

This is a weather application for Montreal built with SvelteKit and deployed to
Azure App Service. It includes an alerting mechanism that monitors temperature
and triggers alerts via an Azure Function when extreme temperatures are detected.

## Features

- Real-time weather display for Montreal
- HTMX-based polling to refresh data every 5 minutes
- Automatic temperature threshold monitoring:
  - Cold alert when temperature falls below 10°C
  - Heat alert when temperature rises above 20°C
- Integration with Azure Function for email alerting

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values. See [Azure Key Vault
   Configuration](#azure-key-vault-configuration) for Key Vault setup.
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

## Environment Variables

- `OPENWEATHER_API_KEY`: Your OpenWeather API key (optional if using Key Vault)
- `KEY_VAULT_NAME`: Your Azure Key Vault name
- `WEATHER_API_SECRET_NAME`: Secret name in Key Vault (default: OpenWeatherApiKey)
- `AZURE_FUNCTION_URL`: URL to your Weather Alert Azure Function

## Azure Deployment

The application is set up to deploy to Azure App Service with:

- Initial deployment to a staging slot when a PR is opened
- Swap to production slot when the PR is merged

## Azure Key Vault Configuration

1. Create an Azure Key Vault
2. Add your OpenWeather API key as a secret (default name: `OpenWeatherApiKey`)

    ```bash
    az keyvault secret set --vault-name <KEY_VAULT_NAME> --name OpenWeatherApiKey --value <API_KEY>
    ```

3. Configure your App Service with Managed Identity

    ```bash
    az webapp identity assign --name <APP_NAME> --resource-group <RESOURCE_GROUP>
    # if in deployment slot:
    az webapp identity assign --name <APP_NAME> --resource-group <RESOURCE_GROUP> --slot <SLOT_NAME>
    ```

4. Grant the Managed Identity access to your Key Vault

    ```bash
    az keyvault assignment create --name <KEY_VAULT_NAME> --resource-group <RESOURCE_GROUP> --object-id <OBJECT_ID> --role "Key Vault Secrets User"
    ```

5. Set the environment variables in App Service Configuration:
   - `KEY_VAULT_NAME`: Your Key Vault name
   - `WEATHER_API_SECRET_NAME`: Secret name (default: OpenWeatherApiKey)
   - `AZURE_FUNCTION_URL`: URL to your Weather Alert Azure Function

## Architecture

The application has two main components:

1. **Frontend (SvelteKit)**: Displays weather data and handles threshold checking
   - Uses HTMX for automatic polling every 5 minutes
   - Triggers alerts when temperature thresholds are crossed

2. **Backend (Azure Function)**: Handles email alerting
   - Receives temperature data via HTTP POST
   - Uses Azure Table Storage to track alert history
   - Implements cooldown period to prevent duplicate alerts
   - Sends email alerts using SendGrid
