from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status


def room(request, room_name):
    return Response(
        {
            "room_name": room_name,
        },
        status=status.HTTP_200_OK,
    )
