using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace useAIble.GameLibrary.LogisticSimulation
{
    public class LogisticOutputManager : GameOutputManager<LogisticSimOutput>
    {
        private readonly string USER_TOKEN;

        public LogisticOutputManager(MqttClient mqtt, string userToken) : base(mqtt)
        {
            USER_TOKEN = userToken;
        }

        public LogisticOutputManager(MqttClient mqtt, int delay, string userToken) : base(mqtt, delay)
        {
            USER_TOKEN = userToken;
        }

        public override void SendViaMQTT(LogisticSimOutput output)
        {
            mqttClient.Publish(
                  USER_TOKEN + "/encog/logistic/simulation_output",
                  Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(output)),
                  MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE,
                  false);
        }
    }
}
