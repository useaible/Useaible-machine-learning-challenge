using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace useAIble.GameLibrary.Maze
{
    public class MazeOutputManager : GameOutputManager<MazeSimOutput>
    {
        private readonly string USER_TOKEN;

        #region Constructors
        public MazeOutputManager(MqttClient mqtt, string userToken) : base(mqtt)
        {
            USER_TOKEN = userToken;
        }

        public MazeOutputManager(MqttClient mqtt, int delay, string userToken) : base(mqtt, delay)
        {
            USER_TOKEN = userToken;
        }
        #endregion

        public override void SendViaMQTT(MazeSimOutput output)
        {
            mqttClient.Publish(
                USER_TOKEN + "/encog/maze/simulation_output", 
                Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(output)), 
                MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, 
                false);
        }
    }
}
