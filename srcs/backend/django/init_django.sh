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

# Aplicar migraciones
python3 /app/manage.py makemigrations
python3 /app/manage.py migrate

# Crear superusuario si no existe
djangouser=$(python3 /app/manage.py shell -c "from django.conf import settings; from django.apps import apps; UserModel = apps.get_model(settings.AUTH_USER_MODEL); print('True' if UserModel.objects.filter(username='admin').exists() else 'False')")
if [ "$djangouser" = "False" ]; then
    echo "Creating new user"
    python3 /app/manage.py createsuperuser --noinput --username admin --email admin@admin.com
fi

# Ejecutar el servidor
python3 /app/manage.py runserver 0.0.0.0:8000

