# ========== EKS Cluster IAM Role ==========
resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.CLUSTER_NAME}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = { Name = "${var.CLUSTER_NAME}-cluster-role" }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster_role.name
}

# ========== EKS Node Group IAM Role ==========
resource "aws_iam_role" "eks_node_role" {
  name = "${var.CLUSTER_NAME}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = { Name = "${var.CLUSTER_NAME}-node-role" }
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}

# ========== AWS Load Balancer Controller IRSA ==========
data "aws_iam_policy_document" "alb_controller_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(var.OIDC_PROVIDER_URL, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(var.OIDC_PROVIDER_URL, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [var.OIDC_PROVIDER_ARN]
    }
  }
}

resource "aws_iam_role" "alb_controller_role" {
  name               = "${var.CLUSTER_NAME}-alb-controller-role"
  assume_role_policy = data.aws_iam_policy_document.alb_controller_assume.json

  tags = { Name = "${var.CLUSTER_NAME}-alb-controller-role" }
}

resource "aws_iam_policy" "alb_controller_policy" {
  name   = "${var.CLUSTER_NAME}-alb-controller-policy"
  policy = file("${path.module}/alb-controller-policy.json")

  tags = { Name = "${var.CLUSTER_NAME}-alb-controller-policy" }
}

resource "aws_iam_role_policy_attachment" "alb_controller_attach" {
  policy_arn = aws_iam_policy.alb_controller_policy.arn
  role       = aws_iam_role.alb_controller_role.name
}

# ========== EBS CSI Driver IRSA ==========
data "aws_iam_policy_document" "ebs_csi_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(var.OIDC_PROVIDER_URL, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(var.OIDC_PROVIDER_URL, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [var.OIDC_PROVIDER_ARN]
    }
  }
}

resource "aws_iam_role" "ebs_csi_role" {
  name               = "${var.CLUSTER_NAME}-ebs-csi-role"
  assume_role_policy = data.aws_iam_policy_document.ebs_csi_assume.json

  tags = { Name = "${var.CLUSTER_NAME}-ebs-csi-role" }
}

resource "aws_iam_role_policy_attachment" "ebs_csi_attach" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_role.name
}
