const { MessageEmbed } = require('discord.js');
const os = require('os');

module.exports = {
    name: 'ping',
    description: 'Replies with Pong, and the bot\'s uptime!',
    async execute( interaction ) {

        // convert seconds properly
        let ut_sec = os.uptime();
        let ut_min = ut_sec / 60;
        let ut_hour = ut_min / 60;
        
        // remove the decimal and convert to clock units
        ut_sec = Math.floor(ut_sec) % 60;
        ut_min = Math.floor(ut_min) % 60;
        ut_hour = Math.floor(ut_hour) % 60;

        // pong
        return await interaction.reply({
            embeds: [new MessageEmbed({
                color: 'AQUA',
                title: '🏓 Pong!',
                description: '**Bot Uptime**'
                + '\n'
                + '`' + ut_hour + "` hour" + (ut_hour != 1 ? 's' : '') + ', '
                + '`' + ut_min + "` minute" + (ut_min != 1 ? 's' : '') + ', '
                + " and " 
                + '`' + ut_sec + "` second" + (ut_sec != 1 ? 's' : '') + '.'
                // Printing os.uptime() value
            })],
            ephemeral: true,
        });

    },
};