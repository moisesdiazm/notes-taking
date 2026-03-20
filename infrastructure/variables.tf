variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name — used as prefix for all resource names"
  type        = string
  default     = "notes-taking"
}

variable "environment" {
  description = "Deployment environment (e.g. production, staging)"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "RDS PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "django_secret_key" {
  description = "Django SECRET_KEY — generate with: openssl rand -base64 50"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Root domain managed in Route 53 (e.g. example.com). Subdomains app. and api. will be created."
  type        = string
}

variable "cloudfront_secret" {
  description = "Secret header value CloudFront sends to the frontend ALB — prevents direct ALB access. Generate with: openssl rand -hex 32"
  type        = string
  sensitive   = true
}

variable "frontend_image_tag" {
  description = "Docker image tag to deploy for the frontend"
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy for the backend"
  type        = string
  default     = "latest"
}
