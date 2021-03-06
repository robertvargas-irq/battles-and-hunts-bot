const { CommandInteraction, EmbedBuilder, Colors } = require('discord.js');
const HuntManager = require('../../../util/Hunting/HuntManager');
const PreyPile = require('../../../util/Hunting/PreyPile');
const CharacterModel = require('../../../database/schemas/character');
const Hunger = require('../../../util/Hunting/Hunger');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'dc': {

            // parse value and fetch server from the database
            const newValue = Math.max(0, interaction.options.getInteger('value'));
            const server = HuntManager.Servers.cache.get(interaction.guild.id);

            // modify dc and notify success to the admin
            const oldValue = server.hunting.seasonDC;
            server.hunting.seasonDC = newValue;
            server.save();

            return interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Green,
                    title: '✅ Hunting DC successfully modified',
                    description: '> ' + (
                    newValue >= 1000
                    ? '🪦'
                    : newValue >= 100
                    ? '🗿 Bruh.'
                    : newValue >= 20
                    ? '☠ Are you insane-??'
                    : newValue >= 15
                    ? '🦴 I hope you know what you\'re doing... cats could die.'
                    : newValue >= 7
                    ? '🍃 It looks rather easy, ' + newValue + '.'
                    : '✨ This is a cake walk!'),
                    fields: [
                        { name: 'Old Value', value: '> `' + oldValue.toString() + '`', inline: true },
                        { name: 'New Value', value: '> `' + newValue.toString() + '`', inline: true },
                    ]
                })]
            })
        }

        case 'starve-everyone': {
            // defer
            await interaction.deferReply();

            // get all characters in the guild
            const characters = Array.from(HuntManager.Characters.cache.getAll(interaction.guild.id).values());

            // set all user's hunger to their size
            for (const character of characters) Hunger.starveFully(character);

            // save all character documents
            await CharacterModel.bulkSave(characters);

            // notify successful set
            return interaction.editReply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Green,
                    title: '✅ Successfully set all character\'s hungers to max.',
                    description: '> **Hunger begins to bear down upon warriors great and small, leaders and young, and everyone in-between.**'
                    + '\n\n > It is inescapable, as time ticks by, finding something suitable to `/eat` grows prevalent to satiate this growing `/hunger`...'
                })]
            });
        }

        case 'spoil-everything': {
            
            // get server from the cache
            const server = PreyPile.Servers.cache.get(interaction.guild.id);

            // empty all entries
            for ([clanName, clanData] of Array.from(Object.entries(server.clans))) {
                const spoiledFood = PreyPile.emptyPreyPile(clanName, server);
                PreyPile.updatePreyPile(interaction, server, clanName);
                PreyPile.pushPreyUpdateMessage(interaction, server, clanName, {
                    embeds: [new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle('🪰🦴 All of your food has gone to waste.')
                        .setDescription(`The entirety of the prey pile has rotted away, leaving behind a foul odor that absolutely engulfs your sense of smell.` +
                        `\n\n__**All of the following prey has spoiled**__:\n${PreyPile.formatPrey(spoiledFood)}\n\n||**${interaction.member.displayName} (${interaction.user.tag}(${interaction.user.id}))** called the \`/spoil\` command.||`)
                    ]
                })
            }

            // save changes to the database
            server.save();

            // notify successful set
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('✅ Successfully spoiled all prey piles.')
                    .setDescription('As the moons pass, disease and rot takes away what little you have left.')
                ]
            })
        } // end spoil-everything

        case 'lock': {

            // get server from the cache
            const server = HuntManager.Servers.cache.get(interaction.guild.id);

            // inform if already locked
            if (server.hunting.locked) return interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Fuchsia,
                    title: '🔐 Hunting is already locked!',
                })]
            });

            // lock hunting and save to the database
            server.hunting.locked = true;
            server.save();

            // notify successful set
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(Colors.DarkVividPink)
                    .setTitle('🔒 Hunting has been heavily restricted.')
                    .setDescription(
                        '> We hope you had a wonderful roleplay session, hunting is now restricted.'
                        + '\n\n`/deposit` `/eat` are now `disabled`.'
                    )
                ]
            });
        }

        case 'unlock': {

            // get server from the cache
            const server = HuntManager.Servers.cache.get(interaction.guild.id);

            // inform if already unlocked
            if (!server.hunting.locked) return interaction.reply({
                embeds: [EmbedBuilder.from({
                    color: Colors.Fuchsia,
                    title: '🔓 Hunting is already unlocked!',
                })]
            });

            // unlock hunting and save to the database
            server.hunting.locked = false;
            server.save();

            // notify successful set
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('🔓 Hunting is now fully available.')
                    .setDescription(
                        '> This probably means that a session is about to start, **happy roleplaying!**'
                        + '\n\n`/deposit` `/eat` are now `enabled`.'
                    )
                ]
            });
        }
    }

}