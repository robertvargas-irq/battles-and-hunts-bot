class PronounsUtil {

    /**
     * Resolve the proper word depending on the incoming pronoun
     * @param {string} pronoun 
     * @param {string} neutral Example: They/Xem
     * @param {string} nonNeutral Example: He/She
     */
    static neutralResolver = (pronoun, neutral, nonNeutral) => {
        if (pronoun.endsWith('y')) return neutral;
        return nonNeutral;
    }
}

module.exports = PronounsUtil;