#!/bin/sh

STATUS=1

while [ $STATUS -ne 0 ]; do
	pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER
	STATUS=$?

	if [ $STATUS -eq 0 ]; then
		echo "Database is ready"
	else
		sleep 1
	fi
done

python3 /app/manage.py makemigrations --no-input
python3 /app/manage.py migrate --no-input
djangouser=$(python3 /app/manage.py shell -c "from django.contrib.auth.models import User; print('True' if User.objects.filter(username='admin').exists() else 'False')")
if [ "$djangouser" = "False" ]; then
	python3 /app/manage.py createsuperuser --noinput --username admin --email admin@admin.com
fi
modelcreated=$(python3 /app/manage.py shell -c "from counter.models import Click; print('True' if Click.objects.filter(id=1).exists() else 'False')")
if [ "$modelcreated" = "False" ]; then
	python3 /app/manage.py shell -c "from counter.models import Click; click = Click.objects.create(count=0); click.save()"
fi
python3 /app/manage.py runserver 0.0.0.0:8000
