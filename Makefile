USER := $(shell echo $$USER)
CONTAINERS_DIR := /home/$(USER)/data
DJANGO_MEDIA := ./srcs/backend/django/apps/media

GID := $(shell id -g)
UID := $(shell id -u)

all:
	-@ echo GID: $(GID), UID: $(UID)
	-@ mkdir -p $(CONTAINERS_DIR) $(CONTAINERS_DIR)/db_volume
	-@ UID=$(UID) GID=$(GID) docker-compose -f docker-compose.yml up --build -d

up:
	-@ docker-compose -f docker-compose.yml up -d

down:
	-@ docker-compose -f docker-compose.yml down

stop:
	-@ docker-compose -f docker-compose.yml stop

logs:
	-@ docker-compose -f docker-compose.yml logs -f

clean: down
	-@ rm -rf $(CONTAINERS_DIR)/db_volume
	-@ rm -rf $(DJANGO_MEDIA)/avatars $(DJANGO_MEDIA)/qrs
	-@ docker rmi -f $$(docker images -qa); docker volume rm $$(docker volume ls -q); docker network rm $$(docker network ls -q) 2>/dev/null
	-@ clear
	-@ echo "Transcendence cleaned"

re: clean all

debug: all logs

re-debug: clean debug

.PHONY: all stop down logs clean up re debug re-debug
