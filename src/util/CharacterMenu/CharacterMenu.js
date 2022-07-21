const {
    CommandInteraction,
    MessageEmbed,
    GuildMember,
    Permissions,
    MessageButton,
    MessageActionRow,
    TextInputComponent,
    ButtonInteraction,
    ModalSubmitInteraction,
    Modal,
} = require('discord.js');
const CharacterModel = require('../../database/schemas/character');
const CoreUtil = require('../CoreUtil');
const StatCalculator = require('../Stats/StatCalculator');

const stats = require('../Stats/stats.json');
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
        this.isAdmin = interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS);
        this.isAuthor = interaction.user.id === authorGuildMemberSnowflake.user.id;
        this.registering = !forceNotEditing && this.isAuthor && !character.approved;
        this.editingEnabled = !forceNotEditing && (this.registering || (this.isAdmin || (this.isAuthor && editingEnabled)));
        this.forceNotEditing = forceNotEditing;

        this.messageId = null;

        // // console.log({NewObject: this});
    }

    static statHelpEmbed = new MessageEmbed({
        color: 'AQUA',
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
     * @returns {MessageEmbed}
     */
    static constructEmbed(character, author, editingEnabled = false, statsLocked = true, isAdmin = false) {
        let statSection = 0;
        const c = character;
        const s = author;
        const embed = new MessageEmbed({
            title: '« ' + (c.name ?? s.displayName + '\'s unnamed character') + ' »',
            color: s.displayHexColor,
            author: { name: '🌟 ⟪PRE-RELEASE⟫' },
            thumbnail: { url: c.icon ?? s.displayAvatarURL({ dynamic: true }) },
            image: { url: c.image || undefined },
            description: '🍵 **Basic Background**\n>>> ' + (c.background || '`None given.`') + '\n\n⇸',
            fields: [
                statArray.map(([stat, data]) => { return {
                    name: (editingEnabled && (!statsLocked || isAdmin)
                        ? statSections[Math.floor(statSection++ / statSections.length)] + ' | '
                        : ''
                    ) + data.flair + ' ' + data.name,
                    value: '> ↣ `' + (c.stats[stat] > -1 ? c.stats[stat] : 'Not assigned').toString() + '`',
                    inline: true,
                }}),
                {
                    name: '🧮 Stat Point Total',
                    value: '> `' + statArray.slice(1).reduce((previousValue, currentValue) => previousValue + c.stats[currentValue[0]], 0).toString() + '`',
                    inline: true,
                },
                {
                    name: '🦾 Battle Power',
                    value: '> `' + StatCalculator.calculateBattlePower(c) + '`/`' + StatCalculator.max.battlePower + '`',
                    inline: true,
                },
                {
                    name: 'Clan',
                    value: '> `' + (c.clan?.toUpperCase() || 'Not chosen') + '`',
                    inline: true,
                },
                {
                    name: 'Age (Moons)',
                    value: '> `' + (c.moons > -1 ? c.moons : 'Not assigned').toString() + '` **⟪ ' + CharacterMenu.getAgeTitle(c.moons ?? 0) + ' ⟫**',
                    inline: true,
                },
                {
                    name: 'Pronouns',
                    value: '>>> `' + (c.pronouns.subjective ?? '____') + '`/`' + (c.pronouns.objective ?? '____') + '`/`' + (c.pronouns.possessive ?? '____') + '`',
                    inline: true,
                },
                {
                    name: 'Personality',
                    value: '>>> ' + (c.personality || '`None given.`'),
                },
            ],
            footer: {
                text: `This character belongs to ${s.user.tag}(${s.user.id})`
                + (!character.approved ? ' | ⚠️ Character is not yet approved by an administrator.' : '')
            },
        });

        // add image label if image provided
        if (c.image) embed.addField('\u200B', '🖼️ **Character Reference Image**');

        return embed;
    }

    /**
     * Render menu to the user
     * @returns {Promise<CharacterMenu>}
     */
    async render() {
        const embed = CharacterMenu.constructEmbed(this.character, this.authorSnowflake, this.editingEnabled, this.statsLocked, this.isAdmin);

        // package message payload
        const components = [];
        if (this.editingEnabled) components.push(...generateEditingRows(this, statSections));
        if (this.registering) components.push(new MessageActionRow({
            components: [new MessageButton({
                customId: 'CHARACTERMENU:SUBMIT',
                label: 'Submit for review',
                emoji: '📋',
                style: 'SECONDARY',
            })]
        }));
        const payload = {
            embeds: [embed, ...generateAuxilaryEmbeds(this)],
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
    const embeds = [];

    // if stats are locked, and the author is calling the menu while not being an admin and not registering, give editing lock information
    if (!menuObject.forceNotEditing && !menuObject.registering && !menuObject.isAdmin && menuObject.isAuthor && menuObject.statsLocked) embeds.push(new MessageEmbed({
        color: 'BLURPLE',
        title: '💡 Why am I unable to edit stats?',
        description: '> **Editing stats is only usable upon request.** Please contact an administrator if you wish to edit your stats.',
        footer: { text: 'This is usually only granted to players who\'s characters are about to reach a milestone, such as a kit becoming an apprentice, an apprentice a warrior, etc.' },
    }));

    // if administrator providing overrides, inform about their permissions
    if (!menuObject.forceNotEditing && menuObject.isAdmin && !menuObject.isAuthor) embeds.push(new MessageEmbed({
        color: 'RED',
        title: '📌 Administrator Overrides',
        description: '> As a member with `MANAGE_CHANNELS` permissions, you are authorized to override any character information or stats you deem fit.',
        footer: { text: 'Please ensure that the user is informed of any changes. Additionally, ensure that these changes are reasonable and are only used to enforce a standard set in place by the server.' }
    }));

    return embeds;
}

/**
 * Generate editing button rows for the Main Menu render
 * @param {CharacterMenu} menuObject
 * @param {string[]} statSections 
 * @returns {MessageActionRow[]}
 */
function generateEditingRows(menuObject, statSections) {
    const helpButtonRow = new MessageActionRow({
        components: [new MessageButton({
            customId: 'CHARACTERMENU:HELP',
            label: 'What do these stats mean?',
            style: 'SECONDARY',
            emoji: '💡',
        })]
    });

    // return single-row buttons
    if (!menuObject.isAdmin && menuObject.editingEnabled && menuObject.statsLocked) return [
        new MessageActionRow({
            components: [
                ...generateStatEditButtons(menuObject, statSections),
                ...generateMiscEditButtons(menuObject),
            ],
        }),
        helpButtonRow,
    ]

    // return dual-row buttons
    return [
        new MessageActionRow({
            components: generateStatEditButtons(menuObject, statSections)
        }),
        new MessageActionRow({
            components: generateMiscEditButtons(menuObject)
        }),
        helpButtonRow,
    ]
}

/**
 * Generate stat edit buttons for the Main Menu render
 * @param {CharacterMenu} menuObject
 * @param {string[]} statSections 
 * @returns {MessageButton[]}
 */
function generateStatEditButtons(menuObject, statSections) {
    return [
        ...!menuObject.isAdmin && menuObject.statsLocked && !menuObject.registering
        ? [new MessageButton({
            customId: 'dummy',
            label: 'Stat editing is locked',
            style: 'SECONDARY',
            emoji: '🔒',
            disabled: true,
        })]
        : generateSectionEditButtons(menuObject.isAdmin, menuObject.isAuthor, statSections),
    ]
}

/**
 * Generate miscellaneous edit buttons for the Main Menu render
 * @param {CharacterMenu} menuObject 
 * @returns {MessageButton[]}
 */
function generateMiscEditButtons(menuObject) {
    return [
        new MessageButton({
            customId: 'CHARACTERMENU:EDIT:INFO',
            label: (!menuObject.isAuthor && menuObject.isAdmin ? 'Override' : 'Edit') + ' Basic Info',
            style: (!menuObject.isAuthor && menuObject.isAdmin ? 'DANGER' : 'SUCCESS'),
        }),
        new MessageButton({
            customId: 'CHARACTERMENU:EDIT:IMAGES',
            label: (!menuObject.isAuthor && menuObject.isAdmin ? 'Override' : 'Edit') + ' Icon/Reference',
            style: (!menuObject.isAuthor && menuObject.isAdmin ? 'DANGER' : 'SUCCESS'),
        }),
        new MessageButton({
            customId: 'CHARACTERMENU:EDIT:PRONOUNS',
            label: (!menuObject.isAuthor && menuObject.isAdmin ? 'Override' : 'Edit') + ' Pronouns',
            style: (!menuObject.isAuthor && menuObject.isAdmin ? 'DANGER' : 'SUCCESS'),
        }),
    ]
}

/**
 * Generate buttons for editing sections
 * @param {boolean} admin 
 * @param {boolean} isAuthor 
 * @param {string[]} statSections 
 * @returns {MessageButton[]}
 */
function generateSectionEditButtons(admin, isAuthor, statSections) {
    let sectionNumber = 0;
    return statSections.map(sectionEmoji => new MessageButton({
        customId: 'CHARACTERMENU:EDIT:SECTION' + sectionNumber++,
        label: (!isAuthor && admin ? 'Override' : 'Edit') + ' Section',
        style: (!isAuthor && admin ? 'DANGER' : 'PRIMARY'),
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
    if (toEdit.startsWith('INFO')) return new Modal({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: '📝 Editing Basic Information',
        components: [
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'name',
                    label: 'Character Name',
                    placeholder: 'No name provided',
                    value: instance.character.name || '',
                    style: 'SHORT',
                    maxLength: 50,
                }),
            ]}),
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'clan',
                    style: 'SHORT',
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
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'age',
                    label: 'Character Age (Moons)',
                    placeholder: 'No character age provided',
                    value: instance.character.moons ?? 0,
                    style: 'SHORT',
                    minLength: 1,
                    maxLength: 3,
                }),
            ]}),
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'background',
                    label: 'Basic Background',
                    placeholder: 'No name provided',
                    value: instance.character.background || '',
                    style: 'PARAGRAPH',
                    maxLength: 3000,
                }),
            ]}),
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'personality',
                    label: 'Character Personality',
                    placeholder: 'No personality provided',
                    value: instance.character.personality || '',
                    style: 'PARAGRAPH',
                    maxLength: 700,
                }),
            ]}),
        ]
    });
    else if (toEdit.startsWith('IMAGES')) return new Modal({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: '🖼️ Editing Character\'s Icon and Appearance',
        components: [
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'icon',
                    label: 'Character Icon (Image Link)',
                    placeholder: 'Provide a link to an image',
                    value: instance.character.icon || '',
                    style: 'SHORT',
                }),
            ]}),
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'image',
                    label: 'Character Appearance (Image Link)',
                    placeholder: 'Provide a link to an image',
                    value: instance.character.image || '',
                    style: 'SHORT',
                }),
            ]}),
        ],
    });
    else if (toEdit.startsWith('PRONOUNS')) return new Modal({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: '💬 Editing Character\'s Pronouns',
        components: [
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'subjective',
                    label: 'Subjective (Ex. he/she/they/xe etc.)',
                    placeholder: 'No Subjective Pronoun provided',
                    value: instance.character.pronouns.subjective || '',
                    style: 'SHORT',
                    maxLength: 10,
                }),
            ]}),
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'objective',
                    label: 'Objective (Ex. him/her/them/xem etc.)',
                    placeholder: 'No Objective Pronoun provided',
                    value: instance.character.pronouns.objective || '',
                    style: 'SHORT',
                    maxLength: 10,
                }),
            ]}),
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: 'possessive',
                    label: 'Possessive (Ex. his/hers/theirs/xeirs etc.)',
                    placeholder: 'No Possessive Pronoun provided',
                    value: instance.character.pronouns.possessive || '',
                    style: 'SHORT',
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
            new MessageActionRow({ components: [
                new TextInputComponent({
                    customId: stat,
                    minLength: Math.min(statData.min.toString().length, statData.max.toString().length),
                    maxLength: Math.max(statData.min.toString().length, statData.max.toString().length),
                    label: statData.flair + ' ' + CoreUtil.ProperCapitalization(statData.name)
                    + ' (' + statData.min + '-' + statData.max + ')',
                    placeholder: 'No value yet',
                    value: instance.character.stats[stat] ?? statData.min,
                    style: 'SHORT',
                })
            ]})
        );
    }

    return new Modal({
        customId: 'CHARACTERMENU:EDIT:' + toEdit,
        title: statSections[sectionNumber] + ' Editing Section ' + (sectionNumber + 1),
        components: sectionComponents,
    });
}



module.exports = CharacterMenu;