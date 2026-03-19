from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Category, Note

User = get_user_model()

CATEGORY_ID = 'random-thoughts'  # seeded by data migration


class CategoryModelTests(TestCase):

    def test_str_returns_name(self):
        category = Category.objects.get(id='school')
        self.assertEqual(str(category), 'School')


class NoteModelTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(email='user@example.com', password='pass1234')

    def test_str_returns_title_when_set(self):
        note = Note.objects.create(title='My Note', user=self.user)
        self.assertEqual(str(note), 'My Note')

    def test_str_returns_fallback_when_no_title(self):
        note = Note.objects.create(user=self.user)
        self.assertEqual(str(note), f'Note {note.pk}')

    def test_note_defaults_to_blank_title_and_content(self):
        note = Note.objects.create(user=self.user)
        self.assertEqual(note.title, '')
        self.assertEqual(note.content, '')

    def test_note_category_nullable(self):
        note = Note.objects.create(user=self.user)
        self.assertIsNone(note.category)

    def test_note_ordering_by_updated_at_descending(self):
        first = Note.objects.create(title='First', user=self.user)
        second = Note.objects.create(title='Second', user=self.user)
        # Touch first note to make it the most recently updated
        first.title = 'First Updated'
        first.save()

        notes = list(Note.objects.filter(user=self.user))
        self.assertEqual(notes[0].pk, first.pk)
        self.assertEqual(notes[1].pk, second.pk)

    def test_note_deleted_when_user_deleted(self):
        Note.objects.create(user=self.user)
        user_id = self.user.pk
        self.user.delete()
        self.assertEqual(Note.objects.filter(user_id=user_id).count(), 0)

    def test_note_category_set_null_when_category_deleted(self):
        category = Category.objects.get(id=CATEGORY_ID)
        note = Note.objects.create(user=self.user, category=category)
        category.delete()
        note.refresh_from_db()
        self.assertIsNone(note.category)


class CategoryListViewTests(APITestCase):

    def setUp(self):
        self.url = reverse('category-list')
        self.user = User.objects.create_user(email='user@example.com', password='pass1234')

    def test_authenticated_user_gets_all_categories(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_category_fields_returned(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        category = response.data[0]
        self.assertIn('id', category)
        self.assertIn('name', category)
        self.assertIn('color', category)

    def test_unauthenticated_request_rejected(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NoteListCreateTests(APITestCase):

    def setUp(self):
        self.url = reverse('note-list')
        self.user = User.objects.create_user(email='user@example.com', password='pass1234')
        self.other_user = User.objects.create_user(email='other@example.com', password='pass1234')

    def test_unauthenticated_request_rejected(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_own_notes(self):
        Note.objects.create(title='Mine', user=self.user)
        Note.objects.create(title='Theirs', user=self.other_user)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Mine')

    def test_list_returns_empty_when_no_notes(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_create_note_assigns_current_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {'title': 'New Note', 'content': 'Hello'})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        note = Note.objects.get(pk=response.data['id'])
        self.assertEqual(note.user, self.user)

    def test_create_note_with_category(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {
            'title': 'School Note',
            'content': 'Content',
            'category': 'school',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['category'], 'school')

    def test_create_note_without_title_or_content(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_note_with_invalid_category(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {'category': 'does-not-exist'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_note_unauthenticated(self):
        response = self.client.post(self.url, {'title': 'Hacked'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_response_includes_expected_fields(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, {'title': 'Test'})
        for field in ('id', 'title', 'content', 'category', 'created_at', 'updated_at'):
            self.assertIn(field, response.data)

    def test_put_method_not_allowed(self):
        note = Note.objects.create(title='Note', user=self.user)
        url = reverse('note-detail', kwargs={'pk': note.pk})
        self.client.force_authenticate(user=self.user)
        response = self.client.put(url, {'title': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class NoteRetrieveUpdateDestroyTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(email='user@example.com', password='pass1234')
        self.other_user = User.objects.create_user(email='other@example.com', password='pass1234')
        self.note = Note.objects.create(title='My Note', content='Body', user=self.user)
        self.url = reverse('note-detail', kwargs={'pk': self.note.pk})

    def test_retrieve_own_note(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'My Note')

    def test_retrieve_other_users_note_returns_404(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_own_note_title(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {'title': 'Updated Title'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertEqual(self.note.title, 'Updated Title')

    def test_patch_own_note_content(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {'content': 'New content'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertEqual(self.note.content, 'New content')

    def test_patch_own_note_category(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {'category': 'personal'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertEqual(self.note.category_id, 'personal')

    def test_patch_own_note_clear_category(self):
        category = Category.objects.get(id=CATEGORY_ID)
        self.note.category = category
        self.note.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {'category': None}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.note.refresh_from_db()
        self.assertIsNone(self.note.category)

    def test_patch_other_users_note_returns_404(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(self.url, {'title': 'Hijacked'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_own_note(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(pk=self.note.pk).exists())

    def test_delete_other_users_note_returns_404(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Note.objects.filter(pk=self.note.pk).exists())

    def test_retrieve_unauthenticated_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NoteCategoryFilterTests(APITestCase):

    def setUp(self):
        self.url = reverse('note-list')
        self.user = User.objects.create_user(email='user@example.com', password='pass1234')
        self.school = Category.objects.get(id='school')
        self.personal = Category.objects.get(id='personal')

    def test_filter_by_category_returns_matching_notes(self):
        Note.objects.create(title='School Note', user=self.user, category=self.school)
        Note.objects.create(title='Personal Note', user=self.user, category=self.personal)
        Note.objects.create(title='No Category', user=self.user)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'category': 'school'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'School Note')

    def test_filter_by_nonexistent_category_returns_empty(self):
        Note.objects.create(title='School Note', user=self.user, category=self.school)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'category': 'nonexistent'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_no_filter_returns_all_user_notes(self):
        Note.objects.create(user=self.user, category=self.school)
        Note.objects.create(user=self.user, category=self.personal)
        Note.objects.create(user=self.user)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_filter_does_not_leak_other_users_notes(self):
        other_user = User.objects.create_user(email='other@example.com', password='pass1234')
        Note.objects.create(user=other_user, category=self.school)
        Note.objects.create(title='Mine', user=self.user, category=self.school)

        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url, {'category': 'school'})

        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Mine')
