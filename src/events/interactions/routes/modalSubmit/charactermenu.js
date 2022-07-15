const { ModalSubmitInteraction, MessageEmbed } = require('discord.js');
const CharacterMenu = require('../../../../util/CharacterMenu/CharacterMenu');
const CoreUtil = require('../../../../util/CoreUtil');
const Player = require('../../../../util/Account/Player');
const stats = require('../../../../util/CharacterMenu/stats.json');

/** @param {ModalSubmitInteraction} modal */
module.exports = async (modal) => {
    
    const instance = CharacterMenu.getMenuFromModal(modal);
    if (!instance) return modal.reply({ content: 'No longer valid', ephemeral: true });

    const [_, action, editTarget] = modal.customId.split(':');
    if (!instance.isAdmin && !Player.allowedToEdit(instance.interaction.guild.id, instance.interaction.user.id)
    && editTarget != 'INFO')
        return modal.reply({
            embeds: [new MessageEmbed({
                title: '🔒 Your editing has been locked.',
                description: '> All changes were discarded.'
            })]
        });
    const errors = [];

    // handle info correctly
    if (editTarget === 'INFO') {
        const name = modal.fields.getField('name').value || null;
        const clan = modal.fields.getField('clan').value || null;
        const personality = modal.fields.getField('personality').value || null;
        const background = modal.fields.getField('background').value || null;
        const image = modal.fields.getField('image').value || null;

        if (clan) instance.character.clan = clan;
        instance.character.name = name;
        instance.character.personality = personality;
        instance.character.background = background;
        instance.character.image = image;
    }
    else if (editTarget === 'AGE') {
        const age = modal.fields.getField('age').value;
        let parsed = parseInt(age);

        if (parsed === NaN) errors.push([
            'moons', 'Please only enter numerical values.'
        ]);
        else if (age === '' || parsed < 0) {
            parsed = -1;
            instance.character.moons = parsed;
        }
        else instance.character.moons = parsed;
    }

    // handle section edits
    else modal.fields.components.forEach((actionRow) => {
        const { customId, value } = actionRow.components[0];
        let parsedValue = value.length > 0 ? parseInt(value) : '-1';
        if (parsedValue === '-1') return errors.push([
            customId, 'Please ensure you don\'t forget to enter a value between `' + stats[customId].range[0] + '`-`' + stats[customId].range[1] + '`'
        ]);
        else if (parsedValue === NaN) return errors.push([
                customId, 'Please only enter numerical values.'
        ]);
        else if (parsedValue < stats[customId].range[0]
        || parsedValue > stats[customId].range[1]) return errors.push([
            customId, 'Please enter a number in the following range: `' + stats[customId].range[0] + '`-`' + stats[customId].range[1] + '`'
        ]);

        instance.character.stats[customId] = parseInt(value);
    });

    // save and re-render
    const embeds = [new MessageEmbed({
        title: '✅ Edits successful!',
        color: 'GREEN',
    })];
    if (errors.length) embeds.push(new MessageEmbed({
        title: '⚠️ Whoops-! Something\'s a bit off...',
        color: 'RED',
        description: 'There were a few values that were\'t quite right! They have been reset to their original values.\n\n'
        + errors.map(([customId, errorMessage]) => stats[customId].flair + ' **' + stats[customId].name + '**\n> ' + errorMessage).join('\n')
    }));
    instance.character.save();
    CoreUtil.Characters.cache.set(instance.authorSnowflake.guild.id, instance.authorSnowflake.user.id, instance.character);
    modal.reply({ embeds, ephemeral: true });
    instance.render();
    
}