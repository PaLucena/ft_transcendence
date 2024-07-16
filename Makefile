USER := $(shell echo $$USER)
CONTAINERS_DIR := /home/$(USER)/data

all:
	-@ echo "CONTAINERS DIRECTORY: $(CONTAINERS_DIR)"
	-@ mkdir -p $(CONTAINERS_DIR) $(CONTAINERS_DIR)/db_volume
	-@ docker-compose -f srcs/docker-compose.yml up --build

clean:
	-@ rm -rf $(CONTAINERS_DIR)/db_volume
	-@ docker stop $$(docker ps -qa); docker rm $$(docker ps -qa); docker rmi -f $$(docker images -qa); docker volume rm $$(docker volume ls -q); docker network rm $$(docker network ls -q) 2>/dev/null

re: clean all

.PHONY: all clean re
