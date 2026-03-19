from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.notes.models import Category, Note

User = get_user_model()

DEMO_EMAIL = 'demo@example.com'
DEMO_PASSWORD = 'demo1234'

SEED_NOTES = [
    {
        'title': 'Bucket list',
        'content': 'Travel to Japan, learn to surf, write a novel, see the northern lights...',
        'category_id': 'random-thoughts',
    },
    {
        'title': 'Midterm prep',
        'content': 'Review chapters 4-7, practice problems from the textbook, group study Friday.',
        'category_id': 'school',
    },
    {
        'title': 'Weekend plans',
        'content': 'Call mom, grocery run, fix the leaky faucet, movie night with friends.',
        'category_id': 'personal',
    },
]


class Command(BaseCommand):
    help = 'Seed database with demo user and sample notes'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={'is_active': True},
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created demo user: {DEMO_EMAIL}'))
        else:
            self.stdout.write(f'Demo user already exists: {DEMO_EMAIL}')

        for data in SEED_NOTES:
            note, created = Note.objects.get_or_create(
                user=user,
                title=data['title'],
                defaults={
                    'content': data['content'],
                    'category_id': data['category_id'],
                },
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'{status}: note "{note.title}"')

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
