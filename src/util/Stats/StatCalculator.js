const CharacterModel = require('../../database/schemas/character');

class StatCalculator {
    static calculateMaxHealth = (/**@type {CharacterModel}*/character) => character.stats.constitution * 5 + 50;
    static calculateBattlePower = (/**@type {CharacterModel}*/character) => character.stats.strength + character.stats.dexterity + character.stats.constitution + character.stats.speed;
}

module.exports = StatCalculator;