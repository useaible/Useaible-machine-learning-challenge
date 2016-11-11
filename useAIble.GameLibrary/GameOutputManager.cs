using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using uPLibrary.Networking.M2Mqtt;

namespace useAIble.GameLibrary
{
    public abstract class GameOutputManager<T> where T: class
    {
        protected MqttClient mqttClient;
        protected bool processStopped = false;

        public GameOutputManager(MqttClient mqtt)
        {
            mqttClient = mqtt;
        }

        public GameOutputManager (MqttClient mqtt, int delay)
            : this(mqtt)
        {
            ProcessDelay = delay;
        }

        public ConcurrentQueue<T> Outputs { get; } = new ConcurrentQueue<T>();
        public int ProcessDelay { get; set; } = 30;
        public bool HandleMqttDisconnection { get; set; } = false;

        public virtual Task ProcessOutputs()
        {
            Task task = Task.Run(() =>
            {
                try
                {
                    while (!processStopped || Outputs.Count > 0)
                    {
                        // try get output item from queue
                        T output;
                        if (Outputs.TryDequeue(out output))
                        {
                            SendViaMQTT(output);
                        }

                        Task.Delay(ProcessDelay).Wait();
                    }
                }
                finally
                {
                    if (HandleMqttDisconnection)
                    {
                        if (mqttClient != null && mqttClient.IsConnected)
                        {
                            mqttClient.Disconnect();
                        }
                    }
                }
            });

            return task;
        }

        public virtual void StopProcess()
        {
            processStopped = true;
        }

        public abstract void SendViaMQTT(T output);
    }
}
