const { SelectMenuInteraction } = require('discord.js');

module.exports = async (/**@type {SelectMenuInteraction}*/ interaction) => {
    const [MENU_ID, ...ARGS] = interaction.customId.split(':');
    switch (MENU_ID) {
        case 'ALLOWEDSUBMISSIONS': return require('./routes/selectMenu/allowedsubmissions')(interaction);
    }
}