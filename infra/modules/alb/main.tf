# The Application Load Balancer
resource "aws_lb" "main_alb" {
  name               = var.ALB_NAME
  internal           = var.INTERNAL_TYPE
  load_balancer_type = var.ALB_TYPE
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.DELETE_PROTECTION

  tags = { Name = "${var.ENVIRONMENT}-${var.ALB_NAME}" }
}

# Target Group
resource "aws_lb_target_group" "ecs_tg" {
  name        = var.ALB_TG_NAME
  port        = var.CONTAINER_PORT
  protocol    = var.HTTP_PROTOCOL
  vpc_id      = var.VPC_ID
  target_type = var.TARGET_TYPE

  health_check {
    path                = var.HC_PATH
    interval            = var.HC_INTERVAL
    timeout             = var.HC_TIMEOUT
    healthy_threshold   = var.THRESHOLD
    unhealthy_threshold = var.THRESHOLD
  }

  tags = { Name = "${var.ENVIRONMENT}-${var.ALB_TG_NAME}" }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = var.CONTAINER_PORT
  protocol          = var.HTTP_PROTOCOL

  default_action {
    type = var.REDIRECT
    redirect {
      port        = var.HTTPS_PORT
      protocol    = var.HTTPS_PROTOCOL
      status_code = var.PERM_STATUS_CODE
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = var.HTTPS_PORT
  protocol          = var.HTTPS_PROTOCOL
  ssl_policy        = var.POLICY_TYPE

  # Paste the ARN you copied from the ACM console here
  certificate_arn = var.CERT_ARN

  default_action {
    type             = var.ALB_DEFAULT_ACTION
    target_group_arn = aws_lb_target_group.ecs_tg.arn
  }
}
