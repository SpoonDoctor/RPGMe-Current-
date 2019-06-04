GameEngine = require("./gameengine.js");

function runMainGame(resultText, command, truncatedCommandText) {

    switch (command) {
        case GameEngine.COMMANDS.CONTINUESTORY:
            //Figure out what scenario to grab. If we have multiple options, we should have a path selection to use.
            //If we have only one option, we gotta go there
            if (Object.keys(GameEngine.NEXTSCENARIOID).length > 1) {
                //console.log(Object.keys(GameEngine.NEXTSCENARIOID).length)
                var choice = truncatedCommandText.substring(command.length + 1);
                GameEngine.CURRENTSCENARIOID = GameEngine.NEXTSCENARIOID[choice];
            } else {
                GameEngine.CURRENTSCENARIOID = GameEngine.NEXTSCENARIOID.path;
            }
            var scenario = GameEngine.SCENARIOSANDEVENTS.scenarios[GameEngine.CURRENTSCENARIOID]; //Use a getter for this
            //console.log(scenario)
            switch (scenario.type) {
                case "story": //Need to consider random encounters
                    resultText = scenario.text;
                    GameEngine.NEXTSCENARIOID = {
                        "path": scenario.path
                    };
                    break;
                case "storyNE":
                        resultText = scenario.text;
                        GameEngine.NEXTSCENARIOID = {
                            "path": scenario.path
                        };
                        break;
                case "choice":
                    resultText = scenario.text;
                    GameEngine.NEXTSCENARIOID = scenario.choicepaths;
                    break;
                case "encounter":
                    resultText = scenario.text;
                    GameEngine.NEXTSCENARIOID = scenario.choicepaths;
                    GameEngine.CURRENTGAMESTATE = GameEngine.GAMESTATES.BATTLE;
                    break;
            }
            break;
        case GameEngine.COMMANDS.RESTATESCENARIO:
            var scenario = GameEngine.SCENARIOSANDEVENTS.scenarios[GameEngine.CURRENTSCENARIOID]; //Use a getter for this
            resultText = scenario.text;
            //Don't need to set up possible routes because those should already be set if we're able to repeat the text.
            break;

    }

    return resultText;
}

module.exports.runMainGame = runMainGame;