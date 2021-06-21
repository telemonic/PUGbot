const Discord = require('discord.js');
const config = require('./config.json');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

var maxPlayers = 4;

var playerArray = [maxPlayers];
var isPugOpen = false;
var numOfPlayers = 0;
var isPugStarted = false;

var captain1Array = [4];
var c1Picks = 1;
var captain2Array = [4];
var c2Picks = 1;

var survivorArray = [4];
var infectedArray = [4];

var numOfSurvivors = 0;
var numOfInfected = 0;

var mapsArray = config.maps;

var mapVotingArray = [mapsArray.length];
var numOfVotes = 0;
var highVote = 0;
var mapIndex = 0;
var map = "";

var numOfCaptains = 0;
var captainArray = [2];
var pickPhase = false;

var currentlyPicking = "";
var pickArray = [];
var pickCount = 2;
var playersLeft = maxPlayers;

var firstPick = true;
var firstPickPlayer = "";

var voteArray = [maxPlayers];

var lobbyID = "765382604156960778";
var survivorID = "756417075932823554";
var infectedID = "756417096619130890";

var pugOpener;

var globalDebug = true;

console.log('init variables loaded');

client.on('message', message => {

	//role stuff
	let adminRole = message.guild.roles.cache.find(role => role.name === "Pug Admin");
	// let survivorRole = message.guild.roles.cache.find(role => role.name === "Survivor Start");
	// let infectedRole = message.guild.roles.cache.find(role => role.name === "Infected Start");

	//handles command ignoring
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	cPrint("Command was recieved by " + message.author.username + ": " + message.content);

	//splices message content
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'createpug' || command === 'cp') {
		if(message.member.roles.cache.some(role => role.name === 'Pug Admin') || message.member.roles.cache.some(role => role.name === 'Server Admin')){
			if(isPugOpen){
				message.channel.send(`A pug is already open! use !add to add to the current pug`);
			} else {
				isPugOpen = true;
				message.channel.send(`PUG has been opened by: ${pingUser(message.author.id)}. Use !add to join!`);
				client.user.setActivity(`L4D2 PUGs - (${numOfPlayers}` + "/"+ `${maxPlayers}) !add`); 
				cPrint("Pug was opened by:" + message.author.username);
				pugOpener = message.author.id;
			}
		}
	}
	else if (command === 'test') {
		message.member.voice.setChannel("853437613766606849").catch(err => message.channel.send("get ur ass in voice"));
	}
	else if (command === 'maps') {
		if(args[0] == 'add' ){
			if(message.member.roles.cache.some(role => role.name === 'Pug Admin') || message.member.roles.cache.some(role => role.name === 'Server Admin')){
				var argMsg = "";

				for(var i = 1; i < args.length; i++){
					argMsg += args[i];
					argMsg += " ";
				}
				config.maps[config.maps.length] =`${argMsg}`;
			}else{
				message.channel.send(`Insufficient Permissions ${pingUser(message.author.id)}`)
			}
		}
		if(args[0] == 'list' ){
			var msg = "";

			for(var i = 0; i < mapsArray.length; i++){
				msg += `${i+1}) ${mapsArray[i]} \n`;
			}

			const embed = new Discord.MessageEmbed()
			.setTitle('!maps')
			.setColor('#DAF7A6')
			.addFields(
				{name: 'Available maps:',
				value:`${msg}`}
			)
				message.channel.send(embed);	
		}
	}else if (command === 'forceadd') {
		if(isPugOpen){
			if(numOfPlayers < maxPlayers){
				var target = args[0];
				target = target.slice(3,target.length-1);

				numOfPlayers++;
				playerArray[numOfPlayers-1] = target;

				const embed = new Discord.MessageEmbed()
				.setTitle(getUsername(target) + " has added to the PUG: (" + numOfPlayers + " / " + maxPlayers + ")")
				.setColor('#DAF7A6')
				.setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(target).user.avatarURL())
				.addFields(
					{name: 'Currently added players:',
					value:getList(playerArray)}
				)
				message.channel.send(embed);

				client.user.setActivity(`L4D2 PUGs - (${numOfPlayers}` + "/"+ `${maxPlayers}) !add`);

				if(numOfPlayers === maxPlayers){

					message.channel.send(`${pingRole(adminRole)} The PUG has reached ${maxPlayers} players!`)

					list = getList(maxPlayers, playerArray);

					const embed = new Discord.MessageEmbed()
					//IMPLEMENT
					.setTitle(`PUG - Opened by ${getUsername(pugOpener)}`)
					.setColor('#DAF7A6')
					.setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(message.author.id).user.avatarURL())
					.addFields(
						{name: 'Currently added players:',
						value:`${list}`}
					)
					if(numOfPlayers > 0){
						message.channel.send(embed);	
					}

				}	
				
		}else{
			message.channel.send(`The ongoing pug is currently full. please wait for a new one to begin.`);
		}
		}else{
			message.channel.send(`There is currently no pug open. use !createpug to start one!`);
		}
	}
	else if (command === 'add') {
		if(isPugOpen){
			if(numOfPlayers < maxPlayers){

				if(checkAdded(message.author.id, maxPlayers, playerArray)){
					message.channel.send(`You are already added to the current pug ${pingUser(message.author.id)}!`)
				}else{
					numOfPlayers++;

					//message.member.roles.add(addedRole);
					playerArray[numOfPlayers-1] = message.author.id;
					client.user.setActivity(`L4D2 PUGs - (${numOfPlayers}` + "/"+ `${maxPlayers}) !add`); 

					const embed = new Discord.MessageEmbed()
					.setTitle(getUsername(message.author.id) + " has added to the PUG: (" + numOfPlayers + " / " + maxPlayers + ")")
					.setColor('#DAF7A6')
					.setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(message.author.id).user.avatarURL())
					.addFields(
						{name: 'Currently added players:',
						value:getList(playerArray)}
					)
					message.channel.send(embed);	

					if(numOfPlayers === maxPlayers){

						message.channel.send(`${pingRole(adminRole)} The PUG has reached ${maxPlayers} players!`)
	
						list = getList(maxPlayers, playerArray);
	
						const embed = new Discord.MessageEmbed()
						//IMPLEMENT
						.setTitle(`PUG - Opened by ${getUsername(pugOpener)}`)
						.setColor('#DAF7A6')
						.setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(pugOpener).user.avatarURL())
						.addFields(
							{name: 'Currently added players:',
							value:`${list}`}
						)
						if(numOfPlayers > 0){
							message.channel.send(embed);	
						}
	
					}
					
				}
			}else{
				message.channel.send(`The ongoing pug is currently full. please wait for a new one to begin.`);
			}
		}else{
			message.channel.send(`There is currently no pug open. use !createpug to start one!`);
		}
	}
	else if (command === 'list') {
		if(numOfPlayers > 0){
			var list = "";

			for(var i = 0; i < maxPlayers; i++){
				if(playerArray[i] != null && playerArray[i] != ""){
					const User = client.users.cache.get(playerArray[i]); // Getting the user by ID.

					list += (`${i+1}) ${pingUser(playerArray[i])}`);
					list += "\n";
				}
			}
			if(list.length == 0){
					list += " ";
			}

			const embed = new Discord.MessageEmbed()
			.setTitle('!list')
			.setColor('#DAF7A6')
			.addFields(
				{name: 'Currently added players:',
				value:`${list}`}
			)
			if(numOfPlayers > 0){
				message.channel.send(embed);	
			}
		}else{
			message.channel.send("There are currently no players added.")
		}
	}	
	else if (command === 'flip') {
		var flip = Math.floor(Math.random() * 2);
		if(flip == 0){
			message.channel.send("Heads.")
		}else{
			message.channel.send("Tails.")
		}
	}
	else if(command === "kick"){
		if (!args.length) {
			message.channel.send("Invalid syntax, use !kick @user");
		}else{
			//target = targeted user for kicking
			target = trimID(args[0]);
			if(checkAdded(target, maxPlayers, playerArray)){
				index = getIndex(target, maxPlayers, playerArray);

				numOfPlayers--;
				playerArray[index] = "";

				message.channel.send(args[0] + " was kicked by " + pingUser(message.author.id))

				cleanArray(index, maxPlayers, playerArray);
			}
		}
	}
	else if(command === "remove"){
		if(checkAdded(message.author.id, maxPlayers, playerArray)){
			index = getIndex(message.author.id, maxPlayers, playerArray);

			numOfPlayers--;
			playerArray[index] = "";
			
			cleanArray(index, maxPlayers, playerArray)
		}else{
			message.channel.send(`You are not added to the current pug!${pingUser(message.author.id)}`)
		}
	}
	else if(command === "start"){
		if(message.member.roles.cache.some(role => role.name === 'Pug Admin') || message.member.roles.cache.some(role => role.name === 'Server Admin')){
			//checks if pug is ready to start and if it is starts pug
			if(numOfPlayers === maxPlayers){
				isPugStarted = true;
				pickArray = playerArray;
				var msg = "";
				msg += `The PUG is now starting! Please join <#${lobbyID}>`;
				for(var i = 0; i < maxPlayers; i++){
					msg += `\n${pingUser(playerArray[i])}`;
				}
				message.channel.send(msg);
				//for(var i = 0; i < ${maxPlayers};i++){
					//Dms users 
					//client.users.cache.get(playerArray[i]).send("Your L4D2 PUG is ready!");
				//}

				
				client.user.setActivity(`L4D2 PUGs - Currently Picking Map !vote #`); 
				var mapsMessage = "";

				for(var i = 0; i < mapsArray.length; i++){
					mapsMessage += `${i+1}) ${mapsArray[i]} \n`;
				}

				const embed = new Discord.MessageEmbed()
				.setTitle('Map Voting - Do !vote #')
				.setColor('#DAF7A6')
				.addFields(
					{name: 'Available maps:',
					value:`${mapsMessage}`}
				)
					message.channel.send(embed);

				for(var i = 0; i < mapsArray.length; i++){
					mapVotingArray[i] = 0;

				}

			}else{
				message.channel.send(`Required amount of players (${maxPlayers}) has not been reached yet!`);
			}
		}
	}
	else if(command === "vote"){
		if (!args.length) {
			message.channel.send("Please vote for a map!");
			
		}else{
			if(isPugStarted){
				if(checkAdded(message.author.id, maxPlayers, playerArray)){
					if(!(checkAdded(message.author.id, maxPlayers, voteArray))){
						if(args[0] >= 1 && args[0] <= config.maps.length){
							mapVotingArray[args[0]-1]++;
							//vote validation
							//voteArray[numOfVotes] = message.author.id;
							numOfVotes++;
						}
						for(var i = 0; i < config.maps.length; i++){
						}
					}else{
						message.channel.send(`You have already voted! ${pingUser(message.author.id)}`)
					}
				
				}else{
					message.channel.send(`You are not added to the current pug ${pingUser(message.author.id)}, you cannot vote for the map!`)
				}
			}else{
				message.channel.send("Pug is not open yet for map voting!");
			}	
		}
		if(numOfVotes == maxPlayers){

			for(var i = 0; i < mapVotingArray.length; i++){
				if(mapVotingArray[i] > highVote){
					highVote = mapVotingArray[i];
					mapIndex = i;
				}
			}
			message.channel.send(`${mapsArray[mapIndex]} won with ${mapVotingArray[mapIndex]} / ${numOfVotes} of the votes!`);
			message.channel.send(`Time to pick teams! Admins, please declare 2 captains by using !captain @User`);
			map = mapsArray[mapIndex];
		}
	}
	else if(command == "captain"){
		if(message.member.roles.cache.some(role => role.name === 'Pug Admin') || message.member.roles.cache.some(role => role.name === 'Server Admin')){
			
			//console.log("got command");
			if (!args.length) {
				message.channel.send("Invalid syntax, use !captain @User");
			}else{
				var target = args[0];
				var playerList = "";

				captainArray[numOfCaptains] = target;
				numOfCaptains++;
				//console.log(numOfCaptains);

				if(numOfCaptains == 2){
					message.channel.send(`Captains are ${captainArray[0]} and ${captainArray[1]}`);

					for(var i = 0; i < maxPlayers; i++){
						//console.log("I RAN THIS FOR LOOP")
						var compare = `<@!${pickArray[i]}>`;
						if(compare == captainArray[0]){
							captain1Array[0] = pickArray[i];
							pickArray[i] = "";
							//console.log("I RAN THIS CODE")
						}
						if(compare == captainArray[1]){
							captain2Array[0] = pickArray[i];
							pickArray[i] = "";
							//console.log("I RAN THIS CODE 2")
						}
					}

					var flip = Math.floor(Math.random() * 2);
					if(flip == 0){
						currentlyPicking = captainArray[0];
						firstPickPlayer = captainArray[0];
					}else{
						currentlyPicking = captainArray[1];
						firstPickPlayer = captainArray[1];
					}

					pickPhase = true;

					for(var i = 0; i < playersLeft; i++){
						if(pickArray[i] != ""){
							playerList += `${i+1}) <@${pickArray[i]}> \n`
						}
					}
					var cut = currentlyPicking.slice(3, currentlyPicking.length-1);
					var cutuser = client.users.cache.find(user => user.id === cut);
					username = cutuser.username;

					const embed = new Discord.MessageEmbed()
					.setTitle(`Currently Picking: ${username}`)
					.setColor('#DAF7A6')
					.setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(cut).user.avatarURL())
					.addFields(
					{name: 'Currently Available Players (!pick #)',
					value:`${playerList}`})
					
					message.channel.send(embed);
				}			
			}
		}
	}
	else if(command === "pick"){
		if (!args.length) {
			message.channel.send("Invalid syntax, use !pick #")
		}else{
			var lastArrayLength;
			var target = args[0];
			var playerList = "";
			var messageAuthor = `<@!${message.author.id}>`;
			if(messageAuthor == currentlyPicking){
				if(messageAuthor == captainArray[0]){
					captain1Array[c1Picks] = pickArray[target - 1];
					c1Picks++;
					pickCount++;
					pickArray[target - 1] = "";
					if(c1Picks > c2Picks){
						currentlyPicking = captainArray[1];
					}
				}else{
					captain2Array[c2Picks] = pickArray[target - 1];
					c2Picks++;
					pickCount++;
					pickArray[target - 1] = "";
					if(c2Picks > c1Picks){
						currentlyPicking = captainArray[0];
					}
				}
				

				for(var i = 0; i < playersLeft; i++){
					if(pickArray[i] != ""){
						playerList += `${i+1}) <@${pickArray[i]}> \n`
					}
				}
				if(!(pickCount >= maxPlayers)){
					var cut = currentlyPicking.slice(3, 21);
					var cutuser = client.users.cache.find(user => user.id === cut);
					username = cutuser.username;

					const embed = new Discord.MessageEmbed()
					.setTitle(`Currently Picking: ${username}`)
					.setColor('#DAF7A6')
					.setThumbnail(client.guilds.resolve(message.guild.id).members.resolve(cut).user.avatarURL())
					.addFields(
					{name: 'Currently Available Players (!pick #)',
					value:`${playerList}`})

					message.channel.send(embed);
					
				}
			}else{
				message.channel.send("You are not currently picking!")
			}
			if(pickCount == maxPlayers){
				message.channel.send(`${firstPickPlayer}, please pick side by doing !infected or !survivor.`);
			}
		}
	}
	else if(command === "survivor"){
		var messageAuthor = `<@!${message.author.id}>`;
		var survivorMsg = "";
		var infectedMsg = "";

		if(messageAuthor == firstPickPlayer){
			if(firstPickPlayer == captainArray[0]){
				survivorArray = captain1Array;
				infectedArray = captain2Array;
			}
			if(firstPickPlayer == captainArray[1]){
				survivorArray = captain2Array;
				infectedArray = captain1Array;
			}
		}

		for(var i = 0; i < maxPlayers/2; i++){
			survivorMsg += `<@${survivorArray[i]}>` + '\n';	
			infectedMsg += `<@${infectedArray[i]}> ` + '\n';
		}
		
		var currentdate = new Date(); 
		var date = (currentdate.getMonth()+1) + "/"
                +  currentdate.getDate() + "/" 
                + currentdate.getFullYear();

		mapIMG = map;
		mapIMG = mapIMG.replace(/\s+/g, '');

		const embed = new Discord.MessageEmbed()
		.setTitle(`PUG - ${map}`)
		.setColor('#DAF7A6')
		.attachFiles([`./images/${mapIMG}.png`])
		.setThumbnail(`attachment://${mapIMG}.png`)
		.setFooter(date)
		.addFields(
		{name: 'Survivor',
		value:`${survivorMsg}`,
		inline: true},
		{name: 'Infected',
		value:`${infectedMsg}`,
		inline: true},
		{name: 'Connect Info:',
		value:'steam://connect/74.91.124.174',
		inline: false})

		message.channel.send(embed);
		client.user.setActivity(`L4D2 PUGs - Currently Playing on ${map}`);
		 
	}
	else if(command === "infected"){
		var messageAuthor = `<@!${message.author.id}>`;
		var survivorMsg = "";
		var infectedMsg = "";

		if(messageAuthor == firstPickPlayer){
			if(firstPickPlayer == captainArray[1]){
				survivorArray = captain1Array;
				infectedArray = captain2Array;
			}
			if(firstPickPlayer == captainArray[0]){
				survivorArray = captain2Array;
				infectedArray = captain1Array;
			}
		}

		for(var i = 0; i < maxPlayers/2; i++){
			survivorMsg += `<@${survivorArray[i]}>` + '\n';	
			infectedMsg += `<@${infectedArray[i]}> ` + '\n';
		}

		var currentdate = new Date(); 
		var date = (currentdate.getMonth()+1) + "/"
                +  currentdate.getDate() + "/" 
                + currentdate.getFullYear();

		mapIMG = map;
		mapIMG = mapIMG.replace(/\s+/g, '');

		const embed = new Discord.MessageEmbed()
		.setTitle(`PUG - ${map}`)
		.setColor('#DAF7A6')
		.attachFiles([`./images/${mapIMG}.png`])
		.setThumbnail(`attachment://${mapIMG}.png`)
		.setFooter(date)
		.addFields(
		{name: 'Survivor',
		value:`${survivorMsg}`,
		inline: true},
		{name: 'Infected',
		value:`${infectedMsg}`,
		inline: true},
		{name: 'Connect Info:',
		value:'steam://connect/74.91.124.174',
		inline: false})

		message.channel.send(embed);
		client.user.setActivity(`L4D2 PUGs - Currently Playing on ${map}`); 
	}
	//ends pug, resets all arrays and such
	else if(command === "end"){
		
		for(var i = 0; i < maxPlayers; i++){
			playerArray[i] = "";
			survivorArray[i] = "";

			infectedArray[i] = "";
			numOfPlayers = 0;
			numOfSurvivors = 0;
			numOfInfected = 0;
			isPugOpen = false;
			isPugStarted = false;
			numOfVotes = 0;
			highVote = 0;
			mapIndex = 0;
			map = "";
			numOfCaptains = 0;
			c1Pick = false;
			c2Pick = false;
			pickCount = 2;
			playersLeft = maxPlayers;
			firstPick = true;
			c1Picks = 1;
			c2Picks = 2;

			playerArray = [maxPlayers];
			isPugOpen = false;
			numOfPlayers = 0;
			isPugStarted = false;
			
			captain1Array = [4];
			c1Picks = 1;
			captain2Array = [4];
			c2Picks = 1;
			
			survivorArray = [4];
			infectedArray = [4];
			
			numOfSurvivors = 0;
			numOfInfected = 0;
			
			mapsArray = config.maps;
			
			mapVotingArray = [mapsArray.length];
			numOfVotes = 0;
			highVote = 0;
			mapIndex = 0;
			map = "";
			
			numOfCaptains = 0;
			captainArray = [2];
			pickPhase = false;
			
			currentlyPicking = "";
			pickArray = [];
			pickCount = 2;
			playersLeft = maxPlayers;
			
			firstPick = true;
			firstPickPlayer = "";
		}
		message.channel.send("The pug has been ended.");
	}

});

function cPrint(msg){
	if(globalDebug == true){
		console.log(msg);
	}
}

function checkAdded(user, size, array){
	for(var i = 0; i < size; i++){
		if(user === array[i]){
			return true;
		}		
	}
	return false;
}
function getIndex(user, size, array){
	for(var i = 0; i < size; i++){
		if(user == array[i]){
			return i;
		}
	}
}
function cleanArray(index, size, array){
	for(var i = index; i < size; i++){
		if(array[i+1] != "" && array[i+1] != null)
			array[i] = array[i+1]
			array[i+1] = "";
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
function getList(array){
	var list = "";

	for(var i = 0; i < maxPlayers; i++){
		if(array[i] != null && array[i] != ""){
			const User = client.users.cache.get(array[i]);

			list += (`${i+1}) ${pingUser(array[i])}`);
			list += "\n";
		}
	}
	if(list.length == 0){
			list += " ";
	}
	return list;
}
client.login(token);

