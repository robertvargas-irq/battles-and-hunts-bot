const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const collectCharacterStats = require('../../util/Account/collectCharacterStats');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const { formatStats, calculateMaxHealth } = require('../../util/Account/Player');

module.exports = {
    name: 'edit',
    description: 'Edit your stats!',
    guilds: ['957854680367648778', '954037682223316992'],
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {

        // defer
        await interaction.deferReply({ ephemeral: true });
        
        // if user is registered
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let found = await User.findOne({ userId: interaction.user.id }).exec();

        // prompt registration if user is not registered; completely return
        if (!found) {
            let newStats = await firstTimeRegister(interaction);
            if (!newStats) return; // error already handled inside collect()
            return interaction.editReply({
                embeds: [formatStats(interaction, newStats)]
            });
        }
        
        // collect new stats
        const catStats = await collectCharacterStats(interaction, '**Welcome back to the editor!**\nPlease enter your character\'s stats one by one!');
        if (!catStats) return; // error already handled inside collect()

        // handle new max health
        if (found.currentHealth > calculateMaxHealth(catStats.constitution))
            found.currentHealth = calculateMaxHealth(catStats.constitution);

        // save to the database
        found.stats = catStats;
        found.markModified('User.stats');
        await found.save()
            .then(() => {
                // success!
                interaction.editReply({
                    embeds: [
                        new MessageEmbed()
                            .setColor('AQUA')
                            .setTitle('🌟 All changes have successfully been recorded!')
                            .setDescription('You may now dismiss this menu.'),
                        formatStats(interaction, found)
                    ]
                });
            })
            .catch((e) => {
                console.error(e);
                interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('GREYPLE')
                        .setTitle('⚠️ Something went wrong!')
                        .setDescription('We were unable to save your changes to the database, please try again later!\nIf this issue persists, please let a moderator know! 🌟')
                    ]
                });
            });
    },
};