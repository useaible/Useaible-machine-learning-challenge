function LogisticSettingsVM(
    storageCost,
    backlogCost,
    retailerInitialInventory,
    wholesalerInitialInventory,
    distributorInitialInventory,
    factoryInitialInventory) {

    var self = this;

    self.StorageCostPerDay = ko.observable(storageCost);
    self.BacklogCostPerDay = ko.observable(backlogCost);
    self.RetailerInitialInventory = ko.observable(retailerInitialInventory);
    self.WholesalerInitialInventory = ko.observable(wholesalerInitialInventory);
    self.DistributorInitialInventory = ko.observable(distributorInitialInventory);
    self.FactoryInitialInventory = ko.observable(factoryInitialInventory);

    self.NoOfDaysInterval = ko.observable();
    self.Session = ko.observable();

    self.RNNSettings = ko.observableArray([]);

    self.random_action_prob = ko.observable();
    self.RANDOM_ACTION_DECAY = ko.observable();
    self.HIDDEN1_SIZE = ko.observable();
    self.HIDDEN2_SIZE = ko.observable();
    self.LEARNING_RATE = ko.observable();
    self.MINIBATCH_SIZE = ko.observable();
    self.DISCOUNT_FACTOR = ko.observable();
    self.TARGET_UPDATE_FREQ = ko.observable();


    self.HiddenLayerNeurons = ko.observable();
    self.TrainingMethodType = ko.observable();
    self.Cycles = ko.observable();
    self.StartTemp = ko.observable();
    self.StopTemp = ko.observable();
    self.PopulationSize = ko.observable();
    self.Epochs = ko.observable();
    self.MinRandom = ko.observable();
    self.MaxRandom = ko.observable();
    self.LearnRate = ko.observable();
    self.Momentum = ko.observable();
    self.HiddenLayerNeuronsInputs = ko.observableArray([]);
}