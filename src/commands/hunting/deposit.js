const HuntManager = require('../../util/Hunting/HuntManager')
const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const PreyPile = require('../../util/Hunting/PreyPile');

module.exports = {
    name: 'deposit',
    description: 'Dump all the prey you\'ve been carrying into the prey pile!',
    guilds: ['957854680367648778', '954037682223316992'],
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
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: true });

        // get clan
        const clan = interaction.options.getString('clan');
        
        // pull user and server from the database
        const hunter = await HuntManager.FetchUser(interaction.user.id);
        if (!hunter) return await HuntManager.NotRegistered(interaction);
        const server = await HuntManager.FetchServer(interaction.guild.id);

        // if hunting is currently restricted, display warning
        if (server.hunting.locked) return await HuntManager.displayRestrictedHunting(interaction);

        // check if user is on cooldown
        if (HuntManager.onCooldownDeposit(interaction.user.id))
            return HuntManager.displayCooldownDeposit(interaction);

        // if not carrying anything, inform
        const carrying = HuntManager.removeFromCarry(interaction.user.id);
        if (carrying.length < 1) {
            return interaction.editReply({
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
            hunter.hunting.contributions.preyCount += carrying.length;
            hunter.hunting.contributions.preyWeight += weight;
            hunter.hunting.trips++;
        }
        
        // dump into the prey pile
        HuntManager.addToPreyPile(carrying, clan, server);
        PreyPile.updatePreyPile(interaction, server, clan);
        server.save();
        hunter.save();

        // add cooldown for user
        HuntManager.addCooldownDeposit(interaction.user.id);

        // notify the clan
        const notifyEmbed = new MessageEmbed();
        if (hunter.clan == clan) {
            notifyEmbed
                .setColor('GREEN')
                .setTitle('📦 Some food has arrived.')
                .setThumbnail(interaction.member.displayAvatarURL())
                .setDescription(`\
                **${interaction.member.displayName}** has deposited some food into the prey pile.\
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
                .setThumbnail(interaction.member.displayAvatarURL())
                .setDescription(`\
                **An outsider to our clan has gifted food to our prey pile!!**\
                \n> The scent is coming from someone from **${hunter.clan.toUpperCase()}**...\
                \n> If I recall, their name was **${interaction.member.displayName}**.
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
        await PreyPile.pushPreyUpdateMessage(interaction, server, clan, {embeds:[notifyEmbed]})








        
        const resultEmbed = new MessageEmbed()
            .setColor('GREEN')
            .setTitle(`📦 __Successfully deposited in: \`${clan.toUpperCase()}\`__`)
            .setDescription(`\
            > You take all the prey that you have collected and dump it into the \`${clan.toUpperCase()}\` prey pile.
            > 
            > You can finally take a breath after finally dropping off all that weight.
            
            🐈 __**Prey you deposited**__

            ${HuntManager.formatPrey(carrying)}
            
            **- - - - - -**
            `)
            .setFooter({ text: '🍃 This pile deposit is canon.' });

        // display result
        return interaction.editReply({
            embeds: [resultEmbed]
        })
    },
};