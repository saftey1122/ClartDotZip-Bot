// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const config = require('./config/config.json');
const cron = require('node-cron');
const { startCron, currentCache } = require('./cronJob');

// Create a new client instance
const client = new Client({ 
	intents: [GatewayIntentBits.Guilds],
	presence: {
		status: 'dnd',
		activities: [{
			application_id: '1206385637603938314',
			type: 0,
			name: 'Gnomeregan',
			details: 'Located in Dun Morogh, the technological wonder known as Gnomeregan has been the gnomes capital city for generations.',
			state: 'Killing Mekgineer Thermaplugg',
			createdTimestamp: Date.now(),
			timestamps: {
				start: Date.now(),
				end: Date.now() + 5184000
			},
			assets: {
				large_image: 'https://media.discordapp.net/1206441092895998013.png',
				large_text: 'Gnomeregan',
				small_image: 'https://cdn.discordapp.com/app-assets/1206385637603938314/1206441092895998013.png',
				small_text: 'Gnomeregan'
			},
			emoji: '🤖'
		}],
	}
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			console.log(`[LOG] The command ${command.data.name} has been registered.`);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(config.token);

client.on('ready', async () => {
	startCron(client);
	//console.log(`Activity ${JSON.stringify(client.user.presence)}`)
})

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

cron.schedule('*/10 * * * * *', () => startCron(client));

const handleExit = () => {
	console.log('[EXIT HANDLER] Exiting process...')
    try {
        // Synchronously write currentCache to a file
        fs.writeFileSync('./data/current_cache.json', JSON.stringify(currentCache), 'utf8');
        console.log('[EXIT HANDLER] Current cache saved to file.');
    } catch (error) {
        console.error('[EXIT HANDLER] Error saving current cache:', error);
    }
	process.exit(0);
};

// Listen for the process exit event and call handleExit synchronously
process.on('exit', handleExit);

// Listen for the SIGINT signal (Ctrl+C) and call handleExit synchronously
// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
    console.log('Received SIGINT signal. Exiting gracefully...');
    // Run cleanup logic here
    process.exit(0);
});

// Handle SIGTERM signal
process.on('SIGTERM', handleExit);

// Listen for uncaught exceptions and call handleExit synchronously
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION] An uncaught exception occurred:', err);
    handleExit();
});
