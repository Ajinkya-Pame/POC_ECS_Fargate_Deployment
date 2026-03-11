# ========== Environment ==========
environment = "prod"
project     = "memecricket"
owner       = "MemeCricket Company"
cost_center = "CloudEthiX-POC"

# ========== Networking ==========
cidr_block           = "10.2.0.0/16"
azs                  = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
global_cidr          = "0.0.0.0/0"
region               = "ap-south-1"
subnet_count         = 3
enable_dns_hostnames = true
enable_dns_support   = true

# ========== Resource Name Tags ==========
vpc_name            = "prod-custom-vpc"
igw_name            = "prod-custom-igw"
public_subnet_name  = "prod-public-subnet"
private_subnet_name = "prod-private-subnet"
public_rt_name      = "prod-public-rt"
private_rt_name     = "prod-private-rt"
nat_eip_name        = "prod-nat-eip"
nat_gw_name         = "prod-nat-gateway"
alb_sg_name         = "prod-alb-sg"
frontend_sg_name    = "prod-frontend-sg"
backend_sg_name     = "prod-backend-sg"
db_sg_name          = "prod-db-sg"
cache_sg_name       = "prod-cache-sg"
exec_role_name      = "prod-ecs-task-execution-role"
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
CLUSTER_NAME                               = "memecricket-prod-cluster"
frontend_count                             = 0
backend_count                              = 0
db_count                                   = 0
cache_count                                = 0
cpu                                        = "512"
memory                                     = "1024"
db_cpu                                     = "1024"
db_memory                                  = "2048"
network_mode                               = "awsvpc"
log_driver                                 = "awslogs"
retention_days                             = 30
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
mutability       = "IMMUTABLE"
enc_type         = "KMS"
force_delete_ecr = false
scan_on_push     = true

# ========== Cloud Map ==========
namespace       = "prod.cricket.local"
ttl             = 60
dns_description = "Private namespace for ECS microservices"
routing_policy  = "MULTIVALUE"
dns_record      = "A"

# ========== ALB ==========
alb_name           = "prod-main-alb"
alb_tg_name        = "prod-main-target-group"
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
