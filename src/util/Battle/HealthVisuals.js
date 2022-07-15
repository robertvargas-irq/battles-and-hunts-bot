const CoreUtil = require('../CoreUtil');

class HealthVisuals {
    static getColor = (ratio) => CoreUtil.GetColorFromRatio(colors, ratio);
    static getDescription = (ratio) => CoreUtil.GetArrayElementFromRatio(descriptions, ratio);
    static getTitle = (ratio) => CoreUtil.GetArrayElementFromRatio(titles, ratio);
    static getFlair = (ratio) => CoreUtil.GetArrayElementFromRatio(flairs, ratio);
}

module.exports = HealthVisuals;