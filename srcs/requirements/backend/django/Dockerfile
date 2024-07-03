FROM python:3.10.12

ENV PYTHONUNBUFFERED=1

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install postgresql-client
RUN apt-get -y install tree

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install channels channels_redis

COPY init_django.sh .

RUN chmod +x init_django.sh

CMD ["./init_django.sh"]