FROM python:3.10.12

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt requirements.txt
COPY init_django.sh .

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get update && apt-get -y install postgresql-client
RUN apt-get -y install tree
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
RUN pip install adrf
RUN chmod +x init_django.sh

# Create a shared directory between the blockchain and the backend
RUN mkdir /blockchain_shared
CMD ["./init_django.sh"]
