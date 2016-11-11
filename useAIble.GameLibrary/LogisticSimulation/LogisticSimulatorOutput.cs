using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace useAIble.GameLibrary.LogisticSimulation
{
    public class LogisticSimulatorOutput
    {
        public string Name { get; set; }
        public int Value { get; set; }
    }

    public class TF_Output
    {
        public IEnumerable<LogisticSimulatorOutput> Settings { get; set; }
    }


    public class TF_Initial_Data
    {
        //public IEnumerable<LogisticSimulatorOutput> Settings { get; set; }
        public IEnumerable<int> Settings { get; set; }
        public double TotalCosts { get; set; }
    }

    public class LogisticSimOutput
    {
        public double Score { get; set; }
        public List<LogisticSimOutputDay> SimulatedDays { get; set; } = new List<LogisticSimOutputDay>();
        public IEnumerable<LogisticSimulatorOutput> Settings { get; set; } = new List<LogisticSimulatorOutput>();
    }

    public class LogisticSimOutputDay
    {
        public int Day { get; set; }
        public dynamic PlayerDetails { get; set; }
        public dynamic Orders { get; set; }
    }
}
