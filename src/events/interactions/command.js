const { MessageEmbed } = require('discord.js');
const fs = require('fs');

const restrictedChannels = new Map(require('./restrictions.json').ChannelToSpecific.map(([k,v]) => [k, new Set(v)]));

module.exports = async ( interaction ) => {

    if ( !interaction.client.commands.has( interaction.commandName ) ) return;

    console.log({
        commandName: interaction.commandName,
        commandId: interaction.commandId,
        calledBy: ( interaction.commandName == 'feedback' )
            ? '# Anonymized #'
            : interaction.user.tag + ' (' + interaction.user.id + ')',
        calledOn: (new Date()).toLocaleDateString(),
        calledAt: (new Date()).toLocaleTimeString(),
    });
    
    // execute command
    try {
        // error if the channel id is restricted and wrong command is used
        let check = restrictedChannels.get(interaction.channel.id);
        if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)
        && restrictedChannels.has(interaction.channel.id)) {
            if (!check.has(interaction.commandName)) {
                return interaction.reply({
                    ephemeral: true,
                    embeds: [new MessageEmbed()
                        .setColor('BLUE')
                        .setTitle('❗ __Woah There!__')
                        .setDescription('**This channel (<#'
                        + interaction.channel.id
                        + ">) is only for the following commands:\n"
                        + Array.from(check.values()).map(v => "`/" + v + "`").join('\n')
                        + "\n\n**Please only use these commands in this channel!**\nThank you! ❣️"
                    )]
                })
            }
        }
        await interaction.client.commands.get( interaction.commandName ).execute( interaction ).catch();
    }
    catch ( error ) {
        console.error( error );

        // const write = fs.createWriteStream( `./logs/Error Log - ${Date().replace(/:/g, "-")}.txt` );
        console.error( `${Date()}\n\n`
            + `Command: ${interaction.commandName}\n`
            + `Guild: ${interaction.guild.name} (${interaction.guild.id})\n`
            + `Caller: ${interaction.user.tag} (${interaction.user.id})\n`
            + `${error.stack}` );
        // write.close();

        // send error message
        try {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
        }
        catch {
            await interaction.editReply({ content: 'There was an error while executing this command!' });
        }

    }
}