from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Click
from asgiref.sync import sync_to_async
class ClickConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.groupName = "all"
        await self.channel_layer.group_add(
            self.groupName,
            self.channel_name
        )

    async def disconnect(self, close_code):
        self.channel_layer.group_discard(
            self.groupName,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle incoming WebSocket messages
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError as error:
            print("error decoding JSON", error)
        action = data.get('action')

        if action == 'get_count':
            count = await sync_to_async(Click.getCount)
            await self.channel_layer.group_send(
                self.groupName, {
                    'type': 'sendCount',
                    'count': count
                }
            )

    async def sendCount(self, event):
        await self.send(text_data= json.dumps({
            'type': 'sendCount',
            'count': event['count']
        }))