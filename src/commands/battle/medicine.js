const { ApplicationCommandOptionType : dTypes, Locale } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');
const Player = require('../../util/Account/Player');
const StatCalculator = require('../../util/Stats/StatCalculator');

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
        const originalHealAmount = Math.max(0, interaction.options.getInteger('amount'));
        let finalHealAmount = originalHealAmount;
        
        // pull user from the database
        const character = AttackManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!character || !character.approved) return AttackManager.NotRegistered(interaction);
        
        // notify if already at max health
        const maxHealth = StatCalculator.calculateMaxHealth(character);
        if (character.currentHealth === maxHealth) return interaction.reply({
            embeds: [new MessageEmbed({
                color: 'FUCHSIA',
                title: '✨ You are already at Max Health!',
                description: 'You feel at ease.',
                fields: [{
                    name: 'CURRENT HEALTH 💘',
                    value: `> ↣ \`${character.currentHealth}\` / \`${Player.StatCalculator.calculateMaxHealth(character)}\``,
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
                        value: `> ↣ \`${character.currentHealth}\` / \`${Player.StatCalculator.calculateMaxHealth(character)}\``,
                    }],
                    footer: (finalHealAmount !== originalHealAmount ? {
                        text: 'Original input has been reduced by ' + (originalHealAmount - finalHealAmount) + '.'
                    } : undefined),
                })
            ]
        });

    },
};