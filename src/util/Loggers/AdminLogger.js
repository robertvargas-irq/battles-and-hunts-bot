const { GuildMember, TextChannel, MessageEmbed } = require('discord.js');

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
        return loggingChannel.send({
            embeds: [new MessageEmbed({
                color: 'BLURPLE',
                thumbnail: { url: administrator.user.avatarURL() },
                title: '📝 Character Administrator Override',
                description: `<@${administrator.user.id}>(${administrator.user.tag}) has overriden items from <@${target.user.id}>(${target.user.tag}) Character.`,
                fields: overrides.map((changes) => {return {
                    name: '__' + changes.property?.toString()?.toUpperCase() + '__',
                    value: '>>> **OLD VALUE**: `' + (changes.old ?? 'Unassigned') + '`\n**NEW VALUE**: `' + (changes.new ?? 'Unassigned') + '`',
                    inline: true,
                }}),
            })]
        });
    }

}

module.exports = AdminLogger;