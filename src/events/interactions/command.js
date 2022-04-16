const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');

const restrictions = require('./restrictions.json');

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
        let wrongId = wrongChannel(interaction);
        console.log({wrongId});
        if (wrongId) return wrongChannelMessage(interaction, wrongId);

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




function wrongChannel(interaction) {

    // administrator override
    if (interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS))
    return false;

    // if guild has no data return
    const R_GUILD = restrictions[interaction.guild.id];
    console.log({R_GUILD});
    if (!R_GUILD) return false;

    // get channel restrictions
    const R_CHANNEL = R_GUILD.CHANNELS[interaction.channel.id];
    const R_COMMAND = R_GUILD.COMMANDS[interaction.commandName];

    console.log({R_CHANNEL, R_COMMAND});
    // if no restrictions, return
    if (!R_CHANNEL && !R_COMMAND) return false;

    // initialize tests
    if (R_CHANNEL && !R_CHANNEL.some(n => n === interaction.commandName)) return [1, R_CHANNEL];
    if (R_COMMAND && !R_COMMAND.some(id => id === interaction.channel.id)) return [2, R_COMMAND];

}

async function wrongChannelMessage(interaction, [code, list]) {
    console.log({code, list});
    // console.log(map);
    const description = (
        code == 1
        ? '**This channel is only for the following commands:**\n'
        + list.map(v => "`/" + v + "`").join('\n')
        + "\n\n**Please only use these commands in this channel!**\nThank you! ❣️"
        : '**This command can only be used in the following channels:**\n'
        + list.map(v => "<#" + v + ">").join('\n')
        + "\n\n**Please only use these commands in this channel!**\nThank you! ❣️"
    )
    return await interaction.reply({
        ephemeral: true,
        embeds: [new MessageEmbed()
            .setColor('BLUE')
            .setTitle('❗ __Woah There!__')
            .setDescription(description)]
    })
}