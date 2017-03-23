import numpy as np
import tempfile
import tensorflow as tf
import math
import json
import random
import puka
import pika
import thread
import time

from simulator import LanderSimulator
from mazeGame import mazeSimulator

credentials = pika.PlainCredentials('test', 'test')
parameters = pika.ConnectionParameters('invirmq.southeastasia.cloudapp.azure.com',
                                       5672,
                                       '/',
                                       credentials)

connection = pika.BlockingConnection(parameters)

channel = connection.channel()
network_solutions = {}
# lander_channel = connection.channel()

class neural_network:
    REPLAY_MEMORY_SIZE = 500000
    RANDOM_ACTION_DECAY = 0.99
    FINAL_RANDOM_ACTION_PROB = 0.05
    INITIAL_RANDOM_ACTION_PROB = 0.9
    MIN_RANDOM_ACTION_PROB = 0.1
    HIDDEN1_SIZE = 200
    HIDDEN2_SIZE = 200
    NUM_EPISODES = 10000
    MAX_STEPS = 100000
    LEARNING_RATE = 0.001
    MINIBATCH_SIZE = 100
    DISCOUNT_FACTOR = 0.9
    TARGET_UPDATE_FREQ = 300
    REG_FACTOR = 0.001
    OBS_LAST_STATE_INDEX, OBS_ACTION_INDEX, OBS_REWARD_INDEX, OBS_CURRENT_STATE_INDEX, OBS_TERMINAL_INDEX = range(5)
    LOG_DIR = '/home/useaible/project/logs'

    # random_action_prob = 0.9
    replay_memory = []
 
    def __init__(self):
        self.env = None
        self.input_size = None
        self.output_size = None
        

    def init_network(self, env):
        self.env = env
        self.input_size = self.env.inputs
        self.output_size = len(self.env.actions)
        self.random_action_prob = self.INITIAL_RANDOM_ACTION_PROB
        # Inference
        self.x = tf.placeholder(tf.float32, [None, self.input_size])
        # self.score = tf.placeholder(tf.float32, shape=[], name="score")
        with tf.name_scope('hidden1'):
            W1 = tf.Variable(
                    tf.truncated_normal([self.input_size, self.HIDDEN1_SIZE], 
                    stddev=0.01), name='W1')
            b1 = tf.Variable(tf.zeros(shape=[self.HIDDEN1_SIZE]), name='b1')
            h1 = tf.nn.tanh(tf.matmul(self.x, W1) + b1)
        with tf.name_scope('hidden2'):
            W2 = tf.Variable(
                    tf.truncated_normal([self.HIDDEN1_SIZE, self.HIDDEN2_SIZE], 
                    stddev=0.01), name='W2')
            b2 = tf.Variable(tf.zeros(shape=[self.HIDDEN2_SIZE]), name='b2')
            h2 = tf.nn.tanh(tf.matmul(h1, W2) + b2)
        with tf.name_scope('output'):
            W3 = tf.Variable(
                    tf.truncated_normal([self.HIDDEN2_SIZE, self.output_size], 
                     stddev=0.01), name='W3')
            b3 = tf.Variable(tf.zeros(shape=[self.output_size]), name='b3')
            self.Q = tf.matmul(h2, W3) + b3
        self.weights = [W1, b1, W2, b2, W3, b3]

        # Loss
        self.targetQ = tf.placeholder(tf.float32, [None])
        self.targetActionMask = tf.placeholder(tf.float32, [None, self.output_size])
        # TODO: Optimize this
        q_values = tf.reduce_sum(tf.mul(self.Q, self.targetActionMask), 
                    reduction_indices=[1])
        self.loss = tf.reduce_mean(tf.square(tf.sub(q_values, self.targetQ)))

        # Reguralization
        for w in [W1, W2, W3]:
            self.loss += self.REG_FACTOR * tf.reduce_sum(tf.square(w))

        # Training
        optimizer = tf.train.AdamOptimizer(self.LEARNING_RATE)
        global_step = tf.Variable(0, name='global_step', trainable=False)
        self.train_op = optimizer.minimize(self.loss, global_step=global_step)
    #end init_network
 
    def train(self, num_episodes=NUM_EPISODES, mqtt=None):

        on_training = True
        stop_training = False
        score = 0

        self.session = tf.Session()

        # Summary for TensorBoard
        tf.scalar_summary('loss', self.loss)
        # tf.scalar_summary('score', self.score)
        self.summary = tf.merge_all_summaries()
        self.summary_writer = tf.train.SummaryWriter(self.LOG_DIR, self.session.graph)

        self.session.run(tf.initialize_all_variables())
        total_steps = 0
        step_counts = []

        target_weights = self.session.run(self.weights)

        # create a temporary queue
        # queue_promise = client.queue_declare(exclusive=True, durable=True)
        # queue = client.wait(queue_promise)['queue']

        # #bind the queue
        # bind_promise = client.queue_bind(exchange='amq.topic', queue=queue, routing_key='telemetry')
        # client.wait(bind_promise)

        # # start waiting for data
        # data_promise = client.basic_consume(queue=queue, no_ack=True)

        # # create a fanout exchange
        # exchange_promise = client.exchange_declare(
        #     exchange='amq.topic', type='topic', durable=True)
        # client.wait(exchange_promise)

        for episode in range(num_episodes):
            # move = {
            #     'Reset' : True,
            #     'Value' : '0'
            # }

            # json_str = json.dumps(move)
            # message = json_str

            # message_promise = client.basic_publish(
            #     exchange='amq.topic', routing_key='move', body=message)
            # # request to start simulator
            # client.wait(message_promise) 

            #delay for multi threading purposes
            #sleeps for .1 second
            time.sleep(.1); 

            score = 0
            actions = []
            state = self.env.reset()
            steps = 0
            reward = 0
            done = False
            for step in range(self.MAX_STEPS):
   
            # Pick the next action and execute it
                # if episode % 10 == 0:
                #     self.env.render()

                action = None
                if episode < self.MINIBATCH_SIZE or episode % 10 == 1 \
                        or random.random() < self.random_action_prob:
                    action = random.choice(self.env.actions)
                else:
                    q_values = self.session.run(self.Q, feed_dict={self.x: [state]})
                    action = q_values.argmax()
                
                actions.append(action)
                # move = {
                #     'Reset' : False,
                #     'Value' : action
                # }
                
                # json_str = json.dumps(move)
       
                # message = json_str

                # message_promise = client.basic_publish(
                #     exchange='amq.topic', routing_key='move', body=message)
                # client.wait(message_promise)

                # # wait for the telemetry               
                
                # data = client.wait(data_promise)
                # # print "[x] data: ", repr(data['body'])
                # receive_data = json.loads(data['body'])

                # obs = receive_data['obs']
                # reward = receive_data['reward']
                # if receive_data['done'] == 0:
                #     done = False
                # else:
                #     done = True


                obs, reward, done, _ = self.env.step(action)          
                # Update replay memory
                if done:
                    # reward = self.env.episode_reward()
                    # reward = reward
                    score = self.env.episode_reward()  

                self.replay_memory.append((state, action, reward, obs, done))
                if len(self.replay_memory) > self.REPLAY_MEMORY_SIZE:
                    self.replay_memory.pop(0)
                state = obs

                total_steps += 1
                steps += 1
                if done:
                    break

            # todo send episode actions using mqtt
            if num_episodes == (episode + 1):
                training_done = True
            else:
                training_done = False 


            #send training session data if mqtt not None
            if mqtt is not None:
                data = {
                    'data': actions,
                    "session": episode + 1,
                    "score": score,
                    "done": training_done
                }
                json_data = json.dumps(data)
                mqtt['channel'].basic_publish(exchange=mqtt['exchange'],
                                      routing_key=mqtt['train_route_key'],
                                      body=json_data)

            # Sample a random minibatch and fetch max Q at s'
            if episode > self.MINIBATCH_SIZE:
                minibatch = random.sample(self.replay_memory, self.MINIBATCH_SIZE)
                previous_states = [d[self.OBS_LAST_STATE_INDEX] for d in minibatch]
                actions = [d[self.OBS_ACTION_INDEX] for d in minibatch]
                rewards = [d[self.OBS_REWARD_INDEX] for d in minibatch]
                current_states = [d[self.OBS_CURRENT_STATE_INDEX] for d in minibatch]

                next_states = [m[3] for m in minibatch]
                # TODO: Optimize to skip terminal states
                feed_dict = {self.x: current_states}
                feed_dict.update(zip(self.weights, target_weights))
                q_values = self.session.run(self.Q, feed_dict=feed_dict)
                max_q_values = q_values.max(axis=1)

              # Compute target Q values
                target_q = np.zeros(self.MINIBATCH_SIZE)
                target_action_mask = np.zeros((self.MINIBATCH_SIZE, self.output_size), dtype=int)
                for i in range(self.MINIBATCH_SIZE):
                    _, action, reward, _, terminal = minibatch[i]
                    # print "Action: %r, Reward: %r, Terminal: %r" % (action, reward, terminal)
                    target_q[i] = rewards[i]
                    if not terminal:
                        target_q[i] += self.DISCOUNT_FACTOR * np.max(q_values[i])
                    target_action_mask[i][actions[i]] = 1
           
                # Gradient descent
                # print "target_action_mask: ", target_action_mask
                # print "actions: ", actions

                states = [m[0] for m in minibatch]
                feed_dict_x = {
                    self.x: previous_states,
                    self.targetQ: target_q,
                    self.targetActionMask: target_action_mask,
                }
                _, summary = self.session.run([self.train_op, self.summary], 
                                            feed_dict=feed_dict_x)

                # Write summary for TensorBoard
                if episode % 10 == 0:
                    self.summary_writer.add_summary(summary, episode)

            step_counts.append(steps) 
            mean_steps = np.mean(step_counts[-100:])
            # print("Training episode = {}, Score = {}, Random chance: {}, Steps: {}"
            #                               .format(episode, score, self.random_action_prob, steps))
            self.update_random_action_prob()
            # Update target network
            if episode % self.TARGET_UPDATE_FREQ == 0:
                target_weights = self.session.run(self.weights)
 
    def update_random_action_prob(self):
        self.random_action_prob *= self.RANDOM_ACTION_DECAY
        if self.random_action_prob < self.MIN_RANDOM_ACTION_PROB:
            self.random_action_prob = self.MIN_RANDOM_ACTION_PROB
    
    def play(self, mqtt=None):

        lander_solution = []
        state = self.env.reset()
        done = False
        
        loop_count = 0
        while not done:
            loop_count += 1
            self.env.render()
            q_values = self.session.run(self.Q, feed_dict={self.x: [state]})        
            action = q_values.argmax()
            print "Action: ", action
            lander_solution.append(action)

            state, _, done, _ = self.env.step(action)
            if loop_count == 1000:
                break
            # steps += 1
        print "Done playing"

        if mqtt is not None:
            data = {
                'data': lander_solution,
                "session": 'best solution',
                "score": 0,
                "done": True
            }

            json_data = json.dumps(data)
            mqtt['channel'].basic_publish(exchange=mqtt['exchange'],
                          routing_key=mqtt['play_route_key'],
                          body=json_data)

        return lander_solution
        # return steps
 
# nn = None
def main():
    try:
       
        print "Neural network initialize"

        result = channel.queue_declare(exclusive=True)
        queue_name = result.method.queue


        def start_training(ch, method, properties, body):
            print body
            print ch
            print method
            print properties
            thread.start_new_thread(train_tensorflow, (body, ch,))
        #end start_training


        channel.queue_bind(exchange='amq.topic',
                        queue=queue_name,
                        routing_key="tensorflow.train")

        channel.basic_consume(start_training,
                        queue=queue_name,
                        no_ack=True)

        print "Chanel ready to consume"
        channel.start_consuming()     

    except KeyboardInterrupt:
        connection.close()
        # client.close()

def train_tensorflow(data, channel):    
    # global network_solutions
    nn = neural_network()

    receive_data = json.loads(data)
     
    session = receive_data['Sessions']           
    nn.INITIAL_RANDOM_ACTION_PROB = np.float32(receive_data['random_action_prob'])
    nn.RANDOM_ACTION_DECAY = np.float32(receive_data['RANDOM_ACTION_DECAY'])
    nn.HIDDEN1_SIZE = np.int32(receive_data['HIDDEN1_SIZE'])
    nn.HIDDEN2_SIZE = np.int32(receive_data['HIDDEN2_SIZE'])
    nn.LEARNING_RATE = np.float32(receive_data['LEARNING_RATE'])
    nn.MINIBATCH_SIZE = np.int32(receive_data['MINIBATCH_SIZE'])
    nn.DISCOUNT_FACTOR = np.float32(receive_data['DISCOUNT_FACTOR'])
    nn.TARGET_UPDATE_FREQ = np.int(receive_data['TARGET_UPDATE_FREQ'])
    
    # USER TOKEN
    user_token = receive_data['USER_TOKEN']
    game = None
    try:
        game_type = receive_data['Game']
    except:
        game_type = None

    print "Training started..."
    tf.reset_default_graph()
    if game_type and receive_data['Game'] == 'maze':
        data = receive_data['MazeInfo']
        grid = data['Grid']
        goal_postion = data['GoalPosition']
        starting_position = data['StartingPosition']
        maze_height = data['Height']
        maze_width = data['Width']
        perfect_game_moves = data['PerfectGameMovesCount']
        game = mazeSimulator(maze_height, maze_width,grid,starting_position['X'], starting_position['Y'],goal_postion['X'], goal_postion['Y'], perfect_game_moves)
    else:
        altitude = receive_data['Altitude']
        fuel = receive_data['Fuel']
        game = LanderSimulator(altitude, fuel)

    nn.env = game

    user_exchange_name = 'amq.topic' #'lander.' + user_token        
    train_route_key = 'tensorflow.actions.' + user_token
    play_route_key = 'tensorflow.play_lander.' + user_token

    mqttMetadata = {        
        'token': user_token,
        'channel': channel,
        'exchange': user_exchange_name,
        'train_route_key': train_route_key,
        'play_route_key': play_route_key
    }

    # todo pass the parameters from the client
    nn.init_network(game)


    nn.train(session, mqttMetadata)
    network_solutions[user_token] = nn.play(mqttMetadata)

#end train_tensorflow()

if __name__ == "__main__":
    main()