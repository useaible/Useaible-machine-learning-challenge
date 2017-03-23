import numpy as np

class LanderSimulator(object):

    inputs = 3
    actions = [0, 1]
    ALTITUDE = 0
    FUEL = 0
    def __init__(self, altitude=10000., fuel=200.):
        LanderSimulator.ALTITUDE = altitude
        LanderSimulator.FUEL = fuel

        self.altitude = altitude
        self.fuel = fuel
        self.gravity = 1.62
        self.thrust = 10.
        self.terminalVelocity = 40.
        self.seconds = 0
        self.velocity = 0.

    def step(self, action):
        self.seconds += 1
        self.velocity -= self.gravity
        self.altitude += self.velocity

        if LanderSimulator.actions[action] == 1 and self.fuel > 0:
            self.fuel -= 1
            self.velocity += self.thrust

        self.velocity = np.maximum(-self.terminalVelocity, self.velocity)
        self.velocity = np.minimum(self.terminalVelocity, self.velocity)

        if self.altitude < 0.:
            self.altitude = 0.

        return np.array([[self.altitude, self.fuel, self.velocity], self.collect_reward(LanderSimulator.actions[action]), self.game_is_over(), ''])

    def observe(self):
        return np.array([self.fuel, self.altitude, self.velocity, self.seconds])


    def collect_reward(self, action):
        reward = -1
        if self.altitude <= 1000:
            if self.fuel > 0 and self.velocity >= -8 and action == 0:
                reward = 1
            elif self.fuel > 0 and self.velocity < -5 and action == 1:
                reward = 1
        
        elif self.altitude > 1000 and action == 0:
            reward = 1

        return reward

    def episode_reward(self):
        return (self.fuel * 10) + self.seconds + (self.velocity * 1000.)

    def reset(self):
        self.altitude = LanderSimulator.ALTITUDE
        self.fuel = LanderSimulator.FUEL
        self.seconds = 0
        self.velocity = 0.
        return np.array([self.altitude, self.fuel, 0])

    def render(self):
        print "Elapsed: %r s, Fuel: %r l, Velocity: %r m/s, %r m" % (self.seconds, self.fuel, self.velocity, self.altitude)

    def game_is_over(self):
        if self.altitude == 0:
            return True
        else:
            return False
