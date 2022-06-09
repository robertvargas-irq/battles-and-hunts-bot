// shift to ./app
const process = require('process');
process.chdir('./src');

const BotClient = require("./util/BotClient/BotClient");
const { Intents } = require('discord.js');
const dotenv = require('dotenv');
const Language = require('./util/Language');
const CharacterCache = require('./util/Character/CharacterCache');
const MemberCache = require('./util/Member/MemberCache');
const ServerCache = require('./util/Server/ServerCache');
const ExcuseCache = require('./util/Excused/ExcuseCache');
dotenv.config({ path: '../.env' });

// initialize Discord client then connect to the mongodb database
let client = new BotClient({
    intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES ],
    partials: ["CHANNEL"]
});
require('./database/connect.js')().then(() => {
    // cache languages
    Language.LoadLanguages().then((cache) => console.log(
        'Languages successfully cached',
        'Map(' + cache.size + ')'
    ));

    // cache characters
    CharacterCache.CacheCharacters().then((cache) => {
        console.log(
            'Characters successfully cached',
            'Guilds(' + cache.size + ') {\n',
            Array.from(cache).map(([guildId, data]) => `\t'${guildId}' => Map(${data.size})`).join('\n'),
            '\n}'
        );
    });

    // cache members
    MemberCache.CacheMembers().then((cache) => {
        console.log(
            'Members successfully cached',
            'Guilds(' + cache.size + ') {\n',
            Array.from(cache).map(([guildId, data]) => `\t'${guildId}' => Map(${data.size})`).join('\n'),
            '\n}'
        );
    });

    // cache servers
    ServerCache.CacheServers().then((cache) => {
        console.log(
            'Servers successfully cached',
            'Map(' + cache.size + ')'
        );
    });

    // cache excuses
    ExcuseCache.CacheExcuses().then((cache) => {
        console.log(
            'Excuses successfully cached',
            'Map(' + cache.size + ')'
        );
    })

});


// login
client.login( process.env.DISCORD_TOKEN ).then(() => console.log('Client successfully logged in.'));