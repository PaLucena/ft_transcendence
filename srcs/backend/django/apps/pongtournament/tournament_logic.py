import asyncio
import random

from ponggame.game_manager import game_manager


class TournamentLogic:

    @staticmethod
    async def init_tournament_logic(tournament):
        tournament.initial_bracket = [player for player in tournament.players]
        random.shuffle(tournament.initial_bracket)

        print("Initial shuffled bracket: ", tournament.initial_bracket)  # DEBUG

        while len(tournament.initial_bracket) < 8:
            tournament.initial_bracket.append(0)

        print("Initial bracket (8): ", tournament.initial_bracket)  # DEBUG


    @staticmethod
    async def solve_first_round(tournament):
        print("Initial round")  # DEBUG
        results_i = await TournamentLogic.solve_matches(tournament, tournament.initial_bracket)
        TournamentLogic.move_players(tournament, results_i, "initial", "initial")


    @staticmethod
    async def solve_second_round(tournament):
        print("Second round")  # DEBUG
        results_w = await TournamentLogic.solve_matches(tournament, tournament.winner_bracket)
        results_l = await TournamentLogic.solve_matches(tournament, tournament.loser_bracket)
        TournamentLogic.move_players(tournament, results_l, "second", "loser")
        TournamentLogic.move_players(tournament, results_w, "second", "winner")


    @staticmethod
    async def solve_third_round(tournament):
        print("Third round")  # DEBUG
        results_l = await TournamentLogic.solve_matches(tournament, tournament.loser_bracket)
        TournamentLogic.move_players(tournament, results_l, "third", "loser")


    @staticmethod
    async def solve_fourth_round(tournament):
        print("Fourth round")  # DEBUG
        results_w = await TournamentLogic.solve_matches(tournament, tournament.winner_bracket)
        TournamentLogic.move_players(tournament, results_w, "fourth", "winner")


    @staticmethod
    async def solve_final_round(tournament):
        print("Final round")  # DEBUG
        results_w = await TournamentLogic.solve_matches(tournament, tournament.winner_bracket)
        TournamentLogic.move_players(tournament, results_w, "final", "winner")


    @staticmethod
    async def solve_matches(tournament, bracket):
        num_matches = len(bracket) // 2
        match_tasks = []

        for i in range(num_matches):
            player1_id = bracket[i]
            player2_id = bracket[i + num_matches]

            if player1_id == 0 or player2_id == 0:
                controls_mode = "AI"
            else:
                controls_mode = "remote"

            match_task = game_manager.start_match_test(  # DEBUG *******************************
                tournament.id,
                tournament.id + f"_match_{tournament.match_counter}",
                player1_id,
                player2_id,
                controls_mode,
            )
            tournament.match_counter += 1
            match_tasks.append(match_task)

        matches_results = await asyncio.gather(*match_tasks)

        for match_result in matches_results:
            print("Match result: ", match_result)  # DEBUG
            tournament.finished_matches.append(match_result)

        return matches_results


    @staticmethod
    def move_players(tournament, match_results, round_num, bracket_type):
        if round_num == "initial":
            for match_result in match_results:
                if match_result["winner"] != 0 and match_result["loser"] != 0:  # Both players end the game
                    tournament.winner_bracket.append(match_result[f"player_{match_result['winner']}_id"])
                    tournament.loser_bracket.append(match_result[f"player_{match_result['loser']}_id"])
                elif match_result["loser"] == 0 and match_result["winner"] != 0:  # One player ends the game
                    tournament.winner_bracket.append(match_result[f"player_{match_result['winner']}_id"])
                    tournament.loser_bracket.append(0)
                    delete_player = 2 if match_result["winner"] == 1 else 1
                    tournament.players.remove(match_result[f"player_{delete_player}_id"])
                else:  # Both players quit the game
                    tournament.winner_bracket.append(0)
                    tournament.loser_bracket.append(0)
                    tournament.players.remove(match_result["player_1_id"])
                    tournament.players.remove(match_result["player_2_id"])

            print("Winner bracket: ", tournament.winner_bracket)  # DEBUG
            print("Loser bracket: ", tournament.loser_bracket)  # DEBUG

        elif round_num == "second":
            for match_result in match_results:
                if bracket_type == "loser":
                    if match_result["winner"] != 0:  # Both player ends the game or one player ends the game
                        delete_player = 2 if match_result["winner"] == 1 else 1
                        tournament.loser_bracket.remove(match_result[f"player_{delete_player}_id"])
                        if match_result[f"player_{delete_player}_id"] != 0:
                            tournament.players.remove(match_result[f"player_{delete_player}_id"])
                    else:  # Both players quit the game
                        tournament.loser_bracket.append(0)
                        if match_result["player_1_id"] != 0:
                            tournament.players.remove(match_result["player_1_id"])
                        if match_result["player_2_id"] != 0:
                            tournament.players.remove(match_result["player_2_id"])
                elif bracket_type == "winner":
                    if match_result["winner"] != 0 and match_result["loser"] != 0:  # Both players end the game
                        tournament.winner_bracket.remove(match_result[f"player_{match_result['loser']}_id"])
                        tournament.loser_bracket.append(match_result[f"player_{match_result['loser']}_id"])
                    elif match_result["loser"] == 0 and match_result["winner"] != 0:  # One player ends the game
                        delete_player = 2 if match_result["winner"] == 1 else 1
                        tournament.winner_bracket.remove(match_result[f"player_{delete_player}_id"])
                        tournament.loser_bracket.append(0)
                        tournament.players.remove(match_result[f"player_{delete_player}_id"])
                    else:  # Both players quit the game
                        tournament.winner_bracket.append(0)
                        tournament.loser_bracket.append(0)
                        tournament.players.remove(match_result["player_1_id"])
                        tournament.players.remove(match_result["player_2_id"])

            print("Winner bracket: ", tournament.winner_bracket)  # DEBUG
            print("Loser bracket: ", tournament.loser_bracket)  # DEBUG

        elif round_num == "third":
            for match_result in match_results:
                if bracket_type == "loser":
                    if match_result["winner"] != 0:  # Both player ends the game or one player ends the game
                        tournament.winner_bracket.append(match_result[f"player_{match_result['winner']}_id"])
                        delete_player = 2 if match_result["winner"] == 1 else 1
                        if match_result[f"player_{delete_player}_id"] != 0:
                            tournament.players.remove(match_result[f"player_{delete_player}_id"])
                    else:  # Both players quit the game
                        tournament.winner_bracket.append(0)
                        tournament.players.remove(match_result["player_1_id"])
                        tournament.players.remove(match_result["player_2_id"])

            print("Winner bracket: ", tournament.winner_bracket)  # DEBUG
            print("Loser bracket: ", tournament.loser_bracket)  # DEBUG

        elif round_num == "fourth":
            for match_result in match_results:
                if bracket_type == "winner":
                    if match_result["winner"] != 0 and match_result["loser"] != 0:  # Both players end the game
                        tournament.winner_bracket.remove(match_result[f"player_{match_result['loser']}_id"])
                        if match_result[f"player_{match_result['loser']}_id"] != 0:
                            tournament.players.remove(match_result[f"player_{match_result['loser']}_id"])
                    elif match_result["loser"] == 0 and match_result["winner"] != 0:  # One player ends the game
                        delete_player = 2 if match_result["winner"] == 1 else 1
                        tournament.winner_bracket.remove(match_result[f"player_{delete_player}_id"])
                        tournament.players.remove(match_result[f"player_{delete_player}_id"])
                    else:  # Both players quit the game
                        tournament.winner_bracket.append(0)
                        tournament.winner_bracket.remove(match_result["player_1_id"])
                        tournament.winner_bracket.remove(match_result["player_2_id"])
                        tournament.players.remove(match_result["player_1_id"])
                        tournament.players.remove(match_result["player_2_id"])

            print("Winner bracket: ", tournament.winner_bracket)  # DEBUG
            print("Loser bracket: ", tournament.loser_bracket)

        elif round_num == "final":
            for match_result in match_results:
                if bracket_type == "winner":
                    if match_result["winner"] != 0:
                        tournament.tournament_winner = match_result[f"player_{match_result['winner']}_id"]
                    else:
                        tournament.tournament_winner = 0

                    if match_result["winner"] != 0:
                        tournament.players.remove(match_result["player_1_id"])
                    if match_result["winner"] != 0:
                        tournament.players.remove(match_result["player_2_id"])

            print("Tournament finished. Winner: ", tournament.tournament_winner)

