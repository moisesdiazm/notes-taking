output "frontend_url" {
  description = "Frontend application URL (via CloudFront)"
  value       = "https://app.${var.domain_name}"
}

output "backend_url" {
  description = "Backend API URL (HTTPS)"
  value       = "https://api.${var.domain_name}"
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name (before DNS propagates)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "ecr_frontend_url" {
  description = "ECR repository URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_url" {
  description = "ECR repository URL for the backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "RDS instance endpoint (host only, no port)"
  value       = aws_db_instance.postgres.address
}

output "ecs_cluster_name" {
  description = "ECS cluster name — used in deploy commands"
  value       = aws_ecs_cluster.main.name
}
