# ── Backend ALB certificate (deployment region) ───────────────────────────────
# Covers api.<domain> — attached to the backend ALB HTTPS listener.

resource "aws_acm_certificate" "api" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_api : r.fqdn]
}

# ── CloudFront certificate (must be us-east-1) ────────────────────────────────
# Covers app.<domain> — attached to the CloudFront distribution.

resource "aws_acm_certificate" "app" {
  provider          = aws.us_east_1
  domain_name       = "app.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "app" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.app.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_app : r.fqdn]
}
