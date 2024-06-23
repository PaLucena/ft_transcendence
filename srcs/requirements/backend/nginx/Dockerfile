FROM nginx:bullseye

RUN mkdir -p /var/www/html/
RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install openssl wget unzip
RUN wget https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip -O bootstrap.zip
RUN unzip bootstrap.zip -d /var/www/html/
EXPOSE 8080

COPY ./conf/nginx.conf etc/nginx/nginx.conf
COPY ./tools/init_nginx.sh ./init_nginx.sh

RUN chmod +x init_nginx.sh

CMD ["./init_nginx.sh"]