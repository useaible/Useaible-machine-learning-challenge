function PlayerVM(name, inventory, expected, shipped, ordered, storageCost, backlogCost) {
    
    var self = this;

    self.Name = ko.observable(name);
    self.Inventory = ko.observable(inventory);
    self.Expected = ko.observable(expected);
    self.Shipped = ko.observable(shipped);
    self.Ordered = ko.observable(ordered);
    self.StorageCost = ko.observable(storageCost);
    self.BacklogCost = ko.observable(backlogCost);

    self.MinStockLevel = ko.observable();
    self.MaxStockLevel = ko.observable();
    self.UnitsPerDay = ko.observable();

    self.Session = ko.observable();
    self.Destination = ko.observable();

    self.Distribution = ko.observable(new DistributionVM());

}

function DistributionVM() {

    var self = this;

    self.From = ko.observable();
    self.To = ko.observable();

}