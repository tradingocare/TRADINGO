terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "tradingo-terraform-state"
    key            = "tradingo/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "tradingo-terraform-locks"
  }
}

locals {
  name_prefix = "tradingo-${var.environment}"
  common_tags = {
    Service     = "tradingo"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  azs = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
}

# ──────────────────────────────────────────────
# VPC
# ──────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-nat-eip-${count.index + 1}" })
}

resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}" })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-public-${count.index + 1}" })
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-private-${count.index + 1}" })
}

resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 6)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-database-${count.index + 1}" })
}

resource "aws_subnet" "elasticache" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 9)
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-elasticache-${count.index + 1}" })
}

# ──────────────────────────────────────────────
# Route Tables
# ──────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-public-rt" })
}

resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-private-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "elasticache" {
  count          = 3
  subnet_id      = aws_subnet.elasticache[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ──────────────────────────────────────────────
# VPC Endpoints
# ──────────────────────────────────────────────
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = flatten([
    aws_route_table.private[*].id,
    aws_route_table.public.id,
  ])

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-s3-endpoint" })
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ecr-api-endpoint" })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ecr-dkr-endpoint" })
}

resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-logs-endpoint" })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-sm-endpoint" })
}

# ──────────────────────────────────────────────
# Security Groups
# ──────────────────────────────────────────────
resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "HTTPS from VPC"
  }

  tags = local.common_tags
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb-sg" })
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Web traffic from ALB"
  }

  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "API traffic from ALB"
  }

  ingress {
    from_port   = 3000
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Internal service communication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ecs-tasks-sg" })
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "PostgreSQL from ECS tasks"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-rds-sg" })
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "Redis from ECS tasks"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-redis-sg" })
}

resource "aws_security_group" "opensearch" {
  name        = "${local.name_prefix}-opensearch-sg"
  description = "Security group for OpenSearch"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 9200
    to_port         = 9200
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "OpenSearch from ECS tasks"
  }

  ingress {
    from_port       = 9600
    to_port         = 9600
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "OpenSearch metrics from ECS tasks"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-opensearch-sg" })
}

# ──────────────────────────────────────────────
# S3 Buckets
# ──────────────────────────────────────────────
resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"
  force_destroy = var.environment != "production"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-assets" })
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name_prefix}-uploads"
  force_destroy = var.environment != "production"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-uploads" })
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "expire-old-uploads"
    status = "Enabled"

    expiration {
      days = 30
    }

    filter {
      prefix = "temp/"
    }
  }
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs"
  force_destroy = var.environment != "production"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-logs" })
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket" "backups" {
  bucket = "${local.name_prefix}-backups"
  force_destroy = var.environment != "production"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-backups" })
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "daily-backup-retention"
    status = "Enabled"

    filter {
      prefix = "postgres/daily/"
    }

    expiration {
      days = 30
    }

    transitions {
      days          = 7
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "monthly-backup-retention"
    status = "Enabled"

    filter {
      prefix = "postgres/monthly/"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "yearly-backup-retention"
    status = "Enabled"

    filter {
      prefix = "postgres/yearly/"
    }

    expiration {
      days = 2555
    }

    transitions {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

# ──────────────────────────────────────────────
# ECR Repositories
# ──────────────────────────────────────────────
resource "aws_ecr_repository" "web" {
  name                 = "tradingo/web"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment != "production"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_repository" "api" {
  name                 = "tradingo/api"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment != "production"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 50 production images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["production-", "staging-"]
          countType     = "imageCountMoreThan"
          countNumber   = 50
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = {
          type = "expire"
        }
      },
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 50 production images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["production-", "staging-"]
          countType     = "imageCountMoreThan"
          countNumber   = 50
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = {
          type = "expire"
        }
      },
    ]
  })
}

# ──────────────────────────────────────────────
# IAM Roles & Policies
# ──────────────────────────────────────────────
resource "aws_iam_role" "ecs_execution" {
  name = "${local.name_prefix}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_custom" {
  name = "${local.name_prefix}-ecs-execution-custom-policy"
  role = aws_iam_role.ecs_execution.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
        ]
        Resource = [
          aws_ecr_repository.web.arn,
          aws_ecr_repository.api.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/ecs/tradingo-*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
        ]
        Resource = "arn:aws:kms:${var.aws_region}:*:key/*"
      },
    ]
  })
}

resource "aws_iam_role" "ecs_task_web" {
  name = "${local.name_prefix}-web-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-task-role" })
}

resource "aws_iam_role_policy" "ecs_task_web_policy" {
  name = "${local.name_prefix}-web-task-policy"
  role = aws_iam_role.ecs_task_web.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.assets.arn,
          "${aws_s3_bucket.assets.arn}/*",
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
        ]
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role" "ecs_task_api" {
  name = "${local.name_prefix}-api-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-api-task-role" })
}

resource "aws_iam_role_policy" "ecs_task_api_policy" {
  name = "${local.name_prefix}-api-task-policy"
  role = aws_iam_role.ecs_task_api.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.assets.arn,
          "${aws_s3_bucket.assets.arn}/*",
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*",
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
        ]
        Resource = "arn:aws:sns:${var.aws_region}:*:tradingo-*"
      },
    ]
  })
}

# ──────────────────────────────────────────────
# RDS PostgreSQL
# ──────────────────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name        = "${local.name_prefix}-db-subnet-group"
  description = "Database subnet group for TRADINGO"
  subnet_ids  = aws_subnet.database[*].id

  tags = local.common_tags
}

resource "aws_db_parameter_group" "main" {
  name        = "${local.name_prefix}-db-params"
  family      = "postgres16"
  description = "Custom parameters for TRADINGO PostgreSQL"

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory*1/16}"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16MB"
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "effective_io_concurrency"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "65536"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = local.common_tags
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name_prefix}-db"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  db_name  = "tradingo_${var.environment}"
  username = "tradingo_admin"
  password = random_password.db_master.result

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true

  multi_az               = var.environment == "production"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  parameter_group_name = aws_db_parameter_group.main.name

  backup_retention_period = var.environment == "production" ? 35 : 7
  backup_window           = "01:00-02:00"
  maintenance_window      = "sun:03:00-sun:04:00"

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${local.name_prefix}-db-final-${formatdate("YYYYMMDD-HHmmss", timestamp())}" : null

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade",
  ]

  copy_tags_to_snapshot = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-db" })
}

resource "random_password" "db_master" {
  length  = 24
  special = false
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ──────────────────────────────────────────────
# ElastiCache Redis
# ──────────────────────────────────────────────
resource "aws_elasticache_subnet_group" "main" {
  name        = "${local.name_prefix}-redis-subnet-group"
  description = "Redis subnet group for TRADINGO"
  subnet_ids  = aws_subnet.elasticache[*].id
}

resource "aws_elasticache_parameter_group" "main" {
  name        = "${local.name_prefix}-redis-params"
  family      = "redis7"
  description = "Custom parameters for TRADINGO Redis"

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "${local.name_prefix}-redis"
  description                   = "Redis cluster for TRADINGO"
  node_type                     = var.redis_node_type
  num_cache_clusters            = var.environment == "production" ? 3 : 1
  port                          = 6379
  parameter_group_name          = aws_elasticache_parameter_group.main.name
  subnet_group_name             = aws_elasticache_subnet_group.main.name
  security_group_ids            = [aws_security_group.redis.id]

  automatic_failover_enabled    = var.environment == "production"
  multi_az_enabled              = var.environment == "production"

  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true

  maintenance_window            = "sun:05:00-sun:06:00"
  snapshot_window               = "03:00-04:00"
  snapshot_retention_limit      = var.environment == "production" ? 7 : 1

  auto_minor_version_upgrade    = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-redis" })
}

# ──────────────────────────────────────────────
# OpenSearch
# ──────────────────────────────────────────────
resource "aws_opensearch_domain" "main" {
  domain_name    = "${local.name_prefix}-os"
  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = var.opensearch_instance_type
    instance_count = var.environment == "production" ? 3 : 1

    zone_awareness_enabled = var.environment == "production"
    zone_awareness_config {
      availability_zone_count = 3
    }

    dedicated_master_enabled = var.environment == "production"
    dedicated_master_type    = "r6g.large.search"
    dedicated_master_count   = 3

    warm_enabled = false
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = var.environment == "production" ? 100 : 20
    throughput  = 125
    iops        = 3000
  }

  encrypt_at_rest {
    enabled    = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  node_to_node_encryption {
    enabled = true
  }

  vpc_options {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.opensearch.id]
  }

  snapshot_options {
    automated_snapshot_start_hour = 2
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "INDEX_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "SEARCH_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "ES_APPLICATION_LOGS"
  }

  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = "tradingo_admin"
      master_user_password = random_password.opensearch_master.result
    }
  }

  auto_tune_options {
    desired_state = var.environment == "production" ? "ENABLED" : "DISABLED"
  }

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.ecs_task_api.arn,
          ]
        }
        Action = [
          "es:ESHttp*",
        ]
        Resource = "arn:aws:es:${var.aws_region}:*:domain/${local.name_prefix}-os/*"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-os" })
}

resource "random_password" "opensearch_master" {
  length  = 24
  special = false
}

resource "aws_cloudwatch_log_group" "opensearch" {
  name              = "/aws/opensearch/${local.name_prefix}-os"
  retention_in_days = 30

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# Application Load Balancer
# ──────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"
  enable_http2               = true
  idle_timeout               = 60

  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb" })
}

resource "aws_lb_target_group" "web_blue" {
  name        = "${local.name_prefix}-web-blue-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-blue-tg" })
}

resource "aws_lb_target_group" "web_green" {
  name        = "${local.name_prefix}-web-green-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-green-tg" })
}

resource "aws_lb_target_group" "api_blue" {
  name        = "${local.name_prefix}-api-blue-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-api-blue-tg" })
}

resource "aws_lb_target_group" "api_green" {
  name        = "${local.name_prefix}-api-green-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-api-green-tg" })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "https_web" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.web_blue.arn
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "https_api" {
  load_balancer_arn = aws_lb.main.arn
  port              = "8443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.api_certificate_arn

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.api_blue.arn
  }

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# ECS Cluster
# ──────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_encryption_enabled = false
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs_exec.name
      }
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cluster" })
}

resource "aws_cloudwatch_log_group" "ecs_exec" {
  name              = "/ecs/${local.name_prefix}-exec"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "ecs_web" {
  name              = "/ecs/tradingo-web"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "ecs_api" {
  name              = "/ecs/tradingo-api"
  retention_in_days = 30

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# ECS Services
# ──────────────────────────────────────────────
resource "aws_ecs_task_definition" "web" {
  family                   = "tradingo-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_web_cpu
  memory                   = var.ecs_web_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_web.arn

  container_definitions = jsonencode([
    {
      name         = "tradingo-web"
      image        = "${aws_ecr_repository.web.repository_url}:latest"
      essential    = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      environment = [
        { name = "NODE_ENV",     value = var.environment },
        { name = "PORT",         value = "3000" },
        { name = "API_URL",      value = "http://localhost:3001" },
        { name = "LOG_LEVEL",    value = "info" },
        { name = "LOG_FORMAT",   value = "json" },
        { name = "AWS_REGION",   value = var.aws_region },
      ]
      secrets = [
        { name = "SENTRY_DSN",     valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/sentry-dsn" },
        { name = "SESSION_SECRET", valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/session-secret" },
        { name = "JWT_SECRET",     valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/jwt-secret" },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_web.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "web"
        }
      }
      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]
      linuxParameters = {
        initProcessEnabled = true
      }
    }
  ])

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-task-def" })
}

resource "aws_ecs_task_definition" "api" {
  family                   = "tradingo-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_api_cpu
  memory                   = var.ecs_api_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_api.arn

  container_definitions = jsonencode([
    {
      name         = "tradingo-api"
      image        = "${aws_ecr_repository.api.repository_url}:latest"
      essential    = true
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
          protocol      = "tcp"
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3001/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      environment = [
        { name = "NODE_ENV",      value = var.environment },
        { name = "PORT",          value = "3001" },
        { name = "DB_HOST",       value = aws_db_instance.main.address },
        { name = "DB_PORT",       value = "5432" },
        { name = "DB_NAME",       value = aws_db_instance.main.db_name },
        { name = "DB_SSL",        value = "true" },
        { name = "DB_POOL_MAX",   value = "20" },
        { name = "REDIS_URL",     value = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379" },
        { name = "OPENSEARCH_URL", value = "https://${aws_opensearch_domain.main.endpoint}" },
        { name = "S3_ASSETS_BUCKET", value = aws_s3_bucket.assets.id },
        { name = "S3_UPLOADS_BUCKET", value = aws_s3_bucket.uploads.id },
        { name = "AWS_REGION",    value = var.aws_region },
        { name = "LOG_LEVEL",     value = "info" },
        { name = "LOG_FORMAT",    value = "json" },
      ]
      secrets = [
        { name = "DB_USER",     valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/db-username" },
        { name = "DB_PASSWORD", valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/db-password" },
        { name = "SENTRY_DSN",  valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/sentry-dsn" },
        { name = "JWT_SECRET",  valueFrom = "arn:aws:secretsmanager:${var.aws_region}:*:secret:tradingo/jwt-secret" },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        },
        {
          name      = "nproc"
          softLimit = 4096
          hardLimit = 4096
        }
      ]
      linuxParameters = {
        initProcessEnabled = true
      }
    }
  ])

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-api-task-def" })
}

resource "aws_ecs_service" "web_blue" {
  name            = "${local.name_prefix}-web-blue"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.web_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web_blue.arn
    container_name   = "tradingo-web"
    container_port   = 3000
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = var.environment != "production"

  service_connect_configuration {
    enabled = true
    namespace = aws_service_discovery_http_namespace.main.arn
    service {
      client_alias {
        port     = 3000
        dns_name = "tradingo-web"
      }
      port_name      = "tradingo-web"
      discovery_name = "web"
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-blue" })
}

resource "aws_ecs_service" "web_green" {
  name            = "${local.name_prefix}-web-green"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web_green.arn
    container_name   = "tradingo-web"
    container_port   = 3000
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = var.environment != "production"

  service_connect_configuration {
    enabled = true
    namespace = aws_service_discovery_http_namespace.main.arn
    service {
      client_alias {
        port     = 3000
        dns_name = "tradingo-web-green"
      }
      port_name      = "tradingo-web"
      discovery_name = "web-green"
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-green" })
}

resource "aws_ecs_service" "api_blue" {
  name            = "${local.name_prefix}-api-blue"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_blue.arn
    container_name   = "tradingo-api"
    container_port   = 3001
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = var.environment != "production"

  service_connect_configuration {
    enabled = true
    namespace = aws_service_discovery_http_namespace.main.arn
    service {
      client_alias {
        port     = 3001
        dns_name = "tradingo-api"
      }
      port_name      = "tradingo-api"
      discovery_name = "api"
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-api-blue" })
}

resource "aws_ecs_service" "api_green" {
  name            = "${local.name_prefix}-api-green"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_green.arn
    container_name   = "tradingo-api"
    container_port   = 3001
  }

  deployment_controller {
    type = "ECS"
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = var.environment != "production"

  service_connect_configuration {
    enabled = true
    namespace = aws_service_discovery_http_namespace.main.arn
    service {
      client_alias {
        port     = 3001
        dns_name = "tradingo-api-green"
      }
      port_name      = "tradingo-api"
      discovery_name = "api-green"
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-api-green" })
}

resource "aws_service_discovery_http_namespace" "main" {
  name        = "${local.name_prefix}.internal"
  description = "Service discovery namespace for TRADINGO"

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# WAF Web ACL
# ──────────────────────────────────────────────
resource "aws_wafv2_web_acl" "main" {
  name        = "${local.name_prefix}-waf"
  description = "WAF ACL for TRADINGO"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesAmazonIpReputationList"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesAmazonIpReputationListMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 5

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 5000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRuleMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "TradingoWAFMetric"
    sampled_requests_enabled  = true
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-waf" })
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# ──────────────────────────────────────────────
# CloudFront (Origin: ALB + S3)
# ──────────────────────────────────────────────
resource "aws_cloudfront_distribution" "main" {
  enabled     = true
  price_class = "PriceClass_100"
  http_version = "http2and3"
  aliases     = [var.domain_name, "*.${var.domain_name}"]

  viewer_certificate {
    acm_certificate_arn      = var.cloudfront_certificate_arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  logging_config {
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 60
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 60
  }

  custom_error_response {
    error_code         = 500
    response_code      = 503
    response_page_path = "/503.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code         = 502
    response_code      = 503
    response_page_path = "/503.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code         = 503
    response_code      = 503
    response_page_path = "/503.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code         = 504
    response_code      = 503
    response_page_path = "/503.html"
    error_caching_min_ttl = 10
  }

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALBOrigin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_read_timeout    = 60
      origin_keepalive_timeout = 5
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    origin_shield {
      enabled              = true
      origin_shield_region = var.aws_region
    }
  }

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3StaticAssets"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id       = "ALBOrigin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0

    forwarded_values {
      query_string = true
      cookies {
        forward = "whitelist"
        whitelisted_names = ["session", "_csrf", "token"]
      }
      headers = [
        "Authorization",
        "Origin",
        "Referer",
        "Host",
        "Accept",
        "Accept-Language",
        "Content-Type",
        "X-CSRF-Token",
        "X-Requested-With",
        "CloudFront-Forwarded-Proto",
      ]
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ALBOrigin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0

    forwarded_values {
      query_string = true
      cookies {
        forward = "whitelist"
        whitelisted_names = ["session", "_csrf", "token"]
      }
      headers = [
        "Authorization",
        "Origin",
        "Referer",
        "Host",
        "Accept",
        "Accept-Language",
        "Content-Type",
        "X-CSRF-Token",
        "X-Requested-With",
        "CloudFront-Forwarded-Proto",
      ]
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    target_origin_id = "S3StaticAssets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress         = true
    default_ttl      = 31536000
    max_ttl          = 31536000
    min_ttl          = 86400

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/static/*"
    target_origin_id = "S3StaticAssets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress         = true
    default_ttl      = 31536000
    max_ttl          = 31536000
    min_ttl          = 86400

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern     = "/logo/*"
    target_origin_id = "S3StaticAssets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress         = true
    default_ttl      = 86400
    max_ttl          = 604800
    min_ttl          = 3600

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.geo_allowed_countries
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cloudfront" })
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for TRADINGO CloudFront distribution"
}

# ──────────────────────────────────────────────
# Route53 DNS
# ──────────────────────────────────────────────
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# ──────────────────────────────────────────────
# Secrets Manager
# ──────────────────────────────────────────────
resource "aws_secretsmanager_secret" "session_secret" {
  name                    = "tradingo/session-secret"
  description             = "Session encryption secret for TRADINGO web"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "session_secret" {
  secret_id     = aws_secretsmanager_secret.session_secret.id
  secret_string = random_password.session_secret.result
}

resource "random_password" "session_secret" {
  length  = 64
  special = true
  upper   = true
  lower   = true
  numeric = true
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "tradingo/jwt-secret"
  description             = "JWT signing secret for TRADINGO API"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
  upper   = true
  lower   = true
  numeric = true
}

resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name                    = "tradingo/jwt-refresh-secret"
  description             = "JWT refresh token secret for TRADINGO"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_refresh_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh_secret.id
  secret_string = random_password.jwt_refresh_secret.result
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
  upper   = true
  lower   = true
  numeric = true
}

resource "aws_secretsmanager_secret" "db_username" {
  name                    = "tradingo/db-username"
  description             = "Database master username for TRADINGO"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_username" {
  secret_id     = aws_secretsmanager_secret.db_username.id
  secret_string = "tradingo_admin"
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "tradingo/db-password"
  description             = "Database master password for TRADINGO"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_master.result
}

resource "aws_secretsmanager_secret" "sentry_dsn" {
  name                    = "tradingo/sentry-dsn"
  description             = "Sentry DSN for TRADINGO backend"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "sentry_dsn" {
  secret_id     = aws_secretsmanager_secret.sentry_dsn.id
  secret_string = "https://placeholder-key@o123456.ingest.sentry.io/1234567"
}

resource "aws_secretsmanager_secret" "encryption_key" {
  name                    = "tradingo/encryption-key"
  description             = "Encryption key for sensitive data at rest"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "encryption_key" {
  secret_id     = aws_secretsmanager_secret.encryption_key.id
  secret_string = random_password.encryption_key.result
}

resource "random_password" "encryption_key" {
  length  = 64
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# ──────────────────────────────────────────────
# Auto Scaling
# ──────────────────────────────────────────────
resource "aws_appautoscaling_target" "web" {
  max_capacity       = var.web_max_count
  min_capacity       = var.web_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.web_blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "web_cpu" {
  name               = "${local.name_prefix}-web-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  service_namespace  = aws_appautoscaling_target.web.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "web_memory" {
  name               = "${local.name_prefix}-web-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  service_namespace  = aws_appautoscaling_target.web.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.api_max_count
  min_capacity       = var.api_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api_blue.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${local.name_prefix}-api-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "api_memory" {
  name               = "${local.name_prefix}-api-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

# ──────────────────────────────────────────────
# CloudWatch Alarms
# ──────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name_prefix}-alb-5xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx error rate exceeded threshold"
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "${local.name_prefix}-alb-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "p99"
  threshold           = 3
  alarm_description   = "ALB p99 response time exceeded 3 seconds"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization exceeded 80%"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${local.name_prefix}-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 160
  alarm_description   = "RDS connections exceeded 80% of max (200)"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${local.name_prefix}-ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS CPU utilization exceeded 85%"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = local.common_tags
}
