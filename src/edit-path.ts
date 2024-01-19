export abstract class Op {
    abstract pred(i: number, j: number): [number, number]
}

export class InsertOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i, j - 1]
    }
    constructor(public readonly index: number) { super() }
}

export class RemoveOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i - 1, j]
    }
    constructor(public readonly index: number) { super() }
}

export class NoOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i - 1, j - 1]
    }
    constructor(public readonly index_arr1: number, public readonly index_arr2: number) { super() }
}

export class MergeOp extends Op {
    pred(i: number, j: number): [number, number] {
        return [i - 2, j - 1]
    }
    constructor(
        public readonly indices_arr1: [number, number],
        public readonly index_arr2: number) { super() }
}

function traversePathImpl(ops: Op[][], i: number, j: number, accum: Op[]) {
    if (i == 0 && j == 0) return;

    let op = ops[i][j];

    let [p_i, p_j] = op.pred(i, j)
    traversePathImpl(ops, p_i, p_j, accum)
    accum.push(op)
}

/**
 * Takes ops[][] where ops[i][j] is the last edit operation transforming arr1[:i] into arr2[:j],
 * and returns a simple sequence of operations.
 */
function traversePath(ops: Op[][]) {
    let accum: Op[] = []
    traversePathImpl(ops, ops.length - 1, ops[0].length - 1, accum)
    return accum
}

const SPECIAL_MERGES = new Map<string, string>([
    ['Café Desaster', 'Kaffee-Desaster']
])

/**
 * Edit path from word array arr1 to word array arr2: minimal sequence of
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
export function editPath(arr1: string[], arr2: string[], normalize: (a: string) => string) {
    const comp = (a: string, b: string) => normalize(a) === normalize(b)
    let special_merges = new Map<string, string>()
    for (const [k, v] of SPECIAL_MERGES) {
        special_merges.set(normalize(k), normalize(v))
    }
    // dist[i][j] - edit distance between arr1[:i] and arr2[:j]
    let dist = Array.from(Array(arr1.length + 1), () => new Array(arr2.length + 1).fill(0))
    // ops[i][j] - the last operation performed when converting arr1[:i] to arr2[:j]
    let ops: Op[][] = Array.from(Array(arr1.length + 1), () => new Array(arr2.length + 1).fill(new NoOp(0, 0)))
    for (let i = 1; i < arr1.length + 1; i++) {
        dist[i][0] = i
        ops[i][0] = new RemoveOp(i - 1)
    }
    for (let j = 1; j < arr2.length + 1; j++) {
        dist[0][j] = j
        ops[0][j] = new InsertOp(j - 1)
    }
    for (let i = 1; i <= arr1.length; i++) {
        for (let j = 1; j <= arr2.length; j++) {
            if (comp(arr1[i - 1], arr2[j - 1])) {
                dist[i][j] = dist[i - 1][j - 1]
                ops[i][j] = new NoOp(i - 1, j - 1)
            } else if (i >= 2 &&
                (comp(arr1[i - 2] + '-' + arr1[i - 1], arr2[j - 1]) ||
                    comp(arr1[i - 2] + arr1[i - 1], arr2[j - 1]) ||
                    special_merges.get(normalize(arr1[i - 2] + ' ' + arr1[i - 1])) === normalize(arr2[j - 1]))) {
                dist[i][j] = dist[i - 2][j - 1]
                ops[i][j] = new MergeOp([i - 2, i - 1], j - 1)
            } else {
                // The classic algorithm also supports substitution, but I'm not sure
                // how to render it nicely => not doing it here.
                let dist_ins = dist[i][j - 1] + 1;
                let dist_rem = dist[i - 1][j] + 1;
                if (dist_ins <= dist_rem) {
                    dist[i][j] = dist_ins;
                    ops[i][j] = new InsertOp(j - 1)
                } else {
                    dist[i][j] = dist_rem;
                    ops[i][j] = new RemoveOp(i - 1)
                }
            }
        }
    }

    return traversePath(ops)
}