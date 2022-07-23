const { ApplicationCommandOptionType : CommandTypes, Locale } = require('discord-api-types/v10');
const { CommandInteraction, EmbedBuilder, Colors } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');
const StatCalculator = require('../../util/Stats/StatCalculator');
const HealthVisuals = require('../../util/Battle/HealthVisuals');

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
            type: CommandTypes.Integer,
            required: true,
        },
    ],
    /**
     * @param {CommandInteraction} interaction
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
        if (character.currentHealth > maxHealth) return interaction.reply({
            embeds: [
                EmbedBuilder.from({
                    color: Colors.Fuchsia,
                    title: '💖 You are over-healed!',
                    description: 'You feel at ease.',
                }),
                HealthVisuals.generateHealthEmbed(interaction.member, character),
            ]
        });
        if (character.currentHealth === maxHealth) return interaction.reply({
            embeds: [
                EmbedBuilder.from({
                    color: Colors.Fuchsia,
                    title: '✨ You are already at Max Health!',
                    description: 'You feel at ease.',
                }),
                HealthVisuals.generateHealthEmbed(interaction.member, character),
            ]
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
                EmbedBuilder.from({
                    color: Colors.Aqua,
                    title: '🥬 Healed up `' + finalHealAmount + '` HP',
                    description: '> ' + HealthVisuals.Healing.getRandomHealingMessage(),
                    footer: (finalHealAmount !== originalHealAmount ? {
                        text: 'Original input has been reduced by ' + (originalHealAmount - finalHealAmount) + '.'
                    } : undefined),
                }),
                HealthVisuals.generateHealthEmbed(interaction.member, character),
            ]
        });

    },
};