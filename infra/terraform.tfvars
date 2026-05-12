# ========== Common Defaults ==========
# These are overridden by environment-specific .tfvars files
cidr_block     = "10.0.0.0/16"
azs            = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
global_cidr    = "0.0.0.0/0"
region         = "ap-south-1"
subnet_count   = 3

# ========== EKS ==========
cluster_name       = "memecricket-eks-cluster"
k8s_version        = "1.35"
node_instance_type = "t3.medium"
node_desired_size  = 2
node_max_size      = 3
node_min_size      = 1
retention_days     = 7

# ========== ECR ==========
services = {
  frontend = "frontend"
  backend  = "backend"
  db       = "db"
  cache    = "cache"
}
app_name         = "memecricket"
mutability       = "MUTABLE"
enc_type         = "KMS"
force_delete_ecr = true
scan_on_push     = true
