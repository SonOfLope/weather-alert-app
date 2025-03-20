# Montreal Weather App - Azure App Service Demo

This is a weather application for Montreal built with SvelteKit and deployed to
Azure App Service.

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values. See [Azure Key Vault
   Configuration](#azure-key-vault-configuration) for Key Vault setup.
3. Install dependencies: `npm install`
4. Run the development server: `npm run dev`

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
