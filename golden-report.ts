// Intended usage:
// 1. Make a change.
// 2. `git stash`
// 3. `tsx golden-report.ts https://URL > /tmp/some_file_old`
// 4. `git stash pop`
// 5. `tsx golden-report.ts https://URL > /tmp/some_file_new`
// 6. Diff the two.

import { extractSentencesFromSection, getWords, normalize } from './src/data-extraction'

if (process.argv.length != 3) {
    console.error("Usage: tsx golden-report.ts https://URL")
    process.exit(1)
}

let url = process.argv[2]

let response = await fetch(url)
const input = JSON.parse(await response.text())
let report = input['sections'].map(s => ({
    'id': s['id'],
    'sentences': extractSentencesFromSection(s).map(sentence => getWords(sentence).map(normalize))
}))
console.log(JSON.stringify(report, null, 2))

export {}