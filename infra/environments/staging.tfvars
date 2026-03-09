# ========== Environment ==========
environment = "staging"
project     = "memecricket"
owner       = "MemeCricket Company"
cost_center = "CloudEthiX-POC"

# ========== Networking ==========
cidr_block  = "10.1.0.0/16"
azs         = ["ap-south-1a", "ap-south-1b"]
global_cidr = "0.0.0.0/0"
region      = "ap-south-1"

# ========== Resource Name Tags ==========
vpc_name            = "custom-vpc"
igw_name            = "custom-igw"
public_subnet_name  = "public-subnet"
private_subnet_name = "private-subnet"
public_rt_name      = "public-rt"
private_rt_name     = "private-rt"
nat_eip_name        = "nat-eip"
nat_gw_name         = "nat-gateway"
alb_sg_name         = "alb-sg"
frontend_sg_name    = "frontend-sg"
backend_sg_name     = "backend-sg"
db_sg_name          = "db-sg"
cache_sg_name       = "cache-sg"
exec_role_name      = "ecs-task-execution-role"
all_protocol        = "-1"

# ========== Ports ==========
container_port = 80
backend_port   = 3001
db_port        = 5432
cache_port     = 6379
https_port     = 443
zero_port      = 0

# ========== ECS Cluster ==========
services          = ["frontend", "backend", "db", "cache"]
CLUSTER_NAME      = "memecricket-staging-cluster"
desired_count     = 1
cpu               = "256"
memory            = "512"
db_cpu            = "512"
db_memory         = "1024"
network_mode      = "awsvpc"
log_driver        = "awslogs"
retention_days    = 14
ecs_prefix        = "ecs"
req_compatibility = "FARGATE"
tcp_protocol      = "tcp"
service           = "service"
container         = "container"
task              = "task"
fargate_base      = 1
fargate_weight    = 100

# ========== ECR ==========
app_name         = "memecricket"
mutability       = "MUTABLE"
enc_type         = "KMS"
force_delete_ecr = true

# ========== Cloud Map ==========
namespace       = "staging.cricket.local"
ttl             = 60
dns_description = "Private namespace for ECS microservices"
routing_policy  = "MULTIVALUE"
dns_record      = "A"

# ========== ALB ==========
alb_name           = "main-alb"
alb_tg_name        = "main-target-group"
alb_type           = "application"
alb_default_action = "forward"
http_protocol      = "HTTP"
target_type        = "ip"
hc_interval        = 30
hc_timeout         = 5
threshold          = 2
hc_path            = "/"

# ========== Database (Non-Sensitive) ==========
POSTGRES_DB   = "cricket_db"
POSTGRES_USER = "cricket"
