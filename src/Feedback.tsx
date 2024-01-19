import { InsertOp, MergeOp, NoOp, Op, RemoveOp, editPath } from './edit-path'

function renderOp(op: Op, arr1: string[], arr2: string[]) {
    if (op instanceof InsertOp) {
        return <span className="transcript-add">{arr2[op.index]} </span>
    }
    if (op instanceof RemoveOp) {
        return <span className="transcript-remove">{arr1[op.index]} </span>
    }
    if (op instanceof NoOp) {
        return <span className="transcript-correct">{arr1[op.index_arr1]} </span>
    }
    if (op instanceof MergeOp) {
        return <span className="transcript-correct">{arr2[op.index_arr2]} </span>
    }
    console.error("Unknown operation type: " + op.constructor.name)
}

function renderDiff(arr1: string[], arr2: string[], preprocess: (a: string) => string, trim: boolean) {
    let path = editPath(arr1, arr2, preprocess)
    while(trim && path.length > 1 && path[path.length - 1] instanceof InsertOp) {
        path.pop()
    }
    return (<p>
        {path.map(op => renderOp(op, arr1, arr2))}
    </p>)
}

function getWords(s: string) {
    return s.split(" ").filter(w => w.length > 0)
}

function normalize(word: string) {
    return word.toUpperCase().replaceAll(/[\.,:;\?\!\"\'„“«»’\-—\(\)\[\]]/gi, "")
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
    return renderDiff(getWords(props.transcript), getWords(props.sentence), normalize, props.listening)
}

export default Feedback