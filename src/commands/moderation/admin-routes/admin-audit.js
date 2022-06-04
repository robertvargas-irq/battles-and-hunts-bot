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
                footer: { text: 'Requested by ' + interaction.user.tag + ' (' + interaction.user.id + ')', iconURL: interaction.member.displayAvatarURL() },
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
            
            // get roles
            const roles = require('./roles.json');
            
            // filter out non-administrators
            if (!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
                return interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('RED')
                        .setTitle('❗ Woah wait-!')
                        .setDescription(
                            `Sorry about that **${interaction.member.displayName}**! This command is for administrators only!`
                        )
                    ]
                });
            }

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
    }

}