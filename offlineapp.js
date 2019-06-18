//Entry/exit point for offline testing of game logic
//Should contain no game logic itself 

var MainHandler = require("./modulehandler.js")

//lets us use the command line as if it were a groupme input
const readlineSync = require('readline-sync');

function offlineEntryExitPoint(){
    var entryText = "";
    //Gonna need promise shenanigans to make sure this works synchronously
    //loop until we see "stop"
    while(true){
        entryText = readlineSync.question(``);
        if(entryText === "stop") break;
        //create an object with similar structure to a groupme payload to make handling consistent across offline and offline apps
        var mockGroupMePayload = {
            "text": entryText,
            "user_id": "0123456789"
        }
        let resultText = MainHandler.selectAndRunGameLogic(mockGroupMePayload);
        //TODO: Implement helper to break down lengthy text into multiple smaller messages to avoid character limits (may not be necessary)
        console.log(resultText);
    }
}

//Getting game engine from main handler. TODO: Better way to do this?
GameEngine.initialSetup();
offlineEntryExitPoint();