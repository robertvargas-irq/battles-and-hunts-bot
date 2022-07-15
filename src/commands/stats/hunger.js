const { BaseCommandInteraction, MessageEmbed, Util: DiscordUtil } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');
const { colors, titles, descriptions, flairs } = require('./hungerVisuals.json');

module.exports = {
    name: 'hunger',
    description: 'Quickly view your hunger!',
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {
        
        // if user is registered
        const found = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!found || !found.approved) return CoreUtil.NotRegistered(interaction);

        // show hunger bar
        const hungerRatio = found.currentHunger / found.stats.cat_size;
        interaction.reply({
            embeds: [new MessageEmbed({
                color: getColor(hungerRatio),
                title: '⟪' + getFlair(hungerRatio) + '⟫ ' + getTitle(hungerRatio),
                description: '*' + getDescription(hungerRatio) + '*',
                fields: [
                    {
                        name: 'Current Hunger',
                        value: `> ↣ \`${found.stats.cat_size - found.currentHunger}\` / \`${found.stats.cat_size}\` `
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
                        value: '> ' + (found.lastAteAt > 0 ? '<t:' + found.lastAteAt + '>, roughly <t:' + found.lastAteAt + ':R>' : 'Hmm... can\'t remember...'),
                    },
                ],
                footer: { text: '🍃 This hunger stat is canon.' }
            })]
        });
    
    },
};



/*
 * Helper functions for visuals
 */
const getColor = (ratio) => CoreUtil.GetColorFromRatio(colors, ratio);
const getDescription = (ratio) => CoreUtil.GetArrayElementFromRatio(descriptions, ratio);
const getTitle = (ratio) => CoreUtil.GetArrayElementFromRatio(titles, ratio);
const getFlair = (ratio) => CoreUtil.GetArrayElementFromRatio(flairs, ratio);