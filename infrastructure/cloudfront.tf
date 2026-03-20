# CloudFront sits in front of the frontend ALB.
# It terminates HTTPS at the edge and forwards requests to the ALB over HTTP
# within AWS — no NAT Gateway or public-IP exposure needed for the ALB itself.

locals {
  cf_origin_id = "alb-frontend"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = ["app.${var.domain_name}"]
  price_class     = "PriceClass_100" # US + Europe edge nodes only

  origin {
    domain_name = aws_lb.frontend.dns_name
    origin_id   = local.cf_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # ALB speaks plain HTTP inside VPC
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Secret header so the ALB only accepts requests from CloudFront
    custom_header {
      name  = "X-CloudFront-Secret"
      value = var.cloudfront_secret
    }
  }

  # ── Default behaviour: SSR pages (no caching) ──────────────────────────────
  default_cache_behavior {
    target_origin_id       = local.cf_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin", "Authorization", "Accept", "Accept-Language"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # ── Static assets: cache aggressively (Next.js uses content hashes) ─────────
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = local.cf_origin_id
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 86400    # 1 day
    max_ttl     = 31536000 # 1 year
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.app.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.app]
}
