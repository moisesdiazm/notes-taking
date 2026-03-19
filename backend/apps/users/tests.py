from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

User = get_user_model()


class CustomUserModelTests(TestCase):

    def test_create_user_with_email(self):
        user = User.objects.create_user(email='test@example.com', password='pass1234')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('pass1234'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_normalizes_email(self):
        # normalize_email lowercases the domain only, not the local part
        user = User.objects.create_user(email='Test@EXAMPLE.COM', password='pass1234')
        self.assertEqual(user.email, 'Test@example.com')

    def test_create_user_without_email_raises(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='pass1234')

    def test_create_superuser(self):
        user = User.objects.create_superuser(email='admin@example.com', password='pass1234')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_str_returns_email(self):
        user = User.objects.create_user(email='hello@example.com', password='pass1234')
        self.assertEqual(str(user), 'hello@example.com')


class LoginViewTests(APITestCase):

    def setUp(self):
        self.url = reverse('auth-login')
        self.user = User.objects.create_user(
            email='user@example.com',
            password='securepass123',
        )

    def test_login_with_valid_credentials(self):
        response = self.client.post(self.url, {
            'email': 'user@example.com',
            'password': 'securepass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_wrong_password(self):
        response = self.client.post(self.url, {
            'email': 'user@example.com',
            'password': 'wrongpassword',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_nonexistent_email(self):
        response = self.client.post(self.url, {
            'email': 'nobody@example.com',
            'password': 'securepass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post(self.url, {
            'email': 'user@example.com',
            'password': 'securepass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_email(self):
        response = self.client.post(self.url, {'password': 'securepass123'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_password(self):
        response = self.client.post(self.url, {'email': 'user@example.com'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_empty_body(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_method_not_allowed(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
