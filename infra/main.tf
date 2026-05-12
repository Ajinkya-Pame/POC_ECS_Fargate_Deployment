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

# ========== IAM Roles (Cluster + Node — no OIDC dependency) ==========
module "iam" {
  source       = "./modules/iam"
  CLUSTER_NAME = var.cluster_name
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

# ========== EKS Cluster (depends on IAM, no circular ref) ==========
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
  LOG_RETENTION_DAYS = var.retention_days
}

# ========== IRSA Roles (depend on EKS OIDC — created AFTER cluster) ==========

# --- ALB Controller IRSA ---
data "aws_iam_policy_document" "alb_controller_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks_cluster.oidc_provider_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks_cluster.oidc_provider_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [module.eks_cluster.oidc_provider_arn]
    }
  }
}

resource "aws_iam_role" "alb_controller_role" {
  name               = "${var.cluster_name}-alb-controller-role"
  assume_role_policy = data.aws_iam_policy_document.alb_controller_assume.json
  tags               = { Name = "${var.cluster_name}-alb-controller-role" }
}

resource "aws_iam_policy" "alb_controller_policy" {
  name   = "${var.cluster_name}-alb-controller-policy"
  policy = file("${path.module}/modules/iam/alb-controller-policy.json")
  tags   = { Name = "${var.cluster_name}-alb-controller-policy" }
}

resource "aws_iam_role_policy_attachment" "alb_controller_attach" {
  policy_arn = aws_iam_policy.alb_controller_policy.arn
  role       = aws_iam_role.alb_controller_role.name
}

# --- EBS CSI Driver IRSA ---
data "aws_iam_policy_document" "ebs_csi_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks_cluster.oidc_provider_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks_cluster.oidc_provider_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [module.eks_cluster.oidc_provider_arn]
    }
  }
}

resource "aws_iam_role" "ebs_csi_role" {
  name               = "${var.cluster_name}-ebs-csi-role"
  assume_role_policy = data.aws_iam_policy_document.ebs_csi_assume.json
  tags               = { Name = "${var.cluster_name}-ebs-csi-role" }
}

resource "aws_iam_role_policy_attachment" "ebs_csi_attach" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_role.name
}

# --- EBS CSI Addon (depends on IRSA role) ---
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = module.eks_cluster.cluster_name
  addon_name               = "aws-ebs-csi-driver"
  service_account_role_arn = aws_iam_role.ebs_csi_role.arn
}
