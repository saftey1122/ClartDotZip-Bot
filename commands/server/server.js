const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const cron = require('node-cron');

const serverMsgs = './data/server_messages.json';
const serverData = './data/servers.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('list server'),
    async execute(interaction) {
        try {
            // Read data from the file
            const data = await fs.readFile(serverData, 'utf8', function(err) { if (err) console.error('Error reading file:', err); });
            // Parse JSON data
            const jsonData = JSON.parse(data);

            // Limit the loop to output the first three results for debugging
            const loopLimit = Math.min(jsonData.length, 3);

            // Store the identifiers and message IDs in an object
            const serverMessages = {};

            // Iterate over the parsed JSON array
            for (let i = 0; i < loopLimit; i++) {
                const item = jsonData[i];
                const status = item.status;
                
                const embed = new EmbedBuilder()
                    .setTitle(item.name)
                    .setDescription(status)
                    .addFields(
                        {
                            name: item.ip_alias + ":" + item.port,
                            value: "yes", // Assuming identifier holds IP address
                            inline: true
                        },
                        {
                            name: "Version",
                            value: item.description, // Assuming version holds server version
                            inline: true
                        },
                    )
                    .setThumbnail("https://clart.zip/resources/" + item.identifier + ".png")
                    .setColor("#6495ed")
                    .setFooter({
                        text: "High Tinker Mekkatorque",
                        iconURL: "https://cdn.discordapp.com/app-assets/1206385637603938314/1208468226166489209.png",
                    })
                    .setTimestamp();

                // Send a new message and update the object with identifier and message ID
                const newMessage = await interaction.channel.send({ embeds: [embed] });
                serverMessages[item.identifier] = newMessage.id;
            }

            // Write the server messages to a file
            await fs.writeFile(serverMsgs, serverMessages, 'utf8', function(err) { if (err) console.error('Error writing server messages file:', err); });
        } catch (error) {
            console.error('Error reading or parsing file:', error);
        }
    },
};
