import asyncio
import time


from channels.layers import get_channel_layer
from .game_logic import GameLogic
from .handlers import send_positions, send_game_state, send_score


class GameManager:
    def __init__(self):
        self.rooms = {}
        self.player_to_room = {}
        self.channel_layer = get_channel_layer()

    async def start_match(self, tournament_id, match_id, player_1_id, player_2_id, controls_mode):
        """
        Start a match between two players

        :param tournament_id: The id of the tournament.
        :param match_id: The id of the match.
        :param player_1_id: The id of the first player. 0 for AI.
        :param player_2_id: The id of the second player. 0 for AI.
        :param controls_mode: The controls mode to use. "remote", "AI" or "local" (same keyboard)

        :return:
            JSON object with the result of the match.
            {tournament_id, match_id, player_1_id, player_2_id, player_1_goals, player_2_goals}
        """
        print(f"Starting match between (ID {player_1_id}) and (ID {player_2_id})") # DEBUG
        # Create game room and game logic
        game_room_id = self.create_game_room(player_1_id, player_2_id)
        game_room = self.get_game_room_by_id(game_room_id)
        game_logic = game_room.get_game_logic()

        # Set the controls mode
        game_logic.controls_mode = controls_mode

        await self.run_game_loop(game_room, game_logic)

        # Get the game results
        result = game_room.get_result(tournament_id, match_id)

        # Remove the room
        self.remove_game_room(game_room_id)

        return result

    async def run_game_loop(self, game_room, game_logic):
        while game_logic.game_state != "game_over":
            start_time = time.time()
            await game_logic.game_loop()
            await send_positions(self.channel_layer, game_room.game_room_id, game_logic)
            await send_game_state(self.channel_layer, game_room.game_room_id, game_logic)
            if game_logic.game_state == "scored":
                await send_score(self.channel_layer, game_room.game_room_id, game_logic)
            elapsed_time = time.time() - start_time
            await asyncio.sleep(max(0.0, game_logic.FRAME_TIME - elapsed_time))

    def create_game_room(self, player_1_id, player_2_id):
        room_id = f"{player_1_id}_vs_{player_2_id}"
        room = GameRoom(room_id, player_1_id, player_2_id)
        self.rooms[room_id] = room

        self.player_to_room[player_1_id] = room_id
        self.player_to_room[player_2_id] = room_id

        return room_id

    def get_game_room_by_id(self, game_room_id):
        return self.rooms.get(game_room_id)

    def get_game_room_by_player(self, player_id):
        game_room_id = self.player_to_room.get(player_id)
        if game_room_id:
            return self.rooms.get(game_room_id)
        return None

    def remove_game_room(self, game_room_id):
        if game_room_id in self.rooms:
            room = self.rooms[game_room_id]
            del self.player_to_room[room.player_1_id]
            del self.player_to_room[room.player_2_id]
            del self.rooms[game_room_id]


class GameRoom:
    def __init__(self, game_room_id, player_1_id, player_2_id):
        self.game_room_id = game_room_id
        self.player_1_id = player_1_id
        self.player_2_id = player_2_id
        self.game_logic = GameLogic()
        self.game_logic.player_1_id = player_1_id
        self.game_logic.player_2_id = player_2_id

    def get_room_name(self):
        return self.game_room_id

    def get_players(self):
        return self.player_1_id, self.player_2_id

    def get_game_logic(self):
        return self.game_logic

    def get_result(self, tournament_id, match_id):
        return {
            'tournament_id': tournament_id,
            'match_id': match_id,
            'player_1_id': self.player_1_id,
            'player_2_id': self.player_2_id,
            'player_1_goals': self.game_logic.player_1_goals,
            'player_2_goals': self.game_logic.player_2_goals,
        }

# Create the game manager
game_manager = GameManager()
