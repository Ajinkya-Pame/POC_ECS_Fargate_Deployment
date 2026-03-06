output "vpc_id" {
  value = aws_vpc.custom_vpc.id
}

output "public_subnet_ids" {
  value = aws_subnet.publicsubnet[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.privatesubnet[*].id
}
