function RNetworkSettingsParams(sessions, startRandomness, endRandomness, max, min, numSessionRandomness, learn) {

    var self = this;

    self.Temp_Num_Sessions = sessions;
    self.StartRandomness = startRandomness;
    self.EndRandomness = endRandomness;
    self.MaxLinearBracket = max;
    self.MinLinearBracket = min;
    //self.SessionCountInitial = initialSessionCount;
    self.NumSessionRandomness = numSessionRandomness;
    self.Learn = learn;

}