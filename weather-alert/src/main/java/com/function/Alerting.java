package com.function;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;
import com.microsoft.azure.functions.annotation.*;
import com.microsoft.azure.functions.*;
import com.azure.data.tables.TableClient;
import com.azure.data.tables.TableServiceClient;
import com.azure.data.tables.TableServiceClientBuilder;
import com.azure.data.tables.models.TableEntity;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;

/**
 * Azure Functions with HTTP Trigger for weather alerting.
 */
public class Alerting {
    private static final String TABLE_NAME = "weatheralerts";
    private static final String PARTITION_KEY = "alerts";
    private static final String HISTORY_PARTITION_KEY = "history";
    private static final String CONNECTION_STRING_SETTING = "AzureWebJobsStorage";
    private static final String SENDGRID_API_KEY_SETTING = "SENDGRID_API_KEY";
    private static final String RECIPIENT_EMAIL = System.getenv("SENDGRID_RECIPIENT_EMAIL");
    private static final String FROM_EMAIL = System.getenv("SENDGRID_FROM_EMAIL");
    private static final long ALERT_COOLDOWN_HOURS = 3;
    private static final double COLD_THRESHOLD = 10.0;
    private static final double HEAT_THRESHOLD = 20.0;

    /**
     * This function listens for weather alerts and sends email if needed.
     */
    @FunctionName("weatherAlert")
    public HttpResponseMessage run(
        @HttpTrigger(
            name = "req", 
            methods = {HttpMethod.POST}, 
            authLevel = AuthorizationLevel.ANONYMOUS,
            route = "weather-alert"
        ) HttpRequestMessage<Optional<String>> request,
        final ExecutionContext context) {
        
        context.getLogger().info("Weather alert function processed a request");

        // Parse the request body
        String requestBody = request.getBody().orElse("");
        if (requestBody.isEmpty()) {
            return request.createResponseBuilder(HttpStatus.BAD_REQUEST)
                .body("Please provide temperature data in the request body")
                .build();
        }

        try {
            // Parse JSON request
            JsonObject jsonRequest = new Gson().fromJson(requestBody, JsonObject.class);
            if (!jsonRequest.has("temp")) {
                return request.createResponseBuilder(HttpStatus.BAD_REQUEST)
                    .body("Request must include 'temp' field")
                    .build();
            }

            double temperature = jsonRequest.get("temp").getAsDouble();
            context.getLogger().info("Received temperature: " + temperature);

            // Initialize TableClient
            TableClient tableClient = getTableClient(context);

            // Process temperature
            if (temperature < COLD_THRESHOLD) {
                return processAlert("cold", temperature, tableClient, context, request);
            } else if (temperature > HEAT_THRESHOLD) {
                return processAlert("heat", temperature, tableClient, context, request);
            } else {
                // Temperature is within normal range
                return request.createResponseBuilder(HttpStatus.OK)
                    .header("Content-Type", "application/json")
                    .body("{\"status\": \"normal\", \"message\": \"Temperature is within normal range\"}")
                    .build();
            }
        } catch (Exception e) {
            context.getLogger().severe("Error processing alert: " + e.getMessage());
            return request.createResponseBuilder(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}")
                .build();
        }
    }

    /**
     * Process an alert and decide whether to send an email
     */
    private HttpResponseMessage processAlert(
            String alertType, 
            double temperature, 
            TableClient tableClient, 
            ExecutionContext context,
            HttpRequestMessage<Optional<String>> request) {
        
        try {
            // Check if an alert was sent recently
            String rowKey = alertType;
            
            boolean shouldSendAlert = true;
            
            try {
                TableEntity entity = tableClient.getEntity(PARTITION_KEY, rowKey);
                if (entity != null) {
                    OffsetDateTime lastAlertTime = OffsetDateTime.parse((String) entity.getProperty("AlertTimestamp"));


                    OffsetDateTime now = OffsetDateTime.now();
                    
                    Duration timeSinceLastAlert = Duration.between(lastAlertTime, now);
                    shouldSendAlert = timeSinceLastAlert.toHours() >= ALERT_COOLDOWN_HOURS;
                    
                    context.getLogger().info("Time since last " + alertType + " alert: " + 
                                            timeSinceLastAlert.toHours() + " hours");
                }
            } catch (Exception e) {
                // Entity probably doesn't exist yet, which is fine
                context.getLogger().info("No previous alert record found for: " + alertType);
            }
            
            if (shouldSendAlert) {
                // Send email alert
                boolean emailSent = sendEmailAlert(alertType, temperature, context);
                
                if (emailSent) {

                    TableEntity entity = new TableEntity(PARTITION_KEY, rowKey);
                    entity.addProperty("AlertType", alertType);
                    entity.addProperty("Temperature", temperature);
                    entity.addProperty("AlertTimestamp", OffsetDateTime.now().toString());

                    tableClient.upsertEntity(entity);
                    context.getLogger().info("Saved alert record to table for: " + alertType);

                    // Also add a history record with timestamp as rowKey for listing
                    String historyRowKey = String.valueOf(System.currentTimeMillis());
                    TableEntity historyEntity = new TableEntity(HISTORY_PARTITION_KEY, historyRowKey);
                    historyEntity.addProperty("AlertType", alertType);
                    historyEntity.addProperty("Temperature", temperature);
                    historyEntity.addProperty("AlertTimestamp", OffsetDateTime.now().toString());
                    historyEntity.addProperty("FormattedTime", java.time.LocalDateTime.now().toString());
                    tableClient.upsertEntity(historyEntity);

                    return request.createResponseBuilder(HttpStatus.OK)
                        .header("Content-Type", "application/json")
                        .body("{\"status\": \"alert-sent\", \"alertType\": \"" + alertType + 
                              "\", \"temperature\": " + temperature + "}")
                        .build();
                } else {
                    return request.createResponseBuilder(HttpStatus.INTERNAL_SERVER_ERROR)
                        .header("Content-Type", "application/json")
                        .body("{\"status\": \"error\", \"message\": \"Failed to send email alert\"}")
                        .build();
                }
            } else {
                // Skip sending alert due to cooldown period
                return request.createResponseBuilder(HttpStatus.OK)
                    .header("Content-Type", "application/json")
                    .body("{\"status\": \"skipped\", \"message\": \"Alert skipped due to cooldown period\", " +
                          "\"alertType\": \"" + alertType + "\", \"temperature\": " + temperature + "}")
                    .build();
            }
        } catch (Exception e) {
            context.getLogger().severe("Error in processAlert: " + e.getMessage());
            return request.createResponseBuilder(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/json")
                .body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}")
                .build();
        }
    }

    /**
     * Send email alert using SendGrid
     */
    private boolean sendEmailAlert(String alertType, double temperature, ExecutionContext context) {
        String apiKey = System.getenv(SENDGRID_API_KEY_SETTING);
        if (apiKey == null || apiKey.isEmpty()) {
            context.getLogger().severe("SendGrid API key not configured");
            return false;
        }
        
        try {
            Email from = new Email(FROM_EMAIL);
            Email to = new Email(RECIPIENT_EMAIL);
            
            String subject = "Weather Alert: " + (alertType.equals("cold") ? "Cold" : "Heat") + " Condition Detected";
            
            String alertMessage = alertType.equals("cold") 
                ? "Cold alert: Temperature has dropped to " + temperature + "°C, which is below the threshold of " + COLD_THRESHOLD + "°C."
                : "Heat alert: Temperature has risen to " + temperature + "°C, which is above the threshold of " + HEAT_THRESHOLD + "°C.";
                
            Content content = new Content("text/plain", alertMessage);
            Mail mail = new Mail(from, subject, to, content);
            
            SendGrid sg = new SendGrid(apiKey);
            Request req = new Request();
            
            req.setMethod(com.sendgrid.Method.POST);
            req.setEndpoint("mail/send");
            req.setBody(mail.build());
            
            Response response = sg.api(req);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                context.getLogger().info("Email alert sent successfully for " + alertType + 
                                        " condition. Status code: " + response.getStatusCode());
                return true;
            } else {
                context.getLogger().severe("Failed to send email. Status code: " + response.getStatusCode() + 
                                          ", Body: " + response.getBody());
                return false;
            }
        } catch (Exception e) {
            context.getLogger().severe("Error sending email: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get or create the table client
     */
    private TableClient getTableClient(ExecutionContext context) {
        String connectionString = System.getenv(CONNECTION_STRING_SETTING);
        if (connectionString == null || connectionString.isEmpty()) {
            throw new RuntimeException("Storage connection string not configured");
        }
        
        TableServiceClient tableServiceClient = new TableServiceClientBuilder()
            .connectionString(connectionString)
            .buildClient();
            
        // Create table if it doesn't exist
        if (!tableServiceClient.listTables().stream().anyMatch(table -> table.getName().equals(TABLE_NAME))) {
            context.getLogger().info("Creating table: " + TABLE_NAME);
            tableServiceClient.createTable(TABLE_NAME);
        }
        
        return tableServiceClient.getTableClient(TABLE_NAME);
    }

    /**
     * Function to retrieve alert history from the last 7 days
     */
    @FunctionName("getAlertHistory")
    public HttpResponseMessage getAlertHistory(
        @HttpTrigger(
            name = "req", 
            methods = {HttpMethod.GET}, 
            authLevel = AuthorizationLevel.ANONYMOUS,
            route = "weather-alert-history"
        ) HttpRequestMessage<Optional<String>> request,
        final ExecutionContext context) {
        
        context.getLogger().info("Weather alert history function processed a request");

        try {
            // Get table client
            TableClient tableClient = getTableClient(context);
            
            // Calculate timestamp for 7 days ago
            OffsetDateTime sevenDaysAgo = OffsetDateTime.now().minusDays(7);
            String filterTimestamp = sevenDaysAgo.toString();
            
            // Query the table for alert history records from the last 7 days
            List<Map<String, Object>> alertHistory = new ArrayList<>();
            
            tableClient.listEntities()
                .forEach(entity -> {
                    // Check if it's a history record
                    if (HISTORY_PARTITION_KEY.equals(entity.getPartitionKey())) {
                        try {
                            String alertTimestamp = (String) entity.getProperty("AlertTimestamp");
                            OffsetDateTime alertTime = OffsetDateTime.parse(alertTimestamp);
                            
                            // Include only alerts from the last 7 days
                            if (alertTime.isAfter(sevenDaysAgo)) {
                                Map<String, Object> alertRecord = new HashMap<>();
                                alertRecord.put("id", entity.getRowKey());
                                alertRecord.put("type", entity.getProperty("AlertType"));
                                alertRecord.put("temperature", entity.getProperty("Temperature"));
                                alertRecord.put("timestamp", alertTimestamp);
                                alertRecord.put("formattedTime", entity.getProperty("FormattedTime"));
                                
                                alertHistory.add(alertRecord);
                            }
                        } catch (Exception e) {
                            context.getLogger().warning("Error parsing alert record: " + e.getMessage());
                        }
                    }
                });
            
            // Sort alerts by timestamp (newest first)
            alertHistory.sort((a, b) -> {
                String timestampA = (String) a.get("timestamp");
                String timestampB = (String) b.get("timestamp");
                return timestampB.compareTo(timestampA); // Descending order
            });
            
            // Convert to JSON and return
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(alertHistory);
            
            return request.createResponseBuilder(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body(jsonResponse)
                .build();
                
        } catch (Exception e) {
            context.getLogger().severe("Error retrieving alert history: " + e.getMessage());
            return request.createResponseBuilder(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}")
                .build();
        }
    }
}