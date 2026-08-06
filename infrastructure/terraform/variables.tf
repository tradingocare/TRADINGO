variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "tradingo"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AWS availability zones"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks (ALB)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks (ECS tasks)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "api_container_cpu" {
  description = "API ECS task CPU units"
  type        = number
  default     = 512
}

variable "api_container_memory" {
  description = "API ECS task memory (MiB)"
  type        = number
  default     = 1024
}

variable "web_container_cpu" {
  description = "Web ECS task CPU units"
  type        = number
  default     = 256
}

variable "web_container_memory" {
  description = "Web ECS task memory (MiB)"
  type        = number
  default     = 512
}

variable "api_container_port" {
  description = "API container port"
  type        = number
  default     = 3001
}

variable "web_container_port" {
  description = "Web container port"
  type        = number
  default     = 3000
}

variable "api_metrics_port" {
  description = "API Prometheus metrics port"
  type        = number
  default     = 9100
}

variable "api_desired_count" {
  description = "Desired number of API ECS tasks"
  type        = number
  default     = 2
}

variable "web_desired_count" {
  description = "Desired number of Web ECS tasks"
  type        = number
  default     = 2
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "domain_name" {
  description = "Domain name for ALB"
  type        = string
  default     = "tradingo.in"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cost optimization)"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default = {
    Project     = "tradingo"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
