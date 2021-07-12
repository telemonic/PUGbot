const Discord = require('discord.js');
const config = require('./config.json');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();

//debug mode
globalDebug = true; //Prints otuput to console

//Variables
var maxPlayers = config.maxplayers; //Total Max Players (i.e. 8 players means 4 vs 4)
var playerCount = 0; //Current player count
var mapsVoteCount = 0; //tracks amount of Votes for map voting
var selectedMap = "";
var lastMessage; //holder variable for importing message object into functions
var captain1; //Captain 1
var c1PickCount = 0; //Number of players picked by captain 1
var captain2; //Captain 2
var c2PickCount = 0; //Number of players picked by captain 2
var c1Array = [maxPlayers/2] // Array of players for team captain 1
var c2Array = [maxPlayers/2] // Array of players for team captain 2
var survivorArray = []; //array for survivors
var infectedArray = []; //array for infected
var currentlyPicking = ""; //holds currently picking players discord ID
var adminRole = config.adminID; //ID for admin role
var lobbyID = config.lobbyID; //ID for lobby VC
var serverIP = config.defaultServerID; //default server ip from config
var mapTimer; // Timer object to end voting automatically after value specified in mapVoteTime
var mapVoteTime = config.mapVoteTime * 1000; //time before voting automatically ends (in ms)
var pugChannelID = config.pugChannelID; //ID for the pug channel (channel bot commands are locked to

//Arrays
playerArray = [maxPlayers]; //initializes playerArray
mapsArray = config.maps; //sets mapsArray to the maps defined in config.json
mapVotingArrayPlayers = [maxPlayers]; //Array that stores if the player has voted
mapVotingArrayMaps = [mapsArray.length]; //Array that stores votes for maps

//Phases
phasePugOpen = false; //Pug is open for adding
phaseMapVote = false; //Map voting phase
phaseCaptainPick = false; //Pick captains
phasePlayerPick = false; //Pick players
phaseSidePick = false; //picks starting side
phasePugStart = false; //starts pug

client.once('ready', () => {
    console.log('---------------------');
	console.log('PUGbot - by Telemonic');
    console.log('---------------------');
});

client.on('message', message => {

	//azure is an idiot
	if (message.author.id === '72559613681078272') {
		message.react('862066693978587216');
	}

    if (!message.content.startsWith(prefix) || message.author.bot) return; //checks for prefix

	if (message.channel instanceof Discord.DMChannel) return; //Ignores DMs

    if (message.channel.id != pugChannelID) return; //Ignores Messages from other channels.

    cPrint("Command was recieved by " + message.author.username + ": " + message.content); //prints output to console

    //splices message content
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

    //COMMANDS

    //create pug command
    if (command === 'createpug' || command === 'cp') {
        if(checkAdmin(message)){
            if(phasePugOpen == false){
                phasePugOpen = true;
                message.channel.send("PUG has been opened by " + pingUser(message.author.id) + ". Do !add to join!");
				client.user.setActivity(`L4D2 PUGs - (${playerCount}` + "/"+ `${maxPlayers}) !add`);
            }else{
                message.channel.send("There is already a PUG open!");
            }
        }else{
            message.channel.send("Insufficient Permissions.");
        }
    }
    //add up to pug command
    else if (command === 'add'){
        addPlayer(message, message.author.id);
    }
    else if(command == 'test'){

    }
    //force adds a user (!forceadd @user)
    else if (command === 'forceadd' || command === 'f'){
        if(checkAdmin(message)){
            if(args.length){
                addPlayer(message, trimID(args[0]));
            }
        }else{
            message.channel.send("Insufficient Permissions.");
        }
    }
    //removes message sender
    else if(command === 'remove'){
        removePlayer(message, message.author.id);
    }
    //kicks a user (!kick @user)
    else if(command === 'kick'){
        if(args.length){
            if(checkAdmin(message)){
                removePlayer(message, trimID(args[0]));
            }
        }else{
            message.channel.send("Invalid syntax.")
        }
    }
    //starts pug once max players is reached (admins only)
    else if(command === 'start'){
        if(checkAdmin(message)){
            if(playerCount == maxPlayers){
                phaseMapVote = true;
                phasePugOpen = false;
                
                dmPlayers(playerArray, message);

                mapTimer = setTimeout(function(){getMap(message); }, mapVoteTime); //timer to auto end voting 
                mapVoteQuarter = mapVoteTime/4;

                message.channel.send(mapVoteTime/4000 + " seconds remaining.");
                timer75 = setTimeout(function(){message.channel.send(mapVoteTime/4000*3 + " seconds remaining."); }, mapVoteQuarter);
                timer50 = setTimeout(function(){message.channel.send(mapVoteTime/4000*2 + " seconds remaining."); }, mapVoteQuarter * 2);
                timer25 = setTimeout(function(){message.channel.send(mapVoteTime/4000*1 + " seconds remaining."); }, mapVoteQuarter * 3);

                for(var i = 0; i < mapsArray.length; i++){
                    mapVotingArrayMaps[i] = 0;
                }

                lastMessage = message;
                printMaps();
            }
        }
    }
    //map voting command
    else if (command === 'vote'){
        voteMap(message, args[0]);
    }
    else if (command === 'endvoting'){
        if(phaseMapVote == true){
            if(checkAdmin(message)){
                getMap(message);
            }
        }
    }
    //captain delcare command
    else if(command === 'captains'){
        if(checkAdmin(message)){
            if(args.length){
                if(args.length == 2){
                    if(checkAdded(trimID(args[0]), playerArray) && checkAdded(trimID(args[1]), playerArray)){
                        pickCaptain(message, args[0], args[1]);
                    }
                }
            }
        }else{
            message.channel.send("Insufficient Permissions.");
        }
    }
    else if (command === 'pick'){
        if(phasePlayerPick){
            if(checkPicker(message)){
                if(args.length){
                    if(checkAdded(getPickedUser(args[0]), playerArray)){
                        pickPlayer(message, getPickedUser(args[0]));
                        updateCurrentPick();
                        if(c1PickCount + c2PickCount == maxPlayers){
                            phasePlayerPick = false;
                            phaseSidePick = true;
                        }

                    }else{
                        message.channel.send("Error selecting user, please try again.");
                    }
                }else{
                    message.channel.send("Inavlid syntax, please do !pick #");
                }
            }else{
                message.channel.send("You are not currently picking!");
            }
        }else{
            message.channel.send("It is currently not pick phase.");
        }
    
    }
    else if (command === 'side'){
        if(args.length){
            if(message.author.id == captain2){
                if(args[0] == 'infected' || args[0] == 'survivor'){
                    if(args[0] == 'infected'){
                        infectedArray = c2Array;
                        survivorArray = c1Array;
                    }else{
                        survivorArray = c2Array;
                        infectedArray = c1Array;
                    }
                    phaseSidePick = false;
                    phasePugStart = true;
                }   
            }
        }
    }
    else if (command === 'server'){
        if(checkAdmin(message)){
            if(args.length){
                serverIP = args[0];
                message.channel.send("Server IP has been changed to: " + args[0]);
            }
        }else{
            message.channel.send ("Insifficient Permissions.");
        }
    }
    else if (command === 'help'){
        printHelp(message);
    }
    else if (command === 'maxplayers'){
        if(checkAdmin(message)){
            if(args.length){
                if(Number.isInteger(parseInt(args[0]))){
                    resetPUG();
                    maxPlayers = args[0];
                    message.channel.send("Max players has been changed to " + maxPlayers + ".");
                }else{
                    message.channel.send("Please enter a valid integer.");
                }
            }
        }
    }
	else if (command === 'endpug'){
        if(checkAdmin(message)){
            resetPUG();
            message.channel.send("PUG has been ended.");
	    }
    }   
    //checks if pug is filled
    if(phasePugOpen == true){
        if (playerCount == maxPlayers){
            message.channel.send(pingRole(adminRole) + "The PUG has reached " + playerCount + " / " + maxPlayers + " players and is ready to !start");
        }
    }else if(phaseMapVote == true){
        if(mapsVoteCount == maxPlayers){
            getMap(message);
        }
    //checks for captain pick phase
    }if(phaseCaptainPick == true){
        message.channel.send(pingRole(adminRole) + " Declare two captains by doing !captains @Captain1 @Captain2");
    }
    if(phasePlayerPick == true){
        printPickPhase(message);
    }
    if(phaseSidePick){
        message.channel.send(pingUser(captain2) + ", please declare a side by doing !side infected/survivor");
    }
    if(phasePugStart){
        printMatch(message);
        phasePugStart = false;
        resetPUG();
    }
});

//functions
function cPrint(msg){
	if(globalDebug == true){
		console.log(msg);
	}
}
function checkAdded(user, array){
    if(array.length > 0){
        for(var i = 0; i < array.length; i++){
            if(user === array[i]){
                return true;
            }	
        }	
        return false;
    }
}
function getIndex(user, array){
    if(array.length > 0){
        for(var i = 0; i < array.length; i++){
            if(user == array[i]){
                return i;
            }
        }
    }   
}
function trimID(id){
	return id.slice(3,id.length-1);
}
function pingUser(id){
	return "<@"+id+">";
}
function pingRole(id){
	return "<@&"+id+">";
}
function getUsername(userID){
	var cut = userID;
	var cutuser = client.users.cache.find(user => user.id === cut);
	username = cutuser.username;
	return username;
}
function checkAdmin(message){
    if(message.member.roles.cache.some(role => role.id === adminRole)){
        return true;
    }else{
        return false;
    }
}
function getList(array){
	var list = "";
    if(array.length > 0){
        for(var i = 0; i < array.length; i++){
            if(array[i] != null && array[i] != ""){
    
                list += (pingUser(array[i]));
                list += "\n";
            }
        }
        if(list.length == 0){
                list += " ";
        }
        return list;
    }
}
function getListNum(array){
	var list = "";
    if(array.length > 0){
        for(var i = 0; i < array.length; i++){
            if(array[i] != null && array[i] != ""){
    
                list += (`${i+1}) ${pingUser(array[i])}`);
                list += "\n";
            }
        }
        if(list.length == 0){
                list += " ";
        }
        return list;
    }
}
function addPlayer(message, id){
    if(phasePugOpen){
        if(!(checkAdded(id, playerArray))){
            if(playerCount < maxPlayers){
                playerArray[playerCount] = id;
                playerCount++;

                const embed = new Discord.MessageEmbed()
                .setTitle(getUsername(id) + " has added to the PUG: (" + playerCount + " / " + maxPlayers + ")")
                .setColor('#DAF7A6')
                .setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(id).user.avatarURL())
                .addFields(
                    {name: 'Currently added players:',
                    value:getListNum(playerArray)})
                message.channel.send(embed);
				client.user.setActivity(`L4D2 PUGs - (${playerCount}` + "/"+ `${maxPlayers}) !add`); 
            }else{
                message.channel.send("The PUG is currently full.");
            }
        }else{
            message.channel.send(pingUser(id) + " is already added to the current PUG.");
        }
    }else{
        message.channel.send("There are currently no PUGs open.");
    }
}
function removePlayer(message, id){
    if(checkAdded(id, playerArray)){
        if(phasePugOpen){
            playerArray.splice(getIndex(id, playerArray), 1);
            playerArray.push();
            playerCount--;

            const embed = new Discord.MessageEmbed()
            .setTitle(getUsername(id) + " has removed from the PUG: (" + playerCount + " / " + maxPlayers + ")")
            .setColor('#DAF7A6')
            .setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(id).user.avatarURL())
            .addFields(
                {name: 'Currently added players:',
                value:getListNum(playerArray)})
            message.channel.send(embed);
			client.user.setActivity(`L4D2 PUGs - (${playerCount}` + "/"+ `${maxPlayers}) !add`); 
        }else{
            message.channel.send("You cannot remove at this time.");
        }
    }else{
        message.channel.send(pingUser(id) + " is not added the the current PUG.");
    }
}
function printMaps(message){
    var mapsList = "";

    for(var i = 0; i < mapsArray.length; i++){
        mapsList += `${i+1}) ${mapsArray[i]} \n`;
    }

    const embed = new Discord.MessageEmbed()

    .setTitle('Map Voting - Do !vote #')
    .setColor('#DAF7A6')
    .addFields(
        {name: 'Available maps:',
        value:`${mapsList}`})
    lastMessage.channel.send(embed);	
}
function printMapsMessage(message, voteArray){
    var mapsList = "";
    var bold = "";

    for(var i = 0; i < mapsArray.length; i++){
        if(mapsArray[i] == selectedMap){
            bold = "*";
        }
        mapsList += `${bold}${i+1}) ${mapsArray[i]}: ${voteArray[i]} votes${bold}\n`;
        bold = "";
    }	
    return mapsList;
}
function voteMap(message, vote){

    if(checkAdded(message.author.id, playerArray)){
        if(!(checkAdded(message.author.id, mapVotingArrayPlayers))){
            if(vote.length){
                if(!(Number.isInteger(vote))){
                    if(vote >= 1 && vote <= mapsArray.length){
                        //adds vote # to the array
                        mapVotingArrayMaps[vote-1]++;
                        mapsVoteCount++;
                        
                        //adds player to the array to stop dupe voting (Validate Vote)
                        mapVotingArrayPlayers[mapsVoteCount] = message.author.id;

                    }   
                }else{
                    message.channel.send("Please enter a number between 1 and " + mapsArray.length);
                }
            }else{
                message.channel.send("Invalid Syntax - Do !vote #")
            }
        }else{
            message.channel.send(pingUser(message.author.id) + "You have already voted.");
        }
    }else{
        message.channel.send(pingUser(message.author.id) + " You are not added to the current PUG.")
    }
}
function getMap(message){
    var max = 0;
    var maxIndex = 0;
    var mapsList = printMapsMessage(message, mapVotingArrayMaps);

    clearTimeout(mapTimer);
    clearTimeout(timer75);
    clearTimeout(timer50);
    clearTimeout(timer25);

    for(var i = 0; i < mapsArray.length; i++){
        if(mapVotingArrayMaps[i] > max){
            max = mapVotingArrayMaps[i];
            maxIndex = i;
        }
    }

    selectedMap = mapsArray[maxIndex];
    mapIMG = mapsArray[maxIndex];
    mapIMG = replaceMap(mapIMG)
    const embed = new Discord.MessageEmbed()

    .setTitle('Map Voting - ' + mapsArray[maxIndex] + " won with " + mapVotingArrayMaps[maxIndex] + " / " + mapsVoteCount + " votes")
    .setColor('#DAF7A6')
    .attachFiles([`./images/${mapIMG}.png`])
    .setThumbnail(`attachment://${mapIMG}.png`)
    .addFields(
        {name: 'Voting Results:',
        value:`${mapsList}`})
    message.channel.send(embed);
    
    phaseMapVote = false;

    phaseCaptainPick = true;
}
function pickCaptain(message, c1, c2){
    if(checkAdmin(message)){
        if(phaseCaptainPick){
            captain1 = trimID(c1);
            captain2 = trimID(c2);

            currentlyPicking = captain1;

            phaseCaptainPick = false;
            phasePlayerPick = true;

            //adds captain 1 to their team
            c1Array[c1PickCount] = captain1;
            c1PickCount++;
            playerArray.splice(getIndex(captain1, playerArray), 1);

            //adds captain 2 to their team
            c2Array[c2PickCount] = captain2;
            c2PickCount++;
            playerArray.splice(getIndex(captain2, playerArray), 1);
        }
    }
}
function checkPicker(message){
    if(message.author.id == currentlyPicking){
        return true;
    }else{
        return false;
    }
}
function updateCurrentPick(){
    if(c1PickCount > c2PickCount){
        currentlyPicking = captain2;
    }else if(c1PickCount < c2PickCount){
        currentlyPicking = captain1;
    }
}
function printPickPhase(message){
    const embed = new Discord.MessageEmbed()
        
    .setTitle(`Currently Picking: ${getUsername(currentlyPicking)}`)
    .setColor('#DAF7A6')
    .setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(currentlyPicking).user.avatarURL())
    .addFields(
    {name: 'Currently Available Players (!pick #)',
    value:`${getListNum(playerArray)}`})

    message.channel.send(embed);
}
function pickPlayer(message, pickedUser){
    if(message.author.id == captain1){
        c1Array[c1PickCount] = pickedUser;
        playerArray.splice(getIndex(pickedUser, playerArray), 1);
        c1PickCount++;
    }else if(message.author.id == captain2){
        c2Array[c2PickCount] = pickedUser;
        playerArray.splice(getIndex(pickedUser, playerArray), 1);
        c2PickCount++;
    }
}
function getPickedUser(index){
    return playerArray[index - 1];
}
function printMatch(message){

    var date = getDate();

    const embed = new Discord.MessageEmbed()
        
    .setTitle("PUG - " + selectedMap)
    .setColor('#DAF7A6')
    .attachFiles([`./images/${replaceMap(selectedMap)}.png`])
    .setFooter("             " + date)
    .setThumbnail(`attachment://${replaceMap(selectedMap)}.png`)
    .addFields(
		{name: 'Survivor',
		value:`${getList(survivorArray)}`,
		inline: true},
		{name: 'Infected',
		value:`${getList(infectedArray)}`,
		inline: true},
		{name: 'Connect Info:',
		value:'steam://connect/'+serverIP,
		inline: false})

    message.channel.send(embed);
}
function resetPUG(){
        //Variables
    playerCount = 0; //Current player count
    mapsVoteCount = 0; //tracks amount of Votes for map voting
    selectedMap = "";
    lastMessage; //holder variable for importing message object into functions
    captain1 = ""; //Captain 1
    c1PickCount = 0; //Number of players picked by captain 1
    captain2 = ""; //Captain 2
    c2PickCount = 0; //Number of players picked by captain 2
    c1Array = [maxPlayers/2] // Array of players for team captain 1
    c2Array = [maxPlayers/2] // Array of players for team captain 2
    survivorArray = [];
    infectedArray = [];
    currentlyPicking = "";

    //Arrays
    playerArray = [maxPlayers]; //initializes playerArray
    mapsArray = config.maps; //sets mapsArray to the maps defined in config.json
    mapVotingArrayPlayers = [maxPlayers]; //Array that stores if the player has voted
    mapVotingArrayMaps = [mapsArray.length]; //Array that stores votes for maps

    //Phases
    phasePugOpen = false; //Pug is open for adding
    phaseMapVote = false; //Map voting phase
    phaseCaptainPick = false; //Pick captains
    phasePlayerPick = false; //Pick players
    phaseSidePick = false; //picks starting side
    phasePugStart = false; //starts pug
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
function printHelp(message){
    client.users.fetch(message.author.id, false).then((user) => {
        user.send(`**PUGBot v2.0 - By Telemonic**
        
Admin Commands: 
    - ${prefix}createpug: *opens up the PUG for users to add. Must have the "Pug Admin" role to use.*
    - ${prefix}forceadd: *forcibly adds a user to the current PUG.*
    - ${prefix}kick: *Kicks a user from the PUG.*
    - ${prefix}start: *Starts the PUG once the player cap is reached.*
    - ${prefix}captains: *Declares the two team captains for the PUG (Usage: captains @captain1 @captain2)*
    - ${prefix}maxplayers: *Changes the max players to the value specified. (Warning: Will reset current PUG.)*
    - ${prefix}endpug: ends the current PUG.
    - ${prefix}endvoting: *Ends the voting early and uses the current votes*

Player Commands:
    - ${prefix}add: *Adds you to the current PUG.*
    - ${prefix}remove: *Removes you from the current PUG.*
    - ${prefix}vote: *Submits your vote for a map once map voting is open (Usage: vote #)*
    - ${prefix}pick: *Picks a user for your team, if you are a team captain (Usage: pick #)*
    - ${prefix}side: *Picks either infected or survivor start if you are prompted.*
    - ${prefix}help: *Prints this message.*
    
        
Github link: *https://github.com/telemonic/PUGbot*
        `);
       });
}
function shuffle(array) {
    var currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
}
function pingChannel(channel){
    return "<#"+channel+">";
}
function replaceMap(map){
    return map.replace(/\s+/g, '');
}
function dmPlayers(array, message){
    for(var i = 0; i < maxPlayers; i++){
        client.users.fetch(array[i], false).then((user) => {
            user.send(dmPlayersMessage(message));
        });
    }
}
function getDate(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}
function dmPlayersMessage(message){
    const embed = new Discord.MessageEmbed()
    .setTitle("The PUG has filled! (" + playerCount + " / " + maxPlayers + ")")
    .setColor('#DAF7A6')
    .addFields(
        {name: 'Connect here:',
        value:pingChannel(lobbyID)},
        {name: 'Players:',
        value:getList(playerArray)}
        )
    return embed;
}


client.login(token);



