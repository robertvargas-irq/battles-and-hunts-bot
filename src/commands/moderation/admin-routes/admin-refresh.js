const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const CoreUtil = require('../../../util/CoreUtil');
const CharacterModel = require('../../../database/schemas/character');


/**
 * @param {BaseCommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'clan-affiliations': {
            
            // defer reply
            await interaction.deferReply();
            
            // get special exemption roles
            const clans = Object.keys(CoreUtil.Servers.cache.get(interaction.guild.id).clans);

            // get all users from the database and members from the guild
            const CharacterDocuments = CoreUtil.Characters.cache.getAll(interaction.guild.id);
            const GuildMembers = await interaction.guild.members.fetch();

            console.log({clans});

            // compare and only push members that are not registered
            for (let [_, character] of CharacterDocuments) {

                // if not in the guild anymore, continue
                if (!GuildMembers.has(character.userId)) continue;

                const member = GuildMembers.get(character.userId);

                // filter bots and testing user
                if (member.user.bot || member.user.id === '964281330609315872') continue;

                // find clan in their roles; if none continue
                let clanRole;
                member.roles.cache.find(r => {
                    // if name matches a clan name, return it
                    let name = r.name.toLowerCase().replace(/[^a-zA-Z]/g, '');
                    if (clans.some(c => c == name)) {
                        clanRole = name;
                        return true;
                    }
                    return false;
                });
                if (!clanRole) continue;

                // update clan affiliation
                character.clan = clanRole;
            }

            // save all changes to the database
            CharacterModel.bulkSave(Array.from(CharacterDocuments.values()))
                .then(() => console.log('All characters\' clan affiliations have been saved successfully to the database.'))
                .catch(e => console.error('There was a problem updating clan affiliations in the database.\n' + e));

            // notify successful set
            return interaction.editReply({
                embeds: [new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle('✅ Refreshed everyone\'s clan affiliations.')
                    .setDescription('Everyone\'s affiliations should now be properly accounted for.')
                ]
            });
        }
    }

}