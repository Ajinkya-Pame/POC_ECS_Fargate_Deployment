resource "aws_security_group" "alb_sg" {
  name        = "alb-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = var.VPC_ID

  ingress {
    description = "HTTP from everywhere"
    from_port   = var.CONTAINER_PORT
    to_port     = var.CONTAINER_PORT
    protocol    = "tcp"
    cidr_blocks = [var.GLOBAL_CIDR] # "0.0.0.0/0"
  }
  ingress {
    description = "HTTPS from everywhere"
    from_port   = var.HTTPS_PORT
    to_port     = var.HTTPS_PORT
    protocol    = "tcp"
    cidr_blocks = [var.GLOBAL_CIDR] # "0.0.0.0/0"
  }
  egress {
    from_port   = var.ZERO_PORT
    to_port     = var.ZERO_PORT
    protocol    = var.ALL_PROTOCOL
    cidr_blocks = [var.GLOBAL_CIDR]
  }

  tags = { Name = "${var.ENVIRONMENT}-${var.ALB_SG_NAME}" }
}

resource "aws_security_group" "frontend_sg" {
  name        = "frontend-sg"
  description = "Allow traffic only from ALB"
  vpc_id      = var.VPC_ID

  ingress {
    description     = "Allow traffic from ALB SG only"
    from_port       = var.CONTAINER_PORT
    to_port         = var.CONTAINER_PORT
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = var.ZERO_PORT
    to_port     = var.ZERO_PORT
    protocol    = var.ALL_PROTOCOL
    cidr_blocks = [var.GLOBAL_CIDR]
  }

  tags = { Name = "${var.ENVIRONMENT}-${var.FRONTEND_SG_NAME}" }
}

resource aws_security_group "backend_sg" {
  name        = "backend-sg"
  description = "Allow traffic only from fecs-task-sg"
  vpc_id      = var.VPC_ID

  ingress {
    description     = "Allow traffic from fecs-task-sg only"
    from_port       = var.BACKEND_PORT
    to_port         = var.BACKEND_PORT
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_sg.id]
  }

  egress {
    from_port   = var.ZERO_PORT
    to_port     = var.ZERO_PORT
    protocol    = var.ALL_PROTOCOL
    cidr_blocks = [var.GLOBAL_CIDR]
  }

  tags = { Name = "${var.ENVIRONMENT}-${var.BACKEND_SG_NAME}" }
}

resource "aws_security_group" "db_sg" {
  name        = "db-sg"
  description = "Allow traffic only from backend-sg"
  vpc_id      = var.VPC_ID

  ingress {
    description     = "Allow traffic from backend-sg only"
    from_port       = var.DB_PORT
    to_port         = var.DB_PORT
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }

  egress {
    from_port   = var.ZERO_PORT
    to_port     = var.ZERO_PORT
    protocol    = var.ALL_PROTOCOL
    cidr_blocks = [var.GLOBAL_CIDR]
  }

  tags = { Name = "${var.ENVIRONMENT}-${var.DB_SG_NAME}" }
}

resource "aws_security_group" "cache_sg" {
  name        = "cache-sg"
  description = "Allow traffic only from backend-sg"
  vpc_id      = var.VPC_ID

  ingress {
    description     = "Allow traffic from backend-sg only"
    from_port       = var.CACHE_PORT
    to_port         = var.CACHE_PORT
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }

  egress {
    from_port   = var.ZERO_PORT
    to_port     = var.ZERO_PORT
    protocol    = var.ALL_PROTOCOL
    cidr_blocks = [var.GLOBAL_CIDR]
  }

  tags = { Name = "${var.ENVIRONMENT}-${var.CACHE_SG_NAME}" }
}


