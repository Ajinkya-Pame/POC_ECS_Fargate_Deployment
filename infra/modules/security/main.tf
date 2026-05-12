# ========== EKS Cluster Security Group ==========
resource "aws_security_group" "eks_cluster_sg" {
  name        = "${var.CLUSTER_NAME}-cluster-sg"
  description = "Security group for EKS cluster control plane"
  vpc_id      = var.VPC_ID

  tags = { Name = "${var.CLUSTER_NAME}-cluster-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "cluster_ingress_https" {
  security_group_id            = aws_security_group.eks_cluster_sg.id
  referenced_security_group_id = aws_security_group.eks_node_sg.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "Allow worker nodes to communicate with cluster API"
}

resource "aws_vpc_security_group_egress_rule" "cluster_egress_all" {
  security_group_id = aws_security_group.eks_cluster_sg.id
  cidr_ipv4         = var.GLOBAL_CIDR
  ip_protocol       = "-1"
  description       = "Allow all outbound traffic"
}

# ========== EKS Node Group Security Group ==========
resource "aws_security_group" "eks_node_sg" {
  name        = "${var.CLUSTER_NAME}-node-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = var.VPC_ID

  tags = {
    Name                                        = "${var.CLUSTER_NAME}-node-sg"
    "kubernetes.io/cluster/${var.CLUSTER_NAME}"  = "owned"
  }
}

# Nodes can communicate with each other
resource "aws_vpc_security_group_ingress_rule" "node_to_node" {
  security_group_id            = aws_security_group.eks_node_sg.id
  referenced_security_group_id = aws_security_group.eks_node_sg.id
  ip_protocol                  = "-1"
  description                  = "Allow nodes to communicate with each other"
}

# Cluster control plane can communicate with nodes
resource "aws_vpc_security_group_ingress_rule" "cluster_to_node" {
  security_group_id            = aws_security_group.eks_node_sg.id
  referenced_security_group_id = aws_security_group.eks_cluster_sg.id
  from_port                    = 1025
  to_port                      = 65535
  ip_protocol                  = "tcp"
  description                  = "Allow cluster control plane to communicate with nodes"
}

# Allow cluster API to reach nodes on 443 (for webhooks)
resource "aws_vpc_security_group_ingress_rule" "cluster_to_node_https" {
  security_group_id            = aws_security_group.eks_node_sg.id
  referenced_security_group_id = aws_security_group.eks_cluster_sg.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  description                  = "Allow cluster API to nodes for webhooks"
}

# Nodes can access the internet
resource "aws_vpc_security_group_egress_rule" "node_egress_all" {
  security_group_id = aws_security_group.eks_node_sg.id
  cidr_ipv4         = var.GLOBAL_CIDR
  ip_protocol       = "-1"
  description       = "Allow all outbound traffic"
}
