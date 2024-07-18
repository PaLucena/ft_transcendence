SRCS_PATH=$(shell pwd)/srcs
USER := $(shell echo $$USER)
CONTAINERS_DIR := /home/$(USER)/data

all:
	-@ mkdir -p $(CONTAINERS_DIR) $(CONTAINERS_DIR)/db_volume
	-@ SRCS_PATH=$(SRCS_PATH) docker-compose -f srcs/docker-compose.yml up --build -d

up:
	-@ SRCS_PATH=$(SRCS_PATH) docker-compose -f srcs/docker-compose.yml up -d

down:
	-@ SRCS_PATH=$(SRCS_PATH) docker-compose -f srcs/docker-compose.yml down

stop:
	-@ SRCS_PATH=$(SRCS_PATH) docker-compose -f srcs/docker-compose.yml stop

logs:
	-@ SRCS_PATH=$(SRCS_PATH) docker-compose -f srcs/docker-compose.yml logs -f

clean: down
	-@ rm -rf $(CONTAINERS_DIR)/db_volume
	-@ docker rmi -f $$(docker images -qa); docker volume rm $$(docker volume ls -q); docker network rm $$(docker network ls -q) 2>/dev/null
	-@ clear
	-@ echo "Transcendence cleaned"

re: clean all

.PHONY: all stop down logs clean up re
