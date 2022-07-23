const { EmbedBuilder, PermissionsBitField, CommandInteraction, Colors } = require('discord.js');

const restrictions = require('./restrictions.json');

/** @param {CommandInteraction} interaction */
module.exports = async ( interaction ) => {

    if ( !interaction.client.commands.has( interaction.commandName ) ) return;

    const SubcommandGroup = interaction.options.getSubcommandGroup(false) || null;
    const Subcommand = interaction.options.getSubcommand(false) || null;

    console.log('🏓 COMMAND CALL', {
        command: {
            id: interaction.commandId,
            name: interaction.commandName,
            subcommandGroup: SubcommandGroup || '---',
            subcommand: Subcommand || '---',
        },
        called: {
            by: interaction.user.tag + ' (' + interaction.user.id + ')',
            on: (new Date()).toLocaleDateString(),
            at: (new Date()).toLocaleTimeString(),
        },
        in: {
            guild: interaction.guild.name + ' (' + interaction.guild.id + ')',
            channel: interaction.channel.name + ' (' + interaction.channel.id + ')',
            type: interaction.channel.type
        },
    }, 'END CALL ⏹️');
    
    // execute command
    try {
        // error if the channel id is restricted and wrong command is used
        let wrongId = !(interaction.commandName === 'admin' || interaction.commandName === 'spawn')
        && wrongChannel(interaction);
        
        if (wrongId) return wrongChannelMessage(interaction, wrongId);

        await interaction.client.commands.get(interaction.commandName).execute(interaction).catch(console.error);
    }
    catch (error) {
        console.error(error);

        console.error( `${Date()}\n\n`
            + `Command: ${interaction.commandName}\n`
            + `Subcommand Group: ${SubcommandGroup}\n`
            + `Subcommand: ${Subcommand}\n`
            + `Guild: ${interaction.guild.name} (${interaction.guild.id})\n`
            + `Caller: ${interaction.user.tag} (${interaction.user.id})\n`
            + `${error.stack}` );

        // send error message
        if (!interaction.replied)
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
        else
            await interaction.editReply({ content: 'There was an error while executing this command!' });

    }
}




function wrongChannel(interaction) {

    // administrator override
    if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
    return false;

    // if guild has no data return
    const R_GUILD = restrictions[interaction.guild.id];
    // console.log({R_GUILD});
    if (!R_GUILD) return false;

    // get channel restrictions
    const R_CHANNEL = R_GUILD.CHANNELS[interaction.channel.id];
    const R_COMMAND = R_GUILD.COMMANDS[interaction.commandName];

    // console.log({R_CHANNEL, R_COMMAND});
    // if no restrictions, return
    if (!R_CHANNEL && !R_COMMAND) return false;

    // initialize tests
    if (R_CHANNEL && !R_CHANNEL.some(n => n === interaction.commandName)) return [1, R_CHANNEL];
    if (R_COMMAND && !R_COMMAND.some(id => id === interaction.channel.id)) return [2, R_COMMAND];

}

async function wrongChannelMessage(interaction, [code, list]) {
    const description = (
        code == 1
        ? '**This channel is only for the following commands:**\n'
        + list.map(v => "`/" + v + "`").join('\n')
        + "\n\n**Please only use these commands in this channel!**\nThank you! ❣️"
        : '**This command can only be used in the following channels:**\n'
        + list.map(v => "<#" + v + ">").join('\n')
        + "\n\n**Please only use these commands in this channel!**\nThank you! ❣️"
    )

    const messagePayload = {
        ephemeral: true,
        embeds: [new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle('❗ __Woah There!__')
            .setDescription(description)]
    };

    // notify
    if (!interaction.replied) return await interaction.reply(messagePayload);
    return await interaction.editReply(messagePayload);
}