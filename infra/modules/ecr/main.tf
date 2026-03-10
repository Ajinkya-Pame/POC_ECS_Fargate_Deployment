resource "aws_ecr_repository" "cricket" {
  for_each             = var.SERVICES
  name                 = "${var.ENVIRONMENT}-${each.value}-${var.APP_NAME}"
  image_tag_mutability = var.MUTABILITY

  image_scanning_configuration {
    scan_on_push = var.SCAN_ON_PUSH
  }

  encryption_configuration {
    encryption_type = var.ENC_TYPE
  }

  force_delete = var.FORCE_DELETE

  tags = { Name = "${var.ENVIRONMENT}-${each.value}-${var.APP_NAME}" }
}
