const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');
const HealthVisuals = require('../../util/Battle/HealthVisuals');
const StatCalculator = require('../../util/Stats/StatCalculator');

module.exports = {
    name: 'take-damage',
    description: 'Take damage from an attack or any source of danger!',
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

        // verify user input
        let originalDamageAmount = Math.max(0, interaction.options.getInteger('amount'));
        let finalDamageAmount = originalDamageAmount;
        
        // get user from cached database
        const character = AttackManager.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!character || !character.approved) return AttackManager.NotRegistered(interaction);

        // notify if health is already at 0
        if (character.currentHealth < 1) return interaction.reply({
            embeds: [new MessageEmbed({
                color: 'DARK_RED',
                author: { name: 'The void has already consumed.' },
                description: 'No more damage can be taken.',
                fields: [{
                    name: 'CURRENT HEALTH 💔',
                    value: `> ↣ \`${character.currentHealth}\` / \`${StatCalculator.calculateMaxHealth(character)}\``
                }],
            })]
        });
        
        // adjust for health tanking below 0
        if (character.currentHealth - originalDamageAmount < 0) {
            finalDamageAmount = character.currentHealth;
        }
        
        // save to database if an actual health change was made
        if (finalDamageAmount > 0) {
            character.currentHealth -= finalDamageAmount;
            character.save();
        }
        
        // notify user along with any damage adjustments made
        interaction.reply({
            embeds: [
                new MessageEmbed({
                    color: character.currentHealth < 1 ? 'NOT_QUITE_BLACK' : 'DARK_RED',
                    author: { name: HealthVisuals.Damage.getRandomDamageTitle(character.currentHealth) },
                    description: HealthVisuals.Damage.getRandomDamageMessage(character.currentHealth),
                    footer: (finalDamageAmount !== originalDamageAmount ? {
                        text: 'Original input has been reduced by ' + (originalDamageAmount - finalDamageAmount) + '.'
                    } : undefined),
                }),
                HealthVisuals.generateHealthEmbed(interaction.member, character),
            ]
        })
    },
};