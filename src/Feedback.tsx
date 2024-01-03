enum OpKind {
    Insert,
    Remove,
    Noop,
}

type InsertOp = [OpKind.Insert, number]
type RemoveOp = [OpKind.Remove, number]
type NoOp = [OpKind.Noop, number, number]
type Op = InsertOp | RemoveOp | NoOp

function traversePathImpl(ops: Op[][], i: number, j: number, accum: Op[]) {
    if (i == 0 && j == 0) return;

    let op = ops[i][j];

    switch (op[0]) {
        case OpKind.Insert:
            traversePathImpl(ops, i, j - 1, accum)
            break
        case OpKind.Remove:
            traversePathImpl(ops, i - 1, j, accum)
            break
        case OpKind.Noop:
            traversePathImpl(ops, i - 1, j - 1, accum)
            break
    }
    accum.push(op)
}

function traversePath(ops: Op[][]) {
    let accum: Op[] = []
    traversePathImpl(ops, ops.length - 1, ops[0].length - 1, accum)
    return accum
}

function levenshteinPath(arr1: string[], arr2: string[], comp: (a: string, b: string) => boolean) {
    let dist = Array.from(Array(arr1.length + 1), () => new Array(arr2.length + 1).fill(0))
    let ops: Op[][] = Array.from(Array(arr1.length + 1), () => new Array(arr2.length + 1).fill([OpKind.Noop, 0, 0]))
    for (let i = 1; i < arr1.length + 1; i++) {
        dist[i][0] = i
        ops[i][0] = [OpKind.Remove, i - 1]
    }
    for (let j = 1; j < arr2.length + 1; j++) {
        dist[0][j] = j
        ops[0][j] = [OpKind.Insert, j - 1]
    }
    for (let i = 1; i <= arr1.length; i++) {
        for (let j = 1; j <= arr2.length; j++) {
            if (comp(arr1[i - 1], arr2[j - 1])) {
                dist[i][j] = dist[i - 1][j - 1]
                ops[i][j] = [OpKind.Noop, i - 1, j - 1]
            } else {
                // The classic algorithm also supports substitution, but I'm not sure
                // how to render it nicely => not doing it here.
                let dist_ins = dist[i][j - 1] + 1;
                let dist_rem = dist[i - 1][j] + 1;
                if (dist_ins <= dist_rem) {
                    dist[i][j] = dist_ins;
                    ops[i][j] = [OpKind.Insert, j - 1]
                } else {
                    dist[i][j] = dist_rem;
                    ops[i][j] = [OpKind.Remove, i - 1]
                }
            }
        }
    }

    return traversePath(ops)
}

function renderOp(op: Op, arr1: string[], arr2: string[]) {
    switch (op[0]) {
        case OpKind.Insert:
            return <li className="transcript-element transcript-add">{arr2[op[1]]}</li>
        case OpKind.Remove:
            return <li className="transcript-element transcript-remove">{arr1[op[1]]}</li>
        case OpKind.Noop:
            return <li className="transcript-element transcript-correct">{arr1[op[1]]}</li>
    }
}

function renderDiff(arr1: string[], arr2: string[], comp: (a: string, b: string) => boolean, trim: boolean) {
    let path = levenshteinPath(arr1, arr2, comp)
    while(trim && path.length > 1 && path[path.length - 1][0] === OpKind.Insert) {
        path.pop()
    }
    return <>
        <ul>
            {path.map(op => renderOp(op, arr1, arr2))}
        </ul>
    </>
}

function getWords(s: string) {
    return s.split(" ").filter(w => w.length > 0)
}

function preprocess(word: string) {
    return word.toUpperCase().replaceAll(/[\.,]/gi, "")
}

type FeedbackProps = {
    listening: boolean,
    sentence: string,
    transcript: string,
}

function Feedback(props: FeedbackProps) {
    if(props.transcript === "") {
        return <p></p>
    }
    return renderDiff(getWords(props.transcript), getWords(props.sentence), (a, b) => preprocess(a) === preprocess(b), props.listening)
}

export default Feedback