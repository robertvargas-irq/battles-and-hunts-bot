const { EmbedBuilder, GuildMember } = require('discord.js');
const StatCalculator = require('../Stats/StatCalculator');
const CoreUtil = require('../CoreUtil');
const HealthVisualsData = require('./healthVisuals.json');
const DamagePrompts = require('./damagePrompts.json');
const MedicinePrompts = require('./medicinePrompts.json');

class HealthVisuals {
    static getColor = (ratio) => CoreUtil.GetColorFromRatio(HealthVisualsData.colors, ratio);
    static getDescription = (ratio) => CoreUtil.GetArrayElementFromRatio(HealthVisualsData.descriptions, ratio);
    static getTitle = (ratio) => CoreUtil.GetArrayElementFromRatio(HealthVisualsData.titles, ratio);
    static getFlair = (ratio) => CoreUtil.GetArrayElementFromRatio(HealthVisualsData.flairs, ratio);

    /*
     * Healing and Damage
     */
    static Damage = {
        getRandomDamageTitle: (health) => {
            if (health < 1) return 'Your character has fallen.';
            return DamagePrompts.damageTitle[Math.floor(Math.random() * DamagePrompts.damageTitle.length)];
        },
        getRandomDamageMessage: (health) => {
            if (health < 1) return 'Silence, as the world fades to black.';
            return DamagePrompts.damageAction[Math.floor(Math.random() * DamagePrompts.damageAction.length)] + ', '
            + DamagePrompts.damageResponse[Math.floor(Math.random() * DamagePrompts.damageResponse.length)] + '.';
        },
    };

    static Healing = {
        getRandomHealingTitle: () => {},
        getRandomHealingMessage: () => MedicinePrompts.healingAction[Math.floor(Math.random() * MedicinePrompts.healingAction.length)] + ', ' +
            MedicinePrompts.healingResponse[Math.floor(Math.random() * MedicinePrompts.healingResponse.length)] + '.',
    }

    /**
     * Generate a basic Health embed
     * @param {GuildMember} interaction 
     * @param {CharacterModel} character 
     */
    static generateHealthEmbed = (member, character) => {
        const maxHealth = StatCalculator.calculateMaxHealth(character);
        const healthRatio = character.currentHealth / maxHealth;
        const description = HealthVisuals.getDescription(healthRatio);
        return EmbedBuilder.from({
            color: HealthVisuals.getColor(healthRatio),
            title: '⟪' + HealthVisuals.getFlair(healthRatio) + '⟫ ' + HealthVisuals.getTitle(healthRatio),
            description: description ? '*' + description + '*' : '',
            thumbnail: { url: character.icon ?? member.displayAvatarURL({ dynamic: true }) },
            fields: [
                {
                    name: 'Current Health',
                    value: `> ↣ \`${character.currentHealth}\` / \`${maxHealth}\` `
                    + `**(**${Math.floor(healthRatio * 100)}%**)**`,
                    inline: true,
                },
                {
                    name: '▣'.repeat(Math.floor(healthRatio * 10)) + '▢'.repeat(Math.floor((1 - healthRatio) * 10)),
                    value: '\u200B',
                    inline: true,
                },
            ],
            footer: { text: (character.name ?? member.displayName + '\'s character') },
        });
    }
}

module.exports = HealthVisuals;