#!/bin/bash
# ============================================
# TestApp Deployment Script
# Automates deployment to Azure and Kubernetes
# ============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="testapp"
RESOURCE_GROUP="rg-${PROJECT_NAME}"
ACR_NAME="${PROJECT_NAME}prod"
WEBAPP_NAME="${PROJECT_NAME}-production"
LOCATION="eastus"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v az >/dev/null 2>&1 || { log_error "Azure CLI is required but not installed."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_warning "kubectl not found. Kubernetes deployment will be skipped."; }
    command -v terraform >/dev/null 2>&1 || { log_warning "Terraform not found. Infrastructure deployment will be skipped."; }
    
    # Check Azure login
    az account show >/dev/null 2>&1 || { log_error "Not logged into Azure. Run 'az login' first."; exit 1; }
    
    log_success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    local tag="${1:-latest}"
    
    docker build -t "${PROJECT_NAME}:${tag}" .
    docker tag "${PROJECT_NAME}:${tag}" "${ACR_NAME}.azurecr.io/${PROJECT_NAME}:${tag}"
    
    log_success "Docker image built: ${PROJECT_NAME}:${tag}"
}

# Push to ACR
push_image() {
    log_info "Pushing image to Azure Container Registry..."
    
    local tag="${1:-latest}"
    
    # Login to ACR
    az acr login --name "${ACR_NAME}"
    
    # Push image
    docker push "${ACR_NAME}.azurecr.io/${PROJECT_NAME}:${tag}"
    
    log_success "Image pushed to ACR"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    terraform init
    terraform plan -out=tfplan
    terraform apply tfplan
    
    cd ..
    
    log_success "Infrastructure deployed"
}

# Deploy to Azure Web App
deploy_azure_webapp() {
    log_info "Deploying to Azure Web App..."
    
    local tag="${1:-latest}"
    
    # Configure web app to use container
    az webapp config container set \
        --name "${WEBAPP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --docker-custom-image-name "${ACR_NAME}.azurecr.io/${PROJECT_NAME}:${tag}" \
        --docker-registry-server-url "https://${ACR_NAME}.azurecr.io" \
        --docker-registry-server-user "$(az acr credential show --name "${ACR_NAME}" --query username -o tsv)" \
        --docker-registry-server-password "$(az acr credential show --name "${ACR_NAME}" --query passwords[0].value -o tsv)"
    
    # Restart web app
    az webapp restart --name "${WEBAPP_NAME}" --resource-group "${RESOURCE_GROUP}"
    
    log_success "Deployed to Azure Web App"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Apply manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/serviceaccount.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/hpa.yaml
    kubectl apply -f k8s/pdb.yaml
    kubectl apply -f k8s/network-policy.yaml
    
    # Wait for deployment
    kubectl rollout status deployment/testapp -n testapp --timeout=300s
    
    log_success "Deployed to Kubernetes"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local url="${1:-https://${WEBAPP_NAME}.azurewebsites.net/health}"
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${url}" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_warning "Health check attempt $attempt/$max_attempts failed. Retrying in 10s..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."
    docker system prune -f
    log_success "Cleanup completed"
}

# Usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

Commands:
    build           Build Docker image
    push            Push image to ACR
    infra           Deploy infrastructure with Terraform
    deploy-webapp   Deploy to Azure Web App
    deploy-k8s      Deploy to Kubernetes
    full            Full deployment (build, push, infra, deploy)
    health          Run health check
    cleanup         Clean up Docker resources

Options:
    -t, --tag       Image tag (default: latest)
    -h, --help      Show this help message

Examples:
    $0 build -t v1.0.0
    $0 full -t v1.0.0
    $0 deploy-webapp -t v1.0.0
EOF
}

# Main
main() {
    local tag="latest"
    local command=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--tag)
                tag="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            build|push|infra|deploy-webapp|deploy-k8s|full|health|cleanup)
                command="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    if [ -z "$command" ]; then
        log_error "No command specified"
        usage
        exit 1
    fi
    
    # Execute command
    case $command in
        build)
            check_prerequisites
            build_image "$tag"
            ;;
        push)
            check_prerequisites
            push_image "$tag"
            ;;
        infra)
            check_prerequisites
            deploy_infrastructure
            ;;
        deploy-webapp)
            check_prerequisites
            deploy_azure_webapp "$tag"
            health_check
            ;;
        deploy-k8s)
            check_prerequisites
            deploy_kubernetes
            ;;
        full)
            check_prerequisites
            build_image "$tag"
            push_image "$tag"
            deploy_infrastructure
            deploy_azure_webapp "$tag"
            health_check
            ;;
        health)
            health_check
            ;;
        cleanup)
            cleanup
            ;;
    esac
}

main "$@"
