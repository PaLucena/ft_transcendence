#!/bin/sh

STATUS=1

# Esperar a que la base de datos esté lista
while [ $STATUS -ne 0 ]; do
    pg_isready -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER
    STATUS=$?

    if [ $STATUS -eq 0 ]; then
        echo "Database is ready"
    else
        sleep 1
    fi
done

# Esperar a que la blockchain esté lista
echo "Waiting for blockchain to be ready..."
while [ ! -f ./blockchain_shared/pong_contract.json ]; do
    sleep 1
done
echo "Blockchain is ready"


# Aplicar migraciones
python3 /app/manage.py makemigrations
python3 /app/manage.py migrate


# Create superusue if not exist
# djangouser=$(python3 /app/manage.py shell -c "from django.conf import settings; from django.apps import apps; UserModel = apps.get_model(settings.AUTH_USER_MODEL); print('True' if UserModel.objects.filter(username='admin').exists() else 'False')")
# if [ "$djangouser" = "False" ]; then
#     echo "Creating new user"
#     python3 /app/manage.py createsuperuser --noinput --username admin --email admin@admin.com
# fi

# Checking if a public chat exists
chatgroup_exists=$(python3 /app/manage.py shell -c "from rtchat.models import ChatGroup; print('True' if ChatGroup.objects.filter(group_name='public-chat').exists() else 'False')")

# If public-chat Group dosn't exist, create it
if [ "$chatgroup_exists" = "False" ]; then
    echo "Creating chat group 'public-chat'"
    python3 /app/manage.py shell -c "from rtchat.models import ChatGroup; ChatGroup.objects.create(group_name='public-chat')"
else
    echo "Chat group 'public-chat' already exists"
fi

# Create 10 random users for test app
# python3 /app/manage.py create_random_users

# Ejecutar el servidor
python3 /app/manage.py runserver 0.0.0.0:8000

