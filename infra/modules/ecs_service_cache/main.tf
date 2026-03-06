resource "aws_cloudwatch_log_group" "cache_log_group" {
  name              = "/ecs/${var.SERVICES[3]}"
  retention_in_days = var.RETENTION_DAYS
}

resource "aws_ecs_task_definition" "cache_task" {
  family                   = "${var.SERVICES[3]}-task"
  network_mode             = var.NETWORK_MODE
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.CPU
  memory                   = var.MEMORY
  execution_role_arn       = var.EXECUTION_ROLE_ARN

  container_definitions = jsonencode([
    {
      name      = "${var.SERVICES[3]}-container"
      image     = "${var.IMAGE_URL}"
      essential = true
      portMappings = [
        {
          containerPort = var.CACHE_PORT
          hostPort      = var.CACHE_PORT
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = var.LOG_DRIVER
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.cache_log_group.name
          "awslogs-region"        = var.REGION
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "cache_service" {
  name            = "${var.SERVICES[3]}-service"
  cluster         = var.CLUSTER_ID
  task_definition = aws_ecs_task_definition.cache_task.arn
  launch_type     = "FARGATE"
  desired_count   = var.DESIRED_COUNT

  network_configuration {
    subnets          = var.PRIVATE_SUBNETS
    security_groups  = [var.CACHE_SG_ID]
    assign_public_ip = false
  }

  # This is the Cloud Map integration!
  service_registries {
    registry_arn = var.CACHE_SERVICE_DISCOVERY_ARN
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}