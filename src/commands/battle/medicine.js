const { ApplicationCommandOptionType : dTypes, Locale } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');
const { calculateMaxHealth } = require('../../util/Account/Player');

module.exports = {
    name: 'medicine',
    description: 'Heal yourself!',
    name_localizations: {
        [Locale.SpanishES]: 'medicina'
    },
    description_localizations: {
        [Locale.SpanishES]: 'Cúrate mismo!',
    },
    options: [
        {
            name: 'amount',
            name_localizations: {
                [Locale.SpanishES]: 'puntos'
            },
            description: 'The amount of health to heal. (You will never heal past your max health)',
            type: dTypes.Integer,
            required: true,
        },
    ],
    /**
     * @param {BaseCommandInteraction} interaction
     */
    async execute(interaction) {

        // validate user input
        // await interaction.deferReply({ ephemeral: false });
        const originalHealAmount = Math.max(0, interaction.options.getInteger('amount'));
        let finalHealAmount = originalHealAmount;
        
        // pull user from the database
        const character = AttackManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!character || !character.approved) return AttackManager.NotRegistered(interaction);
        
        // notify if already at max health
        const maxHealth = calculateMaxHealth(character.stats.constitution);
        if (character.currentHealth === maxHealth) return interaction.reply({
            embeds: [new MessageEmbed({
                color: 'FUCHSIA',
                title: '✨ You are already at Max Health!',
                description: 'You feel at ease.',
                fields: [{
                    name: 'CURRENT HEALTH 💘',
                    value: `> ↣ \`${character.currentHealth}\` / \`${character.stats.constitution * 5 + 50}\``,
                }],
            })]
        })

        // adjust for over-heal
        if (character.currentHealth + originalHealAmount > maxHealth)
            finalHealAmount = maxHealth - character.currentHealth;
        
        // save to database if actual change was made
        if (finalHealAmount > 0) {
            character.currentHealth += finalHealAmount;
            await character.save();
        }

        // notify user
        interaction.reply({
            embeds: [
                new MessageEmbed({
                    color: 'AQUA',
                    title: '🌿 Serene',
                    description: AttackManager.getRandomHealingMessage(),
                    fields: [{
                        name: 'CURRENT HEALTH 💘',
                        value: `> ↣ \`${character.currentHealth}\` / \`${character.stats.constitution * 5 + 50}\``,
                    }],
                    footer: (finalHealAmount !== originalHealAmount ? {
                        text: 'Original input has been reduced by ' + (originalHealAmount - finalHealAmount) + '.'
                    } : undefined),
                })
            ]
        });

    },
};