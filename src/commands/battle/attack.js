const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, GuildMember } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');


module.exports = {
    name: 'attack',
    description: 'Attack another user!',
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

        // if target is bot or user, deny
        /**@type {GuildMember}*/
        const targetSnowflake = interaction.options.getMember('opponent');
        if (targetSnowflake.user.bot) return AttackManager.denyBotAttack(interaction);
        if (targetSnowflake.user.id === interaction.user.id) return AttackManager.denySelfAttack(interaction);
        
        // pull character document from the character cache
        const attacker = AttackManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!attacker || !attacker.approved) return AttackManager.NotRegistered(interaction);
        
        // if target is not registered, deny
        const target = AttackManager.Characters.cache.get(interaction.guild.id, targetSnowflake.user.id);
        if (!target || !target.approved) return AttackManager.targetNotRegistered(interaction);

        // initiate rolls
        return AttackManager.rollAndGiveAttackResult(interaction, attacker, target, targetSnowflake);
    },
};

// if (the_hny) she_win();