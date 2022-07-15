const { MessageEmbed, GuildMember } = require('discord.js');
const CoreUtil = require("../CoreUtil");
const HungerVisualsData = require('./hungerVisuals.json');

class HungerVisuals {
    static getColor = (ratio) => CoreUtil.GetColorFromRatio(HungerVisualsData.colors, ratio);
    static getDescription = (ratio) => CoreUtil.GetArrayElementFromRatio(HungerVisualsData.descriptions, ratio);
    static getTitle = (ratio) => CoreUtil.GetArrayElementFromRatio(HungerVisualsData.titles, ratio);
    static getFlair = (ratio) => CoreUtil.GetArrayElementFromRatio(HungerVisualsData.flairs, ratio);

    /**
     * Generate a basic Hunger embed
     * @param {GuildMember} interaction 
     * @param {CharacterModel} character 
     */
    static generateHungerEmbed = (member, character) => {
        const hungerRatio = character.currentHunger / character.stats.cat_size;
        return new MessageEmbed({
            color: HungerVisuals.getColor(hungerRatio),
            title: '⟪' + HungerVisuals.getFlair(hungerRatio) + '⟫ ' + HungerVisuals.getTitle(hungerRatio),
            description: '*' + HungerVisuals.getDescription(hungerRatio) + '*',
            thumbnail: { url: character.icon ?? member.displayAvatarURL({ dynamic: true }) },
            fields: [
                {
                    name: 'Current Hunger',
                    value: `> ↣ \`${character.stats.cat_size - character.currentHunger}\` / \`${character.stats.cat_size}\` `
                    + `**(**${Math.floor((1 - hungerRatio) * 100)}%**)**`,
                    inline: true,
                },
                {
                    name: '▣'.repeat(Math.floor((1 - hungerRatio) * 10)) + '▢'.repeat(Math.floor(hungerRatio * 10)),
                    value: '\u200B',
                    inline: true,
                },
                {
                    name: 'Last Ate At',
                    value: '> ' + (character.lastAteAt > 0 ? '<t:' + character.lastAteAt + '>, roughly <t:' + character.lastAteAt + ':R>' : 'Hmm... can\'t remember...'),
                },
            ],
            footer: { text: '🍃 This hunger stat is canon' + ' : ' + (character.name ?? member.displayName + '\'s character')}
        });
    }
}

module.exports = HungerVisuals;