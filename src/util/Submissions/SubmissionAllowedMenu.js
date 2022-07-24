const { SelectMenuBuilder } = require("@discordjs/builders");
const { CommandInteraction, EmbedBuilder, Colors, ActionRowBuilder } = require("discord.js");
const ages = require('../CharacterMenu/ages.json');
const agesArray = Object.entries(ages);
const CoreUtil = require("../CoreUtil");

class SubmissionAllowedMenu {

    /**
     * Submission Allowed menu to configure what submissions are allowed
     * @param {CommandInteraction} interaction
     * @param {import("../../database/schemas/server").ServerSchema} server 
     */
    constructor(interaction, server) {
        this.interaction = interaction;
        this.server = server;
    }

    /**
     * 
     * @param {import("../../database/schemas/server").ServerSchema} server 
     */
    static generateAllowedMenu = (server) => new EmbedBuilder({
        color: Colors.Aqua,
        title: '⚙️ Character Submissions Config Menu',
        description: '**Swamped by Character Submissions of a specific Character Age Group?** Not to worry!'
        + '\n> Welcome to the Character Submissions config!'
        + '\n> This menu allows you to set what submissions are currently being accepted!'
    });

    /**
     * Generate allowed Character Age Range submissions
     * @param {import("../../database/schemas/server").ServerSchema} server 
     */
    static generateAllowedCharacterAgeDropdown = (server) => new SelectMenuBuilder({
        custom_id: 'ALLOWEDSUBMISSIONS:AGE',
        min_values: 0,
        max_values: agesArray.length,
        placeholder: 'Choose allowed Character Age Groups',
        options: agesArray.map(([ageTitle, [min, max]]) => { return {
            label: ageTitle,
            value: ageTitle,
            description: '⟪' + min + '⟫ → ⟪' + max + '⟫ Moons',
            default: !server.submissions.paused.ages.has(ageTitle),
        }}),
    });

    render = async () => CoreUtil.SafeReply(this.interaction, {
        ephemeral: true,
        embeds: [SubmissionAllowedMenu.generateAllowedMenu(this.server)],
        components: [new ActionRowBuilder({
            components: [SubmissionAllowedMenu.generateAllowedCharacterAgeDropdown(this.server)],
        })],
    });
}

module.exports = SubmissionAllowedMenu;