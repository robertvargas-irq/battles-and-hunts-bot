const { Client, Collection, ClientOptions, ApplicationCommandData } = require("discord.js");
const bindCommands = require("./bindCommands");
const bindEvents = require("./bindEvents");

class BotClient extends Client {

    /**@type {Collection<command.name, ApplicationCommandData>}*/ commands;

    /**
     * Create a new Bot client.
     * @param {ClientOptions} clientOptions Discord Client options
     */
    constructor( clientOptions ) {
        super( clientOptions );
        bindEvents( this );
        bindCommands( this );

        this.config = require('../../config.json');
    }

}

module.exports = BotClient;