# ============================================
# TestApp Azure Infrastructure - Main Configuration
# Terraform v1.5+
# ============================================

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.75"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstatebhogarinc"
    container_name       = "terraform-state"
    key                  = "testapp/terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
  skip_provider_registration = false
}

# ============================================
# Resource Group
# ============================================
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}"
  location = var.location
  tags     = var.common_tags
}

# ============================================
# Container Registry
# ============================================
resource "azurerm_container_registry" "main" {
  name                = "${var.project_name}${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard"
  admin_enabled       = true

  identity {
    type = "SystemAssigned"
  }

  tags = var.common_tags
}

# ============================================
# App Service Plan
# ============================================
resource "azurerm_service_plan" "main" {
  name                = "asp-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = var.common_tags
}

# ============================================
# Linux Web App
# ============================================
resource "azurerm_linux_web_app" "main" {
  name                = "${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on     = true
    ftps_state    = "Disabled"
    http2_enabled = true

    application_stack {
      docker_image     = "${azurerm_container_registry.main.login_server}/${var.project_name}"
      docker_image_tag = "latest"
    }

    health_check_path                 = "/health"
    health_check_eviction_time_in_min = 10

    minimum_tls_version      = "1.2"
    scm_minimum_tls_version  = "1.2"
    scm_use_main_ip_restriction = false

    ip_restriction {
      action     = "Allow"
      ip_address = "0.0.0.0/0"
      name       = "AllowAll"
      priority   = 100
    }
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.main.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.main.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.main.admin_password
    "NODE_ENV"                            = var.environment
    "PORT"                                = "8080"
    "WEBSITES_PORT"                       = "8080"
    "LOG_LEVEL"                           = var.environment == "production" ? "warn" : "debug"
    "APPINSIGHTS_INSTRUMENTATIONKEY"      = azurerm_application_insights.main.instrumentation_key
  }

  identity {
    type = "SystemAssigned"
  }

  https_only = true

  tags = var.common_tags

  lifecycle {
    ignore_changes = [
      site_config[0].application_stack[0].docker_image_tag
    ]
  }
}

# ============================================
# Staging Slot
# ============================================
resource "azurerm_linux_web_app_slot" "staging" {
  name           = "staging"
  app_service_id = azurerm_linux_web_app.main.id

  site_config {
    always_on = true
    ftps_state = "Disabled"

    application_stack {
      docker_image     = "${azurerm_container_registry.main.login_server}/${var.project_name}"
      docker_image_tag = "latest"
    }

    health_check_path = "/health"
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.main.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"     = azurerm_container_registry.main.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"     = azurerm_container_registry.main.admin_password
    "NODE_ENV"                            = "staging"
    "PORT"                                = "8080"
    "WEBSITES_PORT"                       = "8080"
    "LOG_LEVEL"                           = "debug"
    "APPINSIGHTS_INSTRUMENTATIONKEY"      = azurerm_application_insights.main.instrumentation_key
  }

  https_only = true

  tags = var.common_tags
}

# ============================================
# Application Insights
# ============================================
resource "azurerm_application_insights" "main" {
  name                = "appi-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "Node.JS"
  retention_in_days   = 90

  tags = var.common_tags
}

# ============================================
# Log Analytics Workspace
# ============================================
resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.common_tags
}

# ============================================
# Diagnostic Settings
# ============================================
resource "azurerm_monitor_diagnostic_setting" "webapp" {
  name                       = "webapp-diagnostics"
  target_resource_id         = azurerm_linux_web_app.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  enabled_log {
    category = "AppServiceAuditLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
