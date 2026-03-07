# 1. Logical Cluster
resource "aws_ecs_cluster" "memecricket" {
  name = var.CLUSTER_NAME
}

# Capacity Provider
resource "aws_ecs_cluster_capacity_providers" "fargate" {
  cluster_name       = aws_ecs_cluster.memecricket.name
  capacity_providers = [var.REQ_COMPATIBILITY]
  default_capacity_provider_strategy {
    capacity_provider = var.REQ_COMPATIBILITY
    base              = var.FARGATE_BASE
    weight            = var.FARGATE_WEIGHT
  }
}
