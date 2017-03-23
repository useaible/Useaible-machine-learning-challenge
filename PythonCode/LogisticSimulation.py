import tensorflow as tf
import numpy as np
import math
import json
import random
import thread
import time
import datetime
import os
import sys
import multiprocessing
import paho.mqtt.client as mqtt

#MQTT_URL = "122.53.51.247"
#MQTT_URL = "broker.mqttdashboard.com"
MQTT_URL = "dev.useaible.com"

local_data = {
    "Data": [
        {
            "Settings": [
                41,
                93,
                48,
                108,
                43,
                63,
                2,
                87,
                93
            ],
            "TotalCosts": 15539
        },
        {
            "Settings": [
                29,
                117,
                36,
                88,
                21,
                77,
                3,
                110,
                21
            ],
            "TotalCosts": 20993
        },
        {
            "Settings": [
                42,
                82,
                40,
                115,
                14,
                73,
                2,
                75,
                84
            ],
            "TotalCosts": 18145
        },
        {
            "Settings": [
                0,
                65,
                43,
                72,
                16,
                117,
                32,
                83,
                6
            ],
            "TotalCosts": 148277
        },
        {
            "Settings": [
                31,
                80,
                37,
                93,
                50,
                93,
                41,
                97,
                84
            ],
            "TotalCosts": 18284
        },
        {
            "Settings": [
                26,
                67,
                27,
                90,
                46,
                84,
                38,
                101,
                39
            ],
            "TotalCosts": 16388
        },
        {
            "Settings": [
                40,
                110,
                17,
                93,
                39,
                85,
                17,
                53,
                32
            ],
            "TotalCosts": 17085
        },
        {
            "Settings": [
                3,
                70,
                33,
                103,
                46,
                117,
                16,
                82,
                43
            ],
            "TotalCosts": 21563
        },
        {
            "Settings": [
                24,
                65,
                24,
                63,
                6,
                93,
                25,
                86,
                12
            ],
            "TotalCosts": 115277
        },
        {
            "Settings": [
                16,
                80,
                15,
                76,
                28,
                91,
                29,
                109,
                60
            ],
            "TotalCosts": 21620
        },
        {
            "Settings": [
                36,
                51,
                33,
                66,
                13,
                116,
                15,
                101,
                40
            ],
            "TotalCosts": 270833
        },
        {
            "Settings": [
                9,
                104,
                16,
                90,
                12,
                82,
                3,
                69,
                52
            ],
            "TotalCosts": 277790
        },
        {
            "Settings": [
                46,
                93,
                37,
                100,
                6,
                68,
                19,
                52,
                61
            ],
            "TotalCosts": 259497
        },
        {
            "Settings": [
                0,
                99,
                36,
                55,
                9,
                55,
                18,
                92,
                45
            ],
            "TotalCosts": 285465
        },
        {
            "Settings": [
                39,
                68,
                47,
                87,
                44,
                79,
                10,
                72,
                75
            ],
            "TotalCosts": 12316
        },
        {
            "Settings": [
                40,
                101,
                9,
                109,
                16,
                71,
                3,
                97,
                22
            ],
            "TotalCosts": 96037
        },
        {
            "Settings": [
                44,
                119,
                44,
                77,
                42,
                68,
                17,
                71,
                3
            ],
            "TotalCosts": 334351
        },
        {
            "Settings": [
                34,
                58,
                30,
                69,
                11,
                95,
                0,
                70,
                2
            ],
            "TotalCosts": 392058
        },
        {
            "Settings": [
                29,
                76,
                38,
                73,
                26,
                107,
                25,
                92,
                29
            ],
            "TotalCosts": 15024
        },
        {
            "Settings": [
                21,
                62,
                19,
                80,
                0,
                86,
                42,
                84,
                60
            ],
            "TotalCosts": 86502
        },
        {
            "Settings": [
                29,
                77,
                21,
                98,
                9,
                90,
                19,
                87,
                20
            ],
            "TotalCosts": 344539
        },
        {
            "Settings": [
                8,
                86,
                26,
                87,
                42,
                52,
                14,
                84,
                30
            ],
            "TotalCosts": 158378
        },
        {
            "Settings": [
                24,
                88,
                24,
                54,
                45,
                67,
                49,
                113,
                13
            ],
            "TotalCosts": 129455
        },
        {
            "Settings": [
                32,
                68,
                5,
                56,
                21,
                101,
                2,
                81,
                90
            ],
            "TotalCosts": 13639
        },
        {
            "Settings": [
                30,
                112,
                9,
                62,
                48,
                118,
                32,
                74,
                9
            ],
            "TotalCosts": 81365
        },
        {
            "Settings": [
                39,
                112,
                17,
                75,
                7,
                86,
                10,
                76,
                93
            ],
            "TotalCosts": 20878
        },
        {
            "Settings": [
                6,
                86,
                25,
                63,
                37,
                70,
                22,
                101,
                28
            ],
            "TotalCosts": 169957
        },
        {
            "Settings": [
                3,
                56,
                4,
                104,
                24,
                78,
                6,
                97,
                60
            ],
            "TotalCosts": 113926
        },
        {
            "Settings": [
                5,
                71,
                30,
                85,
                21,
                88,
                7,
                64,
                2
            ],
            "TotalCosts": 365650
        },
        {
            "Settings": [
                40,
                70,
                5,
                92,
                44,
                55,
                40,
                114,
                92
            ],
            "TotalCosts": 18610
        },
        {
            "Settings": [
                20,
                80,
                8,
                112,
                36,
                65,
                35,
                88,
                26
            ],
            "TotalCosts": 557479
        },
        {
            "Settings": [
                50,
                119,
                20,
                116,
                11,
                83,
                46,
                57,
                7
            ],
            "TotalCosts": 258951
        },
        {
            "Settings": [
                17,
                93,
                4,
                116,
                0,
                87,
                13,
                96,
                46
            ],
            "TotalCosts": 308394
        },
        {
            "Settings": [
                8,
                84,
                11,
                52,
                49,
                90,
                24,
                100,
                26
            ],
            "TotalCosts": 179140
        },
        {
            "Settings": [
                22,
                66,
                29,
                78,
                40,
                111,
                14,
                61,
                20
            ],
            "TotalCosts": 97281
        },
        {
            "Settings": [
                31,
                108,
                2,
                95,
                34,
                103,
                0,
                83,
                30
            ],
            "TotalCosts": 20827
        },
        {
            "Settings": [
                42,
                82,
                20,
                94,
                32,
                55,
                38,
                87,
                8
            ],
            "TotalCosts": 14838
        },
        {
            "Settings": [
                2,
                118,
                0,
                108,
                24,
                86,
                10,
                84,
                87
            ],
            "TotalCosts": 371681
        },
        {
            "Settings": [
                24,
                115,
                41,
                65,
                34,
                110,
                17,
                96,
                82
            ],
            "TotalCosts": 21564
        },
        {
            "Settings": [
                20,
                87,
                40,
                82,
                0,
                86,
                13,
                95,
                27
            ],
            "TotalCosts": 395243
        },
        {
            "Settings": [
                43,
                106,
                30,
                86,
                32,
                69,
                41,
                67,
                18
            ],
            "TotalCosts": 16591
        },
        {
            "Settings": [
                9,
                104,
                18,
                87,
                21,
                64,
                45,
                86,
                52
            ],
            "TotalCosts": 332883
        },
        {
            "Settings": [
                24,
                93,
                39,
                88,
                14,
                118,
                11,
                74,
                1
            ],
            "TotalCosts": 375036
        },
        {
            "Settings": [
                14,
                91,
                49,
                85,
                29,
                108,
                12,
                76,
                67
            ],
            "TotalCosts": 17311
        },
        {
            "Settings": [
                14,
                117,
                15,
                89,
                20,
                80,
                35,
                60,
                88
            ],
            "TotalCosts": 243479
        },
        {
            "Settings": [
                23,
                111,
                5,
                92,
                28,
                85,
                50,
                105,
                2
            ],
            "TotalCosts": 180389
        },
        {
            "Settings": [
                25,
                71,
                26,
                93,
                14,
                71,
                13,
                87,
                65
            ],
            "TotalCosts": 79938
        },
        {
            "Settings": [
                10,
                98,
                10,
                87,
                14,
                55,
                26,
                92,
                56
            ],
            "TotalCosts": 56641
        },
        {
            "Settings": [
                11,
                114,
                11,
                74,
                43,
                61,
                4,
                103,
                47
            ],
            "TotalCosts": 38429
        },
        {
            "Settings": [
                45,
                97,
                1,
                83,
                25,
                105,
                41,
                103,
                6
            ],
            "TotalCosts": 306509
        },
        {
            "Settings": [
                8,
                97,
                34,
                51,
                15,
                111,
                39,
                83,
                45
            ],
            "TotalCosts": 23246
        },
        {
            "Settings": [
                34,
                115,
                29,
                54,
                3,
                117,
                47,
                104,
                86
            ],
            "TotalCosts": 27000
        },
        {
            "Settings": [
                40,
                61,
                22,
                76,
                26,
                86,
                41,
                76,
                85
            ],
            "TotalCosts": 14473
        },
        {
            "Settings": [
                32,
                101,
                9,
                79,
                35,
                87,
                0,
                76,
                93
            ],
            "TotalCosts": 19307
        },
        {
            "Settings": [
                45,
                66,
                31,
                74,
                29,
                77,
                35,
                79,
                82
            ],
            "TotalCosts": 13177
        },
        {
            "Settings": [
                45,
                109,
                30,
                55,
                27,
                101,
                47,
                52,
                61
            ],
            "TotalCosts": 16580
        },
        {
            "Settings": [
                31,
                105,
                7,
                61,
                9,
                115,
                0,
                61,
                74
            ],
            "TotalCosts": 184835
        },
        {
            "Settings": [
                13,
                69,
                12,
                55,
                2,
                99,
                1,
                54,
                55
            ],
            "TotalCosts": 265641
        },
        {
            "Settings": [
                12,
                82,
                29,
                55,
                34,
                58,
                35,
                115,
                51
            ],
            "TotalCosts": 65222
        },
        {
            "Settings": [
                12,
                89,
                10,
                82,
                24,
                98,
                46,
                77,
                57
            ],
            "TotalCosts": 101753
        },
        {
            "Settings": [
                39,
                101,
                1,
                98,
                16,
                79,
                32,
                80,
                16
            ],
            "TotalCosts": 448379
        },
        {
            "Settings": [
                30,
                108,
                40,
                112,
                1,
                84,
                9,
                98,
                56
            ],
            "TotalCosts": 163254
        },
        {
            "Settings": [
                1,
                89,
                6,
                53,
                23,
                67,
                21,
                104,
                58
            ],
            "TotalCosts": 192097
        },
        {
            "Settings": [
                27,
                106,
                39,
                88,
                7,
                96,
                7,
                68,
                33
            ],
            "TotalCosts": 20524
        },
        {
            "Settings": [
                26,
                89,
                6,
                61,
                21,
                67,
                48,
                58,
                11
            ],
            "TotalCosts": 375368
        },
        {
            "Settings": [
                36,
                75,
                27,
                100,
                13,
                106,
                6,
                112,
                83
            ],
            "TotalCosts": 18585
        },
        {
            "Settings": [
                22,
                102,
                13,
                105,
                13,
                89,
                42,
                58,
                62
            ],
            "TotalCosts": 213567
        },
        {
            "Settings": [
                19,
                53,
                34,
                60,
                38,
                105,
                7,
                97,
                13
            ],
            "TotalCosts": 147971
        },
        {
            "Settings": [
                22,
                111,
                6,
                111,
                4,
                75,
                7,
                100,
                42
            ],
            "TotalCosts": 113623
        },
        {
            "Settings": [
                2,
                107,
                27,
                117,
                21,
                68,
                42,
                98,
                51
            ],
            "TotalCosts": 503715
        },
        {
            "Settings": [
                2,
                100,
                15,
                89,
                16,
                73,
                31,
                90,
                7
            ],
            "TotalCosts": 522485
        },
        {
            "Settings": [
                21,
                90,
                30,
                102,
                28,
                91,
                34,
                98,
                1
            ],
            "TotalCosts": 396274
        },
        {
            "Settings": [
                36,
                89,
                33,
                114,
                33,
                88,
                7,
                104,
                29
            ],
            "TotalCosts": 327273
        },
        {
            "Settings": [
                3,
                79,
                31,
                80,
                16,
                55,
                14,
                57,
                95
            ],
            "TotalCosts": 107266
        },
        {
            "Settings": [
                41,
                111,
                28,
                106,
                13,
                87,
                14,
                100,
                14
            ],
            "TotalCosts": 21320
        },
        {
            "Settings": [
                42,
                72,
                12,
                116,
                14,
                102,
                12,
                59,
                13
            ],
            "TotalCosts": 300022
        },
        {
            "Settings": [
                43,
                60,
                3,
                102,
                21,
                88,
                1,
                88,
                16
            ],
            "TotalCosts": 505000
        },
        {
            "Settings": [
                22,
                119,
                12,
                87,
                23,
                83,
                32,
                110,
                80
            ],
            "TotalCosts": 143680
        },
        {
            "Settings": [
                23,
                113,
                15,
                59,
                31,
                115,
                20,
                72,
                47
            ],
            "TotalCosts": 143838
        },
        {
            "Settings": [
                1,
                59,
                6,
                111,
                9,
                64,
                47,
                79,
                95
            ],
            "TotalCosts": 341177
        },
        {
            "Settings": [
                45,
                55,
                23,
                51,
                39,
                100,
                18,
                109,
                71
            ],
            "TotalCosts": 52372
        },
        {
            "Settings": [
                45,
                71,
                42,
                105,
                16,
                80,
                48,
                105,
                22
            ],
            "TotalCosts": 16258
        },
        {
            "Settings": [
                42,
                101,
                26,
                59,
                17,
                57,
                3,
                51,
                42
            ],
            "TotalCosts": 135490
        },
        {
            "Settings": [
                1,
                90,
                41,
                54,
                30,
                54,
                26,
                101,
                79
            ],
            "TotalCosts": 62441
        },
        {
            "Settings": [
                17,
                81,
                6,
                90,
                38,
                105,
                11,
                86,
                2
            ],
            "TotalCosts": 520529
        },
        {
            "Settings": [
                32,
                67,
                40,
                99,
                47,
                77,
                50,
                58,
                68
            ],
            "TotalCosts": 15306
        },
        {
            "Settings": [
                22,
                104,
                37,
                76,
                47,
                103,
                15,
                73,
                27
            ],
            "TotalCosts": 20540
        },
        {
            "Settings": [
                45,
                108,
                36,
                105,
                14,
                91,
                32,
                93,
                36
            ],
            "TotalCosts": 20111
        },
        {
            "Settings": [
                4,
                68,
                49,
                101,
                45,
                107,
                4,
                81,
                76
            ],
            "TotalCosts": 24302
        },
        {
            "Settings": [
                31,
                74,
                32,
                81,
                3,
                84,
                18,
                56,
                96
            ],
            "TotalCosts": 25610
        },
        {
            "Settings": [
                3,
                117,
                25,
                76,
                13,
                81,
                26,
                73,
                68
            ],
            "TotalCosts": 374229
        },
        {
            "Settings": [
                15,
                108,
                49,
                65,
                3,
                73,
                1,
                112,
                86
            ],
            "TotalCosts": 134045
        },
        {
            "Settings": [
                36,
                99,
                44,
                113,
                14,
                85,
                0,
                98,
                99
            ],
            "TotalCosts": 19479
        },
        {
            "Settings": [
                31,
                82,
                39,
                66,
                21,
                64,
                31,
                89,
                64
            ],
            "TotalCosts": 14798
        },
        {
            "Settings": [
                43,
                100,
                50,
                87,
                11,
                90,
                7,
                103,
                60
            ],
            "TotalCosts": 17477
        },
        {
            "Settings": [
                40,
                78,
                13,
                73,
                20,
                62,
                31,
                95,
                37
            ],
            "TotalCosts": 14611
        },
        {
            "Settings": [
                4,
                62,
                34,
                51,
                18,
                90,
                22,
                112,
                86
            ],
            "TotalCosts": 32908
        },
        {
            "Settings": [
                46,
                56,
                21,
                103,
                29,
                85,
                34,
                63,
                18
            ],
            "TotalCosts": 16493
        },
        {
            "Settings": [
                44,
                63,
                24,
                72,
                39,
                86,
                45,
                65,
                30
            ],
            "TotalCosts": 12887
        },
        {
            "Settings": [
                36,
                72,
                2,
                91,
                30,
                104,
                42,
                88,
                40
            ],
            "TotalCosts": 19893
        }
    ]
}

client = mqtt.Client()


class neural_network:
    REPLAY_MEMORY_SIZE = 500000
    RANDOM_ACTION_DECAY = 0.99
    FINAL_RANDOM_ACTION_PROB = 0.05
    INITIAL_RANDOM_ACTION_PROB = 0.9
    MIN_RANDOM_ACTION_PROB = 0.1
    HIDDEN1_SIZE = 200
    HIDDEN2_SIZE = 200
    NUM_EPISODES = 1000
    MAX_STEPS = 100000
    LEARNING_RATE = 0.0000001
    MINIBATCH_SIZE = 100
    DISCOUNT_FACTOR = 0.9
    TARGET_UPDATE_FREQ = 300
    REG_FACTOR = 0.001
    OBS_LAST_STATE_INDEX, OBS_ACTION_INDEX, OBS_REWARD_INDEX, OBS_CURRENT_STATE_INDEX, OBS_TERMINAL_INDEX = range(5)
    LOG_DIR = '/vagrant/development/projects/projects/logs'

    # random_action_prob = 0.9
    replay_memory = []
 
    def __init__(self):
        self.input_size = None
        self.output_size = None
    
    def normalize(self, array):
        return (array - array.mean()) / array.std()    

    def init_network(self, input_size, output_size):
        self.input_size = input_size
        self.output_size = output_size

        # Inference
        self.x = tf.placeholder(tf.float32, [None, 1])
        #weight
        self.W = tf.Variable(tf.zeros([1,1]))
        #bias
        self.b = tf.Variable(tf.zeros([1]))
        self.product = tf.matmul(self.x,self.W)
        self.y = self.product + self.b
        #placeholder for the answers
        self.y_ = tf.placeholder("float32")
        # Cost function sum((y_-y)**2)
        self.cost = tf.reduce_mean(tf.square(self.y_-self.y))

        # Training using Gradient Descent to minimize cost
        self.train_step = tf.train.GradientDescentOptimizer(self.LEARNING_RATE).minimize(self.cost)
    #end init_network
    
    def train(self, training_data=[], num_sessions=100, mqtt=None):

        self.session = tf.Session()
        self.init = tf.initialize_all_variables()
        self.session.run(self.init)
        
       

        steps = num_sessions
        for i in range(steps):
            # load data

            xs = np.array([[i]])
            ys = np.matrix((training_data[i]["Settings"]), dtype=float)
            # Train
            feed = { self.x: xs, self.y_: ys }
            self.session.run(self.train_step, feed_dict=feed)
            print("After %d iteration:" % i)
            print("W: %f" % self.session.run(self.W))
            print("b: %f" % self.session.run(self.b))
      
            print("cost: %f" % self.session.run(self.cost, feed_dict=feed))

        # cntr = 0
        # while cntr <= num_sessions:
        #     txs = np.array([[1]])
        #     feed_dict = {self.x: txs}
        #     classification = self.session.run(self.y, feed_dict)
        #     print("W: %f" % self.session.run(self.W))
        #     print classification
        #     cntr = cntr + 1

        if mqtt:
            logistic_payloads = []
        
            count = 0
            while count < num_sessions:            
                txs = np.array([[1]])
                feed_dict = {self.x: txs}
                classification = self.session.run(self.y, feed_dict)
                logistic_settings = training_data[int(math.floor(classification[0][0]))]["Settings"]
                logistic_payload = {
                    "Settings": [
                        {"Name": "Retailer_Min", "Value": logistic_settings[0] },
                        {"Name": "Retailer_Max", "Value": logistic_settings[1] },
                        {"Name": "WholeSaler_Min", "Value": logistic_settings[2] },
                        {"Name": "WholeSaler_Max", "Value": logistic_settings[3] },
                        {"Name": "Distributor_Min", "Value": logistic_settings[4] },
                        {"Name": "Distributor_Max", "Value": logistic_settings[5] },
                        {"Name": "Factory_Min", "Value": logistic_settings[6] },
                        {"Name": "Factory_Max", "Value": logistic_settings[7] },
                        {"Name": "Factory_Units_Per_Day", "Value": logistic_settings[8] },
                    ]
                }

                logistic_payloads.append(logistic_payload)

                count = count + 1;
            
            client.publish(mqtt["play_route_key"], json.dumps(logistic_payloads))
# txs = np.array([[100]])
# feed_dict = {x: txs}
# classification = sess.run(y, feed_dict)
# print classification

# nn = None
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    # client.subscribe("tf_logistic")
    # client.publish("helloworld", "HELLO WORLD")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):  
    receive_data = json.loads(msg.payload)
     
    num_sessions = receive_data["Metadata"]['NumSessions']           
    INITIAL_RANDOM_ACTION_PROB = np.float32(receive_data["Metadata"]['random_action_prob'])
    RANDOM_ACTION_DECAY = np.float32(receive_data["Metadata"]['RANDOM_ACTION_DECAY'])
    HIDDEN1_SIZE = np.int32(receive_data["Metadata"]['HIDDEN1_SIZE'])
    HIDDEN2_SIZE = np.int32(receive_data["Metadata"]['HIDDEN2_SIZE'])
    LEARNING_RATE = np.float32(receive_data["Metadata"]['LEARNING_RATE'])
    MINIBATCH_SIZE = np.int32(receive_data["Metadata"]['MINIBATCH_SIZE'])
    DISCOUNT_FACTOR = np.float32(receive_data["Metadata"]['DISCOUNT_FACTOR'])
    TARGET_UPDATE_FREQ = np.int(receive_data["Metadata"]['TARGET_UPDATE_FREQ'])
    
    # USER TOKEN
    user_token = receive_data["Metadata"]['UserToken']
    

    user_exchange_name = 'topic/logistic' #'lander.' + user_token        
    train_route_key = 'tensorflow/train_logistic' + user_token
    play_route_key = 'tensorflow/play_logistic/' + user_token

    mqttMetadata = {        
        'token': user_token,
        'exchange': user_exchange_name,
        'train_route_key': train_route_key,
        'play_route_key': play_route_key
    }

    # todo pass the parameters from the client

    thread.start_new_thread(train_tensorflow, (num_sessions, receive_data["Data"], 1, 9, mqttMetadata,))

def on_disconnect(client, userdata, rc):
    print "Disconnected from MQTT server with code: %s" % rc

    client.on_connect = on_connect
    client.on_message = on_message
    #client.connect("dev.useaible.com", 1883, 60)
    client.connect(MQTT_URL, 1883, 60)
    print "Subscribing"
    client.subscribe("logistic_train")  
    print "Listening"
    client.loop_forever()

    #client.subscribe("logistic_train") 
    # while rc != 0:
    #     sleep(RECONNECT_DELAY_SECS)
    #     print "Reconnecting..."
    #     rc = client.reconnect()

data = []
def main():
    try:
        client.on_connect = on_connect
        client.on_message = on_message
        #client.connect("dev.useaible.com", 1883, 60)
        client.connect(MQTT_URL, 1883, 60)
        print "Subscribing"
        client.subscribe("logistic_train")  
        print "Listening"
        client.loop_forever()
        # train_locally(1, 9)
    except KeyboardInterrupt:
        # connection.close()
        print "Closing app"
        sys.exit()
        client.loop_stop()

def train_tensorflow(num_sessions, training_data=[], input_size=1, output_size=9, mqttMetadata=None):
   
    nn = neural_network()
    # training_data_n = nn.normalize(np.array(training_data[0]["Settings"]))
    # print training_data_n
    tf.reset_default_graph()

    nn.init_network(input_size, output_size)
    nn.train(training_data, num_sessions, mqttMetadata)

#end train_tensorflow()
def train_locally(input_size, output_size):
    training_data = local_data["Data"]
    nn = neural_network()
    # training_data_n = nn.normalize(np.array(training_data[0]["Settings"]))
    # print training_data_n
    tf.reset_default_graph()

    nn.init_network(input_size, output_size)
    nn.train(training_data, 100)



if __name__ == "__main__":
    main()
