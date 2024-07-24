from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from rtchat.models import ChatGroup, GroupMessage
import json


class ChatroomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.chatroom_name = self.scope["url_route"]["kwargs"]["chatroom_name"]
        self.chatroom = await self.get_chatroom(self.chatroom_name)

        if self.chatroom is None:
            await self.close()
            return

        if not self.user.is_authenticated:
            await self.send_json({"error": "User not authenticated"})
            await self.close()
        else:
            await self.channel_layer.group_add(self.chatroom_name, self.channel_name)
            await self.accept()

    @database_sync_to_async
    def get_chatroom(self, chatroom_name):
        try:
            return ChatGroup.objects.get(group_name=chatroom_name)
        except ChatGroup.DoesNotExist:
            return None

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.chatroom_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        body = content.get("body")
        print(f"body: {body}")

        message = await self.create_message(body, self.user, self.chatroom)

        await self.channel_layer.group_send(
            self.chatroom_name,
            {
                "type": "message_handler",
                "message_id": message.id,
                "body": message.body,
                "author": self.user.username,
                "created": message.created.isoformat(),  # or any other date format
            },
        )

    @database_sync_to_async
    def create_message(self, body, author, group):
        return GroupMessage.objects.create(body=body, author=author, group=group)

    async def message_handler(self, event):
        message_id = event["message_id"]
        body = event["body"]
        author = event["author"]
        created = event["created"]

        await self.send_json(
            {
                "type": "chat_message",
                "message_id": message_id,
                "body": body,
                "author": author,
                "created": created,
            }
        )
