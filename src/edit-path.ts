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

const SPECIAL_MERGES = new Map<string, string>([
    ['Café Desaster', 'Kaffee-Desaster'],
    ['z. B.', 'zum Beispiel'],
])

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
function specialSubstitution(from: string[], to: string[], from_i: number, to_i: number, normalize: (a: string) => string) {
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
        return [sub_from.length, sub_to.length]
    }
    return null
}

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
    const comp = (a: string, b: string) => normalize(a) === normalize(b)
    let special_merges = new Map<string, string>()
    for (const [k, v] of SPECIAL_MERGES) {
        special_merges.set(normalize(k), normalize(v))
    }
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
            if (comp(from[i - 1], to[j - 1])) {
                dist[i][j] = dist[i - 1][j - 1]
                ops[i][j] = new NoOp(1, 1)
            } else if (i >= 2 &&
                (comp(from[i - 2] + '-' + from[i - 1], to[j - 1]) ||
                    comp(from[i - 2] + from[i - 1], to[j - 1]))) {
                dist[i][j] = dist[i - 2][j - 1]
                ops[i][j] = new NoOp(2, 1)
            } else {
                let specialSub = specialSubstitution(from, to, i - 1, j - 1, normalize)
                if (specialSub !== null) {
                    // from - number of words in arr1 to be substituted
                    // to - number of words in arr2 to be substituted with
                    const [from_len, to_len] = specialSub
                    dist[i][j] = dist[i - from_len][j - to_len]
                    ops[i][j] = new NoOp(from_len, to_len)
                } else {
                    // The classic algorithm also supports substitution, but I'm not sure
                    // how to render it nicely => not doing it here.
                    let dist_ins = dist[i][j - 1] + 1;
                    let dist_rem = dist[i - 1][j] + 1;
                    if (dist_ins <= dist_rem) {
                        dist[i][j] = dist_ins;
                        ops[i][j] = new InsertOp()
                    } else {
                        dist[i][j] = dist_rem;
                        ops[i][j] = new RemoveOp()
                    }
                }
            }
        }
    }

    return traversePath(from, to, ops)
}