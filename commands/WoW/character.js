const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BlizzAPI } = require('blizzapi');
const { wowClientId, wowSecret } = require('../../config/config.json');
const realmTable = require('../../config/realms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('character')
        .setDescription('Lists information regarding a WoW character.')
        .addStringOption(option =>
            option.setName('charactername')
                .setDescription('Name of the character to search.'))
        .addStringOption(option =>
            option.setName('realm')
                .setDescription('Name of the realm the character is on.')),

    async execute(interaction) {

        var charName = interaction.options.getString('charactername');
        var realmName = interaction.options.getString('realm');
        var response;
        var media;

        const api = new BlizzAPI({
            region: "eu",
            clientId: wowClientId,
            clientSecret: wowSecret,
        })

        fs.readFile('config/realms.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }

            try {
                // Parse JSON data
                var jsonData = JSON.parse(data);

                // Iterate over the parsed JSON array
                jsonData.eu.forEach(item => {
                    // Access name and slug properties of each item

                    if (item.name == realmName || item.slug == realmName) {
                        realmName = item.slug;
                        return;
                    }

                });
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        });

        api.query(`/profile/wow/character/${realmName}/${charName}?namespace=profile-eu`).then(value => {
            response = value;
        }).catch(error => {
            console.log("Error finding character.")
        });

        api.query(`/profile/wow/character/${realmName}/${charName}/character-media?namespace=profile-eu`).then(value => {
            media = value;
        }).catch(error => {
            console.log("Error finding character media.")
        });

        setTimeout(async () => {
            if (response != null) {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Character Info",
                        iconURL: media.assets[0].value,
                    })
                    .setTitle(response.active_title.name.en_GB + ' ' + response.name)
                    .addFields(
                        {
                            name: "Level",
                            value: '' + response.level,
                            inline: true
                        },
                        {
                            name: "Race",
                            value: response.race.name.en_GB,
                            inline: true
                        },
                        {
                            name: "Class",
                            value: response.active_spec.name.en_GB + ' ' + response.character_class.name.en_GB,
                            inline: true
                        },
                        {
                            name: "Faction",
                            value: response.faction.name.en_GB,
                            inline: true
                        },
                        {
                            name: "Realm",
                            value: response.realm.name.en_GB,
                            inline: true
                        },
                        {
                            name: "Guild",
                            value: response.guild.name,
                            inline: true
                        },
                    )
                    .setImage(media.assets[2].value)
                    .setThumbnail(media.assets[1].value)
                    .setColor("#6495ed")
                    .setFooter({
                        text: "High Tinker Mekkatorque",
                        iconURL: "https://cdn.discordapp.com/app-assets/1206385637603938314/1208468226166489209.png",
                    })
                    .setTimestamp();

                console.log(response);
                console.log(media);
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ content: 'Realm or character not found!', ephemeral: true });
            }
        }, 1500);



    },
};