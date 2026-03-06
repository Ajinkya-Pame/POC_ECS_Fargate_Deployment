output "alb_sg_id" {
  value = aws_security_group.alb_sg.id
}

output "frontend_sg_id" {
  value = aws_security_group.frontend_sg.id
}

output "backend_sg_id" {
  value = aws_security_group.backend_sg.id
}

output "db_sg_id" {
  value = aws_security_group.db_sg.id
}

output "cache_sg_id" {
  value = aws_security_group.cache_sg.id
}

