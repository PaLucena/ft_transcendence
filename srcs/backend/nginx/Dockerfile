FROM nginx:bullseye

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install openssl

EXPOSE 8080

COPY ./conf/nginx.conf etc/nginx/nginx.conf
COPY ./tools/init_nginx.sh ./init_nginx.sh

RUN chmod +x init_nginx.sh

CMD ["./init_nginx.sh"]
