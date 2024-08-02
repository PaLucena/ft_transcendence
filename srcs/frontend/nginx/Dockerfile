FROM nginx:bullseye

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install wget unzip

RUN mkdir -p /var/www/html/

RUN wget https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip -O bootstrap.zip
RUN unzip bootstrap.zip -d /var/www/html/

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
