GameEngine = require("./gameengine.js");
//Non always ready commands for creating new games/characters
//Creating a new game file itself is an "always ready" command,
//running game setup logic is not.
function runNewGame(resultText, command, truncatedCommandText){
    switch (command) {
        case GameCommands.RETURN:
            if (GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.CONFIRMNEWGAME) {
                resultText = GameEngine.STRINGRESOURCES.SystemCommands.ReturnString;
                GameEngine.CURRENTGAMESTATE = GameEngine.HOLDSTATE;
            }
            //Else: just return our default "nothing happened" text
            break;
        case GameCommands.BEGIN: //TODO: pull commands that can't be used at any time into a separate module
            //If we try to begin the game check that the game is a new game. If not, tell them how to make a new game.
            if (GameEngine.CURRENTGAMESTATE !== GameEngine.GAMESTATES.NEWGAME) {
                resultText = GameEngine.STRINGRESOURCES.SystemCommands.BeginInvalid;
            } else {
                resultText = GameEngine.STRINGRESOURCES.Narrator.BeginText;
                GameEngine.CURRENTGAMESTATE = GameEngine.GAMESTATES.CHARACTERCREATE;
            }
            break;
        case GameCommands.CREATE:
            if (GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.CHARACTERCREATE) {
                resultText = GameEngine.STRINGRESOURCES.Narrator.CreatedCharacter;
                GameEngine.CURRENTGAMESTATE = GameEngine.GAMESTATES.CHARACTERNAME;
            } else if (GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.CHARACTERNAME) {
                var characterName = truncatedCommandText.substring(command.length + 1);
                GameEngine.CHARACTERINCREATION.Name = characterName;
                GameEngine.CHARACTERWITHFOCUS = GameEngine.CHARACTERINCREATION;
                //Fix this so it isn't so wonky. Narrator strings should handle inputs of variables in a better way. 
                //Maybe make a helper function for parsing, make it more global too and not only useable in certain commands
                //For now I'll leave a place holder tag for where the character name would go
                resultText = GameEngine.STRINGRESOURCES.Narrator.NamedCharacter;
                GameEngine.CURRENTGAMESTATE = GameEngine.GAMESTATES.CHARACTERCLASS;
            } else if(GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.CHARACTERCLASS){
                var characterClass = truncatedCommandText.substring(command.length + 1); //TODO: Make sure this class is a valid class
                GameEngine.CHARACTERINCREATION.Class = characterClass;
                GameEngine.CHARACTERWITHFOCUS = GameEngine.CHARACTERINCREATION;
                resultText = GameEngine.STRINGRESOURCES.Narrator.PickedClass;
                GameEngine.CURRENTGAMESTATE = GameEngine.GAMESTATES.CHARACTERJOB;
            } else if(GameEngine.CURRENTGAMESTATE === GameEngine.GAMESTATES.CHARACTERJOB){
                var characterJob = truncatedCommandText.substring(command.length + 1);
                GameEngine.CHARACTERINCREATION.Job = characterJob;
                GameEngine.CHARACTERWITHFOCUS = GameEngine.CHARACTERINCREATION;
                resultText = GameEngine.STRINGRESOURCES.Narrator.PickedJob + "\n\n" 
                + GameEngine.STRINGRESOURCES.SystemCommands.NewGameFinalized;
                //Add character in progress to list of players, create new save game, move to main game, go to first scenario
                GameEngine.CURRENTGAMESTATE = GameEngine.GAMESTATES.MAIN;
                GameEngine.NEXTSCENARIOID = {"path": "000000"};
                GameEngine.finalizeCharacter();
                GameEngine.saveGame();
            }
            break;
    }
    return resultText
}

module.exports.runNewGame = runNewGame;