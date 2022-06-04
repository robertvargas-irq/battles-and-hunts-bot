const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const HuntManager = require('../../../util/Hunting/HuntManager');
const PreyPile = require('../../../util/Hunting/PreyPile');

/**
 * @param {BaseCommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'dc': {
            // defer
            await interaction.deferReply({ ephemeral: false });

            // parse value and fetch server from the database
            const newValue = Math.max(0, interaction.options.getInteger('value'));
            const server = await HuntManager.FetchServer(interaction.guild.id);

            // modify dc and notify success to the admin
            const oldValue = server.hunting.seasonDC;
            server.hunting.seasonDC = newValue;
            await server.save();

            return interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'GREEN',
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
            await interaction.deferReply({ ephemeral: false });

            // get all users
            const { UserModel, users } = await HuntManager.FetchAllUsers();

            // set all user's hunger to their size
            for (let user of users) user.currentHunger = user.stats.cat_size;

            // save all user documents
            await UserModel.bulkSave(users);

            // notify successful set
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle('✅ Successfully set all user hungers to max.')
                    .setDescription(
                    `> **Hunger begins to bear down upon warriors great and small, leaders and young, and everyone in-between.**` +
                    `\n\n > It is inescapable, as time ticks by, finding something suitable to \`/eat\` grows prevalent to satiate this growing \`/hunger\`...`
                    )
                ]
            });
        }

        case 'spoil-everything': {
            // defer
            await interaction.deferReply({ ephemeral: false });
            
            // pull server from the database
            const server = await PreyPile.FetchServer(interaction.guild.id);

            // empty all entries
            for ([clanName, clanData] of Array.from(Object.entries(server.clans))) {
                const spoiledFood = PreyPile.emptyPreyPile(clanName, server);
                PreyPile.updatePreyPile(interaction, server, clanName);
                PreyPile.pushPreyUpdateMessage(interaction, server, clanName, {
                    embeds: [new MessageEmbed()
                        .setColor('RED')
                        .setTitle('🪰🦴 All of your food has gone to waste.')
                        .setDescription(`The entirety of the prey pile has rotted away, leaving behind a foul odor that absolutely engulfs your sense of smell.` +
                        `\n\n__**All of the following prey has spoiled**__:\n${PreyPile.formatPrey(spoiledFood)}\n\n||**${interaction.member.displayName}** called the \`/spoil\` command.||`)
                    ]
                })
            }

            // save to server
            await server.save();

            // notify successful set
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle('✅ Successfully spoiled all prey piles.')
                    .setDescription('As the moons pass, disease and rot takes away what little you have left.')
                ]
            })
        } // end spoil-everything

        case 'lock': {
            // defer
            await interaction.deferReply({ ephemeral: false });

            // pull server from the database
            const server = await HuntManager.FetchServer(interaction.guild.id);

            // inform if already locked
            if (server.hunting.locked) return interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'FUCHSIA',
                    title: '🔐 Hunting is already locked!',
                })]
            });

            // lock hunting and save
            server.hunting.locked = true;
            await server.save();

            // notify successful set
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('DARK_VIVID_PINK')
                    .setTitle('🔒 Hunting has been heavily restricted.')
                    .setDescription(
                        '> We hope you had a wonderful roleplay session, hunting is now restricted.'
                        + '\n\n`/carry` `/deposit` `/eat` are now `disabled`.'
                    )
                ]
            });
        }

        case 'unlock': {
            // defer
            await interaction.deferReply({ ephemeral: false });

            // pull server from the database
            const server = await HuntManager.FetchServer(interaction.guild.id);

            // inform if already unlocked
            if (!server.hunting.locked) return interaction.editReply({
                embeds: [new MessageEmbed({
                    color: 'FUCHSIA',
                    title: '🔓 Hunting is already unlocked!',
                })]
            });

            // unlock hunting and save
            server.hunting.locked = false;
            await server.save();

            // notify successful set
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle('🔓 Hunting is now fully available.')
                    .setDescription(
                        '> This probably means that a session is about to start, **happy roleplaying!**'
                        + '\n\n`/carry` `/deposit` `/eat` are now `enabled`.'
                    )
                ]
            });
        }
    }

}