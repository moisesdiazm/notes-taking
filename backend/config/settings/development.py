from .base import *  # noqa

DEBUG = True

DATABASES = {
    'default': env.db('DATABASE_URL', default='postgres://notes:notes@localhost:5432/notes'),
}

CORS_ALLOW_ALL_ORIGINS = True
