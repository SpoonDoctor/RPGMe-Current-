//Deals with all combat logic in one main combat loop
GameEngine = require("./gameengine.js");


function doCombatStep(resultText, command, truncatedCommandText) {
    resultText = ""; //Clear resultText to prepare appending combat information
    var combatPhaseEnded = false;
    while (!combatPhaseEnded) {
        var combatantWithFocus = GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex];
        if (combatantWithFocus.User) {
            resultText = resultText + doPlayerCombatAction(combatantWithFocus); //implement
        } else {
            resultText = resultText + doMonsterCombatAction(combatantWithFocus); //implement
        }
        checkPlayersOrMonstersDead(); //implement

        do {
            GameEngine.ENCOUNTER.combatTurnIndex += 1; //Add one to our index tracking whose turn it is
            GameEngine.ENCOUNTER.combatTurnIndex %= GameEngine.ENCOUNTER.participants.length; //If the number exceeds the number of participants, wrap around to the first
        }
        while (GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].hp <= 0); //If they're dead, (hp less than or equal to 0), repeat and check again

        if (GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].User) { //if next player is a user, stop the combat phase and announce their turn and set focus
            combatPhaseEnded = true;
            resultText = resultText + announcePlayerTurnAndFocus();
        }
        //else, perform combat steps until we run into a player turn
    }
    return resultText;
}

function doPlayerCombatAction() { //For now, just subtract their strength from their first enemy's hp
    var targetIndex = 0;
    while (GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].User) { //Find target that is a monster
        targetIndex += 1;
        targetIndex %= GameEngine.ENCOUNTER.participants.length;
    }
    GameEngine.ENCOUNTER.participants[targetIndex].hp = GameEngine.ENCOUNTER.participants[targetIndex].hp - GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].strength
    return GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].Name + " dealt " + GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].strength + " damage to " + GameEngine.ENCOUNTER.participants[targetIndex].Name + ".\n";
}

function doMonsterCombatAction() { //For now, just subtract their strength from their first enemy's hp
    var targetIndex = 0;
    while (!GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].User) { //Find target that is player
        targetIndex += 1;
        targetIndex %= GameEngine.ENCOUNTER.participants.length;
    }
    GameEngine.ENCOUNTER.participants[targetIndex].hp = GameEngine.ENCOUNTER.participants[targetIndex].hp - GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].strength
    return GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].Name + " dealt " + GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex].strength + " damage to " + GameEngine.ENCOUNTER.participants[targetIndex].Name + ".\n";
}

function beginCombat(resultText) {
    if (GameEngine.ENCOUNTER.participants[0].User) { //If first combat participant has a registered user, they must be a player
        resultText = announcePlayerTurnAndFocus(); //If we start with a player, announce it's their turn
    } else { //Otherwise, they're a monster
        resultText = doCombatStep(resultText, undefined, undefined) //Perform monster combat phase (spell/action options not important for monster turns)
    }
}

function announcePlayerTurnAndFocus() {
    //Change character with focus to the player whose turn it is so the string manipulator works
    GameEngine.CHARACTERWITHFOCUS = GameEngine.ENCOUNTER.participants[GameEngine.ENCOUNTER.combatTurnIndex];
    return GameEngine.STRINGRESOURCES.PlayerTurn; //Return string resource for when it's a player's turn
}

function initializeStoryEncounter(resultText) {
    //Pull the set of enemy info we need from the current encounter
    var enemyList = GameEngine.POSSIBLEENCOUNTERS.storyencounters[GameEngine.SCENARIOSANDEVENTS.scenarios[GameEngine.CURRENTSCENARIOID].storyencounter_id]; //make a getter for this....
    var enemyCombatants = prepareEnemyCombatants(enemyList);
    resultText = setCombatOrder(resultText, enemyCombatants);

    return resultText;
}

function prepareEnemyCombatants(enemyList) {
    //Prepare array to temporarily hold our enemy combatants
    var enemyCombatants = [];
    //Iterate through the enemy info strings
    for (enemyString of enemyList) {
        var enemyAndVariation = enemyString.split(":"); //Our enemy info strings are split into the name of the monster and the variation of it we want
        enemy = GameEngine.MONSTERPEDIA.monsters[enemyAndVariation[0]].variations[enemyAndVariation[1]]; //Make a getter
        enemy.Name = enemyAndVariation[0];
        enemyCombatants.push(enemy);
    }
    return enemyCombatants;
}

//Combat order is determined like this: We find out if the enemy team or the player team has a higher total speed. The winning team goes first. Turn order within the team is 
//then determined on an individual's basis. Highest speed first down to lowest speed last.
function setCombatOrder(resultText, enemyCombatants) {
    var enemyTotalSpeed, playerTotalSpeed = 0;
    var playerCombatants = GameEngine.PLAYERS;
    // console.log(playerCombatants); //Got a feeling this is a reference copy not a value copy so let's see what happens.
    // console.log(GameEngine.PLAYERS);
    for (enemy of enemyCombatants) {
        enemyTotalSpeed += enemy.speed;
    }
    for (player of playerCombatants) {
        playerTotalSpeed += player.speed;
    }

    if (enemyTotalSpeed > playerTotalSpeed) {
        //Fill participant list with enemies based on speed
        while (enemyCombatants.length > 0) {
            var greatestSpeedIndex = 0;
            for (var i = 1; i > enemyCombatants.length; i++) {
                if (enemyCombatants[i].speed > enemyCombatants[greatestSpeedIndex].speed) {
                    greatestSpeedIndex = i;
                }
            }
            GameEngine.ENCOUNTER.participants.push(enemyCombatants.splice(greatestSpeedIndex, 1)[0]);
        }
        //Fill participant list with players based on speed
        while (playerCombatants.length > 0) {
            var greatestSpeedIndex = 0;
            for (var i = 1; i > playerCombatants.length; i++) {
                if (playerCombatants[i].speed > playerCombatants[greatestSpeedIndex].speed) {
                    greatestSpeedIndex = i;
                }
            }
            GameEngine.ENCOUNTER.participants.push(playerCombatants.splice(greatestSpeedIndex, 1)[0]);
        }
    } else {
        //Do the reverse

        //Fill participant list with players based on speed
        while (playerCombatants.length > 0) {
            var greatestSpeedIndex = 0;
            for (var i = 1; i > playerCombatants.length; i++) {
                if (playerCombatants[i].speed > playerCombatants[greatestSpeedIndex].speed) {
                    greatestSpeedIndex = i;
                }
            }
            GameEngine.ENCOUNTER.participants.push(playerCombatants.splice(greatestSpeedIndex, 1)[0]);
        }
        //Fill participant list with enemies based on speed
        while (enemyCombatants.length > 0) {
            var greatestSpeedIndex = 0;
            for (var i = 1; i > enemyCombatants.length; i++) {
                if (enemyCombatants[i].speed > enemyCombatants[greatestSpeedIndex].speed) {
                    greatestSpeedIndex = i;
                }
            }
            GameEngine.ENCOUNTER.participants.push(enemyCombatants.splice(greatestSpeedIndex, 1)[0]);
        }
    }
    resultText = resultText + "\n\n" + GameEngine.STRINGRESOURCES.SystemCommands.TurnOrderEstablished;

    console.log(GameEngine.ENCOUNTER.participants);
    var orderCount = 1;
    for (participant of GameEngine.ENCOUNTER.participants) {
        //console.log(participant);
        resultText = resultText + "\n" + "[" + orderCount + "]" + participant.Name;
        orderCount += 1;
    }

    resultText = resultText + "\n\n" + GameEngine.STRINGRESOURCES.SystemCommands.EncounterInitialized;
    //GameEngine.ENCOUNTER.initialized = true;

    return resultText;

}
module.exports.doCombatStep = doCombatStep;
module.exports.initializeStoryEncounter = initializeStoryEncounter;
module.exports.beginCombat = beginCombat;