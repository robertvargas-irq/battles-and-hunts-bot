const { CommandInteraction, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ExcuseHandler = require('../../../util/Excused/ExcuseHandler');
const CoreUtil = require('../../../util/CoreUtil');
const Hunger = require('../../../util/Hunting/Hunger');


/**
 * @param {CommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'excuses': {
            await interaction.deferReply({ ephemeral: true });
            const day = interaction.options.getString('day');
            const headerEmbed = new EmbedBuilder({
                color: 'Fuchsia',
                title: '📋 AUDIT FOR: ' + day,
                description: '> This is the most up-to-date summary audit of **`' + day + '`** excuses and their status!'
                + '\n\n__**Legend**__'
                + '\n> 🟢: Approved'
                + '\n> 🟡: Pending'
                + '\n> 🔴: Denied',
                footer: { text: 'Requested by ' + interaction.user.tag + ' (' + interaction.user.id + ')', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) },
                timestamp: Date.now(),
            });
            const lateEmbed = new EmbedBuilder({
                color: 'Yellow',
                title: '⏰ __LATE__',
            });
            const leftEarlyEmbed = new EmbedBuilder({
                color: 'Blurple',
                title: '🏃 __LEFT EARLY__',
            });
            const absentEmbed = new EmbedBuilder({
                color: 'Orange',
                title: '❌ __ABSENT__',
            });

            // fetch all excuses for the given day
            const excuses = await ExcuseHandler.fetchAllExcuses(interaction.guild.id, day);

            // sort into each excuse type
            const late = [];
            const leftEarly = [];
            const absent = [];

            const statuses = {
                late: {},
                leftEarly: {},
                absent: {},
            }
            
            // sort users by excuse status and begin fetching each one asyncronously
            for (const excuse of excuses) {
                switch (excuse.type) {
                    case 'LATE':
                        late.push(interaction.guild.members.fetch({ member: excuse.userId }).catch(() => false));
                        statuses.late[excuse.userId] = excuse.status;
                        break;
                    case 'LEFT EARLY':
                        leftEarly.push(interaction.guild.members.fetch({ member: excuse.userId }).catch(() => false));
                        statuses.leftEarly[excuse.userId] = excuse.status;
                        break;
                    case 'ABSENCE':
                        absent.push(interaction.guild.members.fetch({ member: excuse.userId }).catch(() => false));
                        statuses.absent[excuse.userId] = excuse.status;
                        break;
                }
            }

            // resolve all fetched members
            console.log({
                late,
                leftEarly,
                absent,
            });
            const [
                lateMembers,
                leftEarlyMembers,
                absentMembers,
            ] = await Promise.all([
                Promise.all(late),
                Promise.all(leftEarly),
                Promise.all(absent)
            ]);

            const colors = {
                [ExcuseHandler.EXCUSE_STATUSES.APPROVED]: '🟢',
                [ExcuseHandler.EXCUSE_STATUSES.PENDING]: '🟡',
                [ExcuseHandler.EXCUSE_STATUSES.DENIED]: '🔴',
            };

            // sort into each respective embed
            lateEmbed.description = lateMembers
                .filter(member => member != false)
                .sort((a, b) => a.status - b.status)
                .map(member => {
                    const status = statuses.late[member.user.id];
                    return '> **' + colors[status] + ' ' + member.displayName + '** (<@' + member.user.id + '>)';
                }).join('\n') || '> Nothin to see here! ✨';
            leftEarlyEmbed.description = leftEarlyMembers
                .filter(member => member != false)
                .sort((a, b) => a.status - b.status)
                .map(member => {
                    const status = statuses.leftEarly[member.user.id];
                    return '> **' + colors[status] + ' ' + member.displayName + '** (<@' + member.user.id + '>)';
                }).join('\n') || '> Nothin to see here! ✨';
            absentEmbed.description = absentMembers
                .filter(member => member != false)
                .sort((a, b) => a.status - b.status)
                .map(member => {
                    const status = statuses.absent[member.user.id];
                    return '> **' + colors[status] + ' ' + member.displayName + '** (<@' + member.user.id + '>)';
                }).join('\n') || '> Nothin to see here! ✨';

            // display excuse report
            return interaction.editReply({
                embeds: [lateEmbed, leftEarlyEmbed, absentEmbed, headerEmbed]
            });
        }

        case 'registration': {
            return interaction.reply({
                content: 'This command is under construction.'
            });
            // get options and defer appropriately
            const ping = interaction.options.getString("ping-them") == 'yes';
            const ephemeral = interaction.options.getString("view-privately") == 'yes';
            await interaction.deferReply({ ephemeral });
            
            // get special exemption roles
            const roles = require('./roles.json');

            // get all users from the database and members from the guild
            const CharacterDocuments = CoreUtil.Characters.cache.getAll(interaction.guild.id);
            const GuildMembers = await interaction.guild.members.fetch();

            // compare and only push members that are not registered
            const nonRegistered = [];
            const nonSubmitted = [];
            for (let [id, member] of GuildMembers) {

                // filter bots and testing user
                if (member.user.bot || member.user.id === '964281330609315872') continue;
                
                // if role exemptions are present, continue if the member has one
                if (roles[member.guild.id]) {
                    if (member.roles.cache.hasAny([
                        roles[member.guild.id].spectator,
                        roles[member.guild.id].partner,
                    ])) continue;
                }
                
                // if character is not registered, route to non-registered or non-submitted
                if (!CharacterDocuments.has(id))
                    nonRegistered.push(member);
                else if (!CharacterDocuments.get(id).approved)
                    nonSubmitted.push(member);
            }

            // notify successful set
            return interaction.editReply({
                content: (ping)
                ? "**Don't forget to fill out your `/character` and submit when you can!**\n||"
                + nonRegistered.map(m => "<@" + m.user.id + ">").join('')
                + "||" : null,
                embeds: [new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('✅ Audit complete.')
                    .setDescription(
                        (nonSubmitted.length > 0 ? (
                            "__**Users who haven't submitted an OC:**__\n"
                            + "*These players are unable to sign up as they still need approval from the server owner,\n<@" + interaction.guild.ownerId + ">.\n\nPick up a `template` from <#954246632550072350>\nthen `submit` over at <#954246543102337086> as soon as possible!*\n------------\n"
                            + nonSubmitted.map(m => '> ' + m.displayName + ' (<@' + m.user.id + '>)').join('\n')
                        ) : '__**All players have submitted an OC.**__')
                    )
                ]
            });
        }

        case 'starvation': {
            await interaction.deferReply();

            const CharacterDocuments = CoreUtil.Characters.cache.getAll(interaction.guild.id);
            const GuildMembers = await interaction.guild.members.fetch();
            const starving = {};

            // organize members based on hunger status
            const totalClanMembers = {};
            for (const [_, character] of Array.from(CharacterDocuments)) {
                
                // if user is not in the current server, continue
                if (!GuildMembers.has(character.userId)) continue;

                // count the total clan members
                if (!character.clan) continue;
                if (!totalClanMembers.hasOwnProperty(character.clan)) totalClanMembers[character.clan] = 0;
                totalClanMembers[character.clan]++;
                
                // if hunger is satiated, continue
                if (Hunger.isSatiated(character)) continue;

                // initialize clan array and push the guild member
                if (!starving.hasOwnProperty(character.clan)) starving[character.clan] = [];
                starving[character.clan].push(GuildMembers.get(character.userId));
            }

            // generate embeds with the final audit
            const embeds = [];

            // generate clan-specific embeds
            const starvingMembersArray = Object.entries(starving);
            for (let i = 0; i < starvingMembersArray.length && i < 8; i++) {
                const [clan, starvingMembers] = starvingMembersArray[i];
                console.log({starvingMembers});
                console.log({starvSorted: starvingMembers.sort((a, b) => a.displayName.replace(/[^a-zA-Z]/g, '') - b.displayName.replace(/[^a-zA-Z]/g, ''))})
                embeds.push(new EmbedBuilder({
                    color: 'DarkRed',
                    title: 'STARVING MEMBERS IN: ' + clan.toUpperCase(),
                    description: starvingMembers.length > 0 ? starvingMembers.sort((a, b) => a.displayName.replace(/[^a-zA-Z]/g, '') - b.displayName.replace(/[^a-zA-Z]/g, '')).map(member =>
                        '> ⊗ **' + member.displayName + '** (<@' + member.user.id + '>)'
                    ).join('\n') : '> None to list... my, many here got lucky...',
                    footer: { text: starvingMembers.length + ' starving member(s) / ' + totalClanMembers[clan] + ' member(s)' },
                }));
            }

            // generate header
            embeds.push(new EmbedBuilder({
                color: 'DarkGrey',
                title: '🦴 Starvation lingers...',
                description: '> This audit contains the most up-to-date information available upon request.',
                footer: { text: 'Requested by ' + interaction.user.tag + ' (' + interaction.user.id + ')', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) },
                timestamp: Date.now(),
            }));

            // display audit result
            return interaction.editReply({ embeds });

        }

        case 'list-members': {
            // defer reply and get special exemption roles
            await interaction.deferReply({ ephemeral: true });
            const roles = require('./roles.json');

            // get all users from the cache and fetch members from the guild
            const allCharacters = CoreUtil.Characters.cache.getAll(interaction.guild.id);
            const Members = await interaction.guild.members.fetch();

            // compare and only push members that are registered
            const registered = new Map();
            for (let [id, member] of Members) {
                
                // filter out any users not registered to the bot or not in the server
                if (!allCharacters.has(id) || !Members.has(id)) continue;

                // filter out bots, testing account, and any special roles exempting registration
                if (member.user.bot || member.user.id === '964281330609315872') continue;
                if (roles[member.guild.id]) {
                    if (member.roles.cache.hasAny([
                        roles[member.guild.id].spectator,
                        roles[member.guild.id].partner,
                    ])) continue;
                }

                // push to the appropriate clan
                const clan = allCharacters.get(id).clan;
                if (!clan) continue;
                if (!registered.has(clan)) registered.set(clan, []);
                registered.get(clan).push(Members.get(id));
            }

            // create embeds for each clan
            const embeds = [];
            const registeredList = Array.from(registered);
            for (let i = 0; i < registeredList.length && i < 9; i++) {
                embeds.push(new EmbedBuilder({
                    color: 'Fuchsia',
                    title: registeredList[i][0].toUpperCase(),
                    description: registeredList[i][1].map(member => '> ↣ **' + member.displayName + '** (<@' + member.user.id + '>)').join('\n'),
                }));
            }

            // generate summary
            embeds.push(new EmbedBuilder({
                color: 'Aqua',
                title: '📝 All members registered to the bot',
                description: '> This audit contains the most up-to-date information available upon request.',
                footer: { text: 'Requested by ' + interaction.user.tag + ' (' + interaction.user.id + ')', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) },
                timestamp: Date.now(),
            }));

            // display the members in an embed
            return interaction.editReply({ embeds });
        }
    }

}