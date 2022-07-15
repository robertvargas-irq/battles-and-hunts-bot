const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { CommandInteraction, MessageEmbed } = require('discord.js');
const PreyPile = require('../../util/Hunting/PreyPile');

module.exports = {
    name: 'deposit',
    description: 'Dump all the prey you\'ve been carrying into the prey pile!',
    options: [
        {
            name: 'clan',
            description: 'The clan\'s prey pile you wish to deposit into.',
            type: dTypes.String,
            required: true,
            choices: [
                {
                    name: 'The Unforgiven',
                    value: 'unforgiven'
                },
                {
                    name: 'River-Clan',
                    value: 'riverclan'
                },
                {
                    name: 'Shadow-Clan',
                    value: 'shadowclan'
                },
                {
                    name: 'Thunder-Clan',
                    value: 'thunderclan'
                },
            ],
        },
    ],
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {

        // get clan
        const clan = interaction.options.getString('clan');
        
        // get user and server from the cache
        const character = HuntManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        const member = HuntManager.Members.cache.get(interaction.guild.id, interaction.user.id);
        if (!character || !character.approved) return HuntManager.NotRegistered(interaction);
        const server = HuntManager.Servers.cache.get(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return HuntManager.displayRestrictedHunting(interaction);

        // check if user is on cooldown
        if (HuntManager.onCooldownDeposit(interaction.user.id))
            return HuntManager.displayCooldownDeposit(interaction);

        // if not carrying anything, inform
        const carrying = HuntManager.removeFromCarry(interaction.user.id);
        if (carrying.length < 1) {
            return interaction.reply({
                ephemeral: true,
                embeds: [new MessageEmbed()
                    .setColor('YELLOW')
                    .setTitle('⚠️ Woah wait! You aren\'t carrying anything!')
                    .setDescription(`\
                    > Go back and use \`/hunt\` first, \`/carry\` anything you caught, and then use this command to go and deposit your prey to your clan\'s prey pile!
                    `)
                ]
            });
        }

        // record contributions if canon (weight and carry)
        if (!server.hunting.locked) {
            let weight = 0;
            for (let i = 0; i < carrying.length; i++)
                weight += carrying[i].size;
            
            // update character hunting stats and overall member stats
            character.hunting.contributions.preyCount += carrying.length;
            member.hunting.contributions.preyCount += carrying.length;
            character.hunting.contributions.preyWeight += weight;
            member.hunting.contributions.preyWeight += weight;
            character.hunting.trips++;
            member.hunting.trips++;

            // perfect hunt if carrying weight matches the max carry weight
            if (weight === HuntManager.INVENTORY_MAX_WEIGHT) {
                character.hunting.fullInventoryTrips++;
                member.hunting.fullInventoryTrips++;
            }

            // save changes to the database
            character.save();
            member.save();
        }
        
        // dump into the prey pile
        HuntManager.addToPreyPile(carrying, clan, server);
        PreyPile.updatePreyPile(interaction, server, clan);
        server.save();

        // add cooldown for user
        HuntManager.addCooldownDeposit(interaction.user.id);

        // notify the clan
        const notifyEmbed = new MessageEmbed();
        if (character.clan == clan) {
            notifyEmbed
                .setColor('GREEN')
                .setTitle('📦 Some food has arrived.')
                .setThumbnail(character.icon ?? interaction.member.displayAvatarURL({ dynamic: true }))
                .setDescription(`\
                **${character.name ?? interaction.member.displayName + '\'s character'}** has deposited some food into the prey pile.\
                \n\
                \n**- - - - - -**\
                \n\
                \n**They have deposited \`${carrying.length}\` piece${carrying.length != 1 ? 's' : ''} of prey, which ${carrying.length != 1 ? 'are' : 'is'} the following**:\
                \n\
                \n${PreyPile.formatPrey(carrying)}\
                \n\
                \n**- - - - - -**`)
                .setFooter({ text: '🍃 This pile deposit is canon.' });
        }
        else {
            notifyEmbed
                .setColor('AQUA')
                .setTitle('🎁 Some prey has been graciously gifted to us!')
                .setThumbnail(character.icon ?? interaction.member.displayAvatarURL({ dynamic: true }))
                .setDescription(`\
                **An outsider to our clan has gifted food to our prey pile!!**\
                \n> The scent is coming from someone from **${character.clan?.toUpperCase() || 'an unknown clan or territory'}**...\
                \n> If I recall, their name was **${character.name ?? interaction.member.displayName + '\'s character'}**.
                \n\
                \n**- - - - - -**\
                \n\
                \n**They have deposited \`${carrying.length}\` piece${carrying.length != 1 ? 's' : ''} of prey, which ${carrying.length != 1 ? 'are' : 'is'} the following**:\
                \n\
                \n${PreyPile.formatPrey(carrying)}\
                \n\
                \n**- - - - - -**`)
                .setFooter({ text: '🍃 This pile deposit is canon.' });
        }
        PreyPile.pushPreyUpdateMessage(interaction, server, clan, {embeds:[notifyEmbed]})

        // display deposit summary
        return interaction.reply({
            ephemeral: true,
            embeds: [new MessageEmbed({
                color: 'GREEN',
                title: `📦 __Successfully deposited in: \`${clan.toUpperCase()}\`__`,
                description: `You take all the prey that you have collected and dump it into the \`${clan.toUpperCase()}\` prey pile.`
                + '\n\nYou can finally take a breath after finally dropping off all that weight.'
                + '\n\n🐈 __**Prey you deposited**__'
                + '\n\n'
                + HuntManager.formatPrey(carrying)
                + '\n\n**- - - - - -**',
                footer: { text: '🍃 This pile deposit is canon.' },
            })]
        })
    },
};