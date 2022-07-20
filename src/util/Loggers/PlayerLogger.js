const { GuildMember, TextChannel, MessageEmbed } = require('discord.js');

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
            embeds: [new MessageEmbed({
                color: 'YELLOW',
                thumbnail: { url: player.user.avatarURL() },
                title: '📝 Character Changes',
                description: `<@${player.user.id}>(${player.user.tag}) has changed items from their Character.`,
                fields: overrides.map((changes) => {return {
                    name: '__' + changes.property?.toString()?.toUpperCase() + '__',
                    value: '>>> **OLD VALUE**: `' + (changes.old ?? 'Unassigned') + '`\n**NEW VALUE**: `' + (changes.new ?? 'Unassigned') + '`',
                    inline: true,
                }}),
            })]
        });
    }

}

module.exports = PlayerLogger;