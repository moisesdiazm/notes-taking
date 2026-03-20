resource "aws_secretsmanager_secret" "django" {
  name = "${var.app_name}/${var.environment}/django"
}

resource "aws_secretsmanager_secret_version" "django" {
  secret_id = aws_secretsmanager_secret.django.id

  secret_string = jsonencode({
    SECRET_KEY   = var.django_secret_key
    DATABASE_URL = "postgres://notes:${var.db_password}@${aws_db_instance.postgres.address}:5432/notes"
  })
}
