const fs = require("fs");

//Utility class containing short helper functions, enums, and other 
//basic game componenets
class GameEngine {



    //Constructor
    constructor() {
        //ENUMS
        //Enum of possible valid game states
        this.GAMESTATES = {
            NOACTIVEGAME: -9999999, //Sentinel, default state of freshly started application
            NEWGAME: parseInt("0000"), //TODO: Working around "octals in strict mode" error. Better method?
            CONFIRMNEWGAME: parseInt("0001"),
            CHARACTERCREATE: parseInt("0002"),
            CHARACTERNAME: parseInt("0003"),
            CHARACTERCLASS: parseInt("0004"),
            CHARACTERJOB: parseInt("0005"),
            MAIN: 1000,
            BATTLE: 2000
        }
        //"Enum" of possible commands
        this.COMMANDS = {
            NEWGAME: "newgame",
            RETURN: "return",
            BEGIN: "begin",
            REPEAT: "repeat",
            CREATE: "create",
            HELP: "help",
            ARCHIVE: "archive",
            ADDPLAYER: "playeradd", //implement this
            CONTINUESTORY: "next",
            LOAD: "load",
            RESTATESCENARIO: "scenario",
            SAVE: "save"
        }

        
        //Member variables
        //Initialize this way to make the members of the engine object a little more obvious. Should get set during startup. 
        //If undefined, best bet is to look below at initialsetup
        this.STRINGRESOURCES = undefined;
        //Used when a player wants text to be repeated. Currently limited (because I'm lazy) to only store last displayed text. Does not store old text during cases when
        //a player returns to a previous state.
        this.LASTTEXT = undefined;
        //Holds active game's current game state. Initializes to sentinel value to prevent issues with new games
        //this.CURRENTGAMESTATE = this.GAMESTATES.NOACTIVEGAME; UNCOMMENT AFTER TESTING
        this.CURRENTGAMESTATE = this.GAMESTATES.MAIN;
        //Hold scenario ID
        //this.CURRENTSCENARIO = undefined;
        //Holds previous game state in cases where we need to go back as the result of some action (such not confirming the start of a new game)
        this.HOLDSTATE = undefined;
        //Holds list of possible next scenarios
        //this.NEXTSCENARIO = undefined; UNCOMMENT ALSO
        this.NEXTSCENARIOID = {"path": "000000"};
        //Holds current scenario, used when player needs a scenario repeated.
        this.CURRENTSCENARIOID = undefined;
        //List of active players in game for when multiplayer is implemented
        this.PLAYERS = [];
        //Hold character in creation progress in memory
        this.CHARACTERINCREATION = {}; //Doesn't need to be in save file because a character can't be used until it exists.
        //Character with current focus
        this.CHARACTERWITHFOCUS = {}; //Add to save file?
        //Holds a character in memory for cases when we need to switch our focus for just a moment
        this.CHARACTERFOCUSHOLD = {}; //Add to save file?
        //Host of current game to decide what save file is being accessed
        this.CURRENTHOST = undefined;

    }


    //Helpers
    //Prepare application environment on game launch to run the game
    initialSetup() {
        //Load string resources into memory
        try {
            this.STRINGRESOURCES = JSON.parse(fs.readFileSync("./documents/stringresources.json", "utf8"));
        } catch (err) {
            if (err.code === "ENOENT") {
                console.log("No string resources");
            } else {
                throw err;
            }
        }

        //Pull spell descriptions from class definitions
        try {
            this.CLASSDEFINITIONS = JSON.parse(fs.readFileSync("./documents/classdefinitions.json", "utf8"));
        } catch (err) {
            if (err.code === "ENOENT") {
                console.log("No class defs");
            } else {
                throw err;
            }
        }

        //Loop through the class definitions...
        for (var classDefIterator in this.CLASSDEFINITIONS) {
            //Make things a little more readable....
            var classDefinition = this.CLASSDEFINITIONS[classDefIterator];
            //Loop through classes skills...
            for(var skill in classDefinition.skills){
                //Add the descriptions of the skills to the archive (data for the skills will not be access through the archive)
                this.STRINGRESOURCES.Archive[skill] = classDefinition.skills[skill].Description;
            };
        }

        //Read scenario information into memory
        try {
            this.SCENARIOSANDEVENTS = JSON.parse(fs.readFileSync("./documents/scenariosandevents.json", "utf8"));
        } catch (err) {
            if (err.code === "ENOENT") {
                console.log("No class defs");
            } else {
                throw err;
            }
        }
    }

    //Add character in creation progress to active player list
    finalizeCharacter() {
        this.PLAYERS.push(this.CHARACTERINCREATION);
        this.CHARACTERINCREATION = {}; //Do this here so saving can be generic
    }

    //Creates new save. Should only need information stored on the engine object to manipulate saves
    saveGame() {
        var saveFileContents = {
            "host": this.CURRENTHOST,
            "currentgamestate": this.CURRENTGAMESTATE,
            "lasttext": this.LASTTEXT,
            "holdstate": this.HOLDSTATE,
            "players": [this.PLAYERS],
            "nextscenario": this.NEXTSCENARIO,
            "currentscenario": this.CURRENTSCENARIO,
            "characterwithfocus": this.CHARACTERWITHFOCUS,
            "characterfocushold": this.CHARACTERFOCUSHOLD
        }
        //If current host is undefined for some reason, catch this instead of creating an undefined save
        if(!this.CURRENTHOST){
            return this.STRINGRESOURCES.SystemCommands.SaveFailedWrite;
        }
        
        try {
            fs.writeFileSync("./saves/" + this.CURRENTHOST + ".json", JSON.stringify(saveFileContents, null, 4));
            return this.STRINGRESOURCES.SystemCommands.SaveSuccessful;
        } catch (err) {
            return this.STRINGRESOURCES.SystemCommands.SaveFailedWrite;
        }
        
        
    }

    //Replace certain predefined placeholders in string resources with the values they represent
    //%CC = character class
    //%CJ = character job
    //%CN = character name
    //%CMDS = command string
    replaceStringValuePlaceholders(stringResource){
        stringResource = stringResource.replace(/%CC/g, this.CHARACTERWITHFOCUS.Class);
        stringResource = stringResource.replace(/%CJ/g, this.CHARACTERWITHFOCUS.Job);
        stringResource = stringResource.replace(/%CN/g, this.CHARACTERWITHFOCUS.Name);
        stringResource = stringResource.replace(/%CMDS/g, this.STRINGRESOURCES.SystemCommands.CommandString);
        return stringResource.charAt(0).toUpperCase() + stringResource.slice(1);
    }

    //loads save file using user_id of requester
    loadGame(user_id){
        
        try {
            //Read save file into memory.
            var loadedGame = JSON.parse(fs.readFileSync("./saves/" + user_id + ".json", "utf8"));
            //Setup engine variables.
            this.CURRENTHOST = loadedGame.host;
            this.CURRENTGAMESTATE = loadedGame.currentgamestate;
            this.LASTTEXT = loadedGame.lasttext;
            this.HOLDSTATE = loadedGame.holdstate;
            this.PLAYERS = loadedGame.players;
            this.NEXTSCENARIO = loadedGame.nextscenario;
            this.CURRENTSCENARIO = loadedGame.currentscenario;
            this.CHARACTERINCREATION = {};
            this.CHARACTERWITHFOCUS = loadedGame.characterwithfocus; 
            this.CHARACTERFOCUSHOLD = loadedGame.characterfocushold;
            
            return this.STRINGRESOURCES.SystemCommands.GameLoadSuccessful;
        } catch (err) {
            if (err.code === "ENOENT") {
                return this.STRINGRESOURCES.SystemCommands.GameLoadFailed; 
            } else {
                throw err;
            }
        }
    }
}

module.exports = new GameEngine();