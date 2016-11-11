function RNNCoreSettings(id, startRandomness, endRandomness, maxLinear, minLinear, startSessionRandomness, endSessionRandomness) {

    var self = this;

    self.Id = ko.observable(id);
    self.StartRandomness = ko.observable(startRandomness);
    self.EndRandomness = ko.observable(endRandomness);
    self.MaxLinear = ko.observable(maxLinear);
    self.MinLinear = ko.observable(minLinear);
    self.StartSessionRandomness = ko.observable(startSessionRandomness);
    self.EndSessionRandomness = ko.observable(endSessionRandomness);

}