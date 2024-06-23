FROM python:3.10.12

ENV PYTHONUNBUFFERED=1

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install postgresql-client

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY init_django.sh .

RUN chmod +x init_django.sh

CMD ["./init_django.sh"]