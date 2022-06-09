const { MessageEmbed } = require('discord.js');
const CoreUtil = require('../../util/CoreUtil');



module.exports = {
    name: 'owner',
    description: 'Owner Only',
    async execute( interaction ) {

        // filter out those who are not the bot owner
        if (interaction.user.id !== process.env.OWNER_ID) return interaction.reply({ ephemeral: true, content: '❌' });

        /**
         * Perform the required operation.
         */

        /**
         * Map User data to a new Member model
         * 
         * TBS Server ID: 954037682223316992
         * 
         * User.hunting {}
         */
        await interaction.deferReply({ ephemeral: true });
        const allUsers = await CoreUtil.Users.FetchAll();
        MapUserToMember(allUsers, interaction.guild.id).then(() => interaction.followUp({
            ephemeral: true,
            content: '✅ Users successfully mapped to Member entries.'
        }));
        MapUserToCharacter(allUsers, interaction.guild.id).then(() => interaction.followUp({
            ephemeral: true,
            content: '✅ Users successfully mapped to Character entries.'
        }));

    },
};

async function MapUserToMember(users, guildId) {
    const operations = [];
    for (const user of users) {
        const newMember = await CoreUtil.Members.FetchOne(guildId, user.userId);
        newMember.hunting = {...user.hunting};
        operations.push(newMember.save().then(() => console.log('Successfully mapped User ' + user.userId + ' data to Member equivalent.')));
    }

    return await Promise.all(operations);
}

async function MapUserToCharacter(users, guildId) {
    const operations = [];
    for (const user of users) {
        const newCharacter = await CoreUtil.Characters.FetchOne(guildId, user.userId);
        newCharacter.hunting = {...user.hunting};
        newCharacter.stats = {...user.stats};
        newCharacter.currentHealth = user.currentHealth;
        newCharacter.currentHunger = user.currentHunger;
        newCharacter.clan = user.clan;
        operations.push(newCharacter.save().then(() => console.log('Successfully mapped User ' + user.userId + ' data to Character equivalent.')));
    }

    return await Promise.all(operations);
}