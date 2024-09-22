import asyncio
import time
import random

from channels.layers import get_channel_layer
from .game_logic import GameLogic
from .handlers import send_positions, send_game_state, send_score
from .AI_player import AiPlayer


def random_ai_game(tournament_id, match_id, player_1_id, player_2_id):
	player_1_goals = 6
	player_2_goals = random.randint(0, 4)
	print(f"AI vs AI result: {player_1_goals} - {player_2_goals}")

	return {
		'tournament_id': tournament_id,
		'match_id': match_id,
		'player_1_id': player_1_id,
		'player_2_id': player_2_id,
		'player_1_goals': player_1_goals,
		'player_2_goals': player_2_goals,
		'player_1_hits': 0,
		'player_2_hits': 0,
		'match_total_time': 0,
	}


class GameManager:
	def __init__(self):
		self.rooms = {}
		self.player_to_room = {}
		self.channel_layer = get_channel_layer()

		self.frame_count = 0

	def is_player_in_game(self, player_id):
		return player_id in self.player_to_room

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

		# Generate random scores for AI vs AI match
		if player_1_id == 0 and player_2_id == 0:
			return random_ai_game(tournament_id, match_id, player_1_id, player_2_id)

		if player_1_id != 0 and self.player_to_room.get(player_1_id):
			return None
		if player_2_id != 0 and self.player_to_room.get(player_2_id):
			return None

		print(f"Starting match between (ID {player_1_id}) and (ID {player_2_id})") # DEBUG

		try:
			# Create game room and game logic
			game_room_id = self.create_game_room(player_1_id, player_2_id)
			game_room = self.get_game_room_by_id(game_room_id)
			game_logic = game_room.get_game_logic()

			# Set the controls mode
			game_logic.controls_mode = controls_mode
			if controls_mode == "local":
				game_logic.player_2_name = "Guest"
				game_logic.player_2_avatar = 'media/default/anonymous_player.jpg'
			elif controls_mode == "AI":
				if player_1_id == 0:
					game_logic.ai_side = 1
					game_logic.player_1_name = "AI"
					game_logic.player_1_avatar = 'media/default/AI_player.jpg'
					game_logic.player_1_ready = True
				else:
					game_logic.ai_side = 2
					game_logic.player_2_name = "AI"
					game_logic.player_2_avatar = 'media/default/AI_player.jpg'
					game_logic.player_2_ready = True
			ai_player = AiPlayer(game_logic)

			await self.run_game_loop(game_room, game_logic, ai_player)

			# Get the game results
			result = game_room.get_result(tournament_id, match_id)

			# Remove the room
			self.remove_game_room(game_room_id)

			return result
		except Exception as e:
			print(f"Error starting match: {e}")
			return None

	async def run_game_loop(self, game_room, game_logic, ai_player):
		frame_count = 0
		try:
			while game_logic.game_state != "game_over":
				loop_time = time.time()
				if game_logic.ai_side:
					ai_player.ai_turn(game_logic.new_direction)
				await game_logic.game_loop()
				await send_game_state(self.channel_layer, game_room.game_room_id, game_logic)
				await send_positions(self.channel_layer, game_room.game_room_id, game_logic)
				if game_logic.game_state == "scored":
					await send_score(self.channel_layer, game_room.game_room_id, game_logic)
				elapsed_time = time.time() - loop_time
				if game_logic.FRAME_TIME - elapsed_time < 0:
					print("**** ALERT: Game loop is running too slow ****")
				sleep_time = max(0.0, game_logic.FRAME_TIME - elapsed_time)
				await asyncio.sleep(sleep_time)
				frame_count += 1
			if game_logic.game_state == "game_over":
				await send_score(self.channel_layer, game_room.game_room_id, game_logic)
				game_logic.end_game_adjustments()
			await send_game_state(self.channel_layer, game_room.game_room_id, game_logic)
		except Exception as e:
			print(f"Error running game loop: {e}")

	def create_game_room(self, player_1_id, player_2_id):
		try:
			room_id = f"{player_1_id}_vs_{player_2_id}"
			room = GameRoom(room_id, player_1_id, player_2_id)
			self.rooms[room_id] = room
			self.player_to_room[player_1_id] = room_id
			self.player_to_room[player_2_id] = room_id
			return room_id
		except Exception as e:
			print(f"Error creating game room: {e}")
			return None

	def get_game_room_by_id(self, game_room_id):
		try:
			return self.rooms.get(game_room_id)
		except Exception as e:
			print(f"Error getting game room: {e}")
			return None

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
			'player_1_max_hits': self.game_logic.player_1_max_hits,
			'player_2_max_hits': self.game_logic.player_2_max_hits,
			'match_total_time': self.game_logic.match_total_time,
			'forfeit': self.game_logic.forfeit,
		}

# Create the game manager
game_manager = GameManager()
