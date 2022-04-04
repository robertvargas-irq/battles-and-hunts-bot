const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const AttackManager = require('../../util/Battle/AttackManager');

const getRandom = (min, max) => { return Math.floor(Math.random() * (max + 1 - min) + min) }

module.exports = {
    name: 'attack',
    description: 'Attack another user!',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'opponent',
            description: 'The target of this attack.',
            type: dTypes.User,
            required: true,
        },
    ],
    /**
     * @param {BaseCommandInteraction} interaction 
     */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: false });

        // if target is bot or user, deny
        /**@type {GuildMember}*/
        const targetSnowflake = interaction.options.getMember('opponent');
        if (targetSnowflake.user.bot) return AttackManager.denyBotAttack(interaction);
        if (targetSnowflake.user.id === interaction.user.id) return AttackManager.denySelfAttack(interaction);
        
        // pull user from the database
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let attacker = await User.findOne({ userId: interaction.user.id }).exec();

        // prompt registration if user is not registered; then continue on
        if (!attacker) attacker = await firstTimeRegister(interaction);
        if (!attacker) return; // error message already handled in collect()

        // if target is not registered, deny
        /**@type {mongoose.Document}*/ let target = await User.findOne({ userId: targetSnowflake.user.id }).exec();
        if (!target) return AttackManager.targetNotRegistered(interaction);

        // initiate rolls
        return AttackManager.rollAndGiveAttackResult(interaction, attacker, target, targetSnowflake);
    },
};

// if (the_hny) she_win();