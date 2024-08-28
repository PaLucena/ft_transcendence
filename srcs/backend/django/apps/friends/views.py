from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from user.models import AppUser
from friends.models import Friend
from user.decorators import default_authentication_required


# CBV has to be created to not repeat code
@api_view(["POST"])
@default_authentication_required
def invite_friend(request):
    username = request.data.get("username")
    if not username:
        return Response(
            {"error": "Friend username required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(username=username)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    if Friend.objects.filter(from_user=request.user, to_user=friend).exists():
        return Response(
            {"error": "Friend request already sent"}, status=status.HTTP_409_CONFLICT
        )

    Friend.objects.create(from_user=request.user, to_user=friend)
    return Response(
        {"message": "Friend request sent successfully."}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@default_authentication_required
def accept_friend_request(request):
    try:
        friendship_request = Friend.objects.get(to_user=request.user)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get("action")

    if friendship_request is None:
        return Response(
            {"error": "Missing friendship ID."}, status=status.HTTP_400_BAD_REQUEST
        )

    if friendship_request.to_user == request.user:
        # friendship_request.to_user.friends.add(friendship_request.from_user)
        # friendship_request.user.from_user.add(friendship_request.to_user)
        friendship_request.status = Friend.ACCEPTED
        friendship_request.save()
        return Response(
            {"message": "Friend request accepted."}, status=status.HTTP_200_OK
        )
    else:
        friendship_request.delete()
        return Response(
            {"message": "Friend request not accepted."}, status=status.HTTP_200_OK
        )


@api_view(["DELETE"])
@default_authentication_required
def remove_friend(request):
    friend_username = request.data.get("username")
    if not friend_username:
        return Response(
            {"error": "Friend username required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        friend = AppUser.objects.get(username=friend_username)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

    friendship = Friend.objects.filter(
        from_user=request.user, to_user=friend
    ) | Friend.objects.filter(to_user=friend, from_user=request.user)

    if not friendship.exists():
        return Response(
            {"error": "Friendship does not exist."}, status=status.HTTP_404_NOT_FOUND
        )

    friendship.delete()
    return Response(
        {"message": "Friend successfully removed."}, status=status.HTTP_204_NO_CONTENT
    )


@api_view(["GET"])
@default_authentication_required
def get_friends(request):
    user = request.user
    all_friends = []
    online_friends = []

    friendships = Friend.objects.filter(
        Q(from_user=user) | Q(to_user=user), status=Friend.ACCEPTED
    )

    for friendship in friendships:
        friend = (
            friendship.to_user if friendship.from_user == user else friendship.from_user
        )
        all_friends.append(friend)
        if friend.is_online:
            online_friends.append(friend)

    all_friends_data = [
        {
            "username": friend.username,
            "status": friend.is_online,
        }
        for friend in all_friends
    ]
    online_friends_data = [{"username": friend.username} for friend in online_friends]

    response_data = {
        "all_friends": all_friends_data,
        "online_friends": online_friends_data,
    }

    return Response(response_data, status=status.HTTP_200_OK)
