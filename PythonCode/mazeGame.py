import numpy as np
import json
import math
class mazeSimulator(object):

    actions = [0, 1, 2, 3] #output up right down left
    inputs = 2
    maze_height = 0
    maze_width =  0
    starting_location_x = 0
    starting_location_y = 0
    goal_location_x = 0
    goal_location_y = 0
    perfect_game_moves = 0
    maze_grid = []
    current_location_x = 0
    current_location_y = 0
    new_location_x = 0
    new_location_y = 0
    old_location_x = 0
    old_location_y = 0
    moves = 0
    distance = 0
    current_distance = 0
    def __init__(self, maze_height, maze_width, grid, starting_location_x, starting_location_y, goal_location_x, goal_location_y, perfect_game_moves):
        self.maze_height = maze_height
        self.maze_width = maze_width
        self.maze_grid = grid
        self.starting_location_x = starting_location_x
        self.starting_location_y = starting_location_y
        self.goal_loacation_x = goal_location_x
        self.goal_loacation_y = goal_location_y
        self.current_location_x = starting_location_x
        self.current_location_y = starting_location_y
        self.new_location_x = starting_location_x
        self.new_location_y = starting_location_y
        self.old_location_x = starting_location_x
        self.old_location_y = starting_location_y
        self.bumped_into_wall = False
        self.perfect_game_moves = perfect_game_moves
        self.distance = math.sqrt( ((self.goal_loacation_x - self.starting_location_x) ** 2) + ((self.goal_loacation_y - self.starting_location_y) ** 2))
        self.current_distance = 0
        print "Width: %r, Height: %r, Starting X: %r ,Starting Y: %r, Goal X: %r, Goal Y: %r, Perfect Game Moves: %r, Distance: %r" % (self.maze_width, self.maze_height, self.current_location_x, 
                                                                                                                            self.current_location_y, self.goal_loacation_x, self.goal_location_y, self.perfect_game_moves, self.distance)

    def step(self, action):
        self.bumped_into_wall = False
        self.moves += 1

        self.current_distance = math.sqrt( ((self.goal_loacation_x - self.current_location_y) ** 2) + ((self.goal_loacation_y - self.current_location_y) ** 2))

        if action == 0:
            if self.current_location_y <= 0:
                self.bumped_into_wall = True
                # print "Action: %r, X: %r , Y: %r, Bump Into Wall: %r, reward: %r" % (action, self.current_location_x, self.current_location_y, self.bumped_into_wall, self.collect_reward(self.bumped_into_wall))
                return np.array([[self.current_location_x, self.current_location_y], self.collect_reward(self.bumped_into_wall), self.game_is_over(), ''])
            
            self.new_location_y = self.current_location_y - 1
            self.new_location_x = self.current_location_x
            
        elif action == 1:          
            if self.current_location_x >= (self.maze_width - 1):
                self.bumped_into_wall = True
                # print "Action: %r, X: %r , Y: %r, Bump Into Wall: %r, reward: %r" % (action, self.current_location_x, self.current_location_y, self.bumped_into_wall, self.collect_reward(self.bumped_into_wall))
                return np.array([[self.current_location_x, self.current_location_y], self.collect_reward(self.bumped_into_wall), self.game_is_over(), ''])
            
            self.new_location_x = self.current_location_x + 1
            self.new_location_y = self.current_location_y
            
        elif action == 2:
            if self.current_location_y >= (self.maze_height - 1):
                self.bumped_into_wall = True
                # print "Action: %r, X: %r , Y: %r, Bump Into Wall: %r, reward: %r" % (action, self.current_location_x, self.current_location_y, self.bumped_into_wall, self.collect_reward(self.bumped_into_wall))
                return np.array([[self.current_location_x, self.current_location_y], self.collect_reward(self.bumped_into_wall), self.game_is_over(), ''])
            
            self.new_location_x = self.current_location_x
            self.new_location_y = self.current_location_y + 1
            
        elif action == 3:
            if self.current_location_x <= 0:
                self.bumped_into_wall = True
                # print "Action: %r, X: %r , Y: %r, Bump Into Wall: %r, reward: %r" % (action, self.current_location_x, self.current_location_y, self.bumped_into_wall, self.collect_reward(self.bumped_into_wall))
                return np.array([[self.current_location_x, self.current_location_y], self.collect_reward(self.bumped_into_wall), self.game_is_over(), ''])

            self.new_location_x = self.current_location_x - 1
            self.new_location_y = self.current_location_y
            
        

        if self.maze_grid[self.new_location_x][self.new_location_y]:        
            self.bumped_into_wall = True    
            # print "Action: %r, X: %r , Y: %r, Bump Into Wall: %r, reward: %r" % (action, self.current_location_x, self.current_location_y, self.bumped_into_wall, self.collect_reward(self.bumped_into_wall))
            return np.array([[self.current_location_x, self.current_location_y], self.collect_reward(self.bumped_into_wall), self.game_is_over(), ''])


        self.old_location_x = self.current_location_x
        self.old_location_y = self.current_location_y
        self.current_location_x = self.new_location_x
        self.current_location_y = self.new_location_y
   
        # print "Action: %r, X: %r , Y: %r, Bump Into Wall: %r, reward: %r" % (action, self.current_location_x, self.current_location_y, self.bumped_into_wall, self.collect_reward(self.bumped_into_wall))
        return np.array([[self.current_location_x, self.current_location_y], self.collect_reward(self.bumped_into_wall), self.game_is_over(), ''])

    def collect_reward(self, bumped):
        new_distance = math.sqrt( ((self.goal_loacation_x - self.current_location_y) ** 2) + ((self.goal_loacation_y - self.current_location_y) ** 2))
        reward = -1
        if bumped:
            reward = -1
        else:
            reward = (self.distance - new_distance) * 10

        return reward

    def episode_reward(self):
        score = ((self.perfect_game_moves - self.moves) + 100) * 10
        return score

    def reset(self):
        self.moves = 0
        self.current_location_x = self.starting_location_x
        self.current_location_y = self.starting_location_y

        return np.array([self.starting_location_x, self.starting_location_y])

    def game_is_over(self):
        if self.current_location_x == self.goal_loacation_x and self.current_location_y == self.goal_loacation_y:
            return True
        else:
            return False

    def render(self):
        print "X: %r , Y: %r, Bump Into Wall: %r" % (self.current_location_x, self.current_location_y, self.bumped_into_wall)

# def main():
#     data =  {
#                 "ID": 0,
#                 "Name": "5ebaa512d7524e92952c48b1600ef890",
#                 "StartingPosition": {
#                     "X": 0,
#                     "Y": 13
#                 },
#                 "GoalPosition": {
#                     "X": 14,
#                     "Y": 1
#                 },
#                 "PerfectGameMovesCount": 0,
#                 "Width": 15,
#                 "Height": 15,
#                 "Grid": [
#                     [
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         True,
#                         False,
#                         True
#                     ],
#                     [
#                         True,
#                         False,
#                         False,
#                         False,
#                         True,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         False,
#                         True
#                     ]
#                 ]
#             }

#     grid = data['Grid']
#     goal_postion = data['GoalPosition']
#     starting_position = data['StartingPosition']
#     maze_height = data['maze_height']
#     maze_width = data['maze_width']
#     print goal_postion['X']

# if __name__ == "__main__":
#     main()

