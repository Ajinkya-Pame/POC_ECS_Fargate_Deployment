resource "aws_cloudwatch_log_group" "backend_log_group" {
  name              = "/${var.ECS_PREFIX}/${var.ENVIRONMENT}-${var.SERVICE_NAME}"
  retention_in_days = var.RETENTION_DAYS
}

# resource "aws_ecs_task_definition" "backend_task" {
#   family                   = "${var.ENVIRONMENT}-${var.SERVICE_NAME}-${var.TASK}"
#   network_mode             = var.NETWORK_MODE
#   requires_compatibilities = [var.REQ_COMPATIBILITY]
#   cpu                      = var.CPU
#   memory                   = var.MEMORY
#   execution_role_arn       = var.EXECUTION_ROLE_ARN

#   container_definitions = jsonencode([
#     {
#       name      = "${var.ENVIRONMENT}-${var.SERVICE_NAME}-${var.CONTAINER}"
#       image     = var.IMAGE_URL
#       essential = var.ESSENTIAL_VALUE
#       portMappings = [
#         {
#           containerPort = var.BACKEND_PORT
#           hostPort      = var.BACKEND_PORT
#           protocol      = var.TCP_PROTOCOL
#         }
#       ]
#       environment = [
#         { name = "PORT", value = tostring(var.BACKEND_PORT) },
#         { name = "DATABASE_URL", value = var.DATABASE_URL },
#         { name = "REDIS_URL", value = var.REDIS_URL },
#         { name = "ADMIN_PASSWORD", value = var.ADMIN_PASSWORD }
#       ]
#       logConfiguration = {
#         logDriver = var.LOG_DRIVER
#         options = {
#           "awslogs-group"         = aws_cloudwatch_log_group.backend_log_group.name
#           "awslogs-region"        = var.REGION
#           "awslogs-stream-prefix" = var.ECS_PREFIX
#         }
#       }
#     }
#   ])
# }

resource "aws_ecs_service" "backend_service" {
  name    = "${var.ENVIRONMENT}-${var.SERVICE_NAME}-${var.SERVICE}"
  cluster = var.CLUSTER_ID
  # task_definition = aws_ecs_task_definition.backend_task.arn
  launch_type   = var.REQ_COMPATIBILITY
  desired_count = var.DESIRED_COUNT

  network_configuration {
    subnets          = var.PRIVATE_SUBNETS
    security_groups  = [var.BACKEND_SG_ID]
    assign_public_ip = var.ASSIGN_PUBLIC_IP
  }

  health_check_grace_period_seconds = var.HEALTH_CHECK_GRACE_PERIOD_SECONDS_BACKEND

  # This is the Cloud Map integration!
  service_registries {
    registry_arn = var.BACKEND_SERVICE_DISCOVERY_ARN
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}
