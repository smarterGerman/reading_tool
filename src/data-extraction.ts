/** Takes a word and returns its normalized form that is useful for comparison.
 * Strips all punctuation and converts it to upper-case. */
export function normalize(word: string) {
    // \p{..} matches by Unicode general category. Unicode general category P
    // is punctuation - so this line strips all punctuation.
    // https://unicode.org/reports/tr18/#General_Category_Property
    return word.toUpperCase().replaceAll(/\p{P}/giu, "")
}

/** Takes a sentence and returns an array of words. */
export function getWords(s: string) {
    return s.split(" ").filter(w => w.length > 0)
}

type Section = {
    id: string,
    content: string,
}

export function extractSentencesFromSection(section: Section) {
    return section
        .content
        .split("\n")
        .map(s => s.trim())
        .filter(s => s.length > 0)
}

type SentenceData = {
    sections: Section[]
}

export function extractSentences(data: SentenceData, id: string) {
