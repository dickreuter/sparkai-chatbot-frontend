DEBUG = True
SECRET_KEY = 'django-insecure-f%t@kz71=fb7&)oa&tncd1ec&z9vebi9n!9h^8jaqhx%obvdv2'

LOGGING['formatters']['colored'] = {  # type: ignore
    '()': 'colorlog.ColoredFormatter',
    'format': '%(log_color)s%(asctime)s %(levelname)s %(name)s %(bold_white)s%(message)s',
}

LOGGING['loggers']['core']['level'] = 'DEBUG'  # type: ignore
LOGGING['handlers']['console']['level'] = 'DEBUG'  # type: ignore
LOGGING['handlers']['console']['formatter'] = 'colored'  # type: ignore
