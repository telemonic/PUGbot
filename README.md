# PUGbot - by Telemonic

A discord bot for running L4D2 pugs using node.js

# Installation

Extract the folder and and run main.js by using "node main.js"

## Dependencies

Node.js

## Commands

Admin Commands:

- createpug: *opens up the PUG for users to add. Must have the "Pug Admin" role to use.*

- forceadd: *forcibly adds a user to the current PUG.*

- kick: *Kicks a user from the PUG.*

- start: *Starts the PUG once the player cap is reached.*

- captains: *Declares the two team captains for the PUG (Usage: captains @captain1 @captain2)*

- maxplayers: *Changes the max players to the value specified. (Warning: Will reset current PUG)*

- endpug: ends the current PUG.

  

Player Commands:

- add: *Adds you to the current PUG.*

- remove: *Removes you from the current PUG.*

- vote: *Submits your vote for a map once map voting is open (Usage: vote #)*

- pick: *Picks a user for your team, if you are a team captain (Usage: pick #)*

- side: *Picks either infected or survivor start if you are prompted.*

- help: *Prints this message.*

## Customization

You can edit the prefix and map list in the config.json. Make sure you upload a .png image with a matching name into the /images folder. 
ex: 
	Map name: Dark Carnival
	images/Dark Carnival.png
