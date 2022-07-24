const { GuildMember, TextChannel, EmbedBuilder, Colors } = require('discord.js');

class PlayerLogger {

    /**@param {Guild} guildManager @param {import('../../database/schemas/server').ServerSchema} server */
    static fetchLogChannel = async (guildManager, server) => {
        if (!server.logging.player) return null;
        return guildManager.channels.fetch(server.logging.player).catch(() => {
            // remove if the channel no longer exists
            server.logging.player = null;
            server.save();
        });
    }

    /**
     * Display change of character stats
     * @param {TextChannel} loggingChannel 
     * @param {GuildMember} player
     * @param {{property: string, old: string|number, new: string|number}[]} overrides 
     * @returns 
     */
    static characterEdits = (loggingChannel, player, overrides) => {
        if (!loggingChannel || !overrides || !overrides.length) return false;
        return loggingChannel.send({
            embeds: [EmbedBuilder.from({
                color: Colors.Yellow,
                thumbnail: { url: player.user.avatarURL() },
                title: '📝 Character Changes',
                description: `<@${player.user.id}>(${player.user.tag}) has changed items from their Character.`,
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
            })],
        });
    }

}

module.exports = PlayerLogger;