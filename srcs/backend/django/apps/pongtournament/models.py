import time


class CurrentPhase:
    WAITING = "Waiting for players to join"
    PRE_FIRST = "Tournament closed. The battle begins!!"
    FIRST = "First round in progress."
    PRE_SECOND = "First round finished. Get ready for the next round."
    SECOND = "Second round in progress."
    PRE_THIRD = "Second round finished. Get ready for the next round."
    THIRD = "Third round in progress."
    PRE_FOURTH = "Third round finished. Get ready for the next round."
    FOURTH = "Fourth round in progress."
    PRE_FINAL = "Fourth round finished. Get ready for the final round."
    FINAL = "Final round in progress."
    FINISHED = "finished"
    DELETED = "deleted"


class Tournament:
    def __init__(self, creator_id, name, is_private=False, password=None):
        self.id = generate_unique_id(creator_id)
        self.name = name
        self.creator_id = creator_id
        self.participants = []
        self.players = []
        self.match_counter = 0
        self.current_phase = CurrentPhase.WAITING
        self.finished_matches = []
        self.is_private = is_private
        self.password = password
        self.initial_bracket = []
        self.winner_bracket = []
        self.loser_bracket = []
        self.tournament_winner = None
        self.participants_data = []


    def can_join(self, user_id, password):
        if (self.current_phase == CurrentPhase.WAITING and
                len(self.participants) < 8 and
                user_id not in self.participants):
            if not self.is_private:
                return True
            elif self.is_private and self.password == password:
                return True
        return False


    def add_participant(self, user):
        self.participants.append(user.id)
        self.players.append(user.id)
        self.participants_data.append({
            "user_id": user.id,
            "user_name": user.username,
            "avatar": user.avatar.url,
        })

    def remove_participant(self, user_id):
        if user_id not in self.participants:
            raise Exception("The user is not a participant of the tournament.")

        if self.current_phase == CurrentPhase.WAITING:
            if user_id == self.creator_id:
                self.current_phase = CurrentPhase.DELETED
            else:
                self.participants.remove(user_id)
                self.players.remove(user_id)
                for player in self.participants_data:
                    if player["user_id"] == user_id:
                        self.participants_data.remove(player)


    def tournament_data(self):
        winner = self.tournament_winner
        winner_name = "AI"

        for participant in self.participants_data:
            if participant["user_id"] == winner:
                winner_name = participant["user_name"]

        return {
            "id": self.id,
            "name": self.name,
            "creator": self.creator_id,
            "participants": [p for p in self.participants],
            "participants_data": self.participants_data,
            "players": [p for p in self.players],
            "is_private": self.is_private,
            "current_phase": self.current_phase,
            "winner": winner_name
        }


def generate_unique_id(user_id):
    timestamp = int(time.time())
    formated_time = time.strftime("%y%m%d%H%M%S", time.localtime(timestamp))
    tournament_id = f"{formated_time}{user_id}"
    return tournament_id
