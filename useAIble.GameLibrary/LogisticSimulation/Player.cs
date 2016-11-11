using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;

namespace useAIble.GameLibrary.LogisticSimulation
{
    public class Player
    {
        GlobalEventHandlers handlers;
        Timer manufacturingTimer;

        private MqttClient MQTT_ORDER_TRACKER;
        private string USER_TOKEN;

        // simulator instance
        private LogisticSimulator simulator;

        public Player(LogisticSimulator sim, string name, double backlogCost, double storageCost, int initInventory, int maxStock, int minStock, double timeSend, double timeService, int? factOrdersPerDay = null, MqttClient MQTT_ORDER_TRACKER = null, string USER_TOKEN = null)
        {
            simulator = sim;

            this.MQTT_ORDER_TRACKER = MQTT_ORDER_TRACKER;
            this.USER_TOKEN = USER_TOKEN;

            this.backlogCost = backlogCost;
            this.storageCost = storageCost;
            this.initInventory = initInventory;
            this.maxStock = maxStock;
            this.minStock = minStock;
            this.timeSend = timeSend;
            this.timeService = timeService;

            Inventory = initInventory;
            Name = name;

            if (factOrdersPerDay != null)
            {
                this.factOrdersPerDay = factOrdersPerDay;
            }

            handlers = new GlobalEventHandlers();
        }

        private double backlogCost;
        private double storageCost;
        private int initInventory;
        private int maxStock;
        private int minStock;
        private double timeSend;
        private double timeService;
        private int? factOrdersPerDay;

        public string Name { get; set; }
        public double BacklogCostTotal { get; set; }
        public int CurBacklog { get; set; }
        public int CurOrder { get; set; } //Orders to be receive
        public int CurReceive { get; set; } //
        public int CurSend { get; set; }
        public int Expected { get; set; } // Expected =+ CurOrder
        public double FactoryTotalCreationLeftTime { get; set; }
        public int Inventory { get; set; }
        public int Ordered { get; set; } //Order received for processing
        public int PrevBacklog { get; set; }
        public int ProductOnWay { get; set; }
        public double StorageCostTotal { get; set; }

        public Player Left { get; set; }
        public Player Right { get; set; }
        public ConcurrentQueue<Order> Orders { get; set; } = new ConcurrentQueue<Order>(); // Orders processing by this player
        public ConcurrentQueue<Order> Backlogs { get; set; } = new ConcurrentQueue<Order>(); // Queue para sa backlogs
        public ConcurrentQueue<Order> Shipments { get; set; } = new ConcurrentQueue<Order>(); // Orders sent by this player

        public List<dynamic> Transactions { get; set; } = new List<dynamic>();

        public void ClearTransactions()
        {
            Transactions.Clear();
        }

        public int BacklogCalculation()
        {
            int bd = 0;

            foreach (var order in Backlogs)
            {
                // changed from Amount to Backlog, added backlog property to Order class, for separation.
                bd = bd + order.Amount;
            }

            CurBacklog += bd;
            return bd;

        }

        public void StorageCalculation()
        {
            if (Inventory > 0)
            {
                double cost = Inventory * storageCost;
                StorageCostTotal = StorageCostTotal + cost;
            }


        }

        public void ProcessIncomingShipments()
        {
            Order shipment = null;
            if (Shipments.TryPeek(out shipment))
            {
                if (shipment.ProcessOn == simulator.CurrentDay)
                {
                    // dequeue
                    Shipments.TryDequeue(out shipment);

                    // add to Inventory
                    Inventory += shipment.Amount;
                    Expected -= shipment.Amount;
                    CurReceive = shipment.Amount;
                }
            }
        }
        
        public void Ordering()
        {
            CurOrder = 0;
            Transactions.Clear();

            if (Inventory <= minStock)
            {
                //if (Inventory < 0)
                //{
                //    CurOrder = (maxStock + Inventory) + (BacklogCalculation() - CurReceive) - Expected;
                //}
                //else
                //{
                //    CurOrder = (maxStock - Inventory) + (BacklogCalculation() - CurReceive) - Expected;
                //}

                //CurOrder = (maxStock - Inventory) + (BacklogCalculation() - CurReceive) - Expected;
                CurOrder = (maxStock - Inventory) + (BacklogCalculation()) - Expected;

                //alternate variant of ordering
                //curOrder=maxStock-inventory-expected;
                //curOrder += max(0, backlogCalculation()-prevBacklog);                
            }

            if (Name == "Factory")
            {
                if (Expected > 0 || CurOrder > 0)
                {
                    //manufacturingTimer = new Timer(200);
                    //manufacturingTimer.Elapsed += (sender, e) => handlers.ManufacturingEventHandler(sender, e, this, factOrdersPerDay.Value);
                    //manufacturingTimer.Start();

                    // manufacture more goods
                    double orders = (CurOrder >= factOrdersPerDay) ? Math.Ceiling(Convert.ToDouble(CurOrder) / Convert.ToDouble(factOrdersPerDay)) : 1D;

                    int totalOrderSent = 0;
                    for (int i = 0; i < orders; i++)
                    {
                        totalOrderSent += factOrdersPerDay.Value;
                        int orderAmt = 0;
                        if (totalOrderSent > CurOrder)
                        {
                            totalOrderSent -= factOrdersPerDay.Value;
                            orderAmt = CurOrder - totalOrderSent;
                        }
                        else
                        {
                            orderAmt = factOrdersPerDay.Value;
                        }

                        var lastShipment = Shipments.LastOrDefault();
                        var processOn = (lastShipment == null) ? simulator.CurrentDay + 1 : lastShipment.ProcessOn + 1;

                        if (orderAmt > 0)
                        {
                            Order manufacture = new Order("more beer", orderAmt) { ProcessOn = processOn };
                            Shipments.Enqueue(manufacture);
                        }
                    }


                    if (CurOrder > 0)
                    {
                        Expected = Expected + CurOrder;
                    }
                }
            }
            else
            {

                if (Name == "Retailer")
                {
                    //System.Diagnostics.Debug.WriteLine($"Inventory: {Inventory}, CurOrder: {CurOrder}, CurReceive: {CurReceive}, Ordered: {Ordered}");
                }

                if (CurOrder > 0)
                {
                    //if (Name == "Factory")
                    //{
                    //    Expected = Expected + CurOrder;
                    //}
                    //else
                    {
                        var ord = new Order("Order", CurOrder);
                        //Right.Orders.Add(ord);
                        Expected = Expected + CurOrder;
                        //Right.Ordered = CurOrder;

                        PlaceOrder(ord);
                    }
                }
            }

            StorageCalculation();
        }

        //This method determines if the Agent/Player needs to order
        //base on the current inventory, minStock and maxStock 
        //public void ordering()
        //{
        //    //todo: Determine if player needs to order
        //    //if (Orders.Count > 0)
        //    //{
        //    //    if (Inventory > 0)
        //    //    {
        //    //        Order currentOrder;
        //    //        Orders.TryPop(out currentOrder);
        //    //        if (Name == "Retailer")
        //    //        {
        //    //            //todo: shipped orders
        //    //            CurSend = currentOrder.Amount;
        //    //            Inventory = Inventory - currentOrder.Amount;
        //    //            StorageCalculation();
        //    //            BacklogCostTotal = BacklogCalculation();

        //    //        }
        //    //        else
        //    //        {
        //    //            Timer delivery = new Timer((timeSend - 0.01) * 2000);
        //    //            delivery.Elapsed += (sender, e) => handlers.DeliveryEventHandler(sender, e, Left, currentOrder, $"FromBacklog {Name}");
        //    //            delivery.Start();
        //    //        }
        //    //    }
        //    //}
        //    CurOrder = 0;
        //    var backlog = BacklogCalculation();
        //    if(Inventory <= minStock)
        //    {
        //        if(Inventory < 0)
        //            CurOrder = (maxStock + Inventory) + CurReceive - Expected;
        //        else
        //            CurOrder = (maxStock - Inventory) + CurReceive - Expected;
        //    }
        //    if(Name == "Retailer")
        //        System.Diagnostics.Debug.WriteLine($"Inventory: {Inventory}, CurOrder: {CurOrder}, CurReceive: {CurReceive}, Ordered: {Ordered}");

        //    if(CurOrder > 0)
        //    {

        //        //if (Name == "Factory")
        //        //{
        //        //    while (Expected != 0)
        //        //    {
        //        //        manufacturingTimer = new Timer(200);
        //        //        manufacturingTimer.Elapsed += (sender, e) => handlers.ManufacturingEventHandler(sender, e, this, factOrdersPerDay.Value);
        //        //        manufacturingTimer.Start();
        //        //        Expected = Expected + (maxStock - Inventory) + CurBacklog;
        //        //    }
        //        //}
        //        //else
        //        {
        //            //if (Inventory <= minStock)
        //            {
        //                if (Name == "Factory")
        //                {
        //                    manufacturingTimer = new Timer(200);
        //                    manufacturingTimer.Elapsed += (sender, e) => handlers.ManufacturingEventHandler(sender, e, this, factOrdersPerDay.Value);
        //                    manufacturingTimer.Start();
        //                    Expected = Expected + CurOrder;
        //                }
        //                else
        //                {
        //                    var ord = new Order("Order", CurOrder);
        //                    //Right.Orders.Add(ord);
        //                    Expected = Expected + CurOrder;
        //                    Right.Ordered = CurOrder;

        //                    place_order(ord);
        //                }

        //            }
        //        }
        //    }
        //    //var backlogOrd = new Order("Backlog Order", CurBacklog);
        //    //right.Orders.Add(backlogOrd);
        //}

        public void Start()
        {
            // Set initial Values
            Expected = 0;

            // Calculate Backlog Total
            PrevBacklog = CurBacklog;
            BacklogCalculation();
            BacklogCostTotal = PrevBacklog + CurBacklog;

            // Calculate Storage Costs
            StorageCalculation();

            // Receive orders
            //Receive();

            // order if inventory is below minstock and order backlogs
            //ordering();

            // Send shipments
            //Send();


        }

        public void PlaceOrder(Order order)
        {
            //Timer orderDelay = new Timer((this.timeService - 0.02) * 2000);
            //orderDelay.Elapsed += (sender, e) => handlers.Servicing_OrderEventHandler(sender, e, Right, order);
            order.ProcessOn = simulator.CurrentDay + order.Timer;
            Right.Orders.Enqueue(order);

            dynamic trans = new { Type = "REQUEST", Order = order.Amount, From = Name, To = Right.Name };
            Transactions.Add(trans);

            if (!simulator.TurnOffMQTT)
            {
                MQTT_ORDER_TRACKER.Publish(USER_TOKEN + "/" + simulator.AI_ROUTE_KEY + "/requestOrder", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(trans)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
            }

            //orderDelay.Start();
        }

        //Receive order for retailer
        public void Receive(Order order)
        {
            Ordered = 0;
            CurSend = 0;
            Ordered = order.Amount;

            if (Inventory >= order.Amount)
            {
                CurSend = order.Amount;
                if (Name != "Retailer")
                {
                    Send(order);
                }

            }
            else if (Inventory > 0)
            {
                CurSend = Inventory;
                if (Name != "Retailer")
                {
                    Send(order);
                }
                CurBacklog = order.Amount - Inventory;
                order.Amount = CurBacklog;
                Orders.Enqueue(order);
            }
            else
            {
                CurBacklog = order.Amount;
                Orders.Enqueue(order);
            }
            Inventory = Inventory - order.Amount;

            BacklogCostTotal = BacklogCalculation();
            StorageCalculation();

        }
        

        public void ProcessOrders()
        {
            Order shipment = new Order("order shipment", 0);
            BacklogCalculation();
            BacklogCostTotal = CurBacklog;

            // backlogs
            if (Backlogs.Count > 0)
            {
                bool endBacklogProcessing = false;

                do
                {
                    Order backlogOrder = null;
                    if (Backlogs.TryPeek(out backlogOrder))
                    {
                        if (Inventory >= backlogOrder.Amount)
                        {
                            // add to shipment
                            shipment.Amount += backlogOrder.Amount;
                            Inventory -= backlogOrder.Amount;

                            // dequeue backlog
                            Backlogs.TryDequeue(out backlogOrder);
                        }
                        else if (Inventory > 0)
                        {
                            // add all inventory to shipment
                            shipment.Amount += Inventory;
                            Inventory -= backlogOrder.Amount;

                            // update backlog amount
                            backlogOrder.Amount = -Inventory;                            

                            endBacklogProcessing = true;
                        }
                        else
                        {
                            endBacklogProcessing = true;
                        }
                    }
                    else
                    {
                        endBacklogProcessing = true;
                    }
                } while (!endBacklogProcessing);
            }

            // current orders
            Order currentOrder = null;
            if (Orders.TryPeek(out currentOrder))
            {
                if (currentOrder.ProcessOn == simulator.CurrentDay)
                {
                    // dequeue
                    Orders.TryDequeue(out currentOrder);

                    Ordered = currentOrder.Amount;

                    if (Inventory >= currentOrder.Amount)
                    {
                        // add to shipment
                        shipment.Amount += currentOrder.Amount;
                        Inventory -= currentOrder.Amount;
                    }
                    else if (Inventory > 0)
                    {
                        // add all inventory to shipment
                        shipment.Amount += Inventory;

                        // update backlog amount
                        currentOrder.Amount -= Inventory;

                        // transfer remaining order amount as backlog
                        Backlogs.Enqueue(currentOrder);
                    }
                    else
                    {
                        // transfer order to backlog
                        Backlogs.Enqueue(currentOrder);
                    }
                }
                else
                {
                    Ordered = 0;
                }
            }

            // send shipment
            if (shipment.Amount > 0)
            {
                Send(shipment);
            }
            else
            {
                CurSend = 0;
            }
        }

        //Send order
        public void Send(Order order)
        {
            //Timer delivery = new Timer((timeSend - 0.01) * 2000);
            //delivery.Elapsed += (sender, e) => handlers.DeliveryEventHandler(sender, e, Left, order, Name);

            CurSend = order.Amount;
            if (Left != null)
            {
                order.ProcessOn = simulator.CurrentDay + order.Timer;
                Left.Shipments.Enqueue(order);
            }

            dynamic trans = new { Type = "RECEIVE", Order = order.Amount, From = Name, To = (Left == null ? "Retailer" : Left.Name) };
            Transactions.Add(trans);

            if (!simulator.TurnOffMQTT)
            {
                MQTT_ORDER_TRACKER.Publish(USER_TOKEN + "/" + simulator.AI_ROUTE_KEY + "/receiveOrder", Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(trans)), MqttMsgBase.QOS_LEVEL_EXACTLY_ONCE, false);
            }

            //delivery.Start();
            //foreach (var order in Orders)
            //{
            //    if (order.Timer == 0)
            //    {
            //        // if order is processed, make a shipment
            //        var ship = new Shipment();

            //        // check if player has enough stocks to send
            //        if (Inventory >= order.Amount)
            //        {
            //            // ship amount if enough
            //            ship.Amount = order.Amount;

            //        }
            //        else
            //        {
            //            // add lacking order to backlog to fulfill later the ship remaining stocks
            //            order.Backlog = order.Amount - Inventory;
            //            ship.Amount = Inventory;

            //        }

            //        Inventory -= ship.Amount;
            //        Shipments.Push(ship);
            //    }


            //}
        }        
    }
}
