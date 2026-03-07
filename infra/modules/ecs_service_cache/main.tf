resource "aws_cloudwatch_log_group" "cache_log_group" {
  name              = "/${var.ECS_PREFIX}/${var.SERVICES["cache"]}"
  retention_in_days = var.RETENTION_DAYS
}

resource "aws_ecs_task_definition" "cache_task" {
  family                   = "${var.SERVICES["cache"]}-${var.TASK}"
  network_mode             = var.NETWORK_MODE
  requires_compatibilities = [var.REQ_COMPATIBILITY]
  cpu                      = var.CPU
  memory                   = var.MEMORY
  execution_role_arn       = var.EXECUTION_ROLE_ARN

  container_definitions = jsonencode([
    {
      name      = "${var.SERVICES["cache"]}-${var.CONTAINER}"
      image     = var.IMAGE_URL
      essential = true
      portMappings = [
        {
          containerPort = var.CACHE_PORT
          hostPort      = var.CACHE_PORT
          protocol      = var.TCP_PROTOCOL
        }
      ]
      logConfiguration = {
        logDriver = var.LOG_DRIVER
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cache_log_group.name
          "awslogs-region"        = var.REGION
          "awslogs-stream-prefix" = var.ECS_PREFIX
        }
      }
    }
  ])
}

resource "aws_ecs_service" "cache_service" {
  name            = "${var.SERVICES["cache"]}-${var.SERVICE}"
  cluster         = var.CLUSTER_ID
  task_definition = aws_ecs_task_definition.cache_task.arn
  launch_type     = var.REQ_COMPATIBILITY
  desired_count   = var.DESIRED_COUNT

  network_configuration {
    subnets          = var.PRIVATE_SUBNETS
    security_groups  = [var.CACHE_SG_ID]
    assign_public_ip = false
  }

  health_check_grace_period_seconds = 30

  # This is the Cloud Map integration!
  service_registries {
    registry_arn = var.CACHE_SERVICE_DISCOVERY_ARN
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}
