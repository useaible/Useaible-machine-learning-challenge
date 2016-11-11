function DRNNRepository() {

    var self = this;
    var BASE_URL = "/api/drnn";

    self.GetToken = function () {
        return $.ajax({
            url: BASE_URL + "/token",
            contentType: "application/json",
            type: "GET",
            async: true
        });
    };

    self.LoadNetwork = function (token, parameters, existing, temporary) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/loadnetwork?token=" + token + "&messageid=" + messageId + "&networkname=" + parameters.Name + "&existing=" + existing + "&temporary=" + temporary,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: true
        });
    };

    //self.Play = function (token, networkName, learn, sessions, startRandomness, endRandomness, maxLinearBracket, minLinearBracket, numSessionRandomness) {
    //    return $.ajax({
    //        url: BASE_URL + "/play?token=" + token + "&networkname=" + networkName + "&learn=" + learn + "&sessions=" + sessions + "&startrandomness=" + startRandomness + "&endrandomness=" + endRandomness + "&maxlinearbracket=" + maxLinearBracket + "&minlinearbracket=" + minLinearBracket + "&numsessionrandomness=" + numSessionRandomness,
    //        contentType: "application/json",
    //        type: "POST",
    //        data: "",
    //        async: true
    //    });
    //};

    self.Play = function (token, networkName, learn, sessions, settings, fuel, altitude) {
        return $.ajax({
            url: BASE_URL + "/play?token=" + token + "&networkname=" + networkName + "&learn=" + learn + "&sessions=" + sessions + "&fuel=" + fuel + "&altitude=" + altitude,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(settings),
            async: true
        });
    };

    self.PlayLanderEncog = function (token, networkName, learn, sessions, settings, fuel, altitude) {
        return $.ajax({
            url: BASE_URL + "/playlunarlanderencog?token=" + token + "&networkname=" + networkName + "&learn=" + learn + "&sessions=" + sessions + "&fuel=" + fuel + "&altitude=" + altitude,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(settings),
            async: true
        });
    };

    self.NetworkSettings = function (token, networkName, parameters) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/settings?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: true
        });
    };

    self.SessionStart = function (token, networkName) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/startsession?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: "",
            async: false
        });
    };

    self.RunCycle = function (token, networkName, parameters) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/runcycle?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName + "&direct=true",
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: true
        });
    };

    self.RunCycleBatch = function (token, messageId, networkName, parameters) {
        var messageId = guid();
        return $.ajax({
            url: BASE_URL + "/runcyclebatch?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: false
        });
    };

    self.ScoreCycle = function (token, networkName, parameters) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/scorecycle?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName + "&direct=true",
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: true
        });
    };

    self.ScoreCycleBatch = function (token, messageId, networkName, parameters) {
        return $.ajax({
            url: BASE_URL + "/scorecyclebatch?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: false
        });
    };

    self.SessionEnd = function (token, networkName, parameters) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/endsession?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(parameters),
            async: false
        });
    };

    self.ResetSessionCount = function (token, networkName) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/resetsessioncount?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: "",
            async: false
        });
    };

    self.ResetNetwork = function (token, networkName) {
        var messageId;
        return $.ajax({
            url: BASE_URL + "/resetnetwork?token=" + token + "&messageid=" + messageId + "&networkname=" + networkName,
            contentType: "application/json",
            type: "POST",
            data: "",
            async: false
        });
    };

    self.GenerateMaze = function (token, width, height) {

        return $.ajax({
            url: BASE_URL + "/generatemaze?token=" + token + "&width=" + width + "&height=" + height,
            contentType: "application/json",
            type: "POST",
            data: ""
        });

    };

    self.PlayMaze = function (token, numSessions, mazeParams) {

        return $.ajax({
            url: BASE_URL + "/playmaze?token=" + token + "&numsessions=" + numSessions,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(mazeParams)
        });

    };

    self.PlayMazeEncog = function (token, numSessions, mazeParams) {

        return $.ajax({
            url: BASE_URL + "/playmazeEncog?token=" + token + "&numsessions=" + numSessions,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(mazeParams)
        });

    };

    self.PlayLogisticSimulator = function (token, numSessions, settings) {

        return $.ajax({
            url: BASE_URL + "/playLogisticSimulator?token=" + token + "&numsessions=" + numSessions,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(settings)
        });

    };

    self.PlayLogisticSimulatorTF = function (token, numSessions, settings) {

        return $.ajax({
            url: BASE_URL + "/playLogisticSimulatorTF?token=" + token + "&numsessions=" + numSessions,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(settings)
        });

    };

    self.PlayLogisticSimulatorEncog = function (token, numSessions, settings) {

        return $.ajax({
            url: BASE_URL + "/playLogisticSimulatorEncog?token=" + token + "&numsessions=" + numSessions,
            contentType: "application/json",
            type: "POST",
            data: ko.toJSON(settings)
        });

    };

    self.GenerateGUID = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        //return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        //  s4() + '-' + s4() + s4() + s4();
        return s4() + s4() + s4() + s4() +
          s4() + s4() + s4() + s4();
    };
}