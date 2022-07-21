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

    /**
     * Turn a plural like "hers"/"theirs" into "her"/"their"
     * @param {string} pronoun 
     */
    static pluralToSingular = (pronoun) => {
        if (pronoun.endsWith('rs')) return pronoun.substring(0, pronoun.length - 1);
        return pronoun;
    }
}

module.exports = PronounsUtil;