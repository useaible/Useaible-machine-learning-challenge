using Encog.Neural.Networks.Training;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Encog.ML;
using Encog.Neural.Networks;
using Encog.Util.Arrayutil;
using Encog.ML.Data;
using Encog.ML.Data.Basic;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace useAIble.GameLibrary.Maze
{
    public class EncogMazeTraveler : Traveler
    {
        private NormalizedField xInput;
        private NormalizedField yInput;
        private NormalizedField bumpedIntoWallInput;
        private NormalizedField directionOutput;
        private BasicNetwork network;
        private MazeInfo maze;

        public EncogMazeTraveler(BasicNetwork net, MazeInfo m, string userToken)
        {
            network = net;
            maze = m;

            // set normalized fields
            xInput = new NormalizedField(NormalizationAction.Normalize, "X", maze.Width - 1, 0, -0.9, 0.9);
            yInput = new NormalizedField(NormalizationAction.Normalize, "Y", maze.Height - 1, 0, -0.9, 0.9);
            bumpedIntoWallInput = new NormalizedField(NormalizationAction.Normalize, "BumpedIntoWall", 1, 0, -0.9, 0.9);
            directionOutput = new NormalizedField(NormalizationAction.Normalize, "Direction", 3, 0, -0.9, 0.9);
        }
        
        public List<int> DirectionHistory { get; set; } = new List<int>();

        public int ScoreMazeTraveler()
        {
            MazeGame game = new MazeGame();
            game.InitGame(maze);
            game.traveler = this;
            game.traveler.location.X = maze.StartingPosition.X;
            game.traveler.location.Y = maze.StartingPosition.Y;

            var recentOutcome = new MazeCycleOutcome();
            int movesCnt = 0;
            int movesLimit = 50; // must be set dynamically

            while (!recentOutcome.GameOver && movesCnt <= movesLimit)
            {
                movesCnt++;
                var input = new BasicMLData(2);
                input[0] = xInput.Normalize(Convert.ToDouble(game.traveler.location.X));
                input[1] = yInput.Normalize(Convert.ToDouble(game.traveler.location.Y));
				
                IMLData output = network.Compute(input);

                //double maxVal = double.MinValue;
                //int direction = 0;
                //for (int i = 0; i < output.Count; i++)
                //{
                //    if (output[i] > maxVal)
                //    {
                //        direction = i;
                //        maxVal = output[i];
                //    }
                //}
                //recentOutcome = game.CycleMaze(direction, true);

                double denormValue = output[0];
                double normValue = Math.Round(directionOutput.DeNormalize(denormValue));

                int direction = Convert.ToInt32(normValue);
                DirectionHistory.Add(direction);
                recentOutcome = game.CycleMaze(direction, true);
            }

            var score = game.CalculateFinalScore(movesCnt);

            return score;
        }

        public override void AcceptUIKeyDown(short direction)
        {
            throw new NotImplementedException();
        }
    }

    public class EncogMazePilotScore : ICalculateScore
    {
        public EncogMazePilotScore(MazeInfo maze, string userToken)
        {
            UserToken = userToken;
            Maze = maze;
        }

		public string UserToken { get; set; }
		public MazeInfo Maze { get; set; }
        public MazeOutputManager OutputMgr { get; set; }

        public double CalculateScore(IMLMethod network)
        {
            var traveler = new EncogMazeTraveler((BasicNetwork)network, Maze, UserToken);
            int score = traveler.ScoreMazeTraveler();

            if (OutputMgr != null)
            {
                MazeSimOutput output = new MazeSimOutput() { Score = score, Directions = traveler.DirectionHistory };
                OutputMgr.Outputs.Enqueue(output);
            }

            return score;
        }

        public bool RequireSingleThreaded
        {
            get
            {
                return false;
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
