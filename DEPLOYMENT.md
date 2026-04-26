# TestApp Deployment Guide

Production-ready deployment infrastructure for TestApp with Docker, Kubernetes, Terraform, and Azure App Service.

## 📋 Quick Start

### Prerequisites

- Azure CLI (`az`)
- Docker
- kubectl
- Terraform >= 1.5.0
- Node.js 20+

### 1. Azure Setup

Run the setup script to create Azure resources:

```bash
chmod +x scripts/setup-azure.sh
./scripts/setup-azure.sh
```

This will create:
- Resource Group (`rg-testapp`)
- Azure Container Registry (`testappprod`)
- Service Principal for CI/CD

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | JSON output from setup script |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |
| `SNYK_TOKEN` | Snyk API token (optional) |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications (optional) |

### 3. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 4. Deploy Application

#### Option A: Azure Web App (Recommended)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh full -t v1.0.0
```

#### Option B: Kubernetes

```bash
# Deploy to AKS
./scripts/deploy.sh build -t v1.0.0
./scripts/deploy.sh push -t v1.0.0
./scripts/deploy.sh deploy-k8s
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Azure Cloud                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Azure Container Registry                 │  │
│  │              (testappprod.azurecr.io)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│              ┌───────────────┴───────────────┐               │
│              ▼                               ▼               │
│  ┌─────────────────────┐         ┌─────────────────────┐    │
│  │   Azure Web App     │         │   AKS Cluster       │    │
│  │   (Production)      │         │   (Alternative)     │    │
│  │                     │         │                     │    │
│  │  ┌───────────────┐  │         │  ┌───────────────┐  │    │
│  │  │ Docker Image  │  │         │  │   Ingress     │  │    │
│  │  │   Node.js     │  │         │  │   Controller  │  │    │
│  │  └───────────────┘  │         │  └───────┬───────┘  │    │
│  │                     │         │          │           │    │
│  │  Staging Slot       │         │  ┌───────▼───────┐  │    │
│  │  (Blue/Green)       │         │  │   Service     │  │    │
│  └─────────────────────┘         │  └───────┬───────┘  │    │
│                                  │          │           │    │
│                                  │  ┌───────▼───────┐  │    │
│                                  │  │  Deployment   │  │    │
│                                  │  │  (3 replicas) │  │    │
│                                  │  └───────────────┘  │    │
│                                  └─────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Monitoring & Observability               │  │
│  │  • Application Insights   • Log Analytics            │  │
│  │  • Azure Monitor          • Custom Dashboards        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
.
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yml            # Base Docker Compose
├── docker-compose.dev.yml        # Development overrides
├── docker-compose.prod.yml       # Production with monitoring
├── .dockerignore                 # Docker build optimization
│
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Main Azure resources
│   ├── variables.tf              # Terraform variables
│   ├── outputs.tf                # Output values
│   ├── monitoring.tf             # Alerts and dashboards
│   └── security.tf               # Key Vault, NSG, RBAC
│
├── k8s/                          # Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml                  # Horizontal Pod Autoscaler
│   ├── pdb.yaml                  # Pod Disruption Budget
│   ├── network-policy.yaml
│   ├── serviceaccount.yaml
│   └── configmap.yaml
│
├── scripts/                      # Deployment scripts
│   ├── deploy.sh                 # Main deployment script
│   └── setup-azure.sh            # Azure setup script
│
└── .github/workflows/
    └── ci-cd.yml                 # GitHub Actions pipeline
```

## 🚀 CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Lint & Test**: ESLint, unit tests, coverage
2. **Security Scan**: npm audit, Snyk, Trivy
3. **Build**: Docker image with multi-stage build
4. **Deploy Staging**: Auto-deploy on `develop` branch
5. **Deploy Production**: Auto-deploy on `main` or tags

### Pipeline Diagram

```
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────┐
│  Push   │───▶│  Test   │───▶│   Security  │───▶│  Build   │
│ Trigger │    │  & Lint │    │    Scan     │    │  Docker  │
└─────────┘    └─────────┘    └─────────────┘    └────┬─────┘
                                                       │
                              ┌────────────────────────┼────────────────────────┐
                              │                        │                        │
                              ▼                        ▼                        ▼
                         ┌─────────┐            ┌──────────┐           ┌────────────┐
                         │ Develop │            │   Tag    │           │    Main    │
                         │ Branch  │            │  (v*)    │           │   Branch   │
                         └────┬────┘            └────┬─────┘           └─────┬──────┘
                              │                      │                       │
                              ▼                      ▼                       ▼
                         ┌─────────┐           ┌──────────┐          ┌────────────┐
                         │ Staging │           │Production│          │Production  │
                         │  Slot   │           │  (Tag)   │          │  (Latest)  │
                         └─────────┘           └──────────┘          └────────────┘
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `LOG_LEVEL` | Logging level | `info` |

### Terraform Variables

```hcl
environment     = "production"    # dev, staging, production
location        = "eastus"        # Azure region
app_service_sku = "B1"            # F1, B1, S1, P1v2, etc.
```

## 📊 Monitoring

### Metrics Collected

- CPU/Memory usage
- HTTP request rates
- Response times
- Error rates (5xx, 4xx)
- Health check status

### Alerts

| Alert | Threshold | Severity |
|-------|-----------|----------|
| CPU > 80% | 5 min | Warning |
| Memory > 85% | 5 min | Warning |
| HTTP 5xx > 10 | 5 min | Critical |
| Response Time > 5s | 5 min | Warning |
| Health Check Failed | 1 min | Critical |

## 🔒 Security

- **Non-root containers**: Run as user 1001
- **Read-only root filesystem**: Prevents runtime modifications
- **Network policies**: Restrict pod-to-pod communication
- **Key Vault**: Secure secret management
- **RBAC**: Role-based access control
- **TLS**: HTTPS enforced with cert-manager

## 🛠️ Troubleshooting

### Check Deployment Status

```bash
# Azure Web App
az webapp show --name testapp-production --resource-group rg-testapp

# Kubernetes
kubectl get pods -n testapp
kubectl logs -n testapp deployment/testapp
```

### View Logs

```bash
# Azure
az webapp log tail --name testapp-production --resource-group rg-testapp

# Kubernetes
kubectl logs -f -n testapp -l app=testapp
```

### Rollback

```bash
# Azure - Swap slots back
az webapp deployment slot swap \
  --name testapp-production \
  --resource-group rg-testapp \
  --slot staging \
  --target-slot production

# Kubernetes
kubectl rollout undo deployment/testapp -n testapp
```

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
