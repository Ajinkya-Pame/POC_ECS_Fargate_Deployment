# ========== Network ==========
module "network" {
  source               = "./modules/network"
  CIDR_BLOCK           = var.cidr_block
  AZS                  = var.azs
  GLOBAL_CIDR          = var.global_cidr
  VPC_NAME             = var.vpc_name
  IGW_NAME             = var.igw_name
  PUBLIC_SUBNET_NAME   = var.public_subnet_name
  PRIVATE_SUBNET_NAME  = var.private_subnet_name
  PUBLIC_RT_NAME       = var.public_rt_name
  PRIVATE_RT_NAME      = var.private_rt_name
  NAT_EIP_NAME         = var.nat_eip_name
  NAT_GW_NAME          = var.nat_gw_name
  subnet_count         = var.subnet_count
  ENABLE_DNS_HOSTNAMES = var.enable_dns_hostnames
  ENABLE_DNS_SUPPORT   = var.enable_dns_support
  CLUSTER_NAME         = var.cluster_name
}

# ========== Security Groups ==========
module "security" {
  source       = "./modules/security"
  VPC_ID       = module.network.vpc_id
  GLOBAL_CIDR  = var.global_cidr
  CLUSTER_NAME = var.cluster_name
}

# ========== IAM Roles ==========
module "iam" {
  source            = "./modules/iam"
  CLUSTER_NAME      = var.cluster_name
  OIDC_PROVIDER_URL = module.eks_cluster.oidc_provider_url
  OIDC_PROVIDER_ARN = module.eks_cluster.oidc_provider_arn
}

# ========== ECR Repositories ==========
module "ecr" {
  source       = "./modules/ecr"
  SERVICES     = var.services
  ENC_TYPE     = var.enc_type
  MUTABILITY   = var.mutability
  APP_NAME     = var.app_name
  FORCE_DELETE = var.force_delete_ecr
  ENVIRONMENT  = var.environment
  SCAN_ON_PUSH = var.scan_on_push
}

# ========== EKS Cluster ==========
module "eks_cluster" {
  source             = "./modules/eks_cluster"
  CLUSTER_NAME       = var.cluster_name
  K8S_VERSION        = var.k8s_version
  CLUSTER_ROLE_ARN   = module.iam.eks_cluster_role_arn
  NODE_ROLE_ARN      = module.iam.eks_node_role_arn
  CLUSTER_SG_ID      = module.security.eks_cluster_sg_id
  PUBLIC_SUBNET_IDS  = module.network.public_subnet_ids
  PRIVATE_SUBNET_IDS = module.network.private_subnet_ids
  NODE_INSTANCE_TYPE = var.node_instance_type
  NODE_DESIRED_SIZE  = var.node_desired_size
  NODE_MAX_SIZE      = var.node_max_size
  NODE_MIN_SIZE      = var.node_min_size
  EBS_CSI_ROLE_ARN   = module.iam.ebs_csi_role_arn
  LOG_RETENTION_DAYS = var.retention_days
}
