# ──────────────────────────────────────────────
# Environment & Region
# ──────────────────────────────────────────────
variable "environment" {
  description = "Deployment environment (production, staging)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "aws_region" {
  description = "AWS region for infrastructure"
  type        = string
  default     = "ap-south-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d{1}$", var.aws_region))
    error_message = "AWS region must be a valid region format (e.g., ap-south-1)."
  }
}

variable "aws_profile" {
  description = "AWS CLI profile to use"
  type        = string
  default     = "default"
}

# ──────────────────────────────────────────────
# Networking
# ──────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && can(cidrnetmask(var.vpc_cidr))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

# ──────────────────────────────────────────────
# Database (RDS PostgreSQL)
# ──────────────────────────────────────────────
variable "db_instance_class" {
  description = "RDS instance class for PostgreSQL"
  type        = string
  default     = "db.r6g.large"

  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "db_instance_class must start with 'db.'"
  }
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100

  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 16384
    error_message = "Database storage must be between 20 and 16384 GB."
  }
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 500
}

variable "db_backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 35

  validation {
    condition     = var.db_backup_retention_days >= 0 && var.db_backup_retention_days <= 35
    error_message = "Backup retention must be between 0 and 35 days."
  }
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = true
}

# ──────────────────────────────────────────────
# Redis (ElastiCache)
# ──────────────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"

  validation {
    condition     = can(regex("^cache\\.", var.redis_node_type))
    error_message = "redis_node_type must start with 'cache.'"
  }
}

variable "redis_num_cache_clusters" {
  description = "Number of Redis cache clusters (3 for production HA)"
  type        = number
  default     = 3
}

variable "redis_multi_az" {
  description = "Enable Multi-AZ for Redis"
  type        = bool
  default     = true
}

# ──────────────────────────────────────────────
# OpenSearch
# ──────────────────────────────────────────────
variable "opensearch_instance_type" {
  description = "OpenSearch instance type"
  type        = string
  default     = "r6g.large.search"
}

variable "opensearch_instance_count" {
  description = "Number of OpenSearch instances"
  type        = number
  default     = 3
}

variable "opensearch_ebs_volume_size" {
  description = "EBS volume size for OpenSearch in GB"
  type        = number
  default     = 100
}

variable "opensearch_dedicated_master_enabled" {
  description = "Enable dedicated master nodes for OpenSearch"
  type        = bool
  default     = true
}

variable "opensearch_dedicated_master_count" {
  description = "Number of dedicated master nodes"
  type        = number
  default     = 3
}

# ──────────────────────────────────────────────
# ECS Fargate
# ──────────────────────────────────────────────
variable "ecs_web_cpu" {
  description = "CPU units for web service (1024 = 1 vCPU)"
  type        = number
  default     = 1024

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.ecs_web_cpu)
    error_message = "ECS CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "ecs_web_memory" {
  description = "Memory in MB for web service"
  type        = number
  default     = 2048

  validation {
    condition     = contains([512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192], var.ecs_web_memory)
    error_message = "ECS memory must be a valid Fargate memory value."
  }
}

variable "ecs_api_cpu" {
  description = "CPU units for API service (2048 = 2 vCPU)"
  type        = number
  default     = 2048

  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.ecs_api_cpu)
    error_message = "ECS CPU must be one of: 256, 512, 1024, 2048, 4096."
  }
}

variable "ecs_api_memory" {
  description = "Memory in MB for API service"
  type        = number
  default     = 4096

  validation {
    condition     = contains([512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192, 10240, 12288, 14336, 16384], var.ecs_api_memory)
    error_message = "ECS memory must be a valid Fargate memory value."
  }
}

variable "web_desired_count" {
  description = "Desired number of web service tasks"
  type        = number
  default     = 2
}

variable "web_max_count" {
  description = "Maximum number of web service tasks (autoscaling)"
  type        = number
  default     = 10
}

variable "api_desired_count" {
  description = "Desired number of API service tasks"
  type        = number
  default     = 2
}

variable "api_max_count" {
  description = "Maximum number of API service tasks (autoscaling)"
  type        = number
  default     = 10
}

# ──────────────────────────────────────────────
# DNS & Certificates
# ──────────────────────────────────────────────
variable "domain_name" {
  description = "Primary domain name for TRADINGO"
  type        = string
  default     = "tradingo.io"
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for ALB (regional)"
  type        = string
  default     = ""
}

variable "api_certificate_arn" {
  description = "ARN of ACM certificate for API ALB listener"
  type        = string
  default     = ""
}

variable "cloudfront_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

# ──────────────────────────────────────────────
# CloudFront & WAF
# ──────────────────────────────────────────────
variable "geo_allowed_countries" {
  description = "List of allowed countries for geo-restriction"
  type        = list(string)
  default     = ["IN", "AE", "SA", "QA", "KW", "BH", "OM", "LB", "JO", "EG", "IQ", "YE", "PS"]
}

variable "waf_rate_limit" {
  description = "Rate limit per IP for WAF (requests per 5 minutes)"
  type        = number
  default     = 5000
}

# ──────────────────────────────────────────────
# Monitoring & Notifications
# ──────────────────────────────────────────────
variable "sns_topic_arn" {
  description = "ARN of SNS topic for CloudWatch alarms"
  type        = string
  default     = ""
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch Logs retention value."
  }
}

# ──────────────────────────────────────────────
# Tags
# ──────────────────────────────────────────────
variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
