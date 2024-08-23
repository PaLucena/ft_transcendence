from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from user.models import AppUser
from rtchat.models import ChatGroup, GroupMessage, Block
from django.utils.html import escape

class ChatroomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        self.chatroom_name = self.scope["url_route"]["kwargs"].get("chatroom_name")

        await self.accept()

        try:
            self.chatroom = await self.get_chatroom(self.chatroom_name)

            if self.user is None or not self.user or not self.user.is_authenticated:
                await self.send_error(401, "User is not authenticated.")
                await self.close()
                return

            if self.chatroom is None:
                await self.send_error(404, "Chatroom not found")
                await self.close()
                return

            await self.channel_layer.group_add(self.chatroom_name, self.channel_name)

        except Exception as e:
            await self.send_error(500, f"Failed to connect: {str(e)}")
            await self.close()

    @database_sync_to_async
    def get_chatroom(self, chatroom_name):
        try:
            return ChatGroup.objects.get(group_name=chatroom_name)
        except ChatGroup.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.chatroom_name, self.channel_name
            )
        except Exception as e:
            await self.send_error(500, f"Failed to leave chatroom: {str(e)}")

    async def receive_json(self, content, **kwargs):
        body = content.get("body")

        if body:
            body = escape(body)

            try:
                block_status = await self.check_blocked_status(self.user, self.chatroom)
                if block_status == "blocked":
                    await self.send_error(1001, "You are blocked by this user")
                    return
                elif block_status == "blocker":
                    await self.send_error(1002, "You have blocked this user")
                    return

                message = await self.create_message(body, self.user, self.chatroom)
                author_data = await self.get_author_data(self.user)

                await self.channel_layer.group_send(
                    self.chatroom_name,
                    {
                        "type": "message_handler",
                        "message_id": message.id,
                        "body": message.body,
                        "author": author_data,
                        "created": message.created.isoformat(),
                    },
                )
            except Exception as e:
                await self.send_error(500, f"Failed to send message: {str(e)}")

    @database_sync_to_async
    def create_message(self, body, author, group):
        try:
            return GroupMessage.objects.create(
                body=body,
                author=author,
                group=group,
            )
        except Exception as e:
            raise e

    @database_sync_to_async
    def get_author_data(self, user):
        return {
            "username": user.username,
            "avatar": user.avatar.url if user.avatar else None,
            "is_online": user.is_online,
        }

    async def message_handler(self, event):
        try:
            message_id = event["message_id"]
            body = event["body"]
            author = event["author"]
            created = event["created"]

            author_user = await self.get_author_user(author["username"])
            if author_user is None:
                await self.send_error(404, "Author user not found")
                return

            await self.send_json(
                {
                    "type": "chat_message",
                    "message_id": message_id,
                    "body": body,
                    "author": author,
                    "created": created,
                }
            )
        except Exception as e:
            await self.send_error(500, f"Failed to handle message: {str(e)}")

    @database_sync_to_async
    def get_author_user(self, author_username):
        try:
            return AppUser.objects.get(username=author_username)
        except AppUser.DoesNotExist:
            return None
        except Exception as e:
            raise e

    @database_sync_to_async
    def check_blocked_status(self, user, chatroom):
        if chatroom.is_private:
            other_user = chatroom.members.exclude(id=user.id).first()
            if not other_user:
                return None
            if Block.objects.filter(blocker=other_user, blocked=user).exists():
                return "blocked"
            elif Block.objects.filter(blocker=user, blocked=other_user).exists():
                return "blocker"
        return None

    async def send_error(self, code, message):
        await self.send_json(
            {
                "error": True,
                "errorCode": code,
                "errorMessage": message,
            }
        )
