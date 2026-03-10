module "network" {
  source              = "./modules/network"
  CIDR_BLOCK          = var.cidr_block
  AZS                 = var.azs
  GLOBAL_CIDR         = var.global_cidr
  ENVIRONMENT         = var.environment
  VPC_NAME            = var.vpc_name
  IGW_NAME            = var.igw_name
  PUBLIC_SUBNET_NAME  = var.public_subnet_name
  PRIVATE_SUBNET_NAME = var.private_subnet_name
  PUBLIC_RT_NAME      = var.public_rt_name
  PRIVATE_RT_NAME     = var.private_rt_name
  NAT_EIP_NAME        = var.nat_eip_name
  NAT_GW_NAME         = var.nat_gw_name
}

module "security" {
  source           = "./modules/security"
  VPC_ID           = module.network.vpc_id
  GLOBAL_CIDR      = var.global_cidr
  CONTAINER_PORT   = var.container_port
  BACKEND_PORT     = var.backend_port
  DB_PORT          = var.db_port
  CACHE_PORT       = var.cache_port
  HTTPS_PORT       = var.https_port
  ZERO_PORT        = var.zero_port
  ENVIRONMENT      = var.environment
  ALB_SG_NAME      = var.alb_sg_name
  FRONTEND_SG_NAME = var.frontend_sg_name
  BACKEND_SG_NAME  = var.backend_sg_name
  DB_SG_NAME       = var.db_sg_name
  CACHE_SG_NAME    = var.cache_sg_name
  ALL_PROTOCOL     = var.all_protocol
}

module "alb" {
  source             = "./modules/alb"
  VPC_ID             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  alb_sg_id          = module.security.alb_sg_id
  ALB_TYPE           = var.alb_type
  ALB_TG_NAME        = var.alb_tg_name
  CONTAINER_PORT     = var.container_port
  HTTP_PROTOCOL      = var.http_protocol
  TARGET_TYPE        = var.target_type
  HC_INTERVAL        = var.hc_interval
  HC_TIMEOUT         = var.hc_timeout
  THRESHOLD          = var.threshold
  ALB_DEFAULT_ACTION = var.alb_default_action
  ALB_NAME           = var.alb_name
  HC_PATH            = var.hc_path
  ENVIRONMENT        = var.environment
  CERT_ARN           = var.cert_arn
  HTTPS_PORT         = var.https_port
  HTTPS_PROTOCOL     = var.https_protocol
  POLICY_TYPE        = var.policy_type
}

module "iam" {
  source         = "./modules/iam"
  EXEC_ROLE_NAME = var.exec_role_name
  ENVIRONMENT    = var.environment
}



module "cloud_map" {
  source          = "./modules/cloud_map"
  VPC_ID          = module.network.vpc_id
  SERVICES        = var.services
  NAMESPACE       = var.namespace
  TTL             = var.ttl
  DNS_DESCRIPTION = var.dns_description
  DNS_RECORD      = var.dns_record
  ROUTING_POLICY  = var.routing_policy
}

module "ecr" {
  source       = "./modules/ecr"
  SERVICES     = var.services
  ENC_TYPE     = var.enc_type
  MUTABILITY   = var.mutability
  APP_NAME     = var.app_name
  FORCE_DELETE = var.force_delete_ecr
  ENVIRONMENT  = var.environment
}

module "ecs_cluster" {
  source            = "./modules/ecs_cluster"
  CLUSTER_NAME      = var.CLUSTER_NAME
  REQ_COMPATIBILITY = var.req_compatibility
  FARGATE_BASE      = var.fargate_base
  FARGATE_WEIGHT    = var.fargate_weight
}

module "ecs_service_frontend" {
  source                         = "./modules/ecs_service_frontend"
  CLUSTER_ID                     = module.ecs_cluster.cluster_id
  IMAGE_URL                      = module.ecr.repository_urls["frontend"]
  CONTAINER_PORT                 = var.container_port
  PRIVATE_SUBNETS                = module.network.private_subnet_ids
  FRONTEND_SG_ID                 = module.security.frontend_sg_id
  TARGET_GROUP_ARN               = module.alb.target_group_arn
  FRONTEND_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["frontend"]
  LOG_DRIVER                     = var.log_driver
  REGION                         = var.region
  CPU                            = var.cpu
  MEMORY                         = var.memory
  EXECUTION_ROLE_ARN             = module.iam.task_execution_role_arn
  NETWORK_MODE                   = var.network_mode
  RETENTION_DAYS                 = var.retention_days
  DESIRED_COUNT                  = var.frontend_count
  ECS_PREFIX                     = var.ecs_prefix
  REQ_COMPATIBILITY              = var.req_compatibility
  TCP_PROTOCOL                   = var.tcp_protocol
  CONTAINER                      = var.container
  SERVICE                        = var.service
  TASK                           = var.task
  SERVICE_NAME                   = var.services["frontend"]
}

module "ecs_service_backend" {
  source                        = "./modules/ecs_service_backend"
  CLUSTER_ID                    = module.ecs_cluster.cluster_id
  IMAGE_URL                     = module.ecr.repository_urls["backend"]
  BACKEND_PORT                  = var.backend_port
  PRIVATE_SUBNETS               = module.network.private_subnet_ids
  BACKEND_SG_ID                 = module.security.backend_sg_id
  BACKEND_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["backend"]
  LOG_DRIVER                    = var.log_driver
  REGION                        = var.region
  CPU                           = var.cpu
  MEMORY                        = var.memory
  EXECUTION_ROLE_ARN            = module.iam.task_execution_role_arn
  NETWORK_MODE                  = var.network_mode
  RETENTION_DAYS                = var.retention_days
  DATABASE_URL                  = var.DATABASE_URL
  REDIS_URL                     = var.REDIS_URL
  ADMIN_PASSWORD                = var.ADMIN_PASSWORD
  DESIRED_COUNT                 = var.backend_count
  ECS_PREFIX                    = var.ecs_prefix
  REQ_COMPATIBILITY             = var.req_compatibility
  TCP_PROTOCOL                  = var.tcp_protocol
  CONTAINER                     = var.container
  SERVICE                       = var.service
  TASK                          = var.task
  SERVICE_NAME                  = var.services["backend"]
}

module "ecs_service_database" {
  source                         = "./modules/ecs_service_database"
  CLUSTER_ID                     = module.ecs_cluster.cluster_id
  IMAGE_URL                      = module.ecr.repository_urls["db"]
  PRIVATE_SUBNETS                = module.network.private_subnet_ids
  DATABASE_SG_ID                 = module.security.db_sg_id
  DATABASE_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["db"]
  LOG_DRIVER                     = var.log_driver
  REGION                         = var.region
  EXECUTION_ROLE_ARN             = module.iam.task_execution_role_arn
  NETWORK_MODE                   = var.network_mode
  RETENTION_DAYS                 = var.retention_days
  POSTGRES_DB                    = var.POSTGRES_DB
  POSTGRES_USER                  = var.POSTGRES_USER
  POSTGRES_PASSWORD              = var.POSTGRES_PASSWORD
  DB_CPU                         = var.db_cpu
  DB_MEMORY                      = var.db_memory
  DB_PORT                        = var.db_port
  DESIRED_COUNT                  = var.db_count
  ECS_PREFIX                     = var.ecs_prefix
  REQ_COMPATIBILITY              = var.req_compatibility
  TCP_PROTOCOL                   = var.tcp_protocol
  CONTAINER                      = var.container
  SERVICE                        = var.service
  TASK                           = var.task
  SERVICE_NAME                   = var.services["db"]
}

module "ecs_service_cache" {
  source                      = "./modules/ecs_service_cache"
  CLUSTER_ID                  = module.ecs_cluster.cluster_id
  IMAGE_URL                   = module.ecr.repository_urls["cache"]
  CACHE_PORT                  = var.cache_port
  PRIVATE_SUBNETS             = module.network.private_subnet_ids
  CACHE_SG_ID                 = module.security.cache_sg_id
  CACHE_SERVICE_DISCOVERY_ARN = module.cloud_map.service_discovery_arns["cache"]
  LOG_DRIVER                  = var.log_driver
  REGION                      = var.region
  CPU                         = var.cpu
  MEMORY                      = var.memory
  EXECUTION_ROLE_ARN          = module.iam.task_execution_role_arn
  NETWORK_MODE                = var.network_mode
  RETENTION_DAYS              = var.retention_days
  DESIRED_COUNT               = var.cache_count
  ECS_PREFIX                  = var.ecs_prefix
  REQ_COMPATIBILITY           = var.req_compatibility
  TCP_PROTOCOL                = var.tcp_protocol
  CONTAINER                   = var.container
  SERVICE                     = var.service
  TASK                        = var.task
  SERVICE_NAME                = var.services["cache"]
}

