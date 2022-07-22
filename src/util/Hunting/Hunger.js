const CharacterModel = require('../../database/schemas/character');
const { calculateMaxHunger } = require('../Stats/StatCalculator');

class Hunger {

    /**@param {CharacterModel} character @param {number} hunger */
    static setHunger = (character, hunger) => character.currentHunger = hunger;
    
    static getHunger = (/**@type {CharacterModel}*/character) => character.currentHunger;
    static getMaxHunger = (/**@type {CharacterModel}*/character) => calculateMaxHunger(character);

    static bitesToSatisfy = (/**@type {CharacterModel}*/character) => this.getMaxHunger(character) - this.getHunger(character);

    static isSatiated = (/**@type {CharacterModel}*/character) => this.getHunger(character) >= this.getMaxHunger(character);

    static starveFully = (/**@type {CharacterModel}*/character) => this.setHunger(character, 0);

    /**@param {CharacterModel} character, @param {number} amount */
    static satiateHunger = (character, amount) => {
        
        // add to hunger then validate
        this.setHunger(character, this.getHunger(character) + amount);
        this.validateHunger(character);

        return character;

    }
    /**@param {CharacterModel} character, @param {number} amount */
    static makeHungry = (character, amount) => {

        // remove hunger then validate
        this.setHunger(character, this.getHunger(character) - amount);
        this.validateHunger(character);

        return character;

    }

    /**@param {CharacterModel} character, @param {number} unixMilliseconds */
    static markLastAte = (character, unixMilliseconds = null) => {

        // set last ate time
        character.lastAteAt = Math.floor((unixMilliseconds ?? Date.now()) / 1000);
        return character;

    }

    static validateHunger = (/**@type {CharacterModel}*/character) => {

        // prevent negatives
        if (this.getHunger(character) < 0)
            this.setHunger(character, 0);
        
        // prevent over-fed
        if (character.currentHunger > this.getMaxHunger(character))
            this.setHunger(character, this.getMaxHunger(character));
        
        return character;
    };
}

module.exports = Hunger;