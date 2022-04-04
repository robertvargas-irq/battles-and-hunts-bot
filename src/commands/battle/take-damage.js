const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');
const mongoose = require('mongoose');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const { formatStats, calculateMaxHealth } = require('../../util/Account/Player');

module.exports = {
    name: 'take-damage',
    description: 'Take damage from an attack or any source of danger!',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'amount',
            description: 'The amount of damage to subtract from your health. (You will never go below 0)',
            type: dTypes.Integer,
            required: true,
        },
    ],
    /**
     * @param {BaseCommandInteraction} interaction
     */
    async execute(interaction) {

        // defer and get input
        await interaction.deferReply({ ephemeral: false });
        let amount = Math.max(0, interaction.options.getInteger('amount'));
        
        // pull user from the database
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
        
        // check for already dead or under-heal
        if (found.currentHealth < 1 || found.currentHealth - amount < 0)
            amount = found.currentHealth;
        
        // save to database if actual change was made
        if (amount > 0) {
            found.currentHealth -= amount;
            await found.save();
        }

        // notify user
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor(found.currentHealth < 1 ? 'NOT_QUITE_BLACK' : 'DARK_RED')
                    .setTitle(found.currentHealth < 1 ? '...' : '🩸 Hrrk...!')
                    .setDescription(AttackManager.getRandomDamageMessage(found.currentHealth))
                    .addField('CURRENT HEALTH 💔', `> ↣ \`${found.currentHealth}\` / \`${calculateMaxHealth(found.stats.constitution)}\``),
            ]
        });

    },
};