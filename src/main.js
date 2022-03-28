// shift to ./app
const process = require('process');
process.chdir('./src');

const BotClient = require("./util/BotClient/BotClient");
const { Intents } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

// initialize Discord client then connect to the mongodb database
let client = new BotClient({
    intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES ],
    partials: ["CHANNEL"]
});
// require('./database/connect.js')();

// login
client.login( process.env.DISCORD_TOKEN );