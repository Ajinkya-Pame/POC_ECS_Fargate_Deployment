resource "aws_security_group" "alb_sg" {
  name   = var.ALB_SG_NAME
  vpc_id = var.VPC_ID

  ingress {
    from_port   = var.CONTAINER_PORT
    to_port     = var.CONTAINER_PORT
    protocol    = var.TCP_PROTOCOL
    cidr_blocks = [var.GLOBAL_CIDR] # "0.0.0.0/0"
  }
  ingress {
    from_port   = var.HTTPS_PORT
    to_port     = var.HTTPS_PORT
    protocol    = var.TCP_PROTOCOL
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
  name   = var.FRONTEND_SG_NAME
  vpc_id = var.VPC_ID

  ingress {
    from_port       = var.CONTAINER_PORT
    to_port         = var.CONTAINER_PORT
    protocol        = var.TCP_PROTOCOL
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

resource "aws_security_group" "backend_sg" {
  name   = var.BACKEND_SG_NAME
  vpc_id = var.VPC_ID

  ingress {
    from_port       = var.BACKEND_PORT
    to_port         = var.BACKEND_PORT
    protocol        = var.TCP_PROTOCOL
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
  name   = var.DB_SG_NAME
  vpc_id = var.VPC_ID

  ingress {
    from_port       = var.DB_PORT
    to_port         = var.DB_PORT
    protocol        = var.TCP_PROTOCOL
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
  name   = var.CACHE_SG_NAME
  vpc_id = var.VPC_ID

  ingress {
    from_port       = var.CACHE_PORT
    to_port         = var.CACHE_PORT
    protocol        = var.TCP_PROTOCOL
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


