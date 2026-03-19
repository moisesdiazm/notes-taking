from django.db import migrations

CATEGORIES = [
    {'id': 'random-thoughts', 'name': 'Random Thoughts', 'color': '#EF9C66'},
    {'id': 'school', 'name': 'School', 'color': '#FCDCA0'},
    {'id': 'personal', 'name': 'Personal', 'color': '#78ABA8'},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('notes', 'Category')
    for data in CATEGORIES:
        Category.objects.get_or_create(id=data['id'], defaults={
            'name': data['name'],
            'color': data['color'],
        })


def unseed_categories(apps, schema_editor):
    Category = apps.get_model('notes', 'Category')
    Category.objects.filter(id__in=[c['id'] for c in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
