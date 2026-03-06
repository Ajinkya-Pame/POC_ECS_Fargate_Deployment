# 🏏 MemeCricket
**The Ultimate Real-Time Cricket Scoring & Dashboard Experience**

MemeCricket is a robust, high-performance web application designed to bring live cricket scoring and match management to administrators and fans alike. It features a secure administrative portal for updating live coverage, ball-by-ball commentary, and match rosters, alongside a blazing-fast public view for fans receiving real-time Server-Sent Events (SSE).

---

## 🏗️ Microservices Architecture
MemeCricket has been re-architected from a monolith into a highly scalable, fully decoupled 4-container microservices ecosystem:

1. **Frontend (`/src/frontend`)**: A React.js (Vite) SPA served securely by Nginx, routing API traffic to the backend.
2. **Backend API (`/src/backend`)**: A lightweight Node.js Express server handling business logic, database connections, and pushing real-time Server-Sent Events (SSE) to connected clients.
3. **Database (`/src/database`)**: A PostgreSQL 16 container managing the core relational schemas (`match_state`, `commentary`, `roster`).
4. **Cache (`/src/cache`)**: A cost-optimized Redis 7 container managing ultra-fast read caching for public queries.

---

## ☁️ AWS ECS Fargate & Infrastructure
MemeCricket operates on a fully codified, highly available AWS Cloud infrastructure built via **Terraform** and automated via **Jenkins**.

*   **Compute (ECS Fargate)**: Serverless container orchestration. The 4 microservices run autonomously in AWS Fargate.
*   **Service Discovery (AWS Cloud Map)**: Containers communicate natively via private DNS hosted zones (`backend.cricket.local`, `database.cricket.local`). 
*   **Routing**: AWS Application Load Balancer (ALB) securely routes external traffic to the private Frontend container.
*   **Security**: Tightened Security Groups ensure the Database and Cache can *only* be accessed by the Backend API.

---

## 🚀 Getting Started Locally

Use Docker Compose to spin up the entire 4-container ecosystem identically to how it runs in AWS ECS.

```bash
# 1. Clone the repository
git clone https://github.com/Ajinkya-Pame/Cricket.git
cd Cricket

# 2. Start the full application stack
docker-compose up --build -d

# 3. Access the Application
# Public View:  http://localhost
# Admin Portal: http://localhost/admin  (Password is set in docker-compose.yml)
# Health Check: http://localhost:3001/health
```

---

## ⚙️ Automated CI/CD (Jenkins Pipelines)

The `/cicd` directory contains 5 distinct declarative Groovy pipelines integrating with Jenkins WSL:

1.  **`infra-pipeline`**: Automates `terraform init/plan/apply` to provision the VPC, Load Balancers, Cloud Map namespace, IAM Roles, and ECS Clusters. *(Must be run first)*
2.  **`database-pipeline`**: Builds the custom Postgres image and pushes to ECR.
3.  **`cache-pipeline`**: Builds the optimized Redis image and pushes to ECR.
4.  **`backend-pipeline`**: Builds the Node API, pushes to ECR, and executes a zero-downtime rolling update via `aws ecs update-service`.
5.  **`frontend-pipeline`**: Builds the React/Nginx static bundle, pushes to ECR, and deploys to the public ALB.

---
*Maintained by [@Ajinkya-Pame](https://github.com/Ajinkya-Pame)*