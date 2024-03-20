#!/usr/bin/env bash

set -e

RUN_MANAGE_PY='poetry run python -m mytenderweb.manage'

echo 'Collecting static files...'
$RUN_MANAGE_PY collectstatic --no-input


echo 'Starting Gunicorn server...'
exec poetry run gunicorn mytenderweb.project.wsgi:application --bind 0.0.0.0:8000
