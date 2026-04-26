#!/bin/bash
# ============================================
# TestApp Azure Setup Script
# Creates Azure resources and configures access
# ============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
SUBSCRIPTION_ID=""
RESOURCE_GROUP="rg-testapp"
LOCATION="eastus"
ACR_NAME="testappprod"

# Get subscription
get_subscription() {
    log_info "Getting Azure subscription..."
    
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    log_success "Using subscription: ${SUBSCRIPTION_ID}"
}

# Create Service Principal
create_service_principal() {
    log_info "Creating Service Principal for CI/CD..."
    
    local sp_name="testapp-cicd"
    
    # Create SP
    local sp_output
    sp_output=$(az ad sp create-for-rbac \
        --name "${sp_name}" \
        --role contributor \
        --scopes "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}" \
        --sdk-auth 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        log_success "Service Principal created"
        echo ""
        echo "=== AZURE_CREDENTIALS for GitHub Secrets ==="
        echo "$sp_output"
        echo "==========================================="
        echo ""
        echo "Add the above JSON to your GitHub repository secrets as AZURE_CREDENTIALS"
    else
        log_error "Failed to create Service Principal"
        exit 1
    fi
}

# Create resource group
create_resource_group() {
    log_info "Creating resource group: ${RESOURCE_GROUP}"
    
    az group create \
        --name "${RESOURCE_GROUP}" \
        --location "${LOCATION}" \
        --tags "Environment=Production" "Project=TestApp" "ManagedBy=Terraform"
    
    log_success "Resource group created"
}

# Create ACR
create_acr() {
    log_info "Creating Azure Container Registry: ${ACR_NAME}"
    
    az acr create \
        --resource-group "${RESOURCE_GROUP}" \
        --name "${ACR_NAME}" \
        --sku Standard \
        --location "${LOCATION}" \
        --admin-enabled true
    
    log_success "ACR created"
    
    # Get credentials
    local acr_username
    local acr_password
    acr_username=$(az acr credential show --name "${ACR_NAME}" --query username -o tsv)
    acr_password=$(az acr credential show --name "${ACR_NAME}" --query passwords[0].value -o tsv)
    
    echo ""
    echo "=== ACR Credentials for GitHub Secrets ==="
    echo "ACR_USERNAME: ${acr_username}"
    echo "ACR_PASSWORD: ${acr_password}"
    echo "=========================================="
}

# Main
main() {
    log_info "TestApp Azure Setup"
    log_info "===================="
    
    # Check Azure CLI
    command -v az >/dev/null 2>&1 || { log_error "Azure CLI is required"; exit 1; }
    
    # Login check
    az account show >/dev/null 2>&1 || { log_error "Not logged into Azure. Run 'az login' first."; exit 1; }
    
    get_subscription
    create_resource_group
    create_acr
    create_service_principal
    
    log_success "Azure setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Add AZURE_CREDENTIALS to GitHub repository secrets"
    echo "2. Add ACR_USERNAME and ACR_PASSWORD to GitHub repository secrets"
    echo "3. Run Terraform to create remaining infrastructure: cd terraform && terraform apply"
}

main "$@"
