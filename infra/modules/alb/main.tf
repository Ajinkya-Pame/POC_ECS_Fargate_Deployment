# The Application Load Balancer
resource "aws_lb" "main_alb" {
  name               = var.ALB_NAME
  internal           = false
  load_balancer_type = var.ALB_TYPE
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

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
    type             = var.ALB_DEFAULT_ACTION
    target_group_arn = aws_lb_target_group.ecs_tg.arn
  }
}
