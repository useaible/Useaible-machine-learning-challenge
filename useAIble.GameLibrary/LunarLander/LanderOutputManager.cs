using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace useAIble.GameLibrary.LunarLander
{
    public class LanderOutputManager : GameOutputManager<LanderSimOutput>
    {
        private readonly string USER_TOKEN;

        public LanderOutputManager(MqttClient mqtt, string userToken) : base(mqtt)
        {
            USER_TOKEN = userToken;
        }

        public LanderOutputManager(MqttClient mqtt, int delay, string userToken) : base(mqtt, delay)
        {
            USER_TOKEN = userToken;
        }

        public override void SendViaMQTT(LanderSimOutput output)
        {
            System.Diagnostics.Debug.WriteLine($"Score: {output.Score}  Thrusts: {string.Join(",",output.Thrusts)}");
            mqttClient.Publish(
                USER_TOKEN + "/encog/lander/simulation_output",
                Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(output)),
                MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE,
                false);
        }
    }
}
