function digitToWord(digit: number): string {
    const digits = [
        'null',
        'ein',  // eins in "final" position, but that will be handled at a higher level
        'zwei',
        'drei',
        'vier',
        'fünf',
        'sechs',
        'sieben',
        'acht',
        'neun'
    ]
    return digits[digit]
}

function twoDigitsToWords(num: number): string {
    const germanWords: { [key: number]: string } = {
        1: 'eins',
        10: 'zehn',
        11: 'elf',
        12: 'zwölf',
        13: 'dreizehn',
        14: 'vierzehn',
        15: 'fünfzehn',
        16: 'sechzehn',
        17: 'siebzehn',
        18: 'achtzehn',
        19: 'neunzehn',
        20: 'zwanzig',
        30: 'dreißig',
        40: 'vierzig',
        50: 'fünfzig',
        60: 'sechzig',
        70: 'siebzig',
        80: 'achtzig',
        90: 'neunzig'
    }
    
    if (germanWords.hasOwnProperty(num)) {
        return germanWords[num]
    }

    // It's important that this goes AFTER handling `germanWords` to ensure that
    // for 1, "eins" is returned
    if (num < 10) {
        return digitToWord(num)
    }

    // Handling other two-digit numbers
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;

    const onesWord = ones == 1 ? 'ein' : digitToWord(ones)
    return `${onesWord}und${germanWords[tens]}`
}

export default function numberToWords(num: number): string | null {
    if (num < 0) return null;
    if (num >= 10000) return null;
    
    let twoDigits = twoDigitsToWords(num % 100)
    if (num < 100) return twoDigits

    const hundreds = Math.floor(num / 100) % 10
    if (num % 100 == 0) twoDigits = ''
    let threeDigits = `${digitToWord(hundreds)}hundert${twoDigits}`

    if (num < 1000) return threeDigits
    if (num % 1000 == 0) threeDigits = ''
    const thousands = Math.floor(num / 1000)
    return `${digitToWord(thousands)}tausend${threeDigits}`
}