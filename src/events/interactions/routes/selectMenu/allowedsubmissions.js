const { SelectMenuInteraction, EmbedBuilder, Colors } = require('discord.js');
const CoreUtil = require('../../../../util/CoreUtil');
const ages = require('../../../../util/CharacterMenu/ages.json');
const agesKeys = Object.keys(ages);

/** @param {SelectMenuInteraction} selectMenu */
module.exports = async (selectMenu) => {

    // get server from cache
    const server = CoreUtil.Servers.cache.get(selectMenu.guild.id);

    // route to action
    const [_, action] = selectMenu.customId.split(':');
    switch (action) {

        case 'AGE': {

            // create array of unallowed age ranges by filtering out those allowed from input
            const allowedAgeRanges = new Set(selectMenu.values);
            const unallowedAgeRanges = agesKeys.filter(ageTitle => {
                return !allowedAgeRanges.has(ageTitle);
            });

            // set paused character age range submissions to values not selected
            server.submissions.paused.ages = new Map(unallowedAgeRanges.map(unallowed => [unallowed, unallowed]));
            server.save();

            // inform successful save
            return selectMenu.reply({
                ephemeral: true,
                embeds: [new EmbedBuilder({
                    color: Colors.Green,
                    title: '✅ Successfully set allowed character age groups',
                    fields: [
                        {
                            name: '🟢 Allowed',
                            value: '>>> ' + (selectMenu.values.join('\n') || '`NONE`'),
                        },
                        {
                            name: '🛑 Paused',
                            value: '>>> ' + (unallowedAgeRanges.join('\n') || '`NONE`'),
                        },
                    ],
                })],
            });
        }

    }

}