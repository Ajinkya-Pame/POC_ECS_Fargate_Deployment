# ========== VPC ==========
resource "aws_vpc" "custom_vpc" {
  cidr_block           = var.CIDR_BLOCK
  enable_dns_hostnames = var.ENABLE_DNS_HOSTNAMES
  enable_dns_support   = var.ENABLE_DNS_SUPPORT

  tags = {
    Name = var.VPC_NAME
  }
}

# ========== Internet Gateway ==========
resource "aws_internet_gateway" "custom_igw" {
  vpc_id = aws_vpc.custom_vpc.id

  tags = {
    Name = var.IGW_NAME
  }
}

# ========== Public Subnets ==========
resource "aws_subnet" "publicsubnet" {
  vpc_id                  = aws_vpc.custom_vpc.id
  count                   = var.subnet_count
  cidr_block              = cidrsubnet(aws_vpc.custom_vpc.cidr_block, 8, count.index)
  availability_zone       = var.AZS[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "${var.PUBLIC_SUBNET_NAME}-${count.index}"
    "kubernetes.io/role/elb"                     = "1"
    "kubernetes.io/cluster/${var.CLUSTER_NAME}"  = "shared"
  }
}

# ========== Private Subnets ==========
resource "aws_subnet" "privatesubnet" {
  vpc_id            = aws_vpc.custom_vpc.id
  count             = var.subnet_count
  cidr_block        = cidrsubnet(aws_vpc.custom_vpc.cidr_block, 8, count.index + var.subnet_count)
  availability_zone = var.AZS[count.index]

  tags = {
    Name                                        = "${var.PRIVATE_SUBNET_NAME}-${count.index}"
    "kubernetes.io/role/internal-elb"            = "1"
    "kubernetes.io/cluster/${var.CLUSTER_NAME}"  = "shared"
  }
}

# ========== Public Route Table ==========
resource "aws_route_table" "public-rt" {
  vpc_id = aws_vpc.custom_vpc.id

  route {
    cidr_block = var.GLOBAL_CIDR
    gateway_id = aws_internet_gateway.custom_igw.id
  }

  tags = {
    Name = var.PUBLIC_RT_NAME
  }
}

# ========== Private Route Table ==========
resource "aws_route_table" "private-rt" {
  vpc_id = aws_vpc.custom_vpc.id

  route {
    cidr_block     = var.GLOBAL_CIDR
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }

  tags = {
    Name = var.PRIVATE_RT_NAME
  }
}

# ========== Route Table Associations ==========
resource "aws_main_route_table_association" "main-rt-asso" {
  vpc_id         = aws_vpc.custom_vpc.id
  route_table_id = aws_route_table.public-rt.id
}

resource "aws_route_table_association" "publicsubnet_association" {
  count          = var.subnet_count
  subnet_id      = aws_subnet.publicsubnet[count.index].id
  route_table_id = aws_route_table.public-rt.id
}

resource "aws_route_table_association" "privatesubnet_association" {
  count          = var.subnet_count
  subnet_id      = aws_subnet.privatesubnet[count.index].id
  route_table_id = aws_route_table.private-rt.id
}

# ========== NAT Gateway ==========
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags   = { Name = var.NAT_EIP_NAME }
}

resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.publicsubnet[0].id

  tags       = { Name = var.NAT_GW_NAME }
  depends_on = [aws_internet_gateway.custom_igw]
}
