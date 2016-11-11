using Newtonsoft.Json;
using RNN;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace useAIble.GameLibrary.LogisticSimulation
{
    public class LogisticSimulator
    {
        private Task newDayTask;
        private System.Threading.CancellationTokenSource cancelTokenSrc = new System.Threading.CancellationTokenSource();

        public Timer newDayTimer;
        public Timer orderGeneratorTimer;
        List<Player> players;
        Player Retailer;
        Player WholeSaler;
        Player Distributor;
        Player Factory;
        private int _numDay = 0;
        static Random rand = new Random();


        private string NETWORK_NAME;
        private string USER_TOKEN;
        private MqttClient OUTPUT_FROM_SERVER_MQTT_CLIENT;

        private double STORAGE_COST;
        private double BACKLOG_COST;
        private int RETAILER_INIT_INV;
        private int WHOLESALER_INIT_INV;
        private int DISTRIBUTOR_INIT_INV;
        private int FACTORY_INIT_INV;
        private IEnumerable<int> CustomerOrders;

        public MqttClient OutputFromServerMQttClient { get { return OUTPUT_FROM_SERVER_MQTT_CLIENT; } }
        public IEnumerable<TF_Output> TF_Output { get; set; }

        public int NO_OF_DAYS_INTERVAL { get; set; } = 2000;

        public bool TurnOffMQTT { get; set; }
        public string AI_ROUTE_KEY { get; set; }

        public LogisticSimOutput SimulationOutput { get; private set; } = new LogisticSimOutput();

        public LogisticSimulator(string userToken, string networkName, double storageCost, double backlogCost, int retailerInitInv, int wholesalerInitInv, int distributorInitInv, int factoryInitInv, bool turnOffMQTT = false, string aiRouteKey = "useaible")
        {

            AI_ROUTE_KEY = aiRouteKey;

            STORAGE_COST = storageCost;
            BACKLOG_COST = backlogCost;

            RETAILER_INIT_INV = retailerInitInv;
            WHOLESALER_INIT_INV = wholesalerInitInv;
            DISTRIBUTOR_INIT_INV = distributorInitInv;
            FACTORY_INIT_INV = factoryInitInv;

            NETWORK_NAME = networkName;
            USER_TOKEN = userToken;

            if (!turnOffMQTT)
            {
                OUTPUT_FROM_SERVER_MQTT_CLIENT = new MqttClient("dev.useaible.com");
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Connect(Guid.NewGuid().ToString("N"), "", "", true, 60 * 10); // ten minutes

                OUTPUT_FROM_SERVER_MQTT_CLIENT.MqttMsgPublishReceived += (sender, e) =>
                {

                    if (e.Topic == userToken + "/disconnect")
                    {
                        DisconnectMQTT();
                    }

                    if (e.Topic == "tensorflow/play_logistic/" + userToken)
                    {
                        var jsonMsg = Encoding.UTF8.GetString(e.Message);
                        TF_Output = JsonConvert.DeserializeObject<IEnumerable<TF_Output>>(jsonMsg);

                        File.WriteAllText("tensorflow_data.txt", jsonMsg);
                    }
                };

                OUTPUT_FROM_SERVER_MQTT_CLIENT.Subscribe(new string[] { userToken + "/disconnect" }, new byte[] { MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE });
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Subscribe(new string[] { "tensorflow/play_logistic/" + userToken }, new byte[] { MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE });
            }
            TurnOffMQTT = turnOffMQTT;

            //initialize all agents/players

            //newDayTimer = new Timer(2000);


            //orderGeneratorTimer = new Timer(2000);

            //event handlers
            //newDayTimer.Elapsed += (sender, e) => initNewDayEventHandler(sender, e);
            //orderGeneratorTimer.Elapsed += (sender, e) => orderGeneratorEventHandler(sender, e);
        }
        
        public static IEnumerable<int> GenerateCustomerOrders()
        {
            var customerOrders = new List<int>();
            for (int i = 0; i < 100; i++)
            {
                customerOrders.Add(rand.Next(1, 30));
            }

            return customerOrders;
        }

        private void initNewDayEventHandler(object sender, ElapsedEventArgs e)
        {
            //initNewDay();
            //Retailer.ordering();
        }

        //private void orderGeneratorEventHandler(object sender, ElapsedEventArgs e)
        //{
        //    orderGenerator();
        //}

        public int CurrentDay
        {
            get { return _numDay; }
        }

        public void ResetSimulationOutput()
        {
            SimulationOutput = new LogisticSimOutput();
        }

        public void initNewDay(System.Threading.CancellationToken token, int delay = 50)
        {
            //if (_numDay > 100)
            //{
            //    stop();
            //}
            //else
            //{           
            while (CurrentDay < 100)
            {
                if (token.IsCancellationRequested)
                    break;

                _numDay++;
                var simOutputDay = new LogisticSimOutputDay() { Day = _numDay };

                // retailer's customers
                retailerOrderGenerator();

                // clear previous day's transactions
                Retailer.ClearTransactions();
                WholeSaler.ClearTransactions();
                Distributor.ClearTransactions();
                Factory.ClearTransactions();
                                
                // accept new shipments
                Retailer.ProcessIncomingShipments();
                WholeSaler.ProcessIncomingShipments();
                Distributor.ProcessIncomingShipments();
                Factory.ProcessIncomingShipments();

                // process backlog and current orders
                Retailer.ProcessOrders();
                WholeSaler.ProcessOrders();
                Distributor.ProcessOrders();
                Factory.ProcessOrders();

                // if necessary, order new stock to replenish inventory
                Retailer.Ordering();
                WholeSaler.Ordering();
                Distributor.Ordering();
                Factory.Ordering();


                dynamic retailer = new
                {
                    Inventory = Retailer.Inventory-Retailer.Backlogs.Sum(a=>a.Amount),
                    Name = Retailer.Name,
                    Expected = Retailer.Expected,
                    Shipped = Retailer.CurSend,
                    Ordered = Retailer.Ordered,
                    StorageCost = Retailer.StorageCostTotal,
                    BacklogCost = Retailer.BacklogCostTotal
                };

                dynamic wholesaler = new
                {
                    Inventory = WholeSaler.Inventory-WholeSaler.Backlogs.Sum(a => a.Amount),
                    Name = WholeSaler.Name,
                    Expected = WholeSaler.Expected,
                    Shipped = WholeSaler.CurSend,
                    Ordered = WholeSaler.Ordered,
                    StorageCost = WholeSaler.StorageCostTotal,
                    BacklogCost = WholeSaler.BacklogCostTotal,
                };

                dynamic distributor = new
                {
                    Inventory = Distributor.Inventory-Distributor.Backlogs.Sum(a => a.Amount),
                    Name = Distributor.Name,
                    Expected = Distributor.Expected,
                    Shipped = Distributor.CurSend,
                    Ordered = Distributor.Ordered,
                    StorageCost = Distributor.StorageCostTotal,
                    BacklogCost = Distributor.BacklogCostTotal
                };

                dynamic factory = new
                {
                    Inventory = Factory.Inventory-Factory.Backlogs.Sum(a => a.Amount),
                    Name = Factory.Name,
                    Expected = Factory.Expected,
                    Shipped = Factory.CurSend,
                    Ordered = Factory.Ordered,
                    StorageCost = Factory.StorageCostTotal,
                    BacklogCost = Factory.BacklogCostTotal
                };

                List<dynamic> playerDetails = new List<dynamic> { retailer, wholesaler, distributor, factory };
                List<dynamic> orders = new List<dynamic>();
                orders.AddRange(Retailer.Transactions);
                orders.AddRange(WholeSaler.Transactions);
                orders.AddRange(Distributor.Transactions);
                orders.AddRange(Factory.Transactions);
                
                simOutputDay.PlayerDetails = playerDetails;
                simOutputDay.Orders = orders;
                SimulationOutput.SimulatedDays.Add(simOutputDay);

                if (!TurnOffMQTT)
                    OUTPUT_FROM_SERVER_MQTT_CLIENT.Publish(USER_TOKEN + "/"+AI_ROUTE_KEY+"/outputFromServer", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(playerDetails)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);

                if (!TurnOffMQTT)
                {
                    Task.Delay(delay).Wait();
                }
            }
            //}
        }
        //place a new order to the retailer orders
        public void retailerOrderGenerator()
        {
            
            int amountToOrder = CustomerOrders.ElementAt(CurrentDay - 1);
            var ord = new Order("Flavored Beer", amountToOrder) { ProcessOn = CurrentDay };
            //Retailer.Receive(ord);
            Retailer.Orders.Enqueue(ord);
            Retailer.Ordered = ord.Amount;

            
        }
        public void NextStepInitialization()
        {
            //todo: determine if an agent/player needs to order and set distributor curReceive and curSend to 0
            //then set all agents/players Ordered to 0
        }
        
        public void start(IEnumerable<LogisticSimulatorOutput> outputs, int delay = 50, IEnumerable<int> customOrders = null)
        {
            _numDay = 0;
            if (customOrders != null)
                CustomerOrders = customOrders;

            int ret_min = Convert.ToInt32(outputs.First(x => x.Name == "Retailer_Min").Value);
            int ret_max = Convert.ToInt32(outputs.First(x => x.Name == "Retailer_Max").Value);
            int who_min = Convert.ToInt32(outputs.First(x => x.Name == "WholeSaler_Min").Value);
            int who_max = Convert.ToInt32(outputs.First(x => x.Name == "WholeSaler_Max").Value);
            int dis_min = Convert.ToInt32(outputs.First(x => x.Name == "Distributor_Min").Value);
            int dis_max = Convert.ToInt32(outputs.First(x => x.Name == "Distributor_Max").Value);
            int fac_min = Convert.ToInt32(outputs.First(x => x.Name == "Factory_Min").Value);
            int fac_max = Convert.ToInt32(outputs.First(x => x.Name == "Factory_Max").Value);
            int fac_unit = Convert.ToInt32(outputs.First(x => x.Name == "Factory_Units_Per_Day").Value);

            Retailer = new Player(this, "Retailer", STORAGE_COST, BACKLOG_COST, RETAILER_INIT_INV, ret_max, ret_min, 2, 2, null, OUTPUT_FROM_SERVER_MQTT_CLIENT, USER_TOKEN);
            WholeSaler = new Player(this, "WholeSaler", STORAGE_COST, BACKLOG_COST, WHOLESALER_INIT_INV, who_max, who_min, 2, 2, null, OUTPUT_FROM_SERVER_MQTT_CLIENT, USER_TOKEN);
            Distributor = new Player(this, "Distributor", STORAGE_COST, BACKLOG_COST, DISTRIBUTOR_INIT_INV, dis_max, dis_min, 2, 2, null, OUTPUT_FROM_SERVER_MQTT_CLIENT, USER_TOKEN);
            Factory = new Player(this, "Factory", STORAGE_COST, BACKLOG_COST, FACTORY_INIT_INV, fac_max, fac_min, 2, 2, fac_unit, OUTPUT_FROM_SERVER_MQTT_CLIENT, USER_TOKEN);

            Retailer.Right = WholeSaler;

            WholeSaler.Left = Retailer;
            WholeSaler.Right = Distributor;

            Distributor.Left = WholeSaler;
            Distributor.Right = Factory;

            Factory.Left = Distributor;
            initNewDay(cancelTokenSrc.Token, delay);

            SimulationOutput.Score = SumAllCosts() * -1;

            //newDayTimer.Start();
            //orderGeneratorTimer.Start();
        }

        public double SumAllCosts()
        {
            double retVal = 0;

            retVal = Retailer.StorageCostTotal + Retailer.BacklogCostTotal + WholeSaler.StorageCostTotal + WholeSaler.BacklogCostTotal + Distributor.StorageCostTotal + Distributor.BacklogCostTotal + Factory.StorageCostTotal + Factory.BacklogCostTotal;

            retVal = retVal * -1;
            return retVal;
        }

        public void stop()
        {
            cancelTokenSrc.Cancel();
            //newDayTimer.Stop();
            //orderGeneratorTimer.Stop();
        }

        public void DisconnectMQTT()
        {
            if (OUTPUT_FROM_SERVER_MQTT_CLIENT != null && OUTPUT_FROM_SERVER_MQTT_CLIENT.IsConnected)
            {
                OUTPUT_FROM_SERVER_MQTT_CLIENT.Disconnect();
            }
        }
    }
}
