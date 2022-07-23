const { ModalSubmitInteraction, EmbedBuilder } = require('discord.js');
const CharacterMenu = require('../../../../util/CharacterMenu/CharacterMenu');
const CoreUtil = require('../../../../util/CoreUtil');
const Player = require('../../../../util/Account/Player');
const stats = require('../../../../util/Stats/stats.json');
const Hunger = require('../../../../util/Hunting/Hunger');
const AdminLogger = require('../../../../util/Loggers/AdminLogger.js');
const PlayerLogger = require('../../../../util/Loggers/PlayerLogger.js');

/** @param {ModalSubmitInteraction} modal */
module.exports = async (modal) => {
    
    const instance = CharacterMenu.getMenuFromModal(modal);
    if (!instance) return modal.reply({
        ephemeral: true,
        content: '**This editor is no longer valid. Please open a new one if you wish to proceed.**'
        + '\n> This may have been caused by another editor being opened, or the bot having restarted.'
    });
    
    const [_, action, editTarget] = modal.customId.split(':');
    if (editTarget.startsWith('SECTION') && !instance.isAdmin && !instance.registering && !Player.allowedToEdit(instance.interaction.guild.id, instance.interaction.user.id))
        return modal.reply({
            ephemeral: true,
            embeds: [EmbedBuilder.from({
                title: '🔒 Your editing is currently locked.',
                description: '> All changes were discarded.'
            })]
        });
        
    // handle info correctly
    const changes = [];
    const errors = [];
    const server = CoreUtil.Servers.cache.get(modal.guild.id);
    if (editTarget === 'INFO') {
        const parseAge = (age) => {

            if (isNaN(age)) {
                errors.push([
                    'moons', 'Please only enter numerical values.'
                ]);
            }
            else if (age === '' || age < 0) {
                age = 0;
            }

            return parseInt(age);
        };
        const isValidClan = (clan) => server.clans.hasOwnProperty(clan.toLowerCase());
        const name = modal.fields.getField('name').value || null;
        const clan = modal.fields.getField('clan').value || null;
        const age = parseAge(modal.fields.getField('age').value);
        const personality = modal.fields.getField('personality').value || null;
        const background = modal.fields.getField('background').value || null;
        
        if (!isNaN(age)) {
            // for logging purposes
            changes.push({
                property: 'age',
                old: instance.character.moons,
                new: age,
            });
            instance.character.moons = age;
        }
        if (clan) {
            if (clan.toLowerCase() === 'none') {
                // for logging purposes
                changes.push({
                    property: 'clan',
                    old: instance.character.clan,
                    new: null,
                });
                instance.character.clan = null;
            }
            else if (isValidClan(clan)) {
                // for logging purposes
                changes.push({
                    property: 'clan',
                    old: instance.character.clan,
                    new: clan.toLowerCase(),
                });
                instance.character.clan = clan.toLowerCase();
            }
            else errors.push([
                'clan',
                'Clan must be one of the following: \n> '
                + [...Object.keys(server.clans), 'None'].map(c => '`' + CoreUtil.ProperCapitalization(c) + '`').join(' | ')]);
        }

        // for logging purposes
        changes.push(
            {
                property: 'name',
                old: instance.character.name,
                new: name,
            },
            {
                property: 'personality',
                old: instance.character.personality,
                new: personality,
            },
            {
                property: 'background',
                old: instance.character.background,
                new: background,
            },
        );

        instance.character.name = name;
        instance.character.personality = personality;
        instance.character.background = background;
    }
    else if (editTarget === 'IMAGES') {
        const image = modal.fields.getField('image').value || null;
        const icon = modal.fields.getField('icon').value || null;

        // for logging purposes
        changes.push(
            {
                property: 'image',
                old: instance.character.image,
                new: image,
            },
            {
                property: 'icon',
                old: instance.character.icon,
                new: icon,
            },
        );
        
        // set given image and icon
        instance.character.image = image;
        instance.character.icon = icon;
    }

    else if (editTarget === 'PRONOUNS') {

        const subjective = modal.fields.getField('subjective').value?.toLowerCase().replace(/[^A-Za-z]/g, '') || null;
        const objective = modal.fields.getField('objective').value?.toLowerCase().replace(/[^A-Za-z]/g, '') || null;
        const possessive = modal.fields.getField('possessive').value?.toLowerCase().replace(/[^A-Za-z]/g, '') || null;

        // for logging purposes
        changes.push(
            {
                property: 'Pronouns: Subjective',
                old: instance.character.pronouns.subjective,
                new: subjective,
            },
            {
                property: 'Pronouns: Objective',
                old: instance.character.pronouns.objective,
                new: objective,
            },
            {
                property: 'Pronouns: Possessive',
                old: instance.character.pronouns.possessive,
                new: possessive,
            },
        );

        // set new values
        instance.character.pronouns.subjective = subjective;
        instance.character.pronouns.objective = objective;
        instance.character.pronouns.possessive = possessive;
    }

    // handle section edits
    else modal.fields.components.forEach((actionRow) => {
        const { customId, value } = actionRow.components[0];
        let parsedValue = value.length > 0 ? parseInt(value) : '-1';
        if (parsedValue === '-1') return errors.push([
            customId, 'Please ensure you don\'t forget to enter a value between `' + stats[customId].min + '`-`' + stats[customId].max + '`'
        ]);
        else if (parsedValue === NaN) return errors.push([
                customId, 'Please only enter numerical values.'
        ]);
        else if (parsedValue < stats[customId].min
        || parsedValue > stats[customId].max) return errors.push([
            customId, 'Please enter a number in the following range: `' + stats[customId].min + '`-`' + stats[customId].max + '`'
        ]);

        // for logging purposes
        changes.push({
            property: (stats[customId]?.flair ?? '') + ' ' + stats[customId].name,
            old: instance.character.stats[customId].toString(),
            new: value.toString(),
        });

        // save to character
        instance.character.stats[customId] = parseInt(value);
        if (customId === 'cat_size') Hunger.validateHunger(instance.character);
    });

    // log as an admin override if not the author
    if (instance.isAdmin && !instance.isAuthor && changes.length) AdminLogger.fetchLogChannel(modal.guild, server).then(channel => {
        AdminLogger.characterOverride(
            channel,
            modal.member,
            instance.authorSnowflake,
            changes.filter((change) => change.old != change.new)
        );
    });

    // log as a change if character is not yet approved
    if (instance.isAuthor && !instance.registering) PlayerLogger.fetchLogChannel(modal.guild, server).then(channel => {
        PlayerLogger.characterEdits(
            channel,
            modal.member,
            changes.filter((change) => change.old != change.new)
        );
    });

    // save and re-render
    const embeds = [EmbedBuilder.from({
        title: '✅ Edits successful!',
        color: 'Green',
    })];
    if (errors.length) embeds.push(EmbedBuilder.from({
        title: '⚠️ Whoops-! Something\'s a bit off...',
        color: 'Red',
        description: 'There were a few values that were\'t quite right! They have been reset to their original values.\n\n'
        + errors.map(([customId, errorMessage]) =>
        (stats[customId]?.flair ?? '') + ' **' +
        (stats[customId]?.name ?? CoreUtil.ProperCapitalization(customId)) + '**\n> ' + errorMessage).join('\n')
    }));
    instance.character.save();
    CoreUtil.Characters.cache.set(instance.authorSnowflake.guild.id, instance.authorSnowflake.user.id, instance.character);
    modal.reply({ embeds, ephemeral: true });
    instance.render();
    
}