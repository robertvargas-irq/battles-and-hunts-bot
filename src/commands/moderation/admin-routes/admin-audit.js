const { BaseCommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const ExcuseHandler = require('../../../util/Excused/ExcuseHandler');
const CoreUtil = require('../../../util/CoreUtil');


/**
 * @param {BaseCommandInteraction} interaction 
 * @param {string} subcommand 
 */
module.exports = async (interaction, subcommand) => {

    // route subcommand
    switch (subcommand) {
        case 'excuses': {
            await interaction.deferReply({ ephemeral: true });
            const day = interaction.options.getString('day');
            const headerEmbed = new MessageEmbed({
                color: 'FUCHSIA',
                title: '📋 AUDIT FOR: ' + day,
                description: '> This is the most up-to-date summary audit of **`' + day + '`** excuses and their status!'
                + '\n\n__**Legend**__'
                + '\n> 🟢: Approved'
                + '\n> 🟡: Pending'
                + '\n> 🔴: Denied',
                footer: { text: 'Requested by ' + interaction.user.tag + ' (' + interaction.user.id + ')', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) },
                timestamp: Date.now(),
            });
            const lateEmbed = new MessageEmbed({
                color: 'YELLOW',
                title: '⏰ __LATE__',
            });
            const leftEarlyEmbed = new MessageEmbed({
                color: 'BLURPLE',
                title: '🏃 __LEFT EARLY__',
            });
            const absentEmbed = new MessageEmbed({
                color: 'ORANGE',
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
                        late.push(interaction.guild.members.fetch(excuse.userId));
                        statuses.late[excuse.userId] = excuse.status;
                        break;
                    case 'LEFT EARLY':
                        leftEarly.push(interaction.guild.members.fetch(excuse.userId));
                        statuses.leftEarly[excuse.userId] = excuse.status;
                        break;
                    case 'ABSENCE':
                        absent.push(interaction.guild.members.fetch(excuse.userId));
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
            lateEmbed.description = lateMembers.sort((a, b) => a.status - b.status).map(member => {
                const status = statuses.late[member.user.id];
                return '> **' + colors[status] + ' ' + member.displayName + '** (<@' + member.user.id + '>)';
            }).join('\n') || '> Nothin to see here! ✨';
            leftEarlyEmbed.description = leftEarlyMembers.sort((a, b) => a.status - b.status).map(member => {
                const status = statuses.leftEarly[member.user.id];
                return '> **' + colors[status] + ' ' + member.displayName + '** (<@' + member.user.id + '>)';
            }).join('\n') || '> Nothin to see here! ✨';
            absentEmbed.description = absentMembers.sort((a, b) => a.status - b.status).map(member => {
                const status = statuses.absent[member.user.id];
                return '> **' + colors[status] + ' ' + member.displayName + '** (<@' + member.user.id + '>)';
            }).join('\n') || '> Nothin to see here! ✨';

            // display excuse report
            return interaction.editReply({
                embeds: [lateEmbed, leftEarlyEmbed, absentEmbed, headerEmbed]
            });
        }

        case 'registration': {
            // get options and defer appropriately
            const ping = interaction.options.getString("ping-them") == 'yes';
            const private = interaction.options.getString("view-privately") == 'yes';
            await interaction.deferReply({
                ephemeral: private
            });
            
            // get special exemption roles
            const roles = require('./roles.json');

            // get all users from the database and members from the guild
            const [allUsers, Members] = await Promise.all([
                CoreUtil.FetchAllUsers().then(({users}) => { return new Set(users.map(o => o.userId)) }),
                interaction.guild.members.fetch()
            ]);

            // compare and only push members that are not registered
            const nonRegistered = [];
            const nonSubmitted = [];
            for (let [id, member] of Members) {
                if (member.user.bot || member.user.id === '964281330609315872') continue;
                if (roles[member.guild.id]) {
                    if (member.roles.cache.hasAny([
                        roles[member.guild.id].spectator,
                        roles[member.guild.id].partner,
                    ])) continue;
                }
                console.log(id);
                if (!allUsers.has(id))
                    if (member.displayName.startsWith('{+'))
                        nonRegistered.push(member);
                    else
                        nonSubmitted.push(member);
            }

            // notify successful set
            return interaction.editReply({
                content: (ping)
                ? "**Don't forget to `/register` for the bot when you can!**\n||"
                + nonRegistered.map(m => "<@" + m.user.id + ">").join('')
                + "||" : null,
                embeds: [new MessageEmbed()
                    .setColor('GREEN')
                    .setTitle('✅ Audit complete.')
                    .setDescription(
                        (nonRegistered.length > 0 ? (
                            "__**Non-Registered Users:**__\n"
                            + "*These players are eligible to sign up as their character has been approved by\n<@" + interaction.guild.ownerId + ">, this is required to hunt and battle; all is needed is your cat's stats from your OC submission! Use `/register` to get started!*\n------------\n"
                            + nonRegistered.map(m => '> ' + m.displayName).join('\n')
                        ) : '__**All eligble users have registered for the bot.**__')
                        + '\n\n' + (nonSubmitted.length > 0 ? (
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

            const [{ users }, guildMembers] = await Promise.all([
                CoreUtil.FetchAllUsers(),
                interaction.guild.members.fetch(),
            ]);
            const starvingMembers = [];
            const oneAwayMembers = [];

            // organize members based on hunger status
            for (const user of users) {
                // if user is not in the current server, continue
                if (!guildMembers.has(user.userId)) continue;

                // if hunger is satiated, continue
                if (user.currentHunger === 0) continue;

                // begin fetching members based on starving or one away from starving
                if (user.stats.cat_size <= user.currentHunger) starvingMembers.push(guildMembers.get(user.userId));
                else if (user.stats.cat_size - user.currentHunger === 1) oneAwayMembers.push(guildMembers.get(user.userId));
            }

            // generate embeds with the final audit
            const headerEmbed = new MessageEmbed({
                color: 'DARK_GREY',
                title: '🦴 Starvation lingers...',
                description: '> This audit contains the most up-to-date information available upon request.',
                footer: { text: 'Requested by ' + interaction.user.tag + ' (' + interaction.user.id + ')', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) },
                timestamp: Date.now(),
            });
            const starvingEmbed = new MessageEmbed({
                color: 'DARK_RED',
                title: '⌛️ The rumbling aches... starvation is imminent.',
                description: starvingMembers.length > 0 ? starvingMembers.map(member =>
                    '> ⊗ **' + member.displayName + '** (<@' + member.user.id + '>)'
                ).join('\n') : '> None to list... my, many here got lucky...'
            });
            const oneAwayEmbed = new MessageEmbed({
                color: 'DARK_PURPLE',
                title: '⏳ One away from starving...',
                description: oneAwayMembers.length > 0 ? oneAwayMembers.map(member =>
                    '> ⊕ **' + member.displayName + '** (<@' + member.user.id + '>)'
                ).join('\n') : '> None to list... my, many here got lucky...'
            })

            // display audit result
            return interaction.editReply({
                embeds: [starvingEmbed, oneAwayEmbed, headerEmbed]
            });

        }

        case 'list-members': {
            // defer reply and get special exemption roles
            await interaction.deferReply({ ephemeral: true });
            const roles = require('./roles.json');

            // get all users from the database and members from the guild
            const [allUsers, Members] = await Promise.all([
                CoreUtil.FetchAllUsers().then(({users}) => { return new Map(users.map(o => [o.userId, o])) }),
                interaction.guild.members.fetch(),
            ]);

            // compare and only push members that are registered
            const registered = new Map();
            for (let [id, member] of Members) {
                
                // filter out any users not registered to the bot or not in the server
                if (!allUsers.has(id) || !Members.has(id)) continue;

                // filter out bots, testing account, and any special roles exempting registration
                if (member.user.bot || member.user.id === '964281330609315872') continue;
                if (roles[member.guild.id]) {
                    if (member.roles.cache.hasAny([
                        roles[member.guild.id].spectator,
                        roles[member.guild.id].partner,
                    ])) continue;
                }


                // push to the appropriate clan
                const clan = allUsers.get(id).clan;
                if (!registered.has(clan)) registered.set(clan, []);
                registered.get(clan).push(Members.get(id));
            }

            // create embeds for each clan
            const embeds = [];
            const registeredList = Array.from(registered);
            for (let i = 0; i < registeredList.length && i < 9; i++) {
                embeds.push(new MessageEmbed({
                    color: 'FUCHSIA',
                    title: registeredList[i][0].toUpperCase(),
                    description: registeredList[i][1].map(member => '> ↣ **' + member.displayName + '** (<@' + member.user.id + '>)').join('\n'),
                }));
            }

            // generate summary
            embeds.push(new MessageEmbed({
                color: 'AQUA',
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