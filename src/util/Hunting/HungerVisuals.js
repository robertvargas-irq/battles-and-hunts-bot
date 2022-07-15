const CoreUtil = require("../CoreUtil");
const HungerVisualsData = require('./hungerVisuals.json');

class HungerVisuals {
    static getColor = (ratio) => CoreUtil.GetColorFromRatio(HungerVisualsData.colors, ratio);
    static getDescription = (ratio) => CoreUtil.GetArrayElementFromRatio(HungerVisualsData.descriptions, ratio);
    static getTitle = (ratio) => CoreUtil.GetArrayElementFromRatio(HungerVisualsData.titles, ratio);
    static getFlair = (ratio) => CoreUtil.GetArrayElementFromRatio(HungerVisualsData.flairs, ratio);
}

module.exports = HungerVisuals;