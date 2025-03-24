# Weather Alert - Azure Function

Java-based Azure Function project built with Gradle to handle weather alerts
when 'extreme' temperatures are detected.

## Features

- HTTP trigger that accepts POST requests with temperature data
- Email alerting using SendGrid when temperature falls below 10°C or rises above
  20°C
- Azure Table Storage to track alert history and prevent duplicate alerts
- Configurable cooldown period (default: 3 hours between alerts of the same
  type)

## Prerequisites

- [Java 17](https://sdkman.io/sdks#java) (installed via
  [SDKMAN](https://sdkman.io))
- [Azure Functions Core
  Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Gradle](https://gradle.org/install/) (wrapper included)
- VS Code (optional but recommended)
- Azure Storage Account (for Table Storage)
- SendGrid account for email delivery

## Setup

```bash
sdk env install
sdk env
```

### Configuration

The function requires the following application settings:

- `AzureWebJobsStorage`: Azure Storage connection string for Azure Functions and
  Table Storage
- `SENDGRID_API_KEY`: SendGrid API key for sending emails

## API

### POST /api/weather-alert

Accepts a JSON payload with temperature data:

```json
{
  "temp": 25.5
}
```

#### Responses

**Alert Sent:**

```json
{
  "status": "alert-sent",
  "alertType": "heat",
  "temperature": 25.5
}
```

**Alert Skipped (due to cooldown):**

```json
{
  "status": "skipped",
  "message": "Alert skipped due to cooldown period",
  "alertType": "heat",
  "temperature": 25.5
}
```

**Normal Temperature (no alert needed):**

```json
{
  "status": "normal",
  "message": "Temperature is within normal range"
}
```

### GET /api/weather-alert-history

Returns a list of alerts that have been sent.

## Build

```bash
gradle azureFunctionsPackage
```

## Run

```bash
cd build/azure-functions/weather-alert-XXXXXXXXXXXXXX
func start
# or
gradle azureFunctionsRun
```

Or use vscode and press F5 and use `Tasks: Run Task` to run the `func: host
start` task.

## Deploy

Connect to Azure through the Azure extension in VS Code and deploy the function
app by pressing F1 and selecting `Azure Functions: Deploy to Function App`.

Alternatively:

```bash
gradle azureFunctionsDeploy
```

## Usage

Send a POST request to the function app with temperature data to trigger an
alert.

```bash
curl -X POST http://localhost:7071/api/weather-alert -H "Content-Type: application/json" -d '{"temp": 25.5}'
```

Send a GET request to view the alert history.

```bash
curl -X GET http://localhost:7071/api/weather-alert-history
```
