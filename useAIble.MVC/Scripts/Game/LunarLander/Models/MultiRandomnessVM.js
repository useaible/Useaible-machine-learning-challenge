function MultiRandomnessVM(id, rstart, rend, fcycle, lcycle) {

    var self = this;

    self.Id = ko.observable(id);
    self.Rstart = ko.observable(rstart);
    self.Rend = ko.observable(rend);
    self.FirstCycle = ko.observable(fcycle);
    self.LastCycle = ko.observable(lcycle);

}