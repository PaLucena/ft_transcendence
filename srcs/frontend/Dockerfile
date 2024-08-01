FROM nginx:bullseye

RUN mkdir -p /var/www/html/

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 4000

CMD ["nginx", "-g", "daemon off;"]
