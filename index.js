const fs = require('node:fs')
const path = require('node:path')
// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds]});

// attach a .commands property to your client instance so that you can access your commands in other files
client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands');
const commandsFolders = fs.readdirSync(foldersPath)

// dynamically retrieve your command files
for (const folder of commandsFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}

    }
}


// *------      ------      ------      ------      ------* //
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


// Client#event:interactionCreate
client.on(Events.InteractionCreate, async interaction => {
    console.log(interaction);
    // BaseInteraction#isChatInputCommand()
	if (!interaction.isChatInputCommand()) return;
    
    const command = interaction.client.commands.get((interaction.commandName))
    
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found`)
    }
    
    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error);
		if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
    
});

// Log in to Discord with your client's token
client.login(token);