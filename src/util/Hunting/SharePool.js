const { EmbedBuilder, Message, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } = require('discord.js');
const HuntManager = require('./HuntManager');

class SharePool {
    
    /**
     * Maximum amount of active shared prey embeds */
    static #MAX_SHARed_PREY = 100;

    /**
     * @type {Map<guildId, Map<messageId, prey: prey>>}
     * Caught prey mapped out as shared */
    static #sharePool = new Map();

    static witherPrey = (message) => {
        return message.edit({
            embeds: [EmbedBuilder.from({
                color: 'DarkAqua',
                footer: { text: 'This catch has withered away...' },
            })],
            components: [],
        }).catch(console.error);
    }

    static storeShared = (originalMessage, prey) => {

        // instantiate server if not already
        if (!this.#sharePool.has(originalMessage.guild.id))
            this.#sharePool.set(originalMessage.guild.id, new Map());

        // make room in the share pool if necessary
        const server = this.#sharePool.get(originalMessage.guild.id);
        if (server.size >= this.#MAX_SHARed_PREY) {
            const [messageId] = server.keys();
            server.delete(messageId);
        }
        server.set(originalMessage.id, prey);
        console.log({server});

    }

    static removeShared = (guildId, messageId) => {

        // get server
        const server = this.#sharePool.get(guildId);
        if (!server) return false;
        
        // remove shared
        return server.delete(messageId);
    }

    static getShared = (message) => {
        
        // instantiate server if not already
        if (!this.#sharePool.has(message.guild.id))
            this.#sharePool.set(message.guild.id, new Map());

        // return prey
        return this.#sharePool.get(message.guild.id).get(message.id) ?? null;
    }

    /**
     * Mark a prey catch as Shared from a Hunt
     * @param {ButtonInteraction} button
     * @param {Message} message Message to mark as shared
     */
    static markSharedFromHunt = async (button, message) => {

        // get prey information
        const preyInformation = HuntManager.getRecentlyCaught(message.guild.id, message.id);
        if (!preyInformation) {
            button.deferUpdate();
            return this.witherPrey(message);
        }

        // deconstruct
        const { prey, originalMember } = preyInformation;

        // ensure original member is the one clicking
        if (originalMember.user.id != button.user.id) return button.reply({
            embeds: [EmbedBuilder.from({
                color: 'Red',
                title: '⚠️ You can only share your own catches!',
            })]
        });

        // get character information
        const character = HuntManager.Characters.cache.get(message.guild.id, originalMember.user.id);

        // enter into SharePool
        this.storeShared(message, prey);

        // display Share notification with Share buttons
        button.deferUpdate();
        return message.edit({
            embeds: [this.generateShareEmbed(prey, character, originalMember)],
            components: [new ActionRowBuilder({
                components: [new ButtonBuilder({
                    customId: 'PREY:COLLECT',
                    label: 'Collect',
                    emoji: '🎒',
                    style: ButtonStyle.Success,
                })],
            })],
        });
    }

    static generateShareEmbed = (prey, character, member) => EmbedBuilder.from({
        color: 'Gold',
        title: '💖🥬 Shared Prey',
        thumbnail: { url: character.icon ?? member.displayAvatarURL({ dynamic: true }) },
        image: prey.visual ? { url: prey.visual } : undefined,
        description: '**' + (character.name ?? member.displayName + '\'s character') + '** has shared the following:'
        + '\n\n**Prey Information**'
        + '\n> Name: ' + HuntManager.ProperCapitalization(prey.name)
        + '\n> Size in Bites: ' + prey.size
        + '\n> Bites Remaining: ' + prey.bites_remaining
    });
    
}

module.exports = SharePool;