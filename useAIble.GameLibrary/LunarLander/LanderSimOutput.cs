using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace useAIble.GameLibrary.LunarLander
{
    public class LanderSimOutput
    {
        public double Score { get; set; }
        public IEnumerable<bool> Thrusts { get; set; }
    }
}
