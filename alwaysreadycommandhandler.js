GameEngine = require("./gameengine.js");

function runAlwaysReadyCommands(resultText, command, truncatedCommandText, user_id) {
    switch (command) {
        case GameCommands.NEWGAME: //TODO add logic to handle saves, set groupme id as save id, stuff like that
            //If there is no active game, or we confirm that we want one, create a new game.
            if (GameEngine.CURRENTGAMESTATE === GameStates.NOACTIVEGAME || GameEngine.CURRENTGAMESTATE === GameStates.CONFIRMNEWGAME) {
                resultText = GameEngine.STRINGRESOURCES.Narrator.NewGameText;
                //Fix up the engine for a new game
                GameEngine.CHARACTERINCREATION.User = user_id;
                GameEngine.CHARACTERWITHFOCUS = user_id;
                GameEngine.CURRENTHOST = user_id;
                GameEngine.NEXTSCENARIOID = undefined;
                GameEngine.CURRENTGAMESTATE = GameStates.NEWGAME;
            } else {
                //TODO: make a string resource
                resultText = "Game is active. Would you like to start a new one? Type: '" + GameEngine.STRINGRESOURCES.SystemCommands.CommandString +
                    " newgame' once more to confirm, or '" + GameEngine.STRINGRESOURCES.SystemCommands.CommandString +
                    " return' to undo this request. Note: If an owner of an existing game starts a game, the old one will be deleted.";
                GameEngine.HOLDSTATE = GameEngine.CURRENTGAMESTATE;
                GameEngine.CURRENTGAMESTATE = GameStates.CONFIRMNEWGAME;

            }
            break;
        case GameCommands.REPEAT:
            //Return whatever our last text was
            resultText = GameEngine.LASTTEXT
            break;
        case GameCommands.HELP:
            //If there's nothing after "help" in the command, display general help info stored in GameEngine.STRINGRESOURCES.Help.Help
            if (truncatedCommandText.length === command.length) {
                resultText = GameEngine.STRINGRESOURCES.Help.Help
            } else {
                var helptext = truncatedCommandText.substring(command.length + 1);
                resultText = GameEngine.STRINGRESOURCES.Help[helptext];
            }
            break;
        case GameCommands.ARCHIVE:
            var archivetext = truncatedCommandText.substring(command.length + 1);
            resultText = GameEngine.STRINGRESOURCES.Archive[archivetext];
            break;
        case GameCommands.LOAD:
            resultText = GameEngine.loadGame(user_id)
            break;
        case GameCommands.SAVE:
            if (GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.MAIN) {
                resultText = GameEngine.saveGame();
            }
            //If we're in battle when we try to save, tell user we can't do this because we're in combat
            //More helpful a reason and establishes this can't be done
            else if (GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.BATTLE) {
                resultText = GameEngine.STRINGRESOURCES.SystemCommands.SaveFailedBattle;
            }
            //Otherwise... Probably should have more helpful stuff like above but this is fine for now
            else {
                resultText = GameEngine.STRINGRESOURCES.SystemCommands.SaveFailed;
            }
            break;
            

    }
    return resultText;
}

module.exports.runAlwaysReadyCommands = runAlwaysReadyCommands;