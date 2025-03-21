# Weather Alert - Azure Function

Java-based Azure Function project built with Gradle.

## Prerequisites

- [Java 17](https://sdkman.io/sdks#java) (installed via
  [SDKMAN](https://sdkman.io))
- [Azure Functions Core
  Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Gradle](https://gradle.org/install/) (wrapper included)
- VS Code (optional but recommended)

## Setup

```bash
sdk env install
sdk env
```

## Build

```bash
gradle azureFunctionsPackage
```

## Run

```bash
cd build/azure-functions/azure-functions-weather-alert-XXXXXXXXXXXXXX
func start
# or
gradle azureFunctionsRun
```

Or use vscode and press F5 and use `Tasks: Run Task` to run the `func: host start`
task.

## Deploy

Connect to Azure through the Azure extension in VS Code and deploy the
function app by pressing F1 and selecting `Azure Functions: Deploy to
Function App`.
