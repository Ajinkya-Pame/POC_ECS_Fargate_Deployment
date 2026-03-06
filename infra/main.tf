module "network" {
  source      = "./modules/network"
  CIDR_BLOCK  = var.cidr_block
  AZS         = var.azs
  GLOBAL_CIDR = var.global_cidr
}

module "security" {
  source      = "./modules/security"
  VPC_ID      = module.network.vpc_id
  GLOBAL_CIDR = var.global_cidr
  CONTAINER_PORT = var.container_port
  BACKEND_PORT = var.backend_port
  DB_PORT = var.db_port
  CACHE_PORT = var.cache_port
  HTTPS_PORT = var.https_port
  ZERO_PORT = var.zero_port
}

module "alb" {
  source            = "./modules/alb"
  VPC_ID            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  alb_sg_id         = module.security.alb_sg_id
}

module "iam" {
  source = "./modules/iam"
}



module "cloud_map" {
  source = "./modules/cloud_map"
  VPC_ID = module.network.vpc_id
  SERVICES = var.services
  NAMESPACE = var.namespace
  TTL = var.ttl
}

module "ecr" {
  source = "./modules/ecr"
  SERVICES = var.services
}

module "ecs_cluster" {
  source = "./modules/ecs_cluster"
  CLUSTER_NAME = var.CLUSTER_NAME
}

module "ecs_service_frontend" {
  source = "./modules/ecs_service_frontend"
  CLUSTER_ID = module.ecs_cluster.cluster_id
  SERVICES = var.services
  IMAGE_URL = module.ecr.repository_urls["frontend"]
  CONTAINER_PORT = var.container_port
  PRIVATE_SUBNETS = module.network.private_subnet_ids
  FRONTEND_SG_ID = module.security.frontend_sg_id
  TARGET_GROUP_ARN = module.alb.target_group_arn
  FRONTEND_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["frontend"]
  LOG_DRIVER = var.log_driver
  REGION = var.region
  CPU = var.cpu
  MEMORY = var.memory
  EXECUTION_ROLE_ARN = module.iam.task_execution_role_arn
  NETWORK_MODE = var.network_mode
  RETENTION_DAYS = var.retention_days
  DESIRED_COUNT = var.desired_count
}

module "ecs_service_backend" {
  source = "./modules/ecs_service_backend"
  CLUSTER_ID = module.ecs_cluster.cluster_id
  SERVICES = var.services
  IMAGE_URL = module.ecr.repository_urls["backend"]
  BACKEND_PORT = var.backend_port
  PRIVATE_SUBNETS = module.network.private_subnet_ids
  BACKEND_SG_ID = module.security.backend_sg_id
  BACKEND_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["backend"]
  LOG_DRIVER = var.log_driver
  REGION = var.region
  CPU = var.cpu
  MEMORY = var.memory
  EXECUTION_ROLE_ARN = module.iam.task_execution_role_arn
  NETWORK_MODE = var.network_mode
  RETENTION_DAYS = var.retention_days
  DATABASE_URL = var.DATABASE_URL
  REDIS_URL = var.REDIS_URL
  ADMIN_PASSWORD = var.ADMIN_PASSWORD
  DESIRED_COUNT = var.desired_count
}

module "ecs_service_database" {
  source = "./modules/ecs_service_database"
  CLUSTER_ID = module.ecs_cluster.cluster_id
  SERVICES = var.services
  IMAGE_URL = module.ecr.repository_urls["database"]
  PRIVATE_SUBNETS = module.network.private_subnet_ids
  DATABASE_SG_ID = module.security.db_sg_id
  DATABASE_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["database"]
  LOG_DRIVER = var.log_driver
  REGION = var.region
  EXECUTION_ROLE_ARN = module.iam.task_execution_role_arn
  NETWORK_MODE = var.network_mode
  RETENTION_DAYS = var.retention_days
  POSTGRES_DB = var.POSTGRES_DB
  POSTGRES_USER = var.POSTGRES_USER
  POSTGRES_PASSWORD = var.POSTGRES_PASSWORD
  DB_CPU = var.db_cpu
  DB_MEMORY = var.db_memory
  DB_PORT = var.db_port
  DESIRED_COUNT = var.desired_count
}

module "ecs_service_cache" {
  source = "./modules/ecs_service_cache"
  CLUSTER_ID = module.ecs_cluster.cluster_id
  SERVICES = var.services
  IMAGE_URL = module.ecr.repository_urls["cache"]
  CACHE_PORT = var.cache_port
  PRIVATE_SUBNETS = module.network.private_subnet_ids
  CACHE_SG_ID = module.security.cache_sg_id
  CACHE_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["cache"]
  LOG_DRIVER = var.log_driver
  REGION = var.region
  CPU = var.cpu
  MEMORY = var.memory
  EXECUTION_ROLE_ARN = module.iam.task_execution_role_arn
  NETWORK_MODE = var.network_mode
  RETENTION_DAYS = var.retention_days
  DESIRED_COUNT = var.desired_count
}

