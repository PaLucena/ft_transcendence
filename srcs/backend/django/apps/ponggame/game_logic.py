import math
import random
import time


class GameLogic:
    # Game configuration
    PADDLE_SPEED = 4
    BALL_SPEED_INIT = 6
    BALL_SPEED_INC = 0.5
    GOALS_TO_WIN = 2
    GOALS_DIFFERENCE = 1
    INIT_COUNTDOWN = 3
    CONNECT_TIMEOUT = 30

    # Graphic configuration
    TABLE_HEIGHT = 680
    TABLE_WIDTH = 1200
    TABLE_MID_HEIGHT = TABLE_HEIGHT / 2
    TABLE_MID_WIDTH = TABLE_WIDTH / 2
    PADDLE_HEIGHT = 110
    PADDLE_WIDTH = 20
    PADDLE_MID_HEIGHT = PADDLE_HEIGHT / 2
    PADDLE_MID_WIDTH = PADDLE_WIDTH / 2
    PADDLE_TAB_MARGIN = 90
    BALL_RADIUS = 24
    GOAL_TAB_MARGIN = 25
    FPS = 64
    FRAME_TIME = 1 / FPS

    def __init__(self, game_environment="single", tournament_id=0):
        # Initial values
        self.pad_1_x = self.PADDLE_TAB_MARGIN
        self.pad_1_y = self.TABLE_MID_HEIGHT
        self.pad_2_x = self.TABLE_WIDTH - self.PADDLE_TAB_MARGIN
        self.pad_2_y = self.TABLE_MID_HEIGHT
        self.ball_x = self.TABLE_MID_WIDTH
        self.ball_y = self.TABLE_MID_HEIGHT
        self.ball_dir_x = -1 if random.uniform(0, 1) <= 0.5 else 1
        self.ball_dir_y = -1 if random.uniform(0, 1) <= 0.5 else 1
        self.ball_vel_x = self.BALL_SPEED_INIT
        self.ball_vel_y = self.BALL_SPEED_INIT
        self.start_time = 0

        # Game variables
        self.game_state = "waiting"
        self.player_1_id = None
        self.player_2_id = None
        self.player_1_name = 'Default'
        self.player_1_avatar = None
        self.player_2_name = 'Default'
        self.player_2_avatar = None
        self.player_1_ready = False
        self.player_2_ready = False
        self.player_1_goals = 0
        self.player_2_goals = 0
        self.player_1_hits = 0
        self.player_2_hits = 0
        self.player_1_max_hits = 0
        self.player_2_max_hits = 0
        self.controls_mode = "local"
        self.ai_side = 0
        self.countdown = self.CONNECT_TIMEOUT * self.FPS
        self.new_direction = False
        self.match_total_time = 0
        self.forfeit = 0
        self.winner = 0
        self.loser = 0

        self.player_1_channel = None
        self.player_2_channel = None

        self.pad_vertical = False

        self.game_environment = game_environment
        self.tournament_id = tournament_id


    def move_ball(self):
        try:
            self.ball_x += self.ball_vel_x * self.ball_dir_x
            self.ball_y += self.ball_vel_y * self.ball_dir_y
        except Exception as e:
            print(f"Error moving ball: {e}")

    def move_paddle(self, player, direction):
        try:
            if player == 1:
                self.pad_1_y += direction * self.PADDLE_SPEED
                self.pad_1_y = max(
                    self.PADDLE_MID_HEIGHT + self.GOAL_TAB_MARGIN,
                    min(
                        self.pad_1_y,
                        self.TABLE_HEIGHT - self.PADDLE_MID_HEIGHT - self.GOAL_TAB_MARGIN))
            else:
                self.pad_2_y += direction * self.PADDLE_SPEED
                self.pad_2_y = max(
                    self.PADDLE_HEIGHT / 2 + self.GOAL_TAB_MARGIN,
                    min(
                        self.pad_2_y,
                        self.TABLE_HEIGHT - self.PADDLE_HEIGHT / 2 - self.GOAL_TAB_MARGIN))
        except Exception as e:
            print(f"Error moving paddle: {e}")

    def check_collision(self):
        try:
            # Check collision with walls
            if self.ball_y - self.BALL_RADIUS < 0:
                self.ball_dir_y = abs(self.ball_dir_y)
            elif self.ball_y + self.BALL_RADIUS >= self.TABLE_HEIGHT:
                self.ball_dir_y = -abs(self.ball_dir_y)

            # Check collision with pads
            if self.pad_1_x >= self.ball_x - self.BALL_RADIUS:
                if (self.pad_1_y - self.PADDLE_MID_HEIGHT <= self.ball_y + self.BALL_RADIUS and
                        self.pad_1_y + self.PADDLE_MID_HEIGHT >= self.ball_y - self.BALL_RADIUS):
                    if self.ball_x - self.BALL_RADIUS >= self.pad_1_x - self.ball_vel_x:
                        self.new_angle(1)
                        self.ball_vel_y += self.BALL_SPEED_INC
                        self.ball_vel_x += self.BALL_SPEED_INC
                        self.player_1_hits += 1
                        self.new_direction = True
                    elif self.ball_x - self.BALL_RADIUS <= self.pad_1_x + self.PADDLE_WIDTH and not self.pad_vertical:
                        self.ball_dir_y *= -1
                        self.pad_vertical = True
            elif self.pad_2_x <= self.ball_x + self.BALL_RADIUS:
                if (self.pad_2_y - self.PADDLE_MID_HEIGHT <= self.ball_y + self.BALL_RADIUS and
                        self.pad_2_y + self.PADDLE_MID_HEIGHT >= self.ball_y - self.BALL_RADIUS):
                    if self.ball_x + self.BALL_RADIUS <= self.pad_2_x + self.PADDLE_WIDTH + self.ball_vel_x:
                        self.new_angle(2)
                        self.ball_vel_y += self.BALL_SPEED_INC
                        self.ball_vel_x += self.BALL_SPEED_INC
                        self.player_2_hits += 1
                        self.new_direction = True
                    elif self.ball_x + self.BALL_RADIUS >= self.pad_2_x and not self.pad_vertical:
                        self.ball_dir_y *= -1
                        self.pad_vertical = True

        except Exception as e:
            print(f"Error checking collision: {e}")

    def new_angle(self, pad):
        try:
            if pad == 1:
                impact_point = self.ball_y - self.pad_1_y
            else:
                impact_point = self.ball_y - self.pad_2_y

            relative_intersect = impact_point / (self.PADDLE_HEIGHT / 2)
            bounce_angle = relative_intersect * math.radians(60)

            self.ball_dir_x = -self.ball_dir_x
            self.ball_dir_y = math.sin(bounce_angle)
        except Exception as e:
            print(f"Error calculating new angle: {e}")

    def check_goal(self):
        try:
            if self.ball_x < self.GOAL_TAB_MARGIN:
                self.player_2_goals += 1
                print("Goal player", self.player_2_id, " Score:", self.player_1_goals, "-", self.player_2_goals) # DEBUG
                return 2
            if self.ball_x > self.TABLE_WIDTH - self.GOAL_TAB_MARGIN:
                self.player_1_goals += 1
                print("Goal player", self.player_1_id, " Score:", self.player_1_goals, "-", self.player_2_goals) # DEBUG
                return 1
            return 0
        except Exception as e:
            print(f"Error checking goal: {e}")
            return 0

    def reset_game(self):
        self.ball_x = self.TABLE_MID_WIDTH
        self.ball_y = self.TABLE_MID_HEIGHT
        self.ball_vel_x = self.BALL_SPEED_INIT
        self.ball_vel_y = self.BALL_SPEED_INIT
        self.ball_dir_x = -1 if random.uniform(0, 1) <= 0.5 else 1
        self.ball_dir_y = -1 if random.uniform(0, 1) <= 0.5 else 1
        self.new_direction = True
        self.pad_vertical = False

    def end_game(self):
        if (self.player_1_goals >= self.GOALS_TO_WIN and
                self.player_1_goals - self.player_2_goals >= self.GOALS_DIFFERENCE):
            return True
        if (self.player_2_goals >= self.GOALS_TO_WIN and
                self.player_2_goals - self.player_1_goals >= self.GOALS_DIFFERENCE):
            return True
        return False

    def set_countdown(self):
        self.countdown = (self.INIT_COUNTDOWN + 1) * self.FPS

    async def game_loop(self):
        try:
            if self.game_state == "playing":
                self.new_direction = False
                self.move_ball()
                self.check_collision()
                goal = self.check_goal()
                if goal:
                    if self.player_1_hits > self.player_1_max_hits:
                        self.player_1_max_hits = self.player_1_hits
                    if self.player_2_hits > self.player_2_max_hits:
                        self.player_2_max_hits = self.player_2_hits
                    self.player_1_hits = 0
                    self.player_2_hits = 0
                    if self.end_game():
                        self.game_state = "game_over"
                    else:
                        self.game_state = "scored"
                        self.set_countdown()
                        self.reset_game()
            elif self.game_state == "countdown":
                if self.countdown > self.FPS:
                    self.new_direction = False
                    self.countdown -= 1
                else:
                    self.new_direction = True
                    self.game_state = "playing"
            elif self.game_state == "scored":
                self.game_state = "countdown"
            elif self.game_state == "waiting":
                if self.countdown > self.FPS:
                    self.countdown -= 1
                else:
                    self.game_state = "game_over"
                if self.player_1_ready and self.player_2_ready:
                    self.start_time = time.time()
                    self.game_state = "countdown"
                    self.set_countdown()
        except Exception as e:
            print(f"Error in game loop: {e}")

    def get_game_result(self):
        return {
            "player_1_score": self.player_1_goals,
            "player_2_score": self.player_2_goals,
        }

    def end_game_adjustments(self):
        self.match_total_time = round(time.time() - self.start_time, 2)
        if self.forfeit:
            if self.forfeit == 1:
                self.winner = 2
            else:
                self.winner = 1
            self.loser = 0
        else:
            if not self.player_1_ready and not self.player_2_ready:
                self.winner = 0
                self.loser = 0
                self.match_total_time = 0
            elif not self.player_1_ready:
                self.winner = 2
                self.loser = 0
                self.match_total_time = 0
            elif not self.player_2_ready:
                self.winner = 1
                self.loser = 0
                self.match_total_time = 0
            elif self.player_1_goals > self.player_2_goals:
                self.winner = 1
                self.loser = 2
            else:
                self.winner = 2
                self.loser = 1
