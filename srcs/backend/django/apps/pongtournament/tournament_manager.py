from .models import Tournament, TournamentState
from .tournament_logic import TournamentLogic


class TournamentManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TournamentManager, cls).__new__(cls)
            cls._instance.tournaments = {}
        return cls._instance


    def create_tournament(self, consumer, creator_id, name, is_private=False, password=None):
        if self.get_player_active_tournament(creator_id) is None:
            print("Free user, ready to create a tournament") # DEBUG
            new_tournament = Tournament(creator_id, name, is_private, password)
            self.tournaments[new_tournament.id] = new_tournament
            self.join_tournament(consumer, new_tournament.id, password)
            return new_tournament
        return None


    async def end_tournament(self, tournament_id, channel_layer):
        tournament = self.tournaments.get(tournament_id)

        if not tournament:
            raise Exception("Error(end tournament): Tournament not found.")

        # TODO - send to blockchain

        await self.notify_end_tournament(tournament, channel_layer)
        self.delete_tournament(tournament_id)


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
            if tournament.state == TournamentState.WAITING:
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

        if user != tournament.creator:
            raise Exception("Error(start tournament): Only the creator can start it.")

        if len(tournament.participants) < 2:
            raise Exception("Error(start tournament): Not enough participants")

        print("Tournament started") # DEBUG
        await TournamentLogic.init_tournament_logic(tournament)


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
