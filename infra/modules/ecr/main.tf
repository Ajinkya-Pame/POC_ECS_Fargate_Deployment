resource "aws_ecr_repository" "cricket" {
  for_each             = toset(var.SERVICES)
  name                 = "${each.value}-memecricket"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS" 
  }

  force_delete = true 
}
