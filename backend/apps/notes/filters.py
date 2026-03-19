import django_filters
from .models import Note


class NoteFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__id', lookup_expr='exact')

    class Meta:
        model = Note
        fields = ['category']
