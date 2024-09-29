import time

class TournamentState:
    WAITING = "waiting"
    STARTED = "ongoing"
    FINISHED = "finished"
    CANCELLED = "cancelled"

class Tournament:
    def __init__(self, creator_id, name, is_private=False, password=None):
        self.id = generate_unique_id(creator_id)
        self.name = name
        self.creator_id = creator_id
        self.participants = [creator_id]
        self.players = [creator_id]
        self.finished_matches = []
        self.is_private = is_private
        self.password = password
        self.state = TournamentState.WAITING
        self.initial_bracket = []
        self.winner_bracket = []
        self.loser_bracket = []
        self.tournament_winner = None


    def can_join(self, user_id, password):
        if (self.state == TournamentState.WAITING and
                len(self.participants) < 8 and
                user_id not in self.participants):
            if not self.is_private:
                return True
            elif self.is_private and self.password == password:
                return True
        return False


    def add_participant(self, user_id):
        self.participants.append(user_id)
        self.players.append(user_id)


    def remove_participant(self, user_id):
        if user_id not in self.participants:
            raise Exception("The user is not a participant of the tournament.")

        if self.state == TournamentState.WAITING:
            if user_id == self.creator_id:
                self.state = TournamentState.CANCELLED
            else:
                self.participants.remove(user_id)
                self.players.remove(user_id)


    def tournament_data(self):
        return {
            "id": self.id,
            "name": self.name,
            "creator": self.creator_id,
            "participants": [p for p in self.participants],
            "is_private": self.is_private,
            "state": self.state,
            "winner": self.tournament_winner
        }


def generate_unique_id(user_id):
    timestamp = int(time.time())
    formated_time = time.strftime("%y%m%d%H%M%S", time.localtime(timestamp))
    tournament_id = f"{formated_time}_{user_id}"
    return tournament_id
