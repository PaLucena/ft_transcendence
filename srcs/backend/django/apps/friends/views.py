from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from user.models import AppUser
from friends.models import Friend
from user.decorators import default_authentication_required
from rtchat.views import create_private_chat_if_not_exists

STATUS_ACCEPTED = "accepted"
STATUS_NO_RELATION = "no_relation"
STATUS_INCOMING = "incoming"
STATUS_PENDING = "pending"


def get_friendship_status(user, other_user):
    try:
        friendship = Friend.objects.get(
            Q(from_user=user, to_user=other_user)
            | Q(to_user=user, from_user=other_user)
        )

        if friendship.status == Friend.ACCEPTED:
            return STATUS_ACCEPTED

        if friendship.status == Friend.PENDING and friendship.from_user == other_user:
            return STATUS_INCOMING

        if friendship.status == Friend.PENDING and friendship.from_user == user:
            return STATUS_PENDING

    except Friend.DoesNotExist:
        return STATUS_NO_RELATION


def get_friend_data(user, friend):
    if friend.from_user == user:
        other_user = friend.to_user
    else:
        other_user = friend.from_user

    return {
        "username": other_user.username,
        "is_online": other_user.is_online,
        "other_user_avatar_url": other_user.avatar.url if other_user.avatar else None,
    }


@api_view(["GET"])
@default_authentication_required
def filter_users(request, filter_type):
    user = request.user

    all_users = AppUser.objects.exclude(id=user.id)
    friendships = Friend.objects.filter(Q(from_user=user) | Q(to_user=user))

    if filter_type == "all":
        users_data = [
            {
                "username": other_user.username,
                "friendship_status": get_friendship_status(user, other_user),
                "is_online": other_user.is_online,
                "other_user_avatar_url": (
                    other_user.avatar.url if other_user.avatar else None
                ),
            }
            for other_user in all_users
        ]

    elif filter_type == "my_friends":
        friends = friendships.filter(status=Friend.ACCEPTED)
        users_data = [get_friend_data(user, friend) for friend in friends]

    elif filter_type == "pending_requests":
        pending_requests = friendships.filter(from_user=user, status=Friend.PENDING)
        users_data = [
            {
                "username": friend.to_user.username,
                "other_user_avatar_url": (
                    friend.to_user.avatar.url if friend.to_user.avatar else None
                ),
            }
            for friend in pending_requests
        ]

    elif filter_type == "incoming_requests":
        incoming_requests = friendships.filter(to_user=user, status=Friend.PENDING)
        users_data = [
            {
                "username": friend.from_user.username,
                "other_user_avatar_url": (
                    friend.from_user.avatar.url if friend.from_user.avatar else None
                ),
            }
            for friend in incoming_requests
        ]

    else:
        return Response(
            {"detail": "Invalid filter type"}, status=status.HTTP_404_NOT_FOUND
        )

    users_data.sort(key=lambda x: x["username"].lower())

    return Response({"users": users_data}, status=status.HTTP_200_OK)


@api_view(["POST"])
@default_authentication_required
def invite_friend(request):
    username = request.data.get("username")

    if not username:
        return Response(
            {"detail": "Friend username required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(username=username)
    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

    if Friend.objects.filter(
        Q(from_user=request.user, to_user=friend)
        | Q(from_user=friend, to_user=request.user)
    ).first():
        return Response(
            {"detail": "Friend request already exists"}, status=status.HTTP_409_CONFLICT
        )

    Friend.objects.create(from_user=request.user, to_user=friend)
    return Response(
        {"detail": "Friend request sent successfully"}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@default_authentication_required
def accept_invitation(request):
    username = request.data.get("username")

    if not username:
        return Response(
            {"detail": "Friend username required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(username=username)
    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

    try:
        friend_request = Friend.objects.get(
            from_user=friend, to_user=request.user, status=0
        )

        friend_request.status = 1
        friend_request.save()

        create_private_chat_if_not_exists(request.user, friend)

        return Response(
            {"detail": "Friend request accepted successfully"},
            status=status.HTTP_200_OK,
        )
    except Friend.DoesNotExist:
        return Response(
            {"detail": "No pending friend request from this user"},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["POST"])
@default_authentication_required
def remove_friend(request):
    friend_username = request.data.get("username")

    if not friend_username:
        return Response(
            {"detail": "Friend username required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(username=friend_username)
    except AppUser.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

    friendship = Friend.objects.filter(
        Q(from_user=request.user, to_user=friend)
        | Q(to_user=request.user, from_user=friend)
    )

    if not friendship.exists():
        return Response(
            {"detail": "Friendship does not exist"}, status=status.HTTP_404_NOT_FOUND
        )

    friendship.delete()
    return Response(
        {"detail": "Friend successfully removed"}, status=status.HTTP_200_OK
    )


@api_view(["GET"])
@default_authentication_required
def search_friends(request):
    user = request.user
    query = request.GET.get("query", "").strip().lower()
    filter_type = request.GET.get("filter", "all")

    all_users = AppUser.objects.exclude(id=user.id)
    friendships = Friend.objects.filter(Q(from_user=user) | Q(to_user=user))

    if filter_type == "all":
        users_data = [
            {
                "username": other_user.username,
                "friendship_status": get_friendship_status(user, other_user),
                "is_online": other_user.is_online,
                "other_user_avatar_url": (
                    other_user.avatar.url if other_user.avatar else None
                ),
            }
            for other_user in all_users.filter(username__icontains=query)
        ]

    elif filter_type == "my_friends":
        friends = friendships.filter(status=Friend.ACCEPTED).filter(
            Q(from_user__username__icontains=query)
            | Q(to_user__username__icontains=query)
        )
        users_data = [get_friend_data(user, friend) for friend in friends]

    elif filter_type == "pending_requests":
        pending_requests = friendships.filter(
            from_user=user, status=Friend.PENDING
        ).filter(to_user__username__icontains=query)
        users_data = [
            {
                "username": friend.to_user.username,
                "other_user_avatar_url": (
                    friend.to_user.avatar.url if friend.to_user.avatar else None
                ),
            }
            for friend in pending_requests
        ]

    elif filter_type == "incoming_requests":
        incoming_requests = friendships.filter(
            to_user=user, status=Friend.PENDING
        ).filter(from_user__username__icontains=query)
        users_data = [
            {
                "username": friend.from_user.username,
                "other_user_avatar_url": (
                    friend.from_user.avatar.url if friend.from_user.avatar else None
                ),
            }
            for friend in incoming_requests
        ]

    else:
        return Response(
            {"detail": "Invalid filter type"}, status=status.HTTP_404_NOT_FOUND
        )

    users_data.sort(key=lambda x: x["username"].lower())

    return Response({"users": users_data}, status=status.HTTP_200_OK)
