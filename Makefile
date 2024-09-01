USER := $(shell echo $$USER)
DJANGO_MEDIA := ./srcs/backend/django/apps/media

sys = $(shell uname)


ifeq ($(sys), Linux)
	CONTAINERS_DIR := /home/$(USER)/data
else
	CONTAINERS_DIR := /Users/$(USER)/data
endif


all:
	-@ echo "Containers directory is set to: $(CONTAINERS_DIR)"
	-@ mkdir -p $(CONTAINERS_DIR) $(CONTAINERS_DIR)/db_volume
	-@ DATABASE_CONTAINER_PATH=$(CONTAINERS_DIR) docker-compose -f docker-compose.yml up --build -d

up:
	-@ docker-compose -f docker-compose.yml up -d

down:
	-@ docker-compose -f docker-compose.yml down

stop:
	-@ docker-compose -f docker-compose.yml stop

logs:
	-@ docker-compose -f docker-compose.yml logs -f

clean: down
	-@ rm -rf $(CONTAINERS_DIR)/db_volume $(CONTAINERS_DIR)
	-@ rm -rf $(DJANGO_MEDIA)/avatars $(DJANGO_MEDIA)/qrs
	-@ docker rmi -f $$(docker images -qa); docker volume rm $$(docker volume ls -q); docker network rm $$(docker network ls -q) 2>/dev/null
	-@ clear
	-@ echo "Transcendence cleaned"

re: clean all

debug: all logs

re-debug: clean debug

.PHONY: all stop down logs clean up re debug re-debug
