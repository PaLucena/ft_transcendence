FROM nginx:bullseye

RUN mkdir -p /var/www/html/

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
