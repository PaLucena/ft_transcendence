FROM redis

RUN groupadd -g ${GID} mygroup && \
    useradd -m -u ${UID} -g ${GID} myuser

USER myuser

RUN apt-get update -y && apt-get upgrade -y

COPY ./conf/redis.conf /usr/local/etc/redis/redis.conf

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
