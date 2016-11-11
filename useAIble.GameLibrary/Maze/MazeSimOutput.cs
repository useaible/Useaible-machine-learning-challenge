using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace useAIble.GameLibrary.Maze
{
    public class MazeSimOutput
    {
        public int Cnt { get; set; } // Delete just trying to see if the Cnt is in order even during Genetic algo
        public int Score { get; set; }
        public IEnumerable<int> Directions { get; set; } = new List<int>();

        public override string ToString()
        {
            return $"Score: {Score} Directions: {string.Join(",", Directions)}";
        }
    }
}
