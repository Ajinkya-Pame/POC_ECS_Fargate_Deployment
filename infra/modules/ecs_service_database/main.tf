resource "aws_cloudwatch_log_group" "database_log_group" {
  name              = "/${var.ECS_PREFIX}/${var.ENVIRONMENT}-${var.SERVICE_NAME}"
  retention_in_days = var.RETENTION_DAYS
}

resource "aws_ecs_task_definition" "database_task" {
  family                   = "${var.ENVIRONMENT}-${var.SERVICE_NAME}-${var.TASK}"
  network_mode             = var.NETWORK_MODE
  requires_compatibilities = [var.REQ_COMPATIBILITY]
  cpu                      = var.DB_CPU
  memory                   = var.DB_MEMORY
  execution_role_arn       = var.EXECUTION_ROLE_ARN

  container_definitions = jsonencode([
    {
      name      = "${var.ENVIRONMENT}-${var.SERVICE_NAME}-${var.CONTAINER}"
      image     = var.IMAGE_URL
      essential = var.ESSENTIAL_VALUE
      portMappings = [
        {
          containerPort = var.DB_PORT
          hostPort      = var.DB_PORT
          protocol      = var.TCP_PROTOCOL
        }
      ]
      environment = [
        { name = "POSTGRES_DB", value = var.POSTGRES_DB },
        { name = "POSTGRES_USER", value = var.POSTGRES_USER },
        { name = "POSTGRES_PASSWORD", value = var.POSTGRES_PASSWORD }
      ]
      logConfiguration = {
        logDriver = var.LOG_DRIVER
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.database_log_group.name
          "awslogs-region"        = var.REGION
          "awslogs-stream-prefix" = var.ECS_PREFIX
        }
      }
    }
  ])
}

resource "aws_ecs_service" "database_service" {
  name            = "${var.ENVIRONMENT}-${var.SERVICE_NAME}-${var.SERVICE}"
  cluster         = var.CLUSTER_ID
  task_definition = aws_ecs_task_definition.database_task.arn
  launch_type     = var.REQ_COMPATIBILITY
  desired_count   = var.DESIRED_COUNT

  network_configuration {
    subnets          = var.PRIVATE_SUBNETS
    security_groups  = [var.DATABASE_SG_ID]
    assign_public_ip = var.ASSIGN_PUBLIC_IP
  }

  health_check_grace_period_seconds = var.HEALTH_CHECK_GRACE_PERIOD_SECONDS_DB



  # This is the Cloud Map integration!
  service_registries {
    registry_arn = var.DATABASE_SERVICE_DISCOVERY_ARN
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}
