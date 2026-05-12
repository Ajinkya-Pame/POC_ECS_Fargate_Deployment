# 🏏 MemeCricket — Enterprise-Grade EKS Deployment

**Multi-Container 4-Tier Microservices Application on Amazon EKS**

MemeCricket is a production-grade, real-time cricket scoring and match management platform deployed on **Amazon Elastic Kubernetes Service (EKS)** using Kubernetes for scalable, highly available container orchestration.

---

## 🏗️ Architecture Overview

### 4-Tier Microservices

| Tier | Service | Technology | Port |
|------|---------|-----------|------|
| **Presentation** | Frontend (`/src/frontend`) | React.js (Vite) + Nginx | 80 |
| **Application** | Backend API (`/src/backend`) | Node.js + Express | 3001 |
| **Data** | Database (`/src/database`) | PostgreSQL 16 | 5432 |
| **Caching** | Cache (`/src/cache`) | Redis 7 | 6379 |

### AWS Infrastructure (Terraform)
- **Amazon EKS** — Managed Kubernetes cluster with managed node groups (t3.medium)
- **Amazon ECR** — Private container registry for all 4 service images
- **VPC** — Custom VPC with public/private subnets across 3 AZs
- **AWS Load Balancer Controller** — Automatic ALB provisioning from Kubernetes Ingress
- **EBS CSI Driver** — Persistent volumes for PostgreSQL StatefulSet
- **IAM (IRSA)** — Fine-grained pod-level IAM with OIDC federation

### CI/CD Pipeline (Jenkins)
- **Trivy** — Container image vulnerability scanning (HIGH/CRITICAL)
- **Amazon ECR** — Image promotion across Dev → QA → Prod registries
- **Helm** — Declarative Kubernetes deployments with rolling updates
- **Zero-downtime** — `maxUnavailable: 0, maxSurge: 1` rolling update strategy

---

## 📁 Project Structure

```
├── src/                           # Application source code
│   ├── frontend/                  #   React + Nginx (Dockerfile)
│   ├── backend/                   #   Node.js API (Dockerfile)
│   ├── database/                  #   PostgreSQL + init.sql (Dockerfile)
│   └── cache/                     #   Redis + custom config (Dockerfile)
├── infra/                         # Terraform (IaC)
│   ├── modules/
│   │   ├── network/               #   VPC, Subnets, NAT Gateway
│   │   ├── security/              #   EKS Cluster & Node Security Groups
│   │   ├── iam/                   #   EKS Roles, IRSA, ALB Controller Policy
│   │   ├── eks_cluster/           #   EKS Cluster, Node Group, Addons
│   │   └── ecr/                   #   Container Registries
│   └── environments/
│       ├── dev/                   #   Dev tfvars + backend config
│       ├── qa/                    #   QA tfvars + backend config
│       └── prod/                  #   Prod tfvars + backend config
├── kube/helm/cricket-app/         # Helm Chart
│   ├── Chart.yaml
│   ├── values.yaml                #   Default values
│   ├── values-dev.yaml            #   Dev overrides
│   ├── values-qa.yaml             #   QA overrides
│   ├── values-prod.yaml           #   Prod overrides
│   └── templates/
│       ├── frontend/              #   Deployment + Service
│       ├── backend/               #   Deployment + Service
│       ├── database/              #   StatefulSet + Service + ConfigMap
│       ├── cache/                 #   Deployment + Service
│       ├── ingress.yaml           #   ALB Ingress
│       └── secrets.yaml           #   Kubernetes Secrets
├── cicd/                          # Jenkins Pipelines
│   ├── frontend-pipeline/         #   Build → Trivy → ECR → Helm Deploy
│   ├── backend-pipeline/          #   Build → Trivy → ECR → Helm Deploy
│   ├── database-pipeline/         #   Build → Trivy → ECR → Helm Deploy
│   ├── cache-pipeline/            #   Build → Trivy → ECR → Helm Deploy
│   └── infra-pipeline/            #   Terraform → ALB Controller Install
└── docker-compose.yml             # Local development
```

---

## 🚀 Getting Started

### Local Development (Docker Compose)

```bash
git clone https://github.com/Ajinkya-Pame/Cricket.git
cd Cricket

docker-compose up --build -d

# Access:
# Public View:  http://localhost
# Admin Portal: http://localhost/admin
# Health Check: http://localhost:3001/health
```

### EKS Deployment (Production)

**Prerequisites:** AWS CLI, kubectl, Helm, Terraform

```bash
# 1. Provision infrastructure
cd infra
terraform init -backend-config=./environments/dev/backend.config
terraform plan -var-file=environments/dev/dev.tfvars
terraform apply

# 2. Configure kubectl
aws eks update-kubeconfig --name memecricket-dev-cluster --region ap-south-1

# 3. Install AWS Load Balancer Controller (via Helm)
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system --set clusterName=memecricket-dev-cluster

# 4. Deploy application
helm upgrade --install cricket ./kube/helm/cricket-app \
  -f ./kube/helm/cricket-app/values.yaml \
  -f ./kube/helm/cricket-app/values-dev.yaml \
  -n cricket --create-namespace \
  --set global.ecrRegistry=<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com \
  --set backend.env.databaseUrl="postgresql://cricket:password@database:5432/cricket_db" \
  --set backend.env.redisUrl="redis://cache:6379" \
  --set backend.env.adminPassword="admin123" \
  --set database.env.postgresPassword="password"

# 5. Verify
kubectl get pods -n cricket
kubectl get ingress -n cricket
```

---

## ⚙️ CI/CD Pipelines (Jenkins)

| Pipeline | Purpose | Stages |
|----------|---------|--------|
| `infra-pipeline` | Provision EKS cluster | Init → Validate → Plan → Apply → ALB Controller |
| `frontend-pipeline` | Deploy React app | Build → Trivy Scan → ECR Push → Helm Deploy |
| `backend-pipeline` | Deploy Node.js API | Build → Trivy Scan → ECR Push → Helm Deploy |
| `database-pipeline` | Deploy PostgreSQL | Build → Trivy Scan → ECR Push → Helm Deploy |
| `cache-pipeline` | Deploy Redis | Build → Trivy Scan → ECR Push → Helm Deploy |
| `infra-pipeline (Destroy)` | Tear down infrastructure | Helm Uninstall → Terraform Destroy |

**Image Promotion Flow:** Dev (build+scan) → QA (pull+retag) → Prod (approve+deploy)

---

*Maintained by [@Ajinkya-Pame](https://github.com/Ajinkya-Pame)*