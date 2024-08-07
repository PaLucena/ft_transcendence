import json
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer
from .game_logic import GameLogic
from .handlers import handle_start, handle_quit, handle_move, send_config, change_theme


class GameConsumer(AsyncWebsocketConsumer):
    def __init__(self):
        super().__init__()
        self.room_name = None
        self.room_group_name = None
        self.game_logic = GameLogic()
        self.game_task = None

    async def connect(self):
        self.room_name = 'pong_game'
        self.room_group_name = 'pong_game_group'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        await send_config(self)

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if self.game_task:
            self.game_task.cancel()

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'start':
            await handle_start(self)

        elif data['type'] == 'quit':
            await handle_quit(self)

        elif data['type'] == 'move':
            await handle_move(self, data['player'], data['direction'])

        elif data['type'] == 'ready':
            self.game_logic.player_1_ready = True
            self.game_logic.player_2_ready = True

        elif data['type'] == 'theme':
            await change_theme(self, self.game_logic.theme)
