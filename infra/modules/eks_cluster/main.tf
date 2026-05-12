# ========== EKS Cluster ==========
resource "aws_eks_cluster" "main" {
  name     = var.CLUSTER_NAME
  role_arn = var.CLUSTER_ROLE_ARN
  version  = var.K8S_VERSION

  vpc_config {
    subnet_ids              = concat(var.PUBLIC_SUBNET_IDS, var.PRIVATE_SUBNET_IDS)
    security_group_ids      = [var.CLUSTER_SG_ID]
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  tags = { Name = var.CLUSTER_NAME }

  depends_on = [var.CLUSTER_ROLE_ARN]
}

# ========== OIDC Provider (for IRSA) ==========
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = { Name = "${var.CLUSTER_NAME}-oidc" }
}

# ========== EKS Managed Node Group ==========
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.CLUSTER_NAME}-node-group"
  node_role_arn   = var.NODE_ROLE_ARN
  subnet_ids      = var.PRIVATE_SUBNET_IDS
  instance_types  = [var.NODE_INSTANCE_TYPE]
  capacity_type   = "ON_DEMAND"

  scaling_config {
    desired_size = var.NODE_DESIRED_SIZE
    max_size     = var.NODE_MAX_SIZE
    min_size     = var.NODE_MIN_SIZE
  }

  update_config {
    max_unavailable = 1
  }

  tags = { Name = "${var.CLUSTER_NAME}-node-group" }

  depends_on = [var.NODE_ROLE_ARN]
}

# ========== EKS Addons ==========
resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "coredns"

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "kube-proxy"

  depends_on = [aws_eks_node_group.main]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "aws-ebs-csi-driver"
  service_account_role_arn = var.EBS_CSI_ROLE_ARN

  depends_on = [aws_eks_node_group.main]
}

# ========== CloudWatch Log Group ==========
resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.CLUSTER_NAME}/cluster"
  retention_in_days = var.LOG_RETENTION_DAYS

  tags = { Name = "${var.CLUSTER_NAME}-logs" }
}
