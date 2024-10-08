from .models import Tournament, CurrentPhase
from .tournament_logic import TournamentLogic
from blockchain.views import create_tournament, record_match


def match_to_uint(match):
    return {
        "tournament_id": int(match['tournament_id']),
        "match_id": int(match['match_id']),
        "player_1_id": int(match['player_1_id']),
        "player_2_id": int(match['player_2_id']),
        "player_1_goals": int(match['player_1_goals']),
        "player_2_goals": int(match['player_2_goals']),
        "player_1_max_hits": int(match['player_1_max_hits']),
        "player_2_max_hits": int(match['player_2_max_hits']),
        "match_total_time": int(match['match_total_time']),
        "forfeit": int(match['forfeit']),
        "winner_id": int(match['winner_id'])
    }


class TournamentManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TournamentManager, cls).__new__(cls)
            cls._instance.tournaments = {}
        return cls._instance


    def create_tournament(self, consumer, creator_id, name, is_private=False, password=None):
        if self.get_player_active_tournament(creator_id) is None:
            new_tournament = Tournament(creator_id, name, is_private, password)
            self.tournaments[new_tournament.id] = new_tournament
            self.join_tournament(consumer, new_tournament.id, password)
            return new_tournament
        return None


    async def save_tournament(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)

        try:
            if tournament:
                uint_tournament_id = int(tournament.id)
                uint_player_ids = [int(player_id) for player_id in tournament.initial_bracket]
                tournament_data = {
                    "tournament_id" : uint_tournament_id,
                    "player_ids" : uint_player_ids
                }
                response = create_tournament(tournament_data)
                if response.get('error'):
                    raise Exception("Error(save tournament): Error creating tournament.")
                print("Before record matches") # DEBUG
                for match in tournament.finished_matches:
                    print("Init loop") # DEBUG
                    print(match)
                    uint_match = match_to_uint(match)
                    print(uint_match)
                    response = record_match(uint_match)
                    print(response)
            else:
                raise Exception("Error(save tournament): Tournament not found.")
        except Exception as e:
            print("Error: ", str(e))
            raise Exception(str(e))

    async def notify_end_tournament(self, tournament, channel_layer):
        message = {
                'type': 'tournament_ended',
                'tournament_id': tournament.id,
                'results': self.get_tournament_data(tournament.id)
        }
        await channel_layer.group_send(f"tournament_{tournament.id}", message)


    def join_tournament(self, consumer, tournament_id, password=None):
        tournament = self.tournaments.get(tournament_id)

        if not tournament:
            raise Exception("Error(join tournament): Tournament not found.")
        if not tournament.can_join(consumer.user_id, password):
            raise Exception(f"Error(join tournament): User '{consumer.user_id}' can't join the tournament.")

        for current_tournament in self.tournaments.values():
            if consumer.user_id in current_tournament.players:
                raise Exception("Error(join tournament): User already has an active tournament.")

        tournament.add_participant(consumer.user)
        return True


    def leave_tournament(self, tournament_id, user_id):
        tournament = self.tournaments.get(tournament_id)

        if tournament:
            if tournament.current_phase == CurrentPhase.WAITING:
                tournament.remove_participant(user_id)
                return True
            else:
                raise Exception("Error(leave tournament): The tournament is ongoing.")
        else:
            raise Exception("Error(leave tournament): Tournament not found.")


    async def start_tournament(self, tournament_id, user):
        tournament = self.tournaments.get(tournament_id)

        if tournament is None:
            raise Exception("Error(start tournament): Tournament not found.")

        if user != tournament.creator_id:
            raise Exception("Error(start tournament): Only the creator can start it.")

        if len(tournament.participants) < 2:
            raise Exception("Error(start tournament): Not enough participants")

        if tournament.current_phase != CurrentPhase.WAITING:
            raise Exception("Error(start tournament): The tournament is already ongoing.")

        print("Tournament started") # DEBUG
        await TournamentLogic.init_tournament_logic(tournament)
        tournament.current_phase = CurrentPhase.PRE_FIRST


    async def solve_first_round(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)
        tournament.current_phase = CurrentPhase.FIRST
        await TournamentLogic.solve_first_round(tournament)
        tournament.current_phase = CurrentPhase.PRE_SECOND


    async def solve_second_round(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)
        tournament.current_phase = CurrentPhase.SECOND
        await TournamentLogic.solve_second_round(tournament)
        tournament.current_phase = CurrentPhase.PRE_THIRD


    async def solve_third_round(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)
        tournament.current_phase = CurrentPhase.THIRD
        await TournamentLogic.solve_third_round(tournament)
        tournament.current_phase = CurrentPhase.PRE_FOURTH


    async def solve_fourth_round(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)
        tournament.current_phase = CurrentPhase.FOURTH
        await TournamentLogic.solve_fourth_round(tournament)
        tournament.current_phase = CurrentPhase.PRE_FINAL


    async def solve_final_round(self, tournament_id):
        tournament = self.tournaments.get(tournament_id)
        tournament.current_phase = CurrentPhase.FINAL
        await TournamentLogic.solve_final_round(tournament)
        tournament.next_state = CurrentPhase.FINISHED


    def get_player_active_tournament(self, user_id):
        for current_tournament in self.tournaments.values():
            if user_id in current_tournament.players:
                return current_tournament.id
        return None


    def get_tournaments_by_privacy(self, is_private):
        returned_tournaments = []
        for tournament in self.tournaments.values():
            if tournament.is_private == is_private:
                returned_tournaments.append(tournament.tournament_data())
        return returned_tournaments


    def get_tournament_data(self, tournament_id):
        if tournament_id in self.tournaments:
            tournament = self.tournaments[tournament_id]
            return tournament.tournament_data()
        else:
            raise Exception("Error(tournament data): Tournament not found.")


    def delete_tournament(self, tournament_id):
        if tournament_id in self.tournaments:
            del self.tournaments[tournament_id]
        else:
            raise Exception("Error(delete tournament): Tournament not found.")


    def clean_tournaments(self):
        while self.tournaments:
            self.delete_tournament(list(self.tournaments.keys())[0])

    @classmethod
    def get_tournament_by_id(cls, tournament_id):
        return cls._instance.tournaments.get(tournament_id)


