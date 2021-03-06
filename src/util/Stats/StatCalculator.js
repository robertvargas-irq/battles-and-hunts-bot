const CharacterModel = require('../../database/schemas/character');
const stats = require('./stats.json');

class StatCalculator {
    static calculateMaxHealth = (/**@type {CharacterModel}*/character) => character.stats.constitution * 5 + 50;
    static calculateMaxHunger = (/**@type {CharacterModel}*/character) => character.stats.cat_size;
    static calculateBattlePower = (/**@type {CharacterModel}*/character) => character.stats.strength + character.stats.dexterity + character.stats.constitution + character.stats.speed;
    static calculateAttackMax = (/**@type {CharacterModel}*/character) => character.stats.strength * 4;
    static calculateDodgeChance = (/**@type {CharacterModel}*/character) => character.stats.speed * 4;
    static calculateCritChance = (/**@type {CharacterModel}*/character) => character.stats.dexterity * 3;

    static max = {
        battlePower: 30,
        attackMax: stats.strength.max * 4,
        dodgeChance: stats.speed.max * 4,
        critChance: stats.dexterity.max * 3,
    };

    static min = {
        critChance: 0,
    }
}

module.exports = StatCalculator;