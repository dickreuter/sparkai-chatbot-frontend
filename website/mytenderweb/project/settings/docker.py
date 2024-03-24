import os

if IN_DOCKER or os.path.isfile('/.dockerenv'):  # type: ignore # noqa: F821
    # We need it to serve static files with DEBUG=False
    assert MIDDLEWARE[:1] == [  # type: ignore # noqa: F821
        'django.middleware.security.SecurityMiddleware'
    ]

    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')  # type: ignore # noqa: F821
    


STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'mytenderweb\static')

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'