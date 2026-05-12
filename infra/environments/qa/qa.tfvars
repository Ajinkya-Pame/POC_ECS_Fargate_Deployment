# ========== Environment ==========
environment = "qa"
project     = "memecricket"
owner       = "MemeCricket Company"
cost_center = "CloudEthiX-POC"

# ========== Networking ==========
cidr_block           = "10.1.0.0/16"
azs                  = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
global_cidr          = "0.0.0.0/0"
region               = "ap-south-1"
subnet_count         = 3
enable_dns_hostnames = true
enable_dns_support   = true

# ========== Resource Name Tags ==========
vpc_name            = "qa-custom-vpc"
igw_name            = "qa-custom-igw"
public_subnet_name  = "qa-public-subnet"
private_subnet_name = "qa-private-subnet"
public_rt_name      = "qa-public-rt"
private_rt_name     = "qa-private-rt"
nat_eip_name        = "qa-nat-eip"
nat_gw_name         = "qa-nat-gateway"

# ========== EKS Cluster ==========
cluster_name       = "memecricket-qa-cluster"
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
