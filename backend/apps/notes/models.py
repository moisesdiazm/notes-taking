from django.db import models
from django.conf import settings


class Category(models.Model):
    id = models.SlugField(primary_key=True, max_length=50)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7)  # hex e.g. #EF9C66

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Note(models.Model):
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notes',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f'Note {self.pk}'
