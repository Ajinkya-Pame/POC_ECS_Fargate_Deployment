# custom vpc
resource "aws_vpc" "custom_vpc" {
  cidr_block           = var.CIDR_BLOCK
  enable_dns_hostnames = var.ENABLE_DNS_HOSTNAMES
  enable_dns_support   = var.ENABLE_DNS_SUPPORT

  tags = {
    Name = "${var.VPC_NAME}"
  }
}

# internet gateway
resource "aws_internet_gateway" "custom_igw" {
  vpc_id = aws_vpc.custom_vpc.id

  tags = {
    Name = "${var.IGW_NAME}"
  }
}

# public subnet
resource "aws_subnet" "publicsubnet" {
  vpc_id            = aws_vpc.custom_vpc.id
  count             = var.subnet_count
  cidr_block        = cidrsubnet(aws_vpc.custom_vpc.cidr_block, 8, count.index)
  availability_zone = var.AZS[count.index]
  tags = {
    Name = "${var.PUBLIC_SUBNET_NAME}-${count.index}"
  }
}

# private subnet
resource "aws_subnet" "privatesubnet" {
  vpc_id            = aws_vpc.custom_vpc.id
  count             = var.subnet_count
  cidr_block        = cidrsubnet(aws_vpc.custom_vpc.cidr_block, 8, count.index + var.subnet_count)
  availability_zone = var.AZS[count.index]
  tags = {
    Name = "${var.PRIVATE_SUBNET_NAME}-${count.index}"
  }
}

# public Route table
resource "aws_route_table" "public-rt" {
  vpc_id = aws_vpc.custom_vpc.id

  route {
    cidr_block = var.GLOBAL_CIDR
    gateway_id = aws_internet_gateway.custom_igw.id
  }

  tags = {
    Name = "${var.PUBLIC_RT_NAME}"
  }
}

# private Route table
resource "aws_route_table" "private-rt" {
  vpc_id = aws_vpc.custom_vpc.id
  route {
    cidr_block     = var.GLOBAL_CIDR
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }
  tags = {
    Name = "${var.PRIVATE_RT_NAME}"
  }
}

# main RT association
resource "aws_main_route_table_association" "main-rt-asso" {
  vpc_id         = aws_vpc.custom_vpc.id
  route_table_id = aws_route_table.public-rt.id
}

# public subnet association
resource "aws_route_table_association" "publicsubnet_association" {
  count          = var.subnet_count
  subnet_id      = aws_subnet.publicsubnet[count.index].id
  route_table_id = aws_route_table.public-rt.id
}

# private subnet association
resource "aws_route_table_association" "privatesubnet_association" {
  count          = var.subnet_count
  subnet_id      = aws_subnet.privatesubnet[count.index].id
  route_table_id = aws_route_table.private-rt.id
}

# 1. Elastic IP for the NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags   = { Name = "${var.NAT_EIP_NAME}" }
}

# 2. NAT Gateway (Placed in the single Public Subnet)
resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.publicsubnet[0].id

  tags       = { Name = "${var.NAT_GW_NAME}" }
  depends_on = [aws_internet_gateway.custom_igw]
}


