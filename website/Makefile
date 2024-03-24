install:
	poetry install

runserver:
	poetry run python -m mytenderweb.manage runserver

install-pre-commit:
	poetry run pre-commit uninstall
	poetry run pre-commit install

lint :
	poetry run pre-commit run --all-files

update: install install-pre-commit ;

up-dependencies-only:
	
	docker-compose -f docker-compose-dev.yml up -d --force-recreate
