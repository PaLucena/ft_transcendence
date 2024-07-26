FROM redis

RUN apt-get update -y && apt-get upgrade -y \
	&& apt-get install -y bash systemctl

COPY ./conf/redis.conf /usr/local/etc/redis/redis.conf

CMD ["sh", "-c", "sysctl -w vm.overcommit_memory=1 && redis-server /usr/local/etc/redis/redis.conf"]
