//Central place for calling main game logic modules. Also contains always ready commands like help and new game (probably should change this).
//Anything not always ready should be in its own module. For now we'll leave the global stuff.
GameEngine = require("./gameengine.js");
NewGame = require("./newgamehandler.js");
AlwaysReady = require("./alwaysreadycommandhandler.js");
MainGame = require("./maingamehandler");
//Increase readability a little
GameCommands = GameEngine.COMMANDS;
GameStates = GameEngine.GAMESTATES;

//Chooses module based on command text and/or current game state
//return result to entry/exit point for sending to window or groupme
function selectGameLogic(payload) {
    //Get the text from the payload object here to make behavior consistent across online and offline apps
    var entryText = payload.text;
    //TODO: Consider making this a string resource NOTE: PROBABLY BETTER TO STORE THIS ON THE ENGINE
    var resultText = "Nothing happened";
    //Make sure string starts with our "command string" and isn't just blank after that"
    if (RegExp("^" + GameEngine.STRINGRESOURCES.SystemCommands.CommandString + "[\\S\\s]*").test(entryText)) {
        //Strip off the command string
        var truncatedCommandText = entryText.substring(GameEngine.STRINGRESOURCES.SystemCommands.CommandString.length);
        var command = truncatedCommandText.split(" ")[0];

        //Run always ready command logic, skip other command logic if we get a non default result back
        resultText = AlwaysReady.runAlwaysReadyCommands(resultText, command, truncatedCommandText, payload.user_id);
        if (resultText === "Nothing happened") {
            //Choose what module to run if we didn't use an "always ready" command
            if (GameEngine.CURRENTGAMESTATE < GameStates.MAIN) {
                resultText = NewGame.runNewGame(resultText, command, truncatedCommandText);
            }
            else if (GameEngine.CURRENTGAMESTATE === GameStates.MAIN) {
                resultText = MainGame.runMainGame(resultText, command, truncatedCommandText);
            }
            else if (GameEngine.CURRENTGAMESTATE === GameStates.BATTLE){
                resultText = CombatHandler.doCombatStep(resultText, command, truncatedCommandText);
            }

        }
    }
    //Replace string value placeholders
    resultText = GameEngine.replaceStringValuePlaceholders(resultText);
    //Stash this text in case it needs repeating
    GameEngine.LASTTEXT = resultText;
    return resultText;
}

module.exports.selectGameLogic = selectGameLogic;