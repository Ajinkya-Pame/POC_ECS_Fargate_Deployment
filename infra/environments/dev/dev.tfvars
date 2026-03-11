# ========== Environment ==========
environment = "dev"
project     = "memecricket"
owner       = "MemeCricket Company"
cost_center = "CloudEthiX-POC"

# ========== Networking ==========
cidr_block           = "10.0.0.0/16"
azs                  = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
global_cidr          = "0.0.0.0/0"
region               = "ap-south-1"
subnet_count         = 3
enable_dns_hostnames = true
enable_dns_support   = true

# ========== Resource Name Tags ==========
vpc_name            = "dev-custom-vpc"
igw_name            = "dev-custom-igw"
public_subnet_name  = "dev-public-subnet"
private_subnet_name = "dev-private-subnet"
public_rt_name      = "dev-public-rt"
private_rt_name     = "dev-private-rt"
nat_eip_name        = "dev-nat-eip"
nat_gw_name         = "dev-nat-gateway"
alb_sg_name         = "dev-alb-sg"
frontend_sg_name    = "dev-frontend-sg"
backend_sg_name     = "dev-backend-sg"
db_sg_name          = "dev-db-sg"
cache_sg_name       = "dev-cache-sg"
exec_role_name      = "dev-ecs-task-execution-role"
all_protocol        = "-1"

# ========== Ports ==========
container_port = 80
backend_port   = 3001
db_port        = 5432
cache_port     = 6379
https_port     = 443
zero_port      = 0

# ========== ECS Cluster ==========
services = {
  frontend = "frontend"
  backend  = "backend"
  db       = "db"
  cache    = "cache"
}
CLUSTER_NAME                               = "memecricket-dev-cluster"
frontend_count                             = 2
backend_count                              = 1
db_count                                   = 1
cache_count                                = 1
cpu                                        = "256"
memory                                     = "512"
db_cpu                                     = "512"
db_memory                                  = "1024"
network_mode                               = "awsvpc"
log_driver                                 = "awslogs"
retention_days                             = 7
ecs_prefix                                 = "ecs"
req_compatibility                          = "FARGATE"
tcp_protocol                               = "tcp"
service                                    = "service"
container                                  = "container"
task                                       = "task"
fargate_base                               = 1
fargate_weight                             = 100
health_check_grace_period_seconds_frontend = 60
health_check_grace_period_seconds_backend  = 60
health_check_grace_period_seconds_db       = 60
health_check_grace_period_seconds_cache    = 60
assign_public_ip                           = false
essential_value                            = true

# ========== ECR ==========
app_name         = "memecricket"
mutability       = "MUTABLE"
enc_type         = "KMS"
force_delete_ecr = true
scan_on_push     = true

# ========== Cloud Map ==========
namespace       = "dev.cricket.local"
ttl             = 60
dns_description = "Private namespace for ECS microservices"
routing_policy  = "MULTIVALUE"
dns_record      = "A"

# ========== ALB ==========
alb_name           = "dev-main-alb"
alb_tg_name        = "dev-main-target-group"
alb_type           = "application"
alb_default_action = "forward"
http_protocol      = "HTTP"
target_type        = "ip"
hc_interval        = 30
hc_timeout         = 5
threshold          = 2
hc_path            = "/"
https_protocol     = "HTTPS"
policy_type        = "ELBSecurityPolicy-2016-08"
redirect           = "redirect"
perm_status_code   = "HTTP_301"
internal_type      = false
delete_protection  = false

# ========== Database (Non-Sensitive) ==========
POSTGRES_DB   = "cricket_db"
POSTGRES_USER = "cricket"
