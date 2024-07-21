#!/bin/sh

if [ ! -f "$CERT_PATH" ] && [ ! -f "$CERTKEY_PATH" ]; then
	# create the directory where we will have the ssl crt and key
    mkdir -p /etc/nginx/ssl

	# create the ssl certificate and key
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 -out $CERT_PATH -keyout $CERTKEY_PATH -subj "/C=SP/ST=Andalucia/L=Malaga/O=42/OU=42/CN=$DOM_NAME/UID=$LOGIN"

    echo "SSL certificate and key generated."
else
    echo "SSL certificate and key already exist. Skipping generation."
fi

# replace hostname, crt and key paths in the nginx.conf file
sed -i "s/dom_name/localhost/" /etc/nginx/nginx.conf
sed -i "s#cert_path#$CERT_PATH#g" /etc/nginx/nginx.conf
sed -i "s#certkey_path#$CERTKEY_PATH#g" /etc/nginx/nginx.conf

# disable daemon for nginx (necessary for Docker)
nginx -g "daemon off;"
