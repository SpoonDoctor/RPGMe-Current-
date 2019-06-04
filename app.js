
/*Setup the server and initialize the main handler for group me*/
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

//routeofsomesort{
//send only command text to main handler, get result text 
//send output to helper function used to send messages to groupme
//}

GameEngine.initialSetup();