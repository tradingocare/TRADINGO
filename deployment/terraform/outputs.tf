# ──────────────────────────────────────────────
# Networking Outputs
# ──────────────────────────────────────────────
output "vpc_id" {
  description = "ID of the TRADINGO VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the TRADINGO VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "elasticache_subnet_ids" {
  description = "IDs of ElastiCache subnets"
  value       = aws_subnet.elasticache[*].id
}

# ──────────────────────────────────────────────
# ALB Outputs
# ──────────────────────────────────────────────
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Route53 zone ID of the ALB"
  value       = aws_lb.main.zone_id
}

output "alb_arn_suffix" {
  description = "ARN suffix of the ALB for CloudWatch metrics"
  value       = aws_lb.main.arn_suffix
}

output "alb_listener_https_web_arn" {
  description = "ARN of the HTTPS listener for web traffic"
  value       = aws_lb_listener.https_web.arn
}

output "alb_listener_https_api_arn" {
  description = "ARN of the HTTPS listener for API traffic"
  value       = aws_lb_listener.https_api.arn
}

output "target_group_web_blue_arn" {
  description = "ARN of the blue web target group"
  value       = aws_lb_target_group.web_blue.arn
}

output "target_group_web_green_arn" {
  description = "ARN of the green web target group"
  value       = aws_lb_target_group.web_green.arn
}

output "target_group_api_blue_arn" {
  description = "ARN of the blue API target group"
  value       = aws_lb_target_group.api_blue.arn
}

output "target_group_api_green_arn" {
  description = "ARN of the green API target group"
  value       = aws_lb_target_group.api_green.arn
}

# ──────────────────────────────────────────────
# CloudFront Outputs
# ──────────────────────────────────────────────
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Route53 zone ID for CloudFront alias records"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "cloudfront_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

# ──────────────────────────────────────────────
# ECS Outputs
# ──────────────────────────────────────────────
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_web_blue_name" {
  description = "Name of the blue web ECS service"
  value       = aws_ecs_service.web_blue.name
}

output "ecs_service_web_green_name" {
  description = "Name of the green web ECS service"
  value       = aws_ecs_service.web_green.name
}

output "ecs_service_api_blue_name" {
  description = "Name of the blue API ECS service"
  value       = aws_ecs_service.api_blue.name
}

output "ecs_service_api_green_name" {
  description = "Name of the green API ECS service"
  value       = aws_ecs_service.api_green.name
}

output "ecs_task_definition_web_arn" {
  description = "ARN of the web task definition"
  value       = aws_ecs_task_definition.web.arn
}

output "ecs_task_definition_api_arn" {
  description = "ARN of the API task definition"
  value       = aws_ecs_task_definition.api.arn
}

# ──────────────────────────────────────────────
# RDS Outputs
# ──────────────────────────────────────────────
output "rds_endpoint" {
  description = "Endpoint address of the RDS PostgreSQL instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "DNS address of the RDS PostgreSQL instance"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "Port of the RDS PostgreSQL instance"
  value       = aws_db_instance.main.port
}

output "rds_db_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "rds_identifier" {
  description = "Identifier of the RDS instance"
  value       = aws_db_instance.main.identifier
}

output "rds_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "rds_resource_id" {
  description = "Resource ID of the RDS instance for CloudWatch metrics"
  value       = aws_db_instance.main.resource_id
}

# ──────────────────────────────────────────────
# Redis Outputs
# ──────────────────────────────────────────────
output "redis_endpoint" {
  description = "Primary endpoint address of the Redis replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_port" {
  description = "Port of the Redis replication group"
  value       = aws_elasticache_replication_group.main.port
}

output "redis_replication_group_id" {
  description = "ID of the Redis replication group"
  value       = aws_elasticache_replication_group.main.replication_group_id
}

output "redis_reader_endpoint" {
  description = "Reader endpoint address for read replicas"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "redis_arn" {
  description = "ARN of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.main.arn
}

# ──────────────────────────────────────────────
# OpenSearch Outputs
# ──────────────────────────────────────────────
output "opensearch_endpoint" {
  description = "Endpoint of the OpenSearch domain"
  value       = aws_opensearch_domain.main.endpoint
}

output "opensearch_dashboard_endpoint" {
  description = "OpenSearch Dashboards endpoint"
  value       = aws_opensearch_domain.main.dashboard_endpoint
}

output "opensearch_domain_id" {
  description = "ID of the OpenSearch domain"
  value       = aws_opensearch_domain.main.domain_id
}

output "opensearch_domain_name" {
  description = "Name of the OpenSearch domain"
  value       = aws_opensearch_domain.main.domain_name
}

output "opensearch_arn" {
  description = "ARN of the OpenSearch domain"
  value       = aws_opensearch_domain.main.arn
}

# ──────────────────────────────────────────────
# ECR Outputs
# ──────────────────────────────────────────────
output "ecr_repository_web_url" {
  description = "URL of the ECR repository for the web service"
  value       = aws_ecr_repository.web.repository_url
}

output "ecr_repository_api_url" {
  description = "URL of the ECR repository for the API service"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_repository_web_arn" {
  description = "ARN of the ECR repository for web"
  value       = aws_ecr_repository.web.arn
}

output "ecr_repository_api_arn" {
  description = "ARN of the ECR repository for API"
  value       = aws_ecr_repository.api.arn
}

# ──────────────────────────────────────────────
# S3 Outputs
# ──────────────────────────────────────────────
output "s3_assets_bucket_name" {
  description = "Name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.id
}

output "s3_uploads_bucket_name" {
  description = "Name of the S3 uploads bucket"
  value       = aws_s3_bucket.uploads.id
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.id
}

output "s3_backups_bucket_name" {
  description = "Name of the S3 backups bucket"
  value       = aws_s3_bucket.backups.id
}

output "s3_assets_bucket_arn" {
  description = "ARN of the S3 assets bucket"
  value       = aws_s3_bucket.assets.arn
}

# ──────────────────────────────────────────────
# WAF Outputs
# ──────────────────────────────────────────────
output "waf_web_acl_arn" {
  description = "ARN of the WAF web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "waf_web_acl_id" {
  description = "ID of the WAF web ACL"
  value       = aws_wafv2_web_acl.main.id
}

# ──────────────────────────────────────────────
# Route53 Outputs
# ──────────────────────────────────────────────
output "route53_zone_id" {
  description = "ID of the Route53 hosted zone"
  value       = data.aws_route53_zone.main.zone_id
}

output "route53_root_record_fqdn" {
  description = "FQDN of the root domain record"
  value       = aws_route53_record.root.fqdn
}

output "route53_api_record_fqdn" {
  description = "FQDN of the API subdomain record"
  value       = aws_route53_record.api.fqdn
}

output "route53_app_record_fqdn" {
  description = "FQDN of the app subdomain record"
  value       = aws_route53_record.app.fqdn
}

# ──────────────────────────────────────────────
# IAM Outputs
# ──────────────────────────────────────────────
output "iam_ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "iam_ecs_task_web_role_arn" {
  description = "ARN of the web ECS task role"
  value       = aws_iam_role.ecs_task_web.arn
}

output "iam_ecs_task_api_role_arn" {
  description = "ARN of the API ECS task role"
  value       = aws_iam_role.ecs_task_api.arn
}

# ──────────────────────────────────────────────
# Security Group Outputs
# ──────────────────────────────────────────────
output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_ecs_tasks_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "security_group_redis_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

# ──────────────────────────────────────────────
# Secrets Manager Outputs
# ──────────────────────────────────────────────
output "secrets_manager_jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "secrets_manager_db_password_arn" {
  description = "ARN of the database password in Secrets Manager"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "secrets_manager_sentry_dsn_arn" {
  description = "ARN of the Sentry DSN in Secrets Manager"
  value       = aws_secretsmanager_secret.sentry_dsn.arn
}

# ──────────────────────────────────────────────
# Service Discovery Outputs
# ──────────────────────────────────────────────
output "service_discovery_namespace_id" {
  description = "ID of the Cloud Map namespace"
  value       = aws_service_discovery_http_namespace.main.id
}

output "service_discovery_namespace_arn" {
  description = "ARN of the Cloud Map namespace"
  value       = aws_service_discovery_http_namespace.main.arn
}

# ──────────────────────────────────────────────
# Auto Scaling Outputs
# ──────────────────────────────────────────────
output "autoscaling_target_web_arn" {
  description = "ARN of the web auto scaling target"
  value       = aws_appautoscaling_target.web.arn
}

output "autoscaling_target_api_arn" {
  description = "ARN of the API auto scaling target"
  value       = aws_appautoscaling_target.api.arn
}
