resource "aws_cloudwatch_log_group" "frontend_log_group" {
  name              = "/ecs/${var.SERVICES[0]}"
  retention_in_days = var.RETENTION_DAYS
}

resource "aws_ecs_task_definition" "frontend_task" {
  family                   = "${var.SERVICES[0]}-task"
  network_mode             = var.NETWORK_MODE
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.CPU
  memory                   = var.MEMORY
  execution_role_arn       = var.EXECUTION_ROLE_ARN

  container_definitions = jsonencode([
    {
      name      = "${var.SERVICES[0]}-container"
      image     = "${var.IMAGE_URL}"
      essential = true
      portMappings = [
        {
          containerPort = var.CONTAINER_PORT
          hostPort      = var.CONTAINER_PORT
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = var.LOG_DRIVER
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend_log_group.name
          "awslogs-region"        = var.REGION
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "frontend_service" {
  name            = "${var.SERVICES[0]}-service"
  cluster         = var.CLUSTER_ID
  task_definition = aws_ecs_task_definition.frontend_task.arn
  launch_type     = "FARGATE"
  desired_count   = var.DESIRED_COUNT

  network_configuration {
    subnets          = var.PRIVATE_SUBNETS
    security_groups  = [var.FRONTEND_SG_ID]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.TARGET_GROUP_ARN
    container_name   = "${var.SERVICES[0]}-container" 
    container_port   = var.CONTAINER_PORT
  }

  # This is the Cloud Map integration!
  service_registries {
    registry_arn = var.FRONTEND_SERVICE_DISCOVERY_ARN
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}
