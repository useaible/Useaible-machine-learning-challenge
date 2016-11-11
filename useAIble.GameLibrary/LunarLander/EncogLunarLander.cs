using Encog.Neural.Networks.Training;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Encog.ML;
using Encog.Util.Arrayutil;
using Encog.Neural.Networks;
using Encog.ML.Data.Basic;
using Encog.ML.Data;
using useAIble.Core.Models.GameData;

namespace useAIble.GameLibrary.LunarLander
{
    public class EncogLanderPilot
    {
        private readonly BasicNetwork network;
        private readonly NormalizedField fuelStats;
        private readonly NormalizedField altitudeStats;
        private readonly NormalizedField velocityStats;
        private readonly LanderSimulator simulator;

        public EncogLanderPilot(BasicNetwork net, LunarLanderMetadata_Encog metadata)
        {
            simulator = new LanderSimulator();

            fuelStats = new NormalizedField(NormalizationAction.Normalize, "fuel", metadata.Fuel, 0, -0.9, 0.9);
            altitudeStats = new NormalizedField(NormalizationAction.Normalize, "altitude", metadata.Altitude, 0, -0.9, 0.9);
            velocityStats = new NormalizedField(NormalizationAction.Normalize, "velocity",
                                                LanderSimulator.TerminalVelocity, -LanderSimulator.TerminalVelocity,
                                                -0.9, 0.9);
            
            network = net;
        }

        public List<bool> ThrustHistory { get; private set; } = new List<bool>();

        public double ScorePilot()
        {
            while (simulator.Flying)
            {
                BasicMLData inputs = new BasicMLData(3);
                inputs[0] = fuelStats.Normalize(simulator.Fuel);
                inputs[1] = altitudeStats.Normalize(simulator.Altitude);
                inputs[2] = velocityStats.Normalize(simulator.Velocity);

                IMLData output = network.Compute(inputs);
                double value = output[0];
                bool thrust = (value > 0);

                ThrustHistory.Add(thrust);

                simulator.Turn(thrust);
            }

            return simulator.Score;
        }
    }

    public class EncogLanderPilotScore : ICalculateScore
    {
        public EncogLanderPilotScore(LunarLanderMetadata_Encog metadata)
        {
            Metadata = metadata;
        }

        public LunarLanderMetadata_Encog Metadata { get; set; }
        public LanderOutputManager OutputMgr { get; set; }

        public double CalculateScore(IMLMethod network)
        {
            var pilot = new EncogLanderPilot((BasicNetwork)network, Metadata);
            var score = pilot.ScorePilot();

            if (OutputMgr != null)
            {
                var simOutput = new LanderSimOutput() { Score = score, Thrusts = pilot.ThrustHistory };
                OutputMgr.Outputs.Enqueue(simOutput);
            }

            return score;
        }

        public bool RequireSingleThreaded
        {
            get
            {
                return true;
            }
        }

        public bool ShouldMinimize
        {
            get
            {
                return false;
            }
        }
    }
}
