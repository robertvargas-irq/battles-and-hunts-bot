module.exports = {
    name: 'pong',
    description: 'Replies with Ping!',
    async execute( interaction ) {
        await interaction.reply('Ping!');
        if ( interaction.user.id == process.env.OWNER_ID )
            await interaction.client.emit('guildMemberAdd', interaction.member );
    },
};