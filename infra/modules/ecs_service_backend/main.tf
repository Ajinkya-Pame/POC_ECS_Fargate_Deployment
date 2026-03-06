resource "aws_cloudwatch_log_group" "backend_log_group" {
  name              = "/ecs/${var.SERVICES[1]}"
  retention_in_days = var.RETENTION_DAYS
}

resource "aws_ecs_task_definition" "backend_task" {
  family                   = "${var.SERVICES[1]}-task"
  network_mode             = var.NETWORK_MODE
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.CPU
  memory                   = var.MEMORY
  execution_role_arn       = var.EXECUTION_ROLE_ARN

  container_definitions = jsonencode([
    {
      name      = "${var.SERVICES[1]}-container"
      image     = "${var.IMAGE_URL}"
      essential = true
      portMappings = [
        {
          containerPort = var.BACKEND_PORT
          hostPort      = var.BACKEND_PORT
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "PORT", value = tostring(var.BACKEND_PORT) },
        { name = "DATABASE_URL", value = var.DATABASE_URL },
        { name = "REDIS_URL", value = var.REDIS_URL },
        { name = "ADMIN_PASSWORD", value = var.ADMIN_PASSWORD }
      ]
      logConfiguration = {
        logDriver = var.LOG_DRIVER
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend_log_group.name
          "awslogs-region"        = var.REGION
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend_service" {
  name            = "${var.SERVICES[1]}-service"
  cluster         = var.CLUSTER_ID
  task_definition = aws_ecs_task_definition.backend_task.arn
  launch_type     = "FARGATE"
  desired_count   = var.DESIRED_COUNT

  network_configuration {
    subnets          = var.PRIVATE_SUBNETS
    security_groups  = [var.BACKEND_SG_ID]
    assign_public_ip = false
  }



  # This is the Cloud Map integration!
  service_registries {
    registry_arn = var.BACKEND_SERVICE_DISCOVERY_ARN
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}