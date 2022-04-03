const { ApplicationCommandOptionType : dTypes } = require('discord-api-types/v10');
const { BaseCommandInteraction, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const userSchema = require('../../database/schemas/user');
const firstTimeRegister = require('../../util/Account/firstTimeRegister');
const { formatStats, calculateMaxHealth } = require('../../util/Account/Player');

module.exports = {
    name: 'medicine',
    description: 'Heal yourself!',
    guilds: ['957854680367648778', '954037682223316992'],
    options: [
        {
            name: 'amount',
            description: 'The amount of health to heal. (You will never heal past your max health)',
            type: dTypes.Integer,
            required: true,
        },
        {
            name: 'target-to-heal',
            description: '⚠️ ONLY MEDICINE CATS CAN HEAL OTHERS: Who you wish to heal.',
            type: dTypes.User,
            required: false,
        } // ! IMPLEMENT ME
    ],
    /**
     * @param {BaseCommandInteraction} interaction
     */
    async execute(interaction) {

        // defer and get input
        await interaction.deferReply({ ephemeral: false });
        let amount = Math.max(0, interaction.options.getInteger('amount'));
        
        // pull user from the database
        const User = mongoose.model('User', userSchema);
        /**@type {mongoose.Document}*/ let found = await User.findOne({ userId: interaction.user.id }).exec();

        // prompt registration if user is not registered; completely return
        if (!found) {
            let newStats = await firstTimeRegister(interaction);
            if (!newStats) return; // error already handled inside collect()
            return interaction.editReply({
                embeds: [formatStats(interaction, newStats)]
            });
        }
        
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
                    .setDescription(getRandomHealingMessage())
                    .addField('CURRENT HEALTH 💘', `> ↣ \`${found.currentHealth}\` / \`${found.stats.constitution * 5 + 50}\``),
            ]
        });

    },
};


const healingAction = [
    'You put some cobwebs on your wounds',
    'The medicine cat puts some Marigold on your scratches',
    'You take two Poppy Seeds and rest in your den'
];

const healingResponse = [
    'you are feeling rejuvinated',
    'your scabs will soon turn to scars',
    'your aches and pains have been soothed'
];

function getRandomHealingMessage() {
    return healingAction[Math.floor(Math.random() * healingAction.length)] + ', ' +
        healingResponse[Math.floor(Math.random() * healingResponse.length)] + '.';
}