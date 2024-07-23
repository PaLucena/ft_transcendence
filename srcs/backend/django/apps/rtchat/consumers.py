from crypt import methods
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        user = self.scope["user"]

        print(f"SCOPE:: {self.scope}")
        print(
            f"HELP!: room_name: {self.room_name}, room_group_name: {self.room_group_name}"
        )
        print(f"user: {user}")

        if not user.is_authenticated:
            await self.send_json({"error": "User not authenticated"})
            await self.close()
        else:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content):
        message = content.get("message", "")
        print(f"message: {message}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": message,
            },
        )

    async def chat_message(self, event):
        message = event["message"]
        await self.send_json(
            {
                "message": message,
            }
        )
