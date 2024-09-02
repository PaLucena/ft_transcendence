import math
import random


class GameLogic:
    # Game configuration
    PADDLE_SPEED = 4
    BALL_SPEED_INIT = 6
    BALL_SPEED_INC = 0.5
    GOALS_TO_WIN = 5
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

    # Initial values
    pad_1_x = PADDLE_TAB_MARGIN
    pad_1_y = TABLE_MID_HEIGHT
    pad_2_x = TABLE_WIDTH - PADDLE_TAB_MARGIN
    pad_2_y = TABLE_MID_HEIGHT
    ball_x = TABLE_MID_WIDTH
    ball_y = TABLE_MID_HEIGHT
    ball_dir_x = -1 if random.uniform(-1, 1) <= 0.5 else 1
    ball_dir_y = -1 if random.uniform(-1, 1) <= 0.5 else 1
    ball_vel_x = BALL_SPEED_INIT
    ball_vel_y = BALL_SPEED_INIT

    # Game variables
    game_state = "waiting"
    player_1_id = None
    player_2_id = None
    player_1_name = 'Default'
    player_1_avatar = None
    player_2_name = 'Default'
    player_2_avatar = None
    player_1_ready = False
    player_2_ready = False
    player_1_goals = 0
    player_2_goals = 0
    controls_mode = "local"
    ai_side = 0
    countdown = CONNECT_TIMEOUT * FPS

    player_1_channel = None
    player_2_channel = None

    def move_ball(self):
        self.ball_x += self.ball_vel_x * self.ball_dir_x
        self.ball_y += self.ball_vel_y * self.ball_dir_y

    def move_paddle(self, player, direction):
        if player == 1:
            self.pad_1_y += direction * self.PADDLE_SPEED
            if self.pad_1_y - self.PADDLE_MID_HEIGHT < self.GOAL_TAB_MARGIN:
                self.pad_1_y = self.PADDLE_MID_HEIGHT + self.GOAL_TAB_MARGIN
            if self.pad_1_y + self.PADDLE_MID_HEIGHT > self.TABLE_HEIGHT - self.GOAL_TAB_MARGIN:
                self.pad_1_y = self.TABLE_HEIGHT - self.PADDLE_MID_HEIGHT - self.GOAL_TAB_MARGIN
        else:
            self.pad_2_y += direction * self.PADDLE_SPEED
            if self.pad_2_y - self.PADDLE_HEIGHT / 2 < self.GOAL_TAB_MARGIN:
                self.pad_2_y = self.PADDLE_HEIGHT / 2 + self.GOAL_TAB_MARGIN
            if self.pad_2_y + self.PADDLE_HEIGHT / 2 > self.TABLE_HEIGHT - self.GOAL_TAB_MARGIN:
                self.pad_2_y = self.TABLE_HEIGHT - self.PADDLE_HEIGHT / 2 - self.GOAL_TAB_MARGIN

    def check_collision(self):
        # Check collision with walls
        if self.ball_y - self.BALL_RADIUS <= 0 or self.ball_y + self.BALL_RADIUS >= self.TABLE_HEIGHT:
            self.ball_dir_y *= -1

        # Check collision with pads
        if (self.pad_1_x >= self.ball_x - self.BALL_RADIUS >= self.pad_1_x - self.PADDLE_WIDTH and
                self.pad_1_y - self.PADDLE_HEIGHT / 2 <= self.ball_y <= self.pad_1_y + self.PADDLE_HEIGHT / 2 and
                self.ball_dir_x < 0):
            self.new_angle(1)
            self.ball_vel_y += self.BALL_SPEED_INC
            self.ball_vel_x += self.BALL_SPEED_INC
        elif (self.pad_2_x <= self.ball_x + self.BALL_RADIUS <= self.pad_2_x + self.PADDLE_WIDTH and
              self.pad_2_y - self.PADDLE_HEIGHT / 2 <= self.ball_y <= self.pad_2_y + self.PADDLE_HEIGHT / 2 and
              self.ball_dir_x > 0):
            self.new_angle(2)
            self.ball_vel_y += self.BALL_SPEED_INC
            self.ball_vel_x += self.BALL_SPEED_INC

    def new_angle(self, pad):
        if pad == 1:
            impact_point = self.ball_y - self.pad_1_y
        else:
            impact_point = self.ball_y - self.pad_2_y

        relative_intersect = impact_point / (self.PADDLE_HEIGHT / 2)
        bounce_angle = relative_intersect * math.radians(60)

        self.ball_dir_x = -self.ball_dir_x
        self.ball_dir_y = math.sin(bounce_angle)

    def check_goal(self):
        if self.ball_x < self.GOAL_TAB_MARGIN:
            self.player_2_goals += 1
            print("Goal player", self.player_2_id, " Score:", self.player_1_goals, "-", self.player_2_goals) # DEBUG
            return 2
        if self.ball_x > self.TABLE_WIDTH - self.GOAL_TAB_MARGIN:
            self.player_1_goals += 1
            print("Goal player", self.player_1_id, " Score:", self.player_1_goals, "-", self.player_2_goals) # DEBUG
            return 1
        return 0

    def reset_game(self):
        self.ball_x = self.TABLE_MID_WIDTH
        self.ball_y = self.TABLE_MID_HEIGHT
        self.ball_vel_x = self.BALL_SPEED_INIT
        self.ball_vel_y = self.BALL_SPEED_INIT
        self.ball_dir_x = -1 if random.uniform(-1, 1) <= 0.5 else 1
        self.ball_dir_y = -1 if random.uniform(-1, 1) <= 0.5 else 1

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
        if self.game_state == "playing":
            self.move_ball()
            self.check_collision()
            goal = self.check_goal()
            if goal:
                if self.end_game():
                    self.game_state = "game_over"
                else:
                    self.game_state = "scored"
                    self.set_countdown()
                    self.reset_game()
        elif self.game_state == "countdown":
            if self.countdown > self.FPS:
                self.countdown -= 1
            else:
                self.game_state = "playing"
        elif self.game_state == "scored":
            self.game_state = "countdown"
        elif self.game_state == "waiting":
            if self.countdown > self.FPS:
                self.countdown -= 1
            else:
                self.game_state = "game_over"
            if self.player_1_ready and self.player_2_ready:
                self.game_state = "countdown"
                self.set_countdown()
        elif self.game_state == "game_over":
            if not self.player_1_ready:
                self.player_1_goals = -1
            if not self.player_2_ready:
                self.player_2_goals = -1

    def get_game_result(self):
        return {
            "player_1_score": self.player_1_goals,
            "player_2_score": self.player_2_goals,
        }

    # Debugging methods
    def print_positions(self):
        print(f"Ball: ({self.ball_x}, {self.ball_y})")
        print(f"Pad 1: ({self.pad_1_x}, {self.pad_1_y})")
        print(f"Pad 2: ({self.pad_2_x}, {self.pad_2_y})")
        print(f"Score: {self.player_1_goals} - {self.player_2_goals}")
