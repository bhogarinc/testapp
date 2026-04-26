# ============================================
# TestApp Azure Infrastructure - Monitoring & Alerting
# ============================================

# ============================================
# Action Group for Alerts
# ============================================
resource "azurerm_monitor_action_group" "main" {
  name                = "ag-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "testapp-alerts"

  email_receiver {
    name                    = "DevOps Team"
    email_address           = "devops@example.com"
    use_common_alert_schema = true
  }

  webhook_receiver {
    name        = "Slack Webhook"
    service_uri = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  }

  tags = var.common_tags
}

# ============================================
# CPU Usage Alert
# ============================================
resource "azurerm_monitor_metric_alert" "cpu" {
  name                = "alert-cpu-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_service_plan.main.id]
  description         = "Alert when CPU usage exceeds 80%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/serverFarms"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.common_tags
}

# ============================================
# Memory Usage Alert
# ============================================
resource "azurerm_monitor_metric_alert" "memory" {
  name                = "alert-memory-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_service_plan.main.id]
  description         = "Alert when memory usage exceeds 85%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/serverFarms"
    metric_name      = "MemoryPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.common_tags
}

# ============================================
# HTTP 5xx Errors Alert
# ============================================
resource "azurerm_monitor_metric_alert" "http_5xx" {
  name                = "alert-http-5xx-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.main.id]
  description         = "Alert when HTTP 5xx errors exceed threshold"
  severity            = 1
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.common_tags
}

# ============================================
# Response Time Alert
# ============================================
resource "azurerm_monitor_metric_alert" "response_time" {
  name                = "alert-response-time-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.main.id]
  description         = "Alert when average response time exceeds 5 seconds"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "AverageResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 5000
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.common_tags
}

# ============================================
# Health Check Failure Alert
# ============================================
resource "azurerm_monitor_metric_alert" "health_check" {
  name                = "alert-health-check-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.main.id]
  description         = "Alert when health check fails"
  severity            = 0
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HealthCheckStatus"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 50
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.common_tags
}

# ============================================
# Dashboard
# ============================================
resource "azurerm_portal_dashboard" "main" {
  name                = "dash-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  tags                = var.common_tags

  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          "0" = {
            position = {
              x      = 0
              y      = 0
              colSpan = 6
              rowSpan = 4
            }
            metadata = {
              type       = "Extension/HubsExtension/PartType/MonitorChartPart"
              inputs     = []
              settings = {
                content = {
                  options = {
                    chart = {
                      metrics = [
                        {
                          resourceMetadata = {
                            id = azurerm_linux_web_app.main.id
                          }
                          name       = "CpuTime"
                          aggregationType = 1
                          namespace = "microsoft.web/sites"
                          metricVisualization = {
                            displayName = "CPU Time"
                          }
                        }
                      ]
                      title    = "CPU Usage"
                      visualization = {
                        chartType = 2
                        legendVisualization = {
                          isVisible = true
                          position  = 2
                          hideSubtitle = false
                        }
                        axisVisualization = {
                          x = {
                            isVisible = true
                            axisType  = 2
                          }
                          y = {
                            isVisible = true
                            axisType  = 1
                          }
                        }
                      }
                      grouping = {
                        dimension = "None"
                        sort      = 2
                        top       = 10
                      }
                      timespan = {
                        relative = {
                          duration = 86400000
                        }
                        showUTCTime = false
                        grain       = 1
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    metadata = {
      model = {
        timeRange = {
          value = {
            relative = {
              duration = 24
              timeUnit = 1
            }
          }
          type = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
        filterLocale = {
          value = "en-us"
        }
        filters = {
          value = {
            MsPortalFx_TimeRange = {
              model = {
                format = "utc"
                granularity = "auto"
                relative = "24h"
              }
            }
          }
        }
      }
    }
  })
}
