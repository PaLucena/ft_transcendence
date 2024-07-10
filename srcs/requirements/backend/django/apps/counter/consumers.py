from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ClickConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        # Handle incoming WebSocket messages
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'get_count':
            # Retrieve count from Redis or database
            count = await self.get_count_from_redis()  # Example function to fetch count
            await self.send(text_data=json.dumps({'count': count}))

    async def get_count_from_redis(self):
        # Example function to retrieve count from Redis
        # Use channels-redis API to interact with Redis
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()

        # Example: Get count from Redis
        count = await channel_layer.redis.get('clicks_count')

        return count
