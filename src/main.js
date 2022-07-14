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
const SubmissionCache = require('./util/Submissions/SubmissionCache');
dotenv.config({ path: '../.env' });

// initialize Discord client
const client = new BotClient({
    intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES ],
    partials: ["CHANNEL"]
});

// create console header
console.log('='.repeat(25));
console.log('Initializing Process: TBS\n\n' + '- '.repeat(13));

// connect to the MongoDB database
console.log('🧩 Connecting to the database...')
require('./database/connect.js')().then(() => {

    // inform success then initialize the cache
    console.log('✅ Database successfully connected!\n|| Caching in progress...');
    Promise.all([

        // cache languages
        Language.LoadLanguages().then((cache) => console.log(
            '\tLanguages successfully cached',
            'Map(' + cache.size + ')'
        )),
    
        // cache characters
        CharacterCache.CacheCharacters().then((cache) => {
            console.log(
                '\tCharacters successfully cached',
                'Guilds(' + cache.size + ') {\n',
                Array.from(cache).map(([guildId, data]) => `\t'${guildId}' => Map(${data.size})`).join('\n'),
                '\n\t}'
            );
        }),
    
        // cache members
        MemberCache.CacheMembers().then((cache) => {
            console.log(
                '\tMembers successfully cached',
                'Guilds(' + cache.size + ') {\n',
                Array.from(cache).map(([guildId, data]) => `\t\t'${guildId}' => Map(${data.size})`).join('\n'),
                '\n\t}'
            );
        }),
    
        // cache servers
        ServerCache.CacheServers().then((cache) => {
            console.log(
                '\tServers successfully cached',
                'Map(' + cache.size + ')'
            );
        }),
    
        // cache excuses
        ExcuseCache.CacheExcuses().then((cache) => {
            console.log(
                '\tExcuses successfully cached',
                'Map(' + cache.size + ')'
            );
        }),

        // cache character submissions
        SubmissionCache.CacheSubmissions().then((cache) => {
            console.log(
                '\tSubmissions successfully cached',
                'Guilds(' + cache.size + ') {\n',
                Array.from(cache).map(([guildId, data]) => `\t\t'${guildId}' => Map(${data.size})`).join('\n'),
                '\n\t}'
            );
        }),

    ]).then(() => console.log('✅ All data successfully cached.')).catch(e => console.error('There was an error during the caching process.\n' + e));

});



// client login
console.log('🧩 Logging into the client...');
client.login( process.env.DISCORD_TOKEN )
    .then(() => console.log('✅ Client successfully logged in.'))
    .catch(e => console.error('There was an error logging into the Discord client.\n' + e));