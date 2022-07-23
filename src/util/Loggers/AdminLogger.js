const { GuildMember, TextChannel, EmbedBuilder } = require('discord.js');

class AdminLogger {

    /**@param {Guild} guildManager @param {import('../../database/schemas/server').ServerSchema} server */
    static fetchLogChannel = async (guildManager, server) => {
        if (!server.logging.admin) return null;
        return guildManager.channels.fetch(server.logging.admin).catch(() => {
            // remove if the channel no longer exists
            server.logging.admin = null;
            server.save();
        });
    }

    /**
     * Display Administrator Override log for overriding character stats
     * @param {TextChannel} loggingChannel 
     * @param {GuildMember} administrator
     * @param {GuildMember} target
     * @param {{property: string, old: string|number, new: string|number}[]} overrides 
     * @returns 
     */
    static characterOverride = (loggingChannel, administrator, target, overrides) => {
        if (!loggingChannel || !overrides || !overrides.length) return false;
        console.log(overrides);
        return loggingChannel.send({
            embeds: [EmbedBuilder.from({
                color: 'Blurple',
                thumbnail: { url: administrator.user.avatarURL() },
                title: '📝 Character Administrator Override',
                description: `<@${administrator.user.id}>(${administrator.user.tag}) has overriden items from <@${target.user.id}>(${target.user.tag}) Character.`,
                fields: overrides.map((changes) => {
                    const propertyName = changes.property?.toString()?.toUpperCase();
                    const old = changes.old
                    ? (changes.old.toString().substring(0, 400) + (changes.old.toString().length >= 400 ? '⟪...⟫' : '')) : 'NONE';
                    const updated = changes.new
                    ? (changes.new.toString().substring(0, 400) + (changes.new.toString().length >= 400 ? '⟪...⟫' : '')) : 'NONE';
                    const tooLong = (old && old.length > 20) || (updated && updated.length > 20);
                    console.log({old, oldLength: old.length, updated, updatedLength: updated.length})
                    return {
                        name: '__' + propertyName + '__',
                        value: (!tooLong ? '>>> ' : '') + (
                            (tooLong)
                            ? 'Old Value ⇲\n```' + old + '```\nNew Value ⇲\n```' + updated + '```'
                            : '`' + old + '` → `' + updated + '`' 
                        ),
                        inline: !tooLong,
                    }
                }),
            })]
        });
    }

}

module.exports = AdminLogger;