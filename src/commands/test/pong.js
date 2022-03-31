module.exports = {
    name: 'pong',
    description: 'Replies with Ping!',
    guilds: ['957854680367648778', '954037682223316992'],
    async execute( interaction ) {
        await interaction.reply('Ping!');
        if ( interaction.user.id == process.env.OWNER_ID )
            await interaction.client.emit('guildMemberAdd', interaction.member );
    },
};