function Simulator(networkName, learn, sessions, startRandomness, endRandomness, maxLinearBracket, minLinearBracket) {

    var self = this;
    var repository = new DRNNRepository();
    var USER_TOKEN;
    var TERMINAL_VELOCITY = 40; // todo need to sync with Leo's code

    self.Init = function () {


        var def = $.Deferred();
        var ins = [];

        ins.push(new RNNIOParams("fuel", "System.Int32", 0, 200, 1));
        ins.push(new RNNIOParams("altitude", "System.Double", 0, 10000, 1));
        ins.push(new RNNIOParams("velocity", "System.Double", -TERMINALVELOCITY, TERMINALVELOCITY, 1));

        var outs = [];

        outs.push(new RNNIOParams("thrust", "System.Boolean", 0, 1));

        var defer = $.when(repository.GetToken());
        defer.done(function (data_token) {

            USER_TOKEN = data_token.Token;

            var defer2 = $.when(repository.LoadNetwork(USER_TOKEN, new CreateNetworkParams(networkName, ins, outs)));

            defer2.done(function (network_data, settings_data) {
                console.log("loaded network...");
                repository.NetworkSettings(USER_TOKEN, networkName, new RNetworkSettingsParams(sessions, startRandomness, endRandomness, maxLinearBracket, minLinearBracket)).done(function () {
                    console.log("created network settings...");
                    def.resolve();
                });
            });

        });

        return def;
    };

    var currentScore = 0;
    var sessionCounter = 0;
    self.Train = function (sim, rungame, resetGame) {

        sessionCounter++;

        var mainDefer = $.Deferred();
        // session start
        var sessionID;
        repository.SessionStart(USER_TOKEN, networkName).done(function (data) {
            try {
                sessionID = eval(data);
            } catch (ex) {
                console.log("Error on session start: " + ex);
            }
        });

        var doBatch = false;
        var cycleDefer = $.Deferred();
        var runCycle = function () {

            var invs = [];

            invs.push(new RNNIOWithValuesParams("fuel", sim.fuel().toFixed(0)));
            invs.push(new RNNIOWithValuesParams("altitude", sim.altitude().toFixed(2)));
            invs.push(new RNNIOWithValuesParams("velocity", sim.velocity().toFixed(2)));

            rungame();

            if (sim.fuel() <= 0 && sim.velocity() <= -(TERMINAL_VELOCITY) && sim.altitude() > 0) {
                doBatch = true;

                self.DoBatchCycles(sim, sessionID);

                if (!sim.flying()) {
                    cycleDefer.resolve(sim);
                }

            } else {

                var defer1 = $.when(repository.RunCycle(USER_TOKEN, networkName, new RunCycleParams(sessionID, invs, [], learn)));

                var reponseCycle;

                defer1.done(function (data1) {

                    responseCycle = new CycleOutputParams(data1.RnnType, data1.Output, data1.CycleId);

                    var thrust = responseCycle.Output == "False" ? false : true;
                    sim.thrust(thrust);

                    // score cycle
                    var score = scoreTurn(sim, thrust);

                    var defer2 = $.when(repository.ScoreCycle(USER_TOKEN, networkName, new ScoreCycleParams(responseCycle.CycleId, score)));

                    defer2.done(function () {

                        if (!sim.flying()) {
                            cycleDefer.resolve(sim);
                        }

                        if (sim.flying() && !doBatch) {
                            runCycle();
                        }
                    });

                });
            }
            return cycleDefer;
        };
        
        runCycle().done(function (deferRes) {
            currentScore = sim.score();

            // session end
            repository.SessionEnd(USER_TOKEN, networkName, new SessionEndParams(currentScore)).done(function (data3) {
                sim.sessionScores.push({
                    Id: sessionID, Score: currentScore
                });
                resetGame();
                mainDefer.resolve(sessionCounter);
            });
        });

        return mainDefer;
    };

    self.DoBatchCycles = function (sim, sessionId) {
        var cycleBatch = {
            SessionId: sessionId, Learn: learn, Items: []
        };

        // calc inputs then save to an array
        while (sim.altitude() > 0) {
            var cycleBatchItem = {
                Inputs: [], Outputs: []
            };
            cycleBatchItem.Inputs.push(new RNNIOWithValuesParams("fuel", sim.fuel().toFixed(0)));
            cycleBatchItem.Inputs.push(new RNNIOWithValuesParams("altitude", sim.altitude().toFixed(2)));
            cycleBatchItem.Inputs.push(new RNNIOWithValuesParams("velocity", sim.velocity().toFixed(2)));
            cycleBatch.Items.push(cycleBatchItem);

            sim.altitude(sim.altitude() + sim.velocity());
            if (sim.altitude() < 0) sim.altitude(0);
        }

        var cycleOutputs = [];

        // run batched cycles
        var retry = true;
        var msgId = repository.GenerateGUID();
        while (retry) {
            repository.RunCycleBatch(USER_TOKEN, msgId, networkName, cycleBatch).done(function (data) {
                cycleOutputs = data;
                retry = false;
                console.log("Batch cycle done");
            }).fail(function (x, t, m) {
                if (t === 'timeout') {
                    retry = true;
                }
                console.log("Error run cycle batch: " + m);
            });
        }

        var scoreCycleBatch = [];

        // score each cycle and save to an array 
        for (var i = 0; i < cycleOutputs.length; i++) {
            var cycleOutput = cycleOutputs[i];
            var cycleInputs = cycleBatch.Items[i].Inputs;

            var fuel = parseInt(getInput(cycleInputs, "fuel"));
            var velocity = parseFloat(getInput(cycleInputs, "velocity"));
            var altitude = parseFloat(getInput(cycleInputs, "altitude"));
            var thrust = cycleOutput.Output == "False" ? false : true;
            var score = scoreTurnMain(fuel, velocity, altitude, thrust);

            scoreCycleBatch.push(new ScoreCycleParams(cycleOutput.CycleId, score));
        }

        // score batched cycles
        retry = true;
        msgId = repository.GenerateGUID();
        while (retry) {
            repository.ScoreCycleBatch(USER_TOKEN, msgId, networkName, scoreCycleBatch).done(function (data) {
                console.log("Score cycle batch done");
                retry = false;
            }).fail(function (x, t, m) {
                if (t === 'timeout') {
                    retry = true;
                }
                console.log("Error score cycle batch: " + m);
            });
        }
    };

    self.ResetSessionCount = function () {

        // reset session count
        repository.ResetSessionCount(USER_TOKEN, networkName).done(function (data) {
            console.log("session count reset");
        });

    };

    var getInput = function (cycleInputs, inputName) {
        var retVal = null;

        $.each(cycleInputs, function (i, v) {
            if (v.IOName == inputName) {
                retVal = v.Value;
                return false;
            }
        });

        return retVal;
    };

    var scoreTurn = function (sim, thrust) {

        var retVal = 0;
        var velocity = sim.velocity();
        var fuel = sim.fuel();
        var altitude = sim.altitude();

        retVal = scoreTurnMain(fuel, velocity, altitude, thrust);

        return retVal;
    };

    var scoreTurnMain = function (fuel, velocity, altitude, thrust) {
        var retVal = 0;

        if (altitude <= 1000) {
            if (fuel > 0 && velocity >= -5 && !thrust) {
                retVal = fuel;
            } else if (fuel > 0 && velocity < -5 && thrust) {
                retVal = fuel;
            }
        }
        else if (altitude > 1000 && !thrust) {
            retVal = 200;
        }

        return retVal;
    };

}