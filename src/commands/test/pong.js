const { CommandInteraction } = require('discord.js');
const CoreUtil = require("../../util/CoreUtil");

module.exports = {
    name: 'pong',
    description: 'Replies with Ping!',
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {

        // filter out non-owner
        if (interaction.user.id !== process.env.OWNER_ID) return interaction.reply('Ping!');
        
        // temporary script goes here
        await interaction.reply({ content: 'Executing owner script.' });
        
        const members = await interaction.guild.members.fetch();
        const characters = CoreUtil.Characters.cache.getAll(interaction.guild.id);

        // mark not-approved for those with the "Permanently dead role"
        let unapproved = 0;
        let unapprovedAndDead = 0;
        let approved = 0;
        let approvedAndSurvived = 0;
        characters.forEach((character) => {

            if (!members.get(character.userId)) return;

            if (!character.approved) unapproved++;
            else approved++;

            if (!character.approved && members.get(character.userId).roles.cache.has('992946753731035246')) unapprovedAndDead++;
            if (character.approved && members.get(character.userId).roles.cache.has('992946700207530035')) approvedAndSurvived++;
        });

        const deadRole = await interaction.guild.roles.fetch('992946753731035246');
        const survivorRole = await interaction.guild.roles.fetch('992946700207530035');
        
        interaction.editReply({
            content: 'Perm. Dead: ' + deadRole.members.size
            + '\nUnapproved Chars. ' + unapproved
            + '\nUnapproved Chars. belonging to Perm dead ' + unapprovedAndDead
            + '\n\nSurvivors: ' + survivorRole.members.size
            + '\nApproved Chars. ' + approved
            + '\n\nApproved Chars. belonging to Survivors ' + approvedAndSurvived
        });
    },
};