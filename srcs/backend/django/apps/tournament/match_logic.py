from rest_framework.decorators import api_view
from .models import Match
from .tournament_config import next_match_dependencies, required_matches, assignments
from user.decorators import default_authentication_required
from blockchain.views import record_match
import random
from ponggame.game_manager import game_manager
import asyncio

async def start_all_matches(tournament, matches):
	results = []

	match_tasks = [
		game_manager.start_match(
			match['tournament_id'],
			match['match_id'],
			match['player_1_id'],
			match['player_2_id'],
			match['controls_mode']
		)
		#notify players here
		for match in matches
	]

	for task in asyncio.as_completed(match_tasks):
		result = await task
		match_id = result['match_id']
		print(f"Match {match_id} finished with result: {result}")
		results.append(result)

		next_matches = assign_next_match(tournament, match_id, result)

		while next_matches:
			formatted_next_matches = [format_match(m) for m in next_matches]
			new_results = await start_all_matches(tournament, formatted_next_matches)
			results.extend(new_results)

			next_matches = []
			for new_result in new_results:
				next_matches.extend(assign_next_match(tournament, new_result['match_id'], result))

	return results


# checks if the next match can be assigned based on the outcome of the current match.
def assign_next_match(tournament, match_id, finished_match_data):
	next_possible_matches = next_match_dependencies.get(match_id, [])
	next_matches = []

	# check if its match between 2 ai players i want to advance (or put this in pong) 
	finished_match = Match.objects.get(match_id=match_id, tournament=tournament)
	if finished_match:
		finished_match_data = set_winner_and_loser(finished_match_data, finished_match)
		print("finished_match_data: ", finished_match_data)
		if finished_match.player1 == 0 and finished_match.player2 == 0:
			pass
		else:
			record_match(format_match_for_bc(finished_match_data))

	for next_match_id in next_possible_matches:
		if can_assign_match(tournament, next_match_id) and not Match.objects.filter(match_id=next_match_id).exists():
			match, created = Match.objects.create(
				tournament=tournament,
				match_id=next_match_id
			)
			if auto_advance_match(tournament, match):
				next_matches.append(assign_match_players(tournament, match.match_id))
			else:
				assign_match_players(tournament, match.match_id)
				next_matches.append(format_match(match))

	if match_id == 14: # needs change
		tournament_cleanup(tournament)

	return next_matches


def set_winner_and_loser(finished_match_data, finished_match):
	player1_id = finished_match_data.get('player_1_id')
	player2_id = finished_match_data.get('player_2_id')
	player1_goals = finished_match_data.get('player_1_goals')
	player2_goals = finished_match_data.get('player_2_goals')
	forfeit = finished_match_data.get('forfeit')

	finished_match.player1 = player1_id
	finished_match.player2 = player2_id

	if forfeit:
		if forfeit == 1:
			finished_match.winner = player2_id
			finished_match.loser = player1_id
		else:
			finished_match.winner = player1_id
			finished_match.loser = player2_id
	elif player1_goals > player2_goals:
		finished_match.winner = player1_id
		finished_match.loser = player2_id

	elif player1_goals < player2_goals:
		finished_match.winner = player2_id
		finished_match.loser = player1_id

	else:
		finished_match.winner = -1
		finished_match.loser = -1

	finished_match.save()
	finished_match_data['winner_id'] = finished_match.winner

	return finished_match_data


def auto_advance_match(tournament, new_match):
	auto_finish_match = 0
	potential_winner = None
	potential_loser= None

	for required_match_id in required_matches[new_match.match_id]:
		match = Match.objects.filter(tournament=tournament, match_id=required_match_id).first()
		
		if match.winner == -1 and match.loser == -1:
			auto_finish_match += 1
		
		elif match.winner != -1 and match.loser != -1:
			potential_winner = match.winner
			potential_loser = match.loser
			continue

	if auto_finish_match == 0:
		return True

	if auto_finish_match == 1:
		new_match.winner = potential_winner
		new_match.loser = potential_loser

	elif auto_finish_match == 2:
		new_match.winner = -1
		new_match.loser = -1

	new_match.save()
	return False


def can_assign_match(tournament, match):
	for required_match_id in required_matches[match]:
		match = Match.objects.filter(tournament=tournament, match_id=required_match_id).first()

		if not match or match.winner is None:
			return False
	return True


def assign_match_players(tournament, match):
	assignment = assignments[match.match_id]

	player1_role = list(assignment['player1'].key())[0]
	player1_match_id = assignment['player1'][player1_role]
	player1_match = Match.objects.get(tournament=tournament, match_id=player1_match_id)
	match.player1 = getattr(player1_match, player1_role)

	player2_role = list(assignment['player2'].key())[0]
	player2_match_id = assignment['player2'][player2_role]
	player2_match = Match.objects.get(tournament=tournament, match_id=player2_match_id)
	match.player2 = getattr(player2_match, player2_role)

	if match.player1 == 0 and match.player2 == 0:
		match.controls_mode = 'AI'
	else:
		match.controls_mode = 'remote'

	match.save()
	return match


# to assign first 4 matches
def create_initial_matches(tournament):
	players = tournament.player_ids
	real_players = [pid for pid in players if pid > 0]
	ai_players = [pid for pid in players if pid == 0]
	match_id = 1
	matches = []

	if len(ai_players) >= 4:
		while match_id <= 4:
			if real_players:
				player1 = real_players.pop(0)
			else:
				player1 = ai_players.pop(0)
			player2 = ai_players.pop(0)

			match = Match.objects.create(
				tournament=tournament,
				match_id=match_id,
				player1=player1,
				player2=player2,
				controls_mode='AI'
			)
			matches.append(match)
			match_id += 1

	if len(ai_players) < 4:
		while match_id <= 4:
			if ai_players:
				player1 = ai_players.pop(0)
				mode='AI'
			else:
				player1 = real_players.pop(0)
				mode='remote'
			player2 = real_players.pop(0)

			match = Match.objects.create(
				tournament=tournament,
				match_id=match_id,
				player1=player1,
				player2=player2,
				controls_mode=mode
			)
			match_id += 1
			matches.append(match)

		available_matches = [format_match(match) for match in matches]
	
	return available_matches


def format_match(match):
	return {
		'tournament_id': match.tournament.id,
		'match_id': match.match_id,
		'player_1_id': match.player1 if match.player1 else None,
		'player_2_id': match.player2 if match.player2 else None,
		'controls_mode': match.controls_mode
	}


def format_match_for_bc(result):
	if result['forfeit']:
		winner = result['player_2_id'] if result['forfeit'] == 1 else result['player_1_id']
	else:
		if result['player_1_goals'] > result['player_2_goals']:
			winner = result['player_1_id']
		else:
			winner = result['player_2_id']
	return {
		'tournament_id': result['tournament_id'],
		'match_id': result['match_id'],
		'player_1_id': result['player_1_id'],
		'player_2_id': result['player_2_id'],
		'player_1_goals': result['player_1_goals'],
		'player_2_goals': result['player_2_goals'],
		'player_1_max_hits': result['player_1_max_hits'],
		'player_2_max_hits': result['player_2_max_hits'],
		'match_total_time': result['match_total_time'],
		'forfeit': result['forfeit'],
		'winner_id': winner,
	}


def tournament_cleanup(tournament):
	Match.objects.filter(tournament=tournament).delete()
	tournament.delete()
