const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const AttackManager = require('../../util/Battle/AttackManager');
const { calculateMaxHealth } = require('../../util/Account/Player');

module.exports = {
    name: 'medicine',
    description: 'Heal yourself!',
    options: [
        {
            name: 'amount',
            description: 'The amount of health to heal. (You will never heal past your max health)',
            type: dTypes.Integer,
            required: true,
        },
        // {
        //     name: 'who-healed-you',
        //     description: '(THIS IS OPTIONAL)',
        //     type: dTypes.User,
        //     required: false,
        // } // ! IMPLEMENT ME
    ],
    /**
     * @param {BaseCommandInteraction} interaction
     */
    async execute(interaction) {

        // defer and get input
        await interaction.deferReply({ ephemeral: false });
        let amount = Math.max(0, interaction.options.getInteger('amount'));
        
        // pull user from the database
        const found = await AttackManager.FetchUser(interaction.user.id);
        if (!found) return AttackManager.NotRegistered(interaction);
        
        // check for over-heal
        let maxHealth = calculateMaxHealth(found.stats.constitution);
        if (found.currentHealth + amount > maxHealth)
            amount = maxHealth - found.currentHealth;
        
        // save to database if actual change was made
        if (amount > 0) {
            found.currentHealth += amount;
            await found.save();
        }

        // notify user
        interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setColor('AQUA')
                    .setTitle('🌿 Serene')
                    .setDescription(AttackManager.getRandomHealingMessage())
                    .addField('CURRENT HEALTH 💘', `> ↣ \`${found.currentHealth}\` / \`${found.stats.constitution * 5 + 50}\``),
            ]
        });

    },
};