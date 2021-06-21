const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

var playerArray = [8];
var playerArrayNames = [8];
var isPugOpen = false;
var numOfPlayers = 0;
var isPugStarted = false;

var survivorArray = [4];
var infectedArray = [4];

var numOfSurvivors = 0;
var numOfInfected = 0;



client.on('message', message => {

	let addedRole = message.guild.roles.cache.find(role => role.name === "Added");
	let survivorRole = message.guild.roles.cache.find(role => role.name === "Survivor Start");
	let infectedRole = message.guild.roles.cache.find(role => role.name === "Infected Start");

	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'createpug' || command === 'cp') {
		if(message.member.roles.cache.some(role => role.name === 'Pug Admin')){
			if(isPugOpen){
				message.channel.send(`A pug is already open! use !add to add to the current pug`);
			} else {
				isPugOpen = true;
				message.channel.send(`PUG has been opened by: <@${message.author.id}>. Use !add to join!`);
			}
		}
	} else if (command === 'add') {
		if(isPugOpen){
			if(numOfPlayers < 8){
				var added = false; 
				for(var i = 0; i < 8; i++){
					if(message.author.id === playerArray[i]){
						added = true; //UNCOMMENT WHEN WANT AUTHENTICATION
						message.channel.send(`You are already added to the current pug <@${message.author.id}>!`)
					}

				}
				if(added == false){
					numOfPlayers++;
					message.channel.send(`<@${message.author.id}> has added to the pug: (${numOfPlayers} / 8)`);
					message.member.roles.add(addedRole);
					playerArray[numOfPlayers-1] = message.author.id;
					playerArrayNames[numOfPlayers-1] = message.author.username;
					
					if(numOfPlayers === 8){
						isPugStarted = true;
						message.channel.send(`The pug has reached 8 players and will start shortly! \n <@${playerArray[0]}> \n <@${playerArray[1]}> \n <@${playerArray[2]}> \n <@${playerArray[3]}> \n <@${playerArray[4]}> \n <@${playerArray[5]}> \n <@${playerArray[6]}> \n <@${playerArray[7]}>`);
						for(var i = 0; i < 8;i++){
							client.users.cache.get(playerArray[i]).send("Your L4D2 PUG is ready!");
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
		var list = "";
		for(var i = 0; i < 8; i++){
			if(playerArray[i] != null && playerArray[i] != ""){
				list += (`${i+1}) ${playerArrayNames[i]}`);
				list += "\n";
			}
		}
		message.channel.send(list);
	}
	else if (command === 'test') {
		if(message.member.roles.cache.some(role => role.name === 'Captain')){
			message.channel.send("Has Captain role");
		}else{
			message.channel.send("Does not have Captain role");
		}
	}
	else if (command === "infected") {
		if(isPugStarted){
			if(message.member.roles.cache.some(role => role.name === 'Added')){
				if ( !( (message.member.roles.cache.some(role => role.name === 'Infected Start') || (message.member.roles.cache.some(role => role.name === 'Survivor Start'))))){
					message.member.roles.add(infectedRole);
					numOfInfected++;
					console.log(numOfInfected);
					infectedArray[numOfInfected-1] = message.author.id;
					if (numOfSurvivors + numOfInfected == 8) {
						var match = "";
						match += `<@${survivorArray[0]}> / <@${survivorArray[1]}> / <@${survivorArray[2]}> / <@${survivorArray[3]}> \n vs \n <@${infectedArray[0]}> / <@${infectedArray[1]}> / <@${infectedArray[2]}> / <@${infectedArray[3]}>`
						message.channel.send(match);
					}
				}
			}
		}else{
			message.channel.send(`The pug has not started yet! <@${message.author.id}>`);
		}
	}
	else if (command === "survivor") {
		if(isPugStarted){
			if(message.member.roles.cache.some(role => role.name === 'Added')){
				if ( !( (message.member.roles.cache.some(role => role.name === 'Survivor Start') || (message.member.roles.cache.some(role => role.name === 'Survivor Start'))))){
					message.member.roles.add(survivorRole);
					numOfSurvivors++;
					console.log(numOfSurvivors);
					survivorArray[numOfSurvivors-1] = message.author.id;

					if (numOfSurvivors + numOfInfected == 8) {
						var match = "";
						match += `Match is starting! \n <:survivors:763695264849854485> <@${survivorArray[0]}> / <@${survivorArray[1]}> / <@${survivorArray[2]}> / <@${survivorArray[3]}> \n vs \n <:infected:763695265189855232> <@${infectedArray[0]}> / <@${infectedArray[1]}> / <@${infectedArray[2]}> / <@${infectedArray[3]}>`
						message.channel.send(match);
					}
				}

			}
		}else{
			message.channel.send(`The pug has not started yet! <@${message.author.id}>`);
		}
	}
	else if (command === "repick") {
		for(var i = 0; i < 8; i++){
			survivorArray[i] = "";
			infectedArray[i] = "";
			numOfSurvivors = 0;
			numOfInfected = 0;
		}
	}
	else if (command === "shuffle") {
		var tempArray = [8];
		for(var i = 0; i < 8; i++){
			tempArray[i] = playerArray[i];
		}
		var shuffledArray = [8];
		shuffledArray = shuffle(tempArray);
		
		for(var i = 0; i < 4; i++){
			survivorArray[i] = shuffledArray[i];
			infectedArray[i] = shuffledArray[i]+4;
		}

		var match = "";
		match += `Teams have been shuffled: use !confirm to start the pug or !shuffle to shuffle teams again. \n <:survivors:763695264849854485> <@${survivorArray[0]}> / <@${survivorArray[1]}> / <@${survivorArray[2]}> / <@${survivorArray[3]}> \n vs \n <:infected:763695265189855232> <@${infectedArray[0]}> / <@${infectedArray[1]}> / <@${infectedArray[2]}> / <@${infectedArray[3]}>`
		message.channel.send(match);

	}
	else if(command === "remove"){
		var index;
		numOfPlayers--;
		if(message.member.roles.cache.some(role => role.name === 'Added')){
			for(var i = 0; i <8; i++){
				if(playerArray[i] == message.author.id){
					index = i;
				}
			}
			for(var x = index; x<6; x++){	
				playerArray[x] = playerArray[x+1];
			}
		}
	}
	else if(command === "endpug"){
		for(var i = 0; i < 8; i++){
			playerArray[i] = "";
			playerArrayNames[i] = "";
			survivorArray[i] = "";
			infectedArray[i] = "";
			numOfPlayers = 0;
			numOfSurvivors = 0;
			numOfInfected = 0;
			isPugOpen = false;
			isPugStarted = false;
		}
		message.channel.send("The pug has been ended.");
	}
	else if(command === "addbot"){
		playerArray[numOfPlayers] = `${Math.floor(Math.random() * 100)}` ;
		numOfPlayers++;
	}
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;
	  
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
	  
		  // Pick a remaining element...
		  randomIndex = Math.floor(Math.random() * currentIndex);
		  currentIndex -= 1;
	  
		  // And swap it with the current element.
		  temporaryValue = array[currentIndex];
		  array[currentIndex] = array[randomIndex];
		  array[randomIndex] = temporaryValue;
		}
	  
		return array;
	  }
});

client.login(token);