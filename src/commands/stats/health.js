const { BaseCommandInteraction, MessageEmbed, Util: DiscordUtil } = require('discord.js');
const StatCalculator = require('../../util/Stats/StatCalculator');
const CoreUtil = require('../../util/CoreUtil');
const { colors, titles, descriptions, flairs } = require('./healthVisuals.json');

module.exports = {
    name: 'health',
    description: 'Quickly view your health!',
    /**@param {BaseCommandInteraction} interaction */
    async execute( interaction ) {
        
        // if user is registered
        const found = CoreUtil.Characters.cache.get(interaction.guild.id, interaction.user.id);
        if (!found || !found.approved) return CoreUtil.NotRegistered(interaction);

        // show health bar
        const maxHealth = StatCalculator.calculateMaxHealth(found);
        const healthRatio = found.currentHealth / maxHealth;
        const description = getDescription(healthRatio);
        interaction.reply({
            embeds: [new MessageEmbed({
                color: getColor(healthRatio),
                title: '⟪' + getFlair(healthRatio) + '⟫ ' + getTitle(healthRatio),
                description: description ? '*' + description + '*' : '',
                thumbnail: { url: found.icon ?? interaction.member.displayAvatarURL({ dynamic: true }) },
                fields: [
                    {
                        name: 'Current Health',
                        value: `> ↣ \`${found.currentHealth}\` / \`${StatCalculator.calculateMaxHealth(found)}\` `
                        + `**(**${Math.floor(healthRatio * 100)}%**)**`,
                        inline: true,
                    },
                    {
                        name: '▣'.repeat(Math.floor(healthRatio * 10)) + '▢'.repeat(Math.floor((1 - healthRatio) * 10)),
                        value: '\u200B',
                        inline: true,
                    },
                ],
                footer: { text: (found.name ?? interaction.member.displayName + '\'s character') },
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