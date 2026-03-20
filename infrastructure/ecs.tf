resource "aws_ecs_cluster" "main" {
  name = var.app_name
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.app_name}/frontend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.app_name}/backend"
  retention_in_days = 7
}

# ── Frontend task ─────────────────────────────────────────────────────────────
# Note: NEXT_PUBLIC_API_URL is baked in at image build time in Next.js.
# Build the frontend image after running `terraform apply` so the backend ALB
# DNS name is available. Pass it as a --build-arg to docker build.

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.app_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name  = "frontend"
    image = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"

    portMappings = [{ containerPort = 3000, protocol = "tcp" }]

    environment = [
      { name = "NEXT_PUBLIC_API_URL", value = "https://api.${var.domain_name}" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.frontend.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

# ── Backend task ─────────────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

    portMappings = [{ containerPort = 8000, protocol = "tcp" }]

    environment = [
      { name = "DJANGO_SETTINGS_MODULE", value = "config.settings.production" },
      { name = "DEBUG",                  value = "False" },
      { name = "ALLOWED_HOSTS",          value = "api.${var.domain_name}" },
      { name = "CORS_ALLOWED_ORIGINS",   value = "https://app.${var.domain_name}" }
    ]

    # SECRET_KEY and DATABASE_URL are injected from Secrets Manager at startup
    secrets = [
      { name = "SECRET_KEY",   valueFrom = "${aws_secretsmanager_secret.django.arn}:SECRET_KEY::" },
      { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.django.arn}:DATABASE_URL::" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.backend.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

# ── ECS services ─────────────────────────────────────────────────────────────

resource "aws_ecs_service" "frontend" {
  name            = "${var.app_name}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_frontend.id]
    assign_public_ip = true # required to pull images from ECR without a NAT gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.frontend]
}

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_backend.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.backend_https]
}
