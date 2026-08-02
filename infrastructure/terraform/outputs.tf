output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB Route53 zone ID"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecr_api_url" {
  description = "API ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_url" {
  description = "Web ECR repository URL"
  value       = aws_ecr_repository.web.repository_url
}

output "ecs_api_task_definition_family" {
  description = "API task definition family"
  value       = aws_ecs_task_definition.api.family
}

output "ecs_web_task_definition_family" {
  description = "Web task definition family"
  value       = aws_ecs_task_definition.web.family
}

output "ecs_migration_task_definition_family" {
  description = "Migration task definition family"
  value       = aws_ecs_task_definition.migration.family
}

output "ecs_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "api_target_group_arn" {
  description = "API target group ARN"
  value       = aws_lb_target_group.api.arn
}

output "web_target_group_arn" {
  description = "Web target group ARN"
  value       = aws_lb_target_group.web.arn
}

output "api_log_group" {
  description = "API CloudWatch log group"
  value       = aws_cloudwatch_log_group.api.name
}

output "web_log_group" {
  description = "Web CloudWatch log group"
  value       = aws_cloudwatch_log_group.web.name
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_api_security_group_id" {
  description = "ECS API security group ID"
  value       = aws_security_group.ecs_api.id
}

output "ecs_web_security_group_id" {
  description = "ECS Web security group ID"
  value       = aws_security_group.ecs_web.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}
