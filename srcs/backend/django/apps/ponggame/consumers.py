import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_manager import game_manager
from .handlers import handle_player_ready, handle_quit, handle_move, handle_resize
from user.models import AppUser as User


class GameConsumer(AsyncWebsocketConsumer):

    def __init__(self):
        super().__init__()
        self.room = None
        self.room_name = None
        self.game_logic = None
        self.player_id = None
        self.player_channel = None
        self.controls_mode = None
        self.controls_side = None

    async def connect(self):
        user = self.scope['user']
        self.player_id = user.id

        print(f"Player name: {user.username}") # DEBUG
        print(f"Available rooms: {game_manager.rooms}") # DEBUG

        self.room = game_manager.get_game_room_by_player(self.player_id)

        if self.room is None:
            print(f"Player {self.player_id} has no room")# DEBUG
            await self.close()
            return

        print(f"Player {self.player_id} has room {self.room.get_room_name()}") # DEBUG

        self.game_logic = self.room.get_game_logic()
        self.room_name = self.room.get_room_name()

        if self.player_id == self.room.player_1_id:
            print(f"Player {self.player_id} is player 1") # DEBUG
            self.game_logic.player_1_channel = self.channel_name
            self.game_logic.player_1_name = user.username
            self.game_logic.player_1_avatar = user.avatar.url 
            self.controls_side = 1
        elif self.player_id == self.room.player_2_id:
            print(f"Player {self.player_id} is player 2") # DEBUG
            self.game_logic.player_2_channel = self.channel_name
            self.game_logic.player_2_name = user.username
            self.game_logic.player_2_avatar = user.avatar.url 
            self.controls_side = 2
        else:
            print(f"Player {self.player_id} is not in the room")
            await self.close()
            return

        player_1_avatar = getattr(self.game_logic, 'player_1_avatar', 'default/anonymous.jpg')
        player_2_avatar = getattr(self.game_logic, 'player_2_avatar', 'default/anonymous.jpg')
    
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        print(f"Player {self.player_id} - room {self.room_name} - side {self.controls_side}")
        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'config',
            'controls_mode': self.game_logic.controls_mode,
            'controls_side': self.controls_side,
            'player_1_name': self.game_logic.player_1_name,
            'player_1_avatar': player_1_avatar,
            'player_2_name': self.game_logic.player_2_name,
            'player_2_avatar': player_2_avatar,
            'goals_to_win': self.game_logic.GOALS_TO_WIN,
            'goals_diff': self.game_logic.GOALS_DIFFERENCE,
        }))

        print(f"Player {self.player_id} sent config") # DEBUG

    async def disconnect(self, close_code):
        if self.game_logic:
            # Disconnect from room
            if self.player_id == 1:
                self.game_logic.player_1_channel = None
            elif self.player_id == 2:
                self.game_logic.player_2_channel = None

            # Leave room group
            await self.channel_layer.group_discard(
                self.room_name,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)

        if data['type'] == 'player_ready' and self.game_logic.game_state == 'waiting':
            await handle_player_ready(self, data['player'])

        elif data['type'] == 'quit':
            player = data['player']
            await handle_quit(self, player)

        elif data['type'] == 'move':
            await handle_move(self, data['player'], data['direction'])

        elif data['type'] == 'resize':
            await handle_resize(self)

    async def game_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))
