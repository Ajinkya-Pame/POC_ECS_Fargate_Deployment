# 1. Logical Cluster
resource "aws_ecs_cluster" "memecricket" {
  name = var.CLUSTER_NAME
}

# Capacity Provider
resource "aws_ecs_cluster_capacity_providers" "fargate" {
  cluster_name = aws_ecs_cluster.memecricket.name
  capacity_providers = ["FARGATE"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    base                = 1
    weight            = 100
  }
}