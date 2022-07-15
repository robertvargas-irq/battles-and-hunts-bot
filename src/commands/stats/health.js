const { BaseCommandInteraction, MessageEmbed, Util: DiscordUtil } = require('discord.js');
const StatCalculator = require('../../util/Stats/StatCalculator');
const CoreUtil = require('../../util/CoreUtil');
const HealthVisuals = require('../../util/Battle/HealthVisuals');

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
        const description = HealthVisuals.getDescription(healthRatio);
        interaction.reply({
            embeds: [new MessageEmbed({
                color: HealthVisuals.getColor(healthRatio),
                title: '⟪' + HealthVisuals.getFlair(healthRatio) + '⟫ ' + HealthVisuals.getTitle(healthRatio),
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