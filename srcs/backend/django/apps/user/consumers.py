from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from user.models import AppUser
from rtchat.models import InviteUser, InviteRoom


class UserSocketConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if self.user is None or not self.user.is_authenticated:
            await self.send_error(401, "User is not authenticated.")
            await self.close()
            return

        self.notification_group_name = f"notification-{self.user.username}"
        self.online_status_group_name = "online-status"

        try:
            await self.channel_layer.group_add(
                self.online_status_group_name, self.channel_name
            )
            await self.channel_layer.group_add(
                self.notification_group_name, self.channel_name
            )

            await self.accept()

            await self.add_user_to_online_list(self.user)
            await self.send_online_users_list()

        except Exception as e:
            await self.channel_layer.group_discard(
                self.online_status_group_name, self.channel_name
            )
            await self.channel_layer.group_discard(
                self.notification_group_name, self.channel_name
            )

            await self.send_error(500, f"Failed to connect: {str(e)}")
            await self.close()

    @database_sync_to_async
    def find_invite_room_for_user(self, user):
        try:
            invite_users = InviteUser.objects.filter(user=user)
            rooms = invite_users.values_list(
                "invite_room__group_name", flat=True
            ).distinct()
            return list(rooms)
        except Exception as e:
            raise Exception(f"Failed to find invite rooms for user: {str(e)}")

    async def disconnect(self, close_code):
        if self.user is not None and self.user.is_authenticated:
            await self.remove_user_from_online_list(self.user)
            rooms = await self.find_invite_room_for_user(self.user)
            if rooms:
                print("Invite rooms for user:", ", ".join(rooms))
                for room in rooms:
                    await self.handle_invite_response_1x1("reject", room)
                    await self.channel_layer.group_discard(room, self.channel_name)

        await self.channel_layer.group_discard(
            self.online_status_group_name, self.channel_name
        )
        await self.channel_layer.group_discard(
            self.notification_group_name, self.channel_name
        )
        await self.send_online_users_list()

    async def receive_json(self, data):
        action = data.get("action")

        if action == "notification":
            await self.handle_notification(data)
        elif action == "invitation_1x1":
            await self.handle_1x1(data)
        else:
            await self.send_error(400, "Unknown UserSocket action.")

    async def handle_1x1(self, data):
        invitation_1x1_type = data.get("type")
        group_name = data.get("group_name")

        if not invitation_1x1_type:
            await self.send_error(400, "Missing type field.")
            return

        if not group_name:
            await self.send_error(400, "Missing group_name field.")
            return

        if invitation_1x1_type == "connect":
            await self.handle_connection_response_1x1(invitation_1x1_type, group_name)
        elif invitation_1x1_type in ["accept", "reject"]:
            await self.handle_invite_response_1x1(invitation_1x1_type, group_name)
        else:
            await self.send_error(404, f"1x1 type '{invitation_1x1_type}' not found.")

    async def handle_connection_response_1x1(self, invitation_1x1_type, group_name):
        try:
            await self.channel_layer.group_add(group_name, self.channel_name)

            invite_data = await self.get_1x1_data(group_name)

            if not invite_data:
                await self.send_error(404, "Invite requires exactly 2 users.")
                return

            current_user = self.scope["user"]

            await self.send_json(
                {
                    "invitation_1x1": {
                        "type": invitation_1x1_type,
                        "players": invite_data,
                        "current_user": current_user.username,
                        "group_name": group_name,
                    }
                }
            )
        except InviteRoom.DoesNotExist as e:
            await self.send_error(404, str(e))
        except ValueError as e:
            await self.send_error(400, str(e))
        except Exception as e:
            await self.send_error(500, f"Unexpected error: {str(e)}")

    async def handle_invite_response_1x1(self, invitation_1x1_type, group_name):
        try:
            invite_data = await self.get_1x1_data(group_name)

            if not invite_data:
                await self.send_error(404, "Invite requires exactly 2 users.")
                return

            current_user = self.scope["user"]
            new_status = 1 if invitation_1x1_type == "accept" else -1

            for player in invite_data:
                if player["username"] == current_user.username:
                    if player["status"] == new_status:
                        await self.send_error(
                            400,
                            f"You have already {invitation_1x1_type}ed the invitation.",
                        )
                        return

                    await self.update_invite_status(
                        group_name, current_user, new_status
                    )
                    break
            else:
                await self.send_error(404, "User not found in the invite.")
                return

            updated_invite_data = await self.get_1x1_data(group_name)

            await self.send_1x1_update(
                group_name, invitation_1x1_type, updated_invite_data
            )

            if invitation_1x1_type == "reject":
                await self.delete_invite_room(group_name)

        except Exception as e:
            await self.send_error(
                500, f"Failed to {invitation_1x1_type} invitation: {str(e)}"
            )

    async def handle_notification(self, data):
        notification_type = data.get("type")
        to_user = data.get("to_user")

        if not notification_type:
            await self.send_error(400, "Missing type field.")
            return

        if not to_user:
            await self.send_error(400, "Missing to_user field.")
            return

        if not await self.user_exists(to_user):
            await self.send_error(404, f"User '{to_user}' not found.")
            return

        if notification_type in ["friend_invite", "friend_accept", "friend_cancel"]:
            message = self.get_friend_notification_message(notification_type)
            if not message:
                await self.send_error(
                    400, f"Invalid notification type '{notification_type}'."
                )
                return

            await self.send_notification(notification_type, to_user, message)
        elif notification_type in ["1x1_invite"]:
            group_name_1x1 = data.get("group_name")

            if not group_name_1x1:
                await self.send_error(400, "Missing group_name_1x1 field.")
                return

            if not await self.group_1x1_exists(group_name_1x1):
                await self.send_error(404, f"Group '{group_name_1x1}' not found.")
                return

            await self.send_notification(notification_type, to_user, group_name_1x1)
        else:
            await self.send_error(
                404, f"Notification type '{notification_type}' not found."
            )

    async def send_1x1_update(
        self, group_name, invitation_1x1_type, updated_invite_data
    ):
        try:
            event = {
                "type": "invitation_1x1_update",
                "invitation_1x1": {
                    "type": invitation_1x1_type,
                    "players": updated_invite_data,
                    "invitation_author": "",
                },
            }
            await self.channel_layer.group_send(group_name, event)
        except Exception as e:
            await self.send_error(500, f"Failed to send 1x1 update: {str(e)}")

    async def send_notification(self, notification_type, username, message):
        try:
            group_name = f"notification-{username}"
            event = {
                "type": "user.notification",
                "notification": {
                    "type": notification_type,
                    "message": message,
                },
            }
            await self.channel_layer.group_send(group_name, event)
        except Exception as e:
            await self.send_error(500, f"Failed to send notification: {str(e)}")

    def get_friend_notification_message(self, notification_type):
        if notification_type == "friend_invite":
            return f"You have a new friend invite from {self.user.username}!"
        elif notification_type == "friend_accept":
            return f"{self.user.username} has accepted your friend request!"
        elif notification_type == "friend_cancel":
            return f"{self.user.username} has canceled the friend request!"
        return None

    @database_sync_to_async
    def delete_invite_room(self, group_name):
        try:
            room = InviteRoom.objects.get(group_name=group_name)
            room.delete()
        except InviteRoom.DoesNotExist:
            raise InviteRoom.DoesNotExist(f"Room '{group_name}' does not exist.")
        except Exception as e:
            raise Exception(f"Failed to delete room: {str(e)}")

    @database_sync_to_async
    def update_invite_status(self, group_name, user, status):
        invite_user = InviteUser.objects.get(
            invite_room__group_name=group_name, user=user
        )
        invite_user.status = status
        invite_user.save()

    @database_sync_to_async
    def user_exists(self, username):
        return AppUser.objects.filter(username=username).exists()

    @database_sync_to_async
    def group_1x1_exists(self, group_name):
        return InviteRoom.objects.filter(group_name=group_name).exists()

    @database_sync_to_async
    def get_1x1_data(self, group_name):
        try:
            invite_room = InviteRoom.objects.get(group_name=group_name)

            invite_users = list(invite_room.invite_users.select_related("user").all())
            if len(invite_users) != 2:
                raise ValueError("Invite requires exactly 2 users.")

            players = [
                {
                    "id": invite_users[0].user.id,
                    "username": invite_users[0].user.username,
                    "avatar": (
                        invite_users[0].user.avatar.url
                        if invite_users[0].user.avatar
                        else None
                    ),
                    "status": invite_users[0].status,
                    "is_author": (
                        1
                        if invite_room.author.username == invite_users[0].user.username
                        else 0
                    ),
                },
                {
                    "id": invite_users[1].user.id,
                    "username": invite_users[1].user.username,
                    "avatar": (
                        invite_users[1].user.avatar.url
                        if invite_users[1].user.avatar
                        else None
                    ),
                    "status": invite_users[1].status,
                    "is_author": (
                        1
                        if invite_room.author.username == invite_users[1].user.username
                        else 0
                    ),
                },
            ]

            return players

        except InviteRoom.DoesNotExist:
            raise InviteRoom.DoesNotExist(
                f"InviteRoom with group_name '{group_name}' does not exist."
            )

        except IndexError:
            raise ValueError("Invite data is incomplete or corrupt.")

        except Exception as e:
            raise Exception(f"An unexpected error occurred: {str(e)}")

    async def user_notification(self, event):
        try:
            notification = event.get("notification")
            await self.send_json({"notification": notification})
        except Exception as e:
            await self.send_error(
                500, f"Failed to send notification users list: {str(e)}"
            )

    async def invitation_1x1_update(self, event):
        try:
            invitation_1x1 = event.get("invitation_1x1")
            if not invitation_1x1:
                await self.send_error(400, "Missing invitation_1x1 data.")
                return

            await self.send_json({"invitation_1x1": invitation_1x1})

        except Exception as e:
            await self.send_error(500, f"Failed to send 1x1 update: {str(e)}")

    async def send_online_users_list(self):
        try:
            online_users = await self.get_online_users()
            event = {
                "type": "update_online_users_list",
                "online_users": online_users,
            }
            await self.channel_layer.group_send(self.online_status_group_name, event)
        except Exception as e:
            await self.send_error(500, f"Failed to send online users list: {str(e)}")

    async def update_online_users_list(self, event):
        try:
            await self.send_json(
                {"online_users": event["online_users"]},
            )
        except Exception as e:
            await self.send_error(500, f"Failed to update online users list: {str(e)}")

    @database_sync_to_async
    def add_user_to_online_list(self, user):
        user.refresh_from_db()
        user.is_online = True
        user.save()

    @database_sync_to_async
    def remove_user_from_online_list(self, user):
        user.refresh_from_db()
        user.is_online = False
        user.save()

    @database_sync_to_async
    def get_online_users(self):
        return list(
            AppUser.objects.filter(is_online=True).values_list("username", flat=True)
        )

    async def send_error(self, code, message):
        await self.send_json(
            {
                "error": True,
                "errorCode": code,
                "errorMessage": message,
            }
        )
