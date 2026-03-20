# ── Frontend ALB ──────────────────────────────────────────────────────────────
# Receives HTTP from CloudFront only (enforced via X-CloudFront-Secret header).
# No HTTPS needed here — CloudFront terminates TLS at the edge.

resource "aws_lb" "frontend" {
  name               = "${var.app_name}-frontend"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_frontend.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.app_name}-frontend"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# Reject any request that doesn't carry the CloudFront secret header
resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.frontend.arn
  port              = 80
  protocol          = "HTTP"

  # Default: block direct access
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Forbidden"
      status_code  = "403"
    }
  }
}

resource "aws_lb_listener_rule" "frontend_cloudfront" {
  listener_arn = aws_lb_listener.frontend.arn
  priority     = 1

  condition {
    http_header {
      http_header_name = "X-CloudFront-Secret"
      values           = [var.cloudfront_secret]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# ── Backend ALB ───────────────────────────────────────────────────────────────
# Terminates HTTPS directly — no CloudFront in front of the API.

resource "aws_lb" "backend" {
  name               = "${var.app_name}-backend"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_backend.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.app_name}-backend"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/api/categories/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# HTTP → HTTPS redirect
resource "aws_lb_listener" "backend_http" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS listener with ACM certificate
resource "aws_lb_listener" "backend_https" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.api.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}
