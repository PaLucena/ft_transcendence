import random
from statistics import variance


class AiPlayer:
    def __init__(self, game):
        self.game = game

        # Board
        self.BOARD_START = 0 + self.game.BALL_RADIUS
        self.BOARD_END = self.game.TABLE_HEIGHT - self.game.BALL_RADIUS

        # Last seen data
        self.ball_x = 0
        self.ball_y = 0
        self.ball_vel_x = 0
        self.ball_vel_y = 0
        self.ball_dir_x = 0
        self.ball_dir_y = 0
        self.ia_y = 0
        self.ia_side = self.game.ai_side
        self.opponent_y = 0

        # Calculating next move
        self.distance_x = 0
        self.collision_y = self.game.TABLE_HEIGHT / 2
        self.target_point = 0
        self.new_position = 0
        self.col_x_time = 0

        # AI settings
        self.ai_handicap = 8
        self.error_base = self.game.PADDLE_HEIGHT / 4

        self.loop_count = 0
        self.new_ball_dir_x = 0

    def ai_turn(self, new_direction):
        if new_direction:
            self.loop_count = 0
            self.new_ball_dir_x = self.game.ball_dir_x
        if self.loop_count % self.game.FPS == 0:
            self.data_update()
            self.think()
        self.move()
        self.loop_count += 1


    def data_update(self):
        try:
            self.ball_x = self.game.ball_x
            self.ball_y = self.game.ball_y

            self.ball_vel_x = self.game.ball_vel_x
            self.ball_vel_y = self.game.ball_vel_y * self.game.ball_dir_y
            self.ball_dir_x = self.game.ball_dir_x
            self.ball_dir_y = self.game.ball_dir_y
            if self.ia_side == 1:
                self.ia_y = self.game.pad_1_y
                self.opponent_y = self.game.pad_2_y
            else:
                self.ia_y = self.game.pad_2_y
                self.opponent_y = self.game.pad_1_y
            # print(f"AI read time: {time.time() - self.game.start_time:.3f}") # DEBUG
        except Exception as e:
            print(f"Error updating data (AI): {e}")


    def move(self):
        try:
            distance = self.ia_y - self.new_position
            if distance < 0 and distance < -self.game.PADDLE_SPEED:
                self.game.move_paddle(self.ia_side, 1)
                self.ia_y += self.game.PADDLE_SPEED
            elif distance > 0 and distance > self.game.PADDLE_SPEED:
                self.game.move_paddle(self.ia_side, -1)
                self.ia_y -= self.game.PADDLE_SPEED
        except Exception as e:
            print(f"Error moving paddle (AI): {e}")


    def think(self):
        try:
            if (((self.ia_side == 1 and self.ball_dir_x < 0) or
                    (self.ia_side == 2 and self.ball_dir_x > 0)) and
                    self.game.game_state == "playing"):
                self.calc_collision_point()
                self.calc_target_point()
                self.calc_new_position()
            elif self.game.game_state == "playing":
                handicap = random.uniform(-self.error_base * 4, self.error_base * 4)
                self.new_position = self.game.TABLE_MID_HEIGHT + handicap
            else:
                self.new_position = self.game.TABLE_MID_HEIGHT
        except Exception as e:
            print(f"Error thinking (AI): {e}")


    def calc_collision_point(self):
        try:
            while_protection = 0
            if self.ia_side == 2:
                self.distance_x = (self.game.TABLE_WIDTH - self.game.PADDLE_TAB_MARGIN
                                   - self.ball_x - self.game.BALL_RADIUS)
            else:
                self.distance_x = self.ball_x - self.game.PADDLE_TAB_MARGIN - self.game.BALL_RADIUS
            self.col_x_time = self.distance_x / self.ball_vel_x
            self.collision_y = (self.ball_y + self.ball_vel_y * self.col_x_time)
            while (self.collision_y < self.BOARD_START or self.collision_y > self.BOARD_END) and while_protection < 10:
                if self.collision_y < self.BOARD_START:
                    self.collision_y = abs(self.collision_y) + self.game.BALL_RADIUS
                else:
                    self.collision_y = self.BOARD_END - abs(self.BOARD_END - self.collision_y)
                while_protection += 1
            if while_protection >= 10:
                print(f"Error calculating collision: while protection at {self.collision_y}")
        except Exception as e:
            print(f"Error calculating collision point (AI): {e}")


    def calc_target_point(self):
        pass


    def calc_new_position(self):
        handicap_index = random.uniform(-self.error_base, self.error_base) * self.ai_handicap
        self.new_position = self.collision_y + handicap_index

