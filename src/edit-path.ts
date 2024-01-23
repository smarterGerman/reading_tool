import numberToWords from "./numbers-to-words"

abstract class Op {
    abstract pred(i: number, j: number): [number, number]
    abstract toString(from: string[], to: string[], i: number, j: number): string
}

class InsertOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i, j - 1]
    }
    toString(_: string[], to: string[], _i: number, j: number) {
        return to[j - 1]
    }
}

class RemoveOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i - 1, j]
    }
    toString(from: string[], _: string[], i: number, _j: number) {
        return from[i - 1]
    }
}

/**
 * This means essentially "no difference", but this "no difference" can happen
 * in many ways:
 * - a word matches
 * - a word in `to` is a merger of multiple words in `from`: Kaffee Desaster => Kaffee-Desaster
 * - a sequence of words in "to" matches a sequence of words in "from", but
 *   semantically rather than letter-to-letter. Example: z. B. => zum Beispiel
 * So it can match an arbitrary number of words in both sequences.
 */
class NoOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i - this.count_from, j - this.count_to]
    }
    toString(_: string[], to: string[], _i: number, j: number) {
        return to.slice(j - this.count_to, j).join(' ')
    }
    constructor(
        public readonly count_from: number,
        public readonly count_to: number) { super() }
}

export type RenderedOp = [string, string]

function traversePathImpl(from: string[], to: string[], ops: Op[][], i: number, j: number, accum: RenderedOp[]) {
    if (i == 0 && j == 0) return;

    let op = ops[i][j];

    let [p_i, p_j] = op.pred(i, j)
    traversePathImpl(from, to, ops, p_i, p_j, accum)
    accum.push([op.constructor.name, op.toString(from, to, i, j)])
}

/**
 * Takes ops[][] where ops[i][j] is the last edit operation transforming from[:i] into to[:j],
 * and returns a simple sequence of operations formatted as:
 * [
 *  ["<operation>", "<word>"]
 *  ["<operation>", "<word>"]
 *  ...
 * ]
 */
function traversePath(from: string[], to: string[], ops: Op[][]) {
    let accum: [string, string][] = []
    traversePathImpl(from, to, ops, ops.length - 1, ops[0].length - 1, accum)
    return accum
}

type Matcher = (from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string) => [Op, number] | null

function runMatchers(matchers: Matcher[], dist: number[][], from: string[], to: string[], i: number, j: number, normalize: (a: string) => string): [Op, number] {
    const matches = matchers
        .map(m => m(from, to, i-1, j-1, normalize))
        .filter(r => r !== null) as [Op, number][]
    let min_i = -1
    let min_d = 2 ** 64
    for (let m_i = 0; m_i < matches.length; m_i++) {
        const [pred_i, pred_j] = matches[m_i][0].pred(i, j)
        let d = dist[pred_i][pred_j] + matches[m_i][1]
        // NOTE: it's important that it is "<" and not "<=" here.
        // Order of matchers matters for the ordering of the rendered output.
        if (d < min_d) {
            min_i = m_i
            min_d = d
        }
    }
    return [matches[min_i][0], min_d]
}

function noOpMatcher(from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string): [Op, number] | null {
    return normalize(from[from_i]) === normalize(to[to_i]) ? [new NoOp(1, 1), 0] : null
}

function mergeMatcher(from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string): [Op, number] | null {
    if (normalize(from[from_i - 1] + '-' + from[from_i]) === normalize(to[to_i]) ||
        normalize(from[from_i - 1] + from[from_i]) === normalize(to[to_i]))
        return [new NoOp(2, 1), 0]
    return null
}

function insertMatcher(): [Op, number] | null {
    return [new InsertOp(), 1]
}

function removeMatcher(): [Op, number] | null {
    return [new RemoveOp(), 1]
}

const SPECIAL_SUBS = [
    [['Café', 'Desaster'], ['Kaffee-Desaster']],
    [['z.', 'B.'], ['zum', 'Beispiel']],
    [['z.B'], ['zum', 'Beispiel']],
]

/**
 * Handle special substitutions - a list of predefined lists of words that are
 * considered to match - with matches ending at indices `from_i` in `from` and
 * `to_i` in `to`.
 * 
 * @returns null or a pair of [from match length, to match length]
 */
function specialSubMatcher(from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string): [Op, number] | null {
    subs: for (const sub of SPECIAL_SUBS) {
        const [sub_from, sub_to] = sub;
        if (from_i - sub_from.length + 1 < 0) continue;
        if (to_i - sub_to.length + 1 < 0) continue;
        // Check that the last `sub_from.length` elements of `from` up to `from_i`
        // match sub_from.
        for (let i = 0; i < sub_from.length; ++i) {
            if (normalize(from[from_i - sub_from.length + 1 + i]) !== normalize(sub_from[i])) {
                continue subs;
            }
        }
        // Check that the last `sub_to.length` elements of `to` up to `to_i`
        // match sub_to.
        for (let i = 0; i < sub_to.length; ++i) {
            if (normalize(to[to_i - sub_to.length + 1 + i]) !== normalize(sub_to[i])) {
                continue subs;
            }
        }
        return [new NoOp(sub_from.length, sub_to.length), 0]
    }
    return null
}

function isNumberic(s: string) {
    return /^-?\d+$/.test(s)
}

function numberMatcher(from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string): [Op, number] | null {
    if (isNumberic(from[from_i]) && !isNumberic(to[to_i])) {
        let num_i = +from[from_i]
        let words_i = numberToWords(num_i)
        if (words_i !== null && normalize(words_i) == normalize(to[to_i])) {
            return [new NoOp(1, 1), 0]
        }
    }
    if (!isNumberic(from[from_i]) && isNumberic(to[to_i])) {
        let num_i = +to[to_i]
        let words_i = numberToWords(num_i)
        if (words_i !== null && normalize(from[from_i]) == normalize(words_i)) {
            return [new NoOp(1, 1), 0]
        }
    }
    return null
}

const hoursToWords = [
    'null',
    'eins',
    'zwei',
    'drei',
    'vier',
    'fünf',
    'sechs',
    'sieben',
    'acht',
    'neun',
    'zehn',
    'elf',
    'zwölf',
    'eins',
]

/**
 * Matches "<X>:30 Uhr" to "halb <X+1>", accepts both words and numbers.
 * We need this because speech recognition tends to recognize "halb sieben" as "6:30 Uhr"
 */
function timeMatcher(from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string): [Op, number] | null {
    if (from_i == 0 || to_i == 0) return null
    console.log(`${from[from_i - 1]} ${from[from_i]}`)
    console.log(`${to[to_i - 1]} ${to[to_i]}`)
    if (normalize(to[to_i - 1]) !== normalize('halb') || normalize(from[from_i]) !== normalize('Uhr')) return null
    
    let match = from[from_i - 1].match(/^(\d+):30$/)
    if(match && (normalize(to[to_i]) === normalize((+match[1] + 1).toString()) ||
            normalize(to[to_i]) === normalize(hoursToWords[+match[1] + 1]))) {
        return [new NoOp(2, 2), 0]
    }
    return null
}

const MATCHERS: Matcher[] = [
    // All of these produce NoOp and add 0 to the edit distance
    noOpMatcher,
    mergeMatcher,
    specialSubMatcher,
    numberMatcher,
    timeMatcher,
    // These produce their corresponding ops and add 1 to the edit distance
    insertMatcher,
    removeMatcher,
]

/**
 * Edit path from word array `from` to word array `to`: minimal sequence of
 * operations to get from one function to the other with the following opeartions:
 * - Remove a word (1 operation)
 * - Add a word (1 operation)
 * - Merge two words (0 operations):
 *   - with hyphen (Kaffe Desaster -> Kaffee-Desaster)
 *   - without hypthen (Montag Morgen -> MontagMorgen)
 *   - special predefined merge (Café Desaster -> Kaffee-Desaster)
 * Inspired by Levenshtein edit distance algorithm: https://en.wikipedia.org/wiki/Levenshtein_distance 
 * @param normalize a function used to normalize strings before comparison
 * @returns a sequence of operations to be performed
 */
export function editPath(from: string[], to: string[], normalize: (a: string) => string) {
    // dist[i][j] - edit distance between from[:i] and to[:j]
    let dist = Array.from(Array(from.length + 1), () => new Array(to.length + 1).fill(0))
    // ops[i][j] - the last operation performed when converting from[:i] to to[:j]
    let ops: Op[][] = Array.from(Array(from.length + 1), () => new Array(to.length + 1).fill(new NoOp(0, 0)))
    for (let i = 1; i < from.length + 1; i++) {
        dist[i][0] = i
        ops[i][0] = new RemoveOp()
    }
    for (let j = 1; j < to.length + 1; j++) {
        dist[0][j] = j
        ops[0][j] = new InsertOp()
    }
    for (let i = 1; i <= from.length; i++) {
        for (let j = 1; j <= to.length; j++) {
            [ops[i][j], dist[i][j]] = runMatchers(MATCHERS, dist, from, to, i, j, normalize)
        }
    }

    return traversePath(from, to, ops)
}