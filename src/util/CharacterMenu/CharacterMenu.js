const {
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
    ActionRowBuilder,
    TextInputBuilder,
    ButtonInteraction,
    ModalSubmitInteraction,
    PermissionsBitField,
    ModalBuilder,
    Colors,
} = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const CoreUtil = require('../CoreUtil');
const StatCalculator = require('../Stats/StatCalculator');

const stats = require('../Stats/stats.json');
const SubmissionHandler = require('../Submissions/SubmissionHandler');
const statSections = ['🍓', '🫐', '🍋'];
const statArray = Object.entries(stats);

const ageTitles = require('./ages.json');
const ageTitlesArray = Object.entries(ageTitles);

/** @type {Map<guildId, Map<userId, CharacterMenu>>} */
const activeEdits = new Map();

class CharacterMenu {

    /**
     * Character Menu for Registration, Editing, and Admin Overrides
     * @param {CommandInteraction} interaction Discord Interaction
     * @param {GuildMember} authorGuildMemberSnowflake Discord GuildMember object for author
     * @param {CharacterModel} character Character database entry
     */
    constructor(interaction, authorGuildMemberSnowflake, character,
    editingEnabled = false, statsLocked = true, forceNotEditing = false) {
        this.interaction = interaction;
        this.authorSnowflake = authorGuildMemberSnowflake;
        this.character = character || new CharacterModel({
            guildId: authorGuildMemberSnowflake.guild.id,
            userId: authorGuildMemberSnowflake.user.id,
        });
        this.statsLocked = statsLocked;
        this.isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
        this.isAuthor = interaction.user.id === authorGuildMemberSnowflake.user.id;
        this.registering = !forceNotEditing && this.isAuthor && !character.approved;
        this.editingEnabled = !forceNotEditing && (this.registering || (this.isAdmin || (this.isAuthor && editingEnabled)));
        this.forceNotEditing = forceNotEditing;

        this.messageId = null;
    }

    static statHelpEmbed = EmbedBuilder.from({
        color: Colors.Aqua,
        title: '💡 Stats & What They Mean',
        fields: statArray.map(([_, statData]) => {return {
            name: statData.flair + ' ' + statData.name,
            value: statData.description,
        }}),
    });

    /**
     * Construct a character embed
     * @param {CharacterModel} character 
     * @param {GuildMember} author 
     * @param {boolean} editingEnabled 
     * @param {boolean} statsLocked 
     * @param {boolean} isAdmin 
     * @returns {EmbedBuilder}
     */
    static constructEmbed(character, author, editingEnabled = false, statsLocked = true, isAdmin = false) {
        let statSection = 0;
        const c = character;
        const s = author;
        const statPointTotal = statArray.slice(1).reduce((previousValue, currentValue) => previousValue + c.stats[currentValue[0]], 0).toString();
        const embed = EmbedBuilder.from({
            color: s.displayColor || 0x76e3ed,
            author: { name: '« ' + (c.name ?? s.displayName + '\'s unnamed character') + ' »', iconURL:  c.icon ?? s.displayAvatarURL({ dynamic: true }) },
            image: { url: c.image || undefined },
            description: '🍵 **Basic Background**\n>>> ' + (c.background || '`None given.`') + '\n\n⇸',
            fields: [
                ...statArray.map(([stat, data]) => { return {
                    name: (editingEnabled && (!statsLocked || isAdmin)
                        ? statSections[Math.floor(statSection++ / statSections.length)] + ' | '
                        : ''
                    ) + data.flair + ' ' + data.name,
                    value: '> ↣ `' + (c.stats[stat] > -1 ? c.stats[stat] : 'Not assigned').toString() + '`',
                    inline: true,
                }}),
                {
                    name: '🧮 Stat Point Total',
                    value: '> `' + statPointTotal + '`',
                    inline: true,
                },
                {
                    name: '🦾 Battle Power',
                    value: '> `' + StatCalculator.calculateBattlePower(c) + '`/`' + StatCalculator.max.battlePower + '`',
                    inline: true,
                },
                {
                    name: '\u200B',
                    value: '\u200B',
                    inline: true,
                },
                {
                    name: 'Clan',
                    value: '> `' + (c.clan?.toUpperCase() || 'Not chosen') + '`',
                },
                {
                    name: 'Age (Moons)',
                    value: '> `' + (c.moons > -1 ? c.moons : 'Not assigned').toString() + '` **⟪ ' + CharacterMenu.getAgeTitle(c.moons ?? 0) + ' ⟫**',
                },
                {
                    name: 'Pronouns',
                    value: '>>> `' + (c.pronouns.subjective ?? '____') + '`/`' + (c.pronouns.objective ?? '____') + '`/`' + (c.pronouns.possessive ?? '____') + '`',
                },
                {
                    name: 'Personality',
                    value: '>>> ' + (c.personality || '`None given.`'),
                },
            ],
            footer: {
                text: `This character belongs to ${s.user.tag}(${s.user.id})`
                + (!character.approved ? ' | ⚠️ Character is not yet approved by an administrator.' : ''),
                iconURL: s.displayAvatarURL(),
            },
        });

        // add image label if image provided
        if (c.image) embed.addFields([{ name:'\u200B', value: '🖼️ **Character Reference Image**' }]);

        return embed;
    }

    /**
     * Construct auxilary embed for character icon
     * @param {CharacterModel} character 
     * @param {GuildMember} author 
     */
    static iconEmbed = (character, author) => EmbedBuilder.from({ thumbnail: {
        url: character.icon ?? author.displayAvatarURL({ dynamic: true }) }
    });

    /**
     * Render menu to the user
     * @returns {Promise<CharacterMenu>}
     */
    async render() {
        const icon = CharacterMenu.iconEmbed(this.character, this.authorSnowflake);
        const embed = CharacterMenu.constructEmbed(this.character, this.authorSnowflake, this.editingEnabled, this.statsLocked, this.isAdmin);

        // package message payload
        const components = [];
        if (this.editingEnabled) components.push(...generateEditingRows(this, statSections));
        if (this.registering) components.push(new ActionRowBuilder({
            components: [generateSubmitButton(this)]
        }));
        const payload = {
            embeds: [icon, embed, ...generateAuxilaryEmbeds(this)],
            ephemeral: this.editingEnabled,
            components,
        }
        
        // display to user
        if (this.interaction.replied || this.interaction.deferred)
            await this.interaction.editReply(payload).catch(() => this.interaction.followUp(payload));
        else
            await this.interaction.reply(payload);
        
        // mark editing if editing
        if (this.editingEnabled) this.markEditing();

        // allow function linking
        return this;
    }

    /**
     * Store object for editing in menus
     * @return {CharacterMenu}
     */
    markEditing() {
        // create guild index if not already present
        if (!activeEdits.has(this.interaction.guild.id))
            activeEdits.set(this.interaction.guild.id, new Map());
        
        // link object to user
        activeEdits.get(this.interaction.guild.id).set(this.interaction.user.id, this);
        return this;
    }

    /**
     * Display editing Modal
     * @param {ButtonInteraction} buttonPressed
     * @param {string} toEdit The specific section or type of information to edit
     * @returns {CharacterMenu}
     */
    displayEditModal(buttonPressed, toEdit) {
        buttonPressed.showModal(getEditModal(this, toEdit));
        return this;
    }

    static testEditCount = 0;
    static testEditValues = ['INFO', 'SECTION0', 'SECTION1', 'SECTION2'];
    testEditModal() {

        this.displayEditModal(this.interaction, CharacterMenu.testEditValues[CharacterMenu.testEditCount]);
        CharacterMenu.testEditCount++;
        if (CharacterMenu.testEditCount >= CharacterMenu.testEditValues.length) CharacterMenu.testEditCount = 0;

    }
    
    /** @param {ButtonInteraction} button */
    static async getActiveEdit(button) {
        const active = activeEdits.get(button.guild.id)?.get(button.user.id);
        if (!active) return false;

        // ensure button matches active edit message
        const originalMessageId = (active.messageId || await active.interaction.fetchReply()
        .then(m => {
            active.messageId = m.id;
            return m.id;
        }));

        // validate and return
        if (button.message.id != originalMessageId) return false;
        return active;
    }

    /** @param {ModalSubmitInteraction} modal */
    static getMenuFromModal = (modal) => activeEdits.get(modal.guild.id)?.get(modal.user.id);

    /**
     * Get age-associated character title
     * @param {number} age 
     */
    static getAgeTitle = (age) => (ageTitlesArray.find(([_, [min, max]]) => min <= age && age <= max) || ["Unknown"])[0];
}

/*
 * Helper functions
 */

/**
 * Generate any additional embeds that need to be displayed
 * @param {CharacterMenu} menuObject 
 */
function generateAuxilaryEmbeds(menuObject) {

    // override
    if (menuObject.forceNotEditing) return [];

    // generate auxilary embeds
    const embeds = [];
    const authorRegistering = menuObject.registering && menuObject.isAuthor;

    // if registering and the author is calling the menu
    if (authorRegistering) {

        // first push registering message
        embeds.push(EmbedBuilder.from({
            color: Colors.Yellow,
            title: '📋 Welcome to ' + menuObject.authorSnowflake.guild.name + '!',
            description: 'It looks like your character is yet to be approved!'
            + '\nBefore you can start roleplaying or use any of the nifty features provided by this bot, you must first fully create your character and submit it for review with the button below!'
            + '\n\nOnce you fill out every detail, and provide an image of your character\'s appearance, go ahead and press "Submit" below, and an administrator will review your character and make any suggestions before approving your character both into the roleplay and into the bot! **Be sure to read any relevant Roleplay or Submission rules as well!**'
            + '\n\n*If you already submitted, but need to change something, you may make the edit and press "Submit" again to refresh your submission with the most up-to-date information!*',
        }));

        // push any warnings afterward
        const server = CoreUtil.Servers.cache.get(menuObject.authorSnowflake.guild.id);
        const agesPaused = server.submissions.paused.ages.size > 0;
        const restrictedFields = [];
        if (agesPaused) {
            const pausedDaysFormatted = Array.from(server.submissions.paused.ages.keys(), (pausedAge) => '`' + pausedAge + '`');
            restrictedFields.push({
                name: 'Character Age',
                value: pausedDaysFormatted.join(', ') + ' character age groups are currently paused.',
            });
        }

        // push restrictions notification
        if (restrictedFields.length > 0) embeds.push(EmbedBuilder.from({
            color: Colors.Red,
            title: '⚠️ There are currently certain restrictions in place for submissions.',
            description: 'Unfortunately, due to either a large influx or a clan capacity issue, the following character traits are currently on hold:',
            fields: restrictedFields,
        }));

    }

    // if stats are locked and author is editing
    if (!menuObject.registering && menuObject.isAuthor && menuObject.statsLocked) {

        // if an admin, inform priveleges
        if (menuObject.isAdmin) embeds.push(EmbedBuilder.from({
            color: Colors.Fuchsia,
            title: '✨ Stats are currently locked, but you\'re immune!',
            description: '> Editing stats is only usable upon request, but you have the `ManageChannels` permission, so you\'re all set!'
        }));

        // else, inform that stat editing is currently locked
        else embeds.push(EmbedBuilder.from({
            color: Colors.Blurple,
            title: '💡 Why am I unable to edit stats?',
            description: '> **Editing stats is only usable upon request.** Please contact an administrator if you wish to edit your stats.',
            footer: { text: 'This is usually only granted to players who\'s characters are about to reach a milestone, such as a kit becoming an apprentice, an apprentice a warrior, etc.' },
        }));
    }

    // if administrator providing overrides, inform about their permissions
    if (menuObject.isAdmin && !menuObject.isAuthor) embeds.push(EmbedBuilder.from({
        color: Colors.Red,
        title: '📌 Administrator Overrides',
        description: '> As a member with `ManageChannels` permissions, you are authorized to override any character information or stats you deem fit.',
        footer: { text: 'Please ensure that the user is informed of any changes. Additionally, ensure that these changes are reasonable and are only used to enforce a standard set in place by the server.' }
    }));

    return embeds;
}

/**
 * Generate the proper submission button
 * @param {CharacterMenu} menuObject 
 */
function generateSubmitButton(menuObject) {

    const server = CoreUtil.Servers.cache.get(menuObject.authorSnowflake.guild.id);
    const alreadySubmitted = server.submissions.authorIdToMessageId.has(menuObject.authorSnowflake.user.id);
    const ageTitle = CharacterMenu.getAgeTitle(menuObject.character.moons);
    const submissionAllowed = SubmissionHandler.isAllowedToSubmitByAgeTitle(server, ageTitle);

    return new ButtonBuilder({
        customId: 'CHARACTERMENU:SUBMIT',
        label: !submissionAllowed
        ? '⚠️ Submission restrictions in place | Refer to embed above'
        : alreadySubmitted
        ? 'Refresh Submission'
        : 'Submit for review',
        emoji: !submissionAllowed ? '🛑' : alreadySubmitted ? '🔃' : '📋',
        style: !submissionAllowed ? ButtonStyle.Danger : alreadySubmitted ? ButtonStyle.Success : ButtonStyle.Secondary,
        disabled: !submissionAllowed
    });
}

/**
 * Generate editing button rows for the Main Menu render
 * @param {CharacterMenu} menuObject
 * @param {string[]} statSections 
 * @returns {ActionRowBuilder[]}
 */
function generateEditingRows(menuObject, statSections) {
    const helpButtonRow = new ActionRowBuilder({
        components: [new ButtonBuilder({
            customId: 'CHARACTERMENU:HELP',
            label: 'What do these stats mean?',
            style: ButtonStyle.Secondary,
            emoji: '💡',
        })]
    });

    // return single-row buttons
    if (!menuObject.registering && !menuObject.isAdmin && menuObject.editingEnabled && menuObject.statsLocked) return [
        new ActionRowBuilder({
            components: [
                ...generateStatEditButtons(menuObject, statSections),
                ...generateMiscEditButtons(menuObject),
            ],
        }),
        helpButtonRow,
    ]

    // return dual-row buttons
    return [
        new ActionRowBuilder({
            components: generateStatEditButtons(menuObject, statSections)
        }),
        new ActionRowBuilder({
            components: generateMiscEditButtons(menuObject)
        }),
        helpButtonRow,
    ]
}

/**
 * Generate stat edit buttons for the Main Menu render
 * @param {CharacterMenu} menuObject
 * @param {string[]} statSections 
 * @returns {ButtonBuilder[]}
 */
function generateStatEditButtons(menuObject, statSections) {
    return [
        ...!menuObject.isAdmin && menuObject.statsLocked && !menuObject.registering
        ? [new ButtonBuilder({
            customId: 'dummy',
            label: 'Stat editing is locked',
            style: ButtonStyle.Secondary,
            emoji: '🔒',
            disabled: true,
        })]
        : generateSectionEditButtons(menuObject.isAdmin, menuObject.isAuthor, statSections),
    ]
}

/**
 * Generate miscellaneous edit buttons for the Main Menu render
 * @param {CharacterMenu} menuObject 
 * @returns {ButtonBuilder[]}
 */
function generateMiscEditButtons(menuObject) {
    return [
        new ButtonBuilder({
            customId: 'CHARACTERMENU:EDIT:INFO',
            label: (!menuObject.isAuthor && menuObject.isAdmin ? 'Override' : 'Edit') + ' Basic Info',
            style: (!menuObject.isAuthor && menuObject.isAdmin ? ButtonStyle.Danger : ButtonStyle.Success),
        }),
        new ButtonBuilder({
            customId: 'CHARACTERMENU:EDIT:IMAGES',
            label: (!menuObject.isAuthor && menuObject.isAdmin ? 'Override' : 'Edit') + ' Icon/Reference',
            style: (!menuObject.isAuthor && menuObject.isAdmin ? ButtonStyle.Danger : ButtonStyle.Success),
        }),
        new ButtonBuilder({
            customId: 'CHARACTERMENU:EDIT:PRONOUNS',
            label: (!menuObject.isAuthor && menuObject.isAdmin ? 'Override' : 'Edit') + ' Pronouns',
            style: (!menuObject.isAuthor && menuObject.isAdmin ? ButtonStyle.Danger : ButtonStyle.Success),
        }),
    ]
}

/**
 * Generate buttons for editing sections
 * @param {boolean} admin 
 * @param {boolean} isAuthor 
 * @param {string[]} statSections 
 * @returns {ButtonBuilder[]}
 */
function generateSectionEditButtons(admin, isAuthor, statSections) {
    let sectionNumber = 0;
    return statSections.map(sectionEmoji => new ButtonBuilder({
        customId: 'CHARACTERMENU:EDIT:SECTION' + sectionNumber++,
        label: (!isAuthor && admin ? 'Override' : 'Edit') + ' Section',
        style: (!isAuthor && admin ? ButtonStyle.Danger : ButtonStyle.Primary),
        emoji: sectionEmoji,
    }));
}

/**
 * Get the proper editing Modal for the requested edit
 * @param {CharacterMenu} instance
 * @param {'INFO'|'SECTION0'|'SECTION1'|'SECTION2'} toEdit 
 * @returns {Modal}
 */
function getEditModal(instance, toEdit) {

    // catch anything other than sections
    // // console.log({toEdit});
    const server = CoreUtil.Servers.cache.get(instance.interaction.guild.id);
    const clanArray = [...Object.keys(server.clans), 'None'];
    if (toEdit.startsWith('INFO')) return ModalBuilder.from({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: '📝 Editing Basic Information',
        components: [
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'name',
                    label: 'Character Name',
                    placeholder: 'No name provided',
                    value: instance.character.name || '',
                    style: TextInputStyle.Short,
                    maxLength: 50,
                }),
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'clan',
                    style: TextInputStyle.Short,
                    label: (
                        !instance.isAdmin && instance.registering
                        ? 'Clan Request'
                        : 'Current Clan'
                    ),
                    placeholder: instance.character.clan
                    ? (
                        !instance.isAdmin && instance.registering
                        ? 'Current Requested Clan: ' + instance.character.clan.toUpperCase()
                        : 'Current Clan: ' + instance.character.clan.toUpperCase()
                    )
                    : (
                        !instance.isAdmin && instance.registering
                        ? 'Choose: ' + clanArray.map(c => CoreUtil.ProperCapitalization(c)).join(' | ')
                        : 'None. ' + clanArray.map(c => CoreUtil.ProperCapitalization(c)).join(' | ')
                    ),
                    value: (!instance.isAdmin && !instance.registering || instance.statsLocked)
                    ? ''
                    : CoreUtil.ProperCapitalization(instance.character.clan ?? ''),
                    maxLength: (!instance.isAdmin && !instance.registering && instance.statsLocked)
                    ? 1
                    : clanArray.reduce((previousValue, currentValue) => {
                        return currentValue.length > previousValue ? currentValue.length : previousValue
                    }, clanArray[0].length),
                })
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'age',
                    label: 'Character Age (Moons)',
                    placeholder: 'No character age provided',
                    value: instance.character.moons ?? 0,
                    style: TextInputStyle.Short,
                    minLength: 1,
                    maxLength: 3,
                }),
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'background',
                    label: 'Basic Background',
                    placeholder: 'No name provided',
                    value: instance.character.background || '',
                    style: TextInputStyle.Paragraph,
                    maxLength: 3000,
                }),
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'personality',
                    label: 'Character Personality',
                    placeholder: 'No personality provided',
                    value: instance.character.personality || '',
                    style: TextInputStyle.Paragraph,
                    maxLength: 700,
                }),
            ]}),
        ]
    });
    else if (toEdit.startsWith('IMAGES')) return ModalBuilder.from({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: '🖼️ Editing Character\'s Icon and Appearance',
        components: [
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'icon',
                    label: 'Character Icon (Image Link)',
                    placeholder: 'Provide a link to an image',
                    value: instance.character.icon || '',
                    style: TextInputStyle.Short,
                }),
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'image',
                    label: 'Character Appearance (Image Link)',
                    placeholder: 'Provide a link to an image',
                    value: instance.character.image || '',
                    style: TextInputStyle.Short,
                }),
            ]}),
        ],
    });
    else if (toEdit.startsWith('PRONOUNS')) return ModalBuilder.from({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: '💬 Editing Character\'s Pronouns',
        components: [
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'subjective',
                    label: 'Subjective (Ex. he/she/they/xe etc.)',
                    placeholder: 'No Subjective Pronoun provided',
                    value: instance.character.pronouns.subjective || '',
                    style: TextInputStyle.Short,
                    maxLength: 10,
                }),
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'objective',
                    label: 'Objective (Ex. him/her/them/xem etc.)',
                    placeholder: 'No Objective Pronoun provided',
                    value: instance.character.pronouns.objective || '',
                    style: TextInputStyle.Short,
                    maxLength: 10,
                }),
            ]}),
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: 'possessive',
                    label: 'Possessive (Ex. his/hers/theirs/xyrs etc.)',
                    placeholder: 'No Possessive Pronoun provided',
                    value: instance.character.pronouns.possessive || '',
                    style: TextInputStyle.Short,
                    maxLength: 12,
                }),
            ]}),
        ]
    });

    // handle sections
    const sectionNumber = parseInt(toEdit.replace(/[^0-9]/g, ''));
    
    // build section
    const sectionComponents = [];
    const sectionSize = Math.floor(statArray.length / statSections.length);
    const sectionStart = sectionNumber * sectionSize;
    const sectionEnd = sectionStart + sectionSize;
    for (let statNumber = sectionStart; statNumber < sectionEnd; statNumber++) {
        const [stat, statData] = statArray[statNumber];
        sectionComponents.push(
            new ActionRowBuilder({ components: [
                new TextInputBuilder({
                    customId: stat,
                    minLength: Math.min(statData.min.toString().length, statData.max.toString().length),
                    maxLength: Math.max(statData.min.toString().length, statData.max.toString().length),
                    label: statData.flair + ' ' + CoreUtil.ProperCapitalization(statData.name)
                    + ' (' + statData.min + '-' + statData.max + ')',
                    placeholder: 'No value yet',
                    value: instance.character.stats[stat] ?? statData.min,
                    style: TextInputStyle.Short,
                })
            ]})
        );
    }

    return ModalBuilder.from({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: statSections[sectionNumber] + ' Editing Section ' + (sectionNumber + 1),
        components: sectionComponents,
    });
}



module.exports = CharacterMenu;