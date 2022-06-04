const FILE_LANG_ID = 'EDIT';

const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const collectCharacterStats = require('../../util/Account/collectCharacterStats');
const Player = require('../../util/Account/Player');
const CoreUtil = require('../../util/CoreUtil');
const Translator = require('../../util/Translator');

module.exports = {
    name: 'edit',
    description: 'Edit your stats!',
    /**@param {BaseCommandInteraction} interaction */
    async execute(interaction) {

        // defer
        await interaction.deferReply({ ephemeral: true });
        
        // if user is registered
        const found = await CoreUtil.FetchUser(interaction.user.id);
        if (!found) return CoreUtil.NotRegistered(interaction);

        // create translator
        const translator = new Translator(interaction.user.id, FILE_LANG_ID);
        
        // collect new stats
        const {clanRole, stats: catStats} = await collectCharacterStats(interaction, translator.get('PROMPT'));
        if (!catStats) return; // error already handled inside collect()

        // handle new max health
        if (found.currentHealth > Player.calculateMaxHealth(catStats.constitution))
            found.currentHealth = Player.calculateMaxHealth(catStats.constitution);

        // handle new hunger
        if (found.stats.cat_size < found.currentHunger)
            found.currentHunger = found.stats.cat_size;
        
        // save to the database
        found.stats = catStats;
        found.clan = clanRole;
        found.markModified('User.stats');
        await found.save()
            .then(() => {
                // success!
                interaction.editReply({
                    embeds: [
                        new MessageEmbed()
                            .setColor('AQUA')
                            .setTitle('🌟 ' + translator.getGlobal('STATS_SAVED'))
                            .setDescription(translator.getGlobal('MENU_DISMISS')),
                        Player.formatStats(interaction, found)
                    ]
                });
            })
            .catch((e) => {
                console.error(e);
                interaction.editReply({
                    embeds: [new MessageEmbed()
                        .setColor('GREYPLE')
                        .setTitle('⚠️ ' + translator.getGlobal('SOMETHING_WENT_WRONG'))
                        .setDescription(translator.get('UNABLE_TO_SAVE') + ' 🌟')
                    ]
                });
            });
    },
};