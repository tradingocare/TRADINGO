resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-${var.environment}-api"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.project_name}-${var.environment}-web"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "migration" {
  name              = "/ecs/${var.project_name}-${var.environment}-migration"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/ecs/${var.project_name}-${var.environment}-nginx"
  retention_in_days = var.log_retention_days

  tags = var.tags
}
