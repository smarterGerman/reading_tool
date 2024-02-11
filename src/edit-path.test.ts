import { editPath } from './edit-path'
import { expect, test } from 'vitest'

const normalize = (a: string) => a

test('editPath - empty to empty', () => {
    expect(editPath([], [], normalize)).toStrictEqual([])
})

test('editPath - identity', () => {
    expect(editPath(['a', 'b'], ['a', 'b'], normalize)).toStrictEqual([
        ['match', 'a'],
        ['match', 'b']
    ])
})

test('editPath - from empty to non-empty', () => {
    expect(editPath([], ['a', 'b'], normalize)).toStrictEqual([
        ['insert', 'a'],
        ['insert', 'b'],
    ])
})

test('editPath - from non-empty to empty', () => {
    expect(editPath(['a', 'b'], [], normalize)).toStrictEqual([
        ['remove', 'a'],
        ['remove', 'b'],
    ])
})

test('editPath - add in the middle', () => {
    expect(editPath(['a', 'c'], ['a', 'b', 'c'], normalize)).toStrictEqual([
        ['match', 'a'],
        ['insert', 'b'],
        ['match', 'c'],
    ])
})

test('editPath - remove in the middle', () => {
    expect(editPath(['a', 'b', 'c'], ['a', 'c'], normalize)).toStrictEqual([
        ['match', 'a'],
        ['remove', 'b'],
        ['match', 'c']
    ])
})

test('editPath - merge with hyphen', () => {
    expect(editPath(['ein', 'Kaffee', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'Kaffee-Desaster'],
        ['match', 'test'],
    ])
})

test('editPath - unmerge with hyphen', () => {
    expect(editPath(['ein', 'Kaffee-Desaster', 'test'], ['ein', 'Kaffee', 'Desaster', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'Kaffee Desaster'],
        ['match', 'test'],
    ])
})

test('editPath - merge without hyphen', () => {
    expect(editPath(['ein', 'Kaffee', 'Desaster', 'test'], ['ein', 'KaffeeDesaster', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'KaffeeDesaster'],
        ['match', 'test'],
    ])
})

test('editPath - unmerge without hyphen', () => {
    expect(editPath(['ein', 'KaffeeDesaster', 'test'], ['ein', 'Kaffee', 'Desaster', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'Kaffee Desaster'],
        ['match', 'test'],
    ])
})

test('editPath - special merge', () => {
    expect(editPath(['ein', 'Café', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'Kaffee-Desaster'],
        ['match', 'test'],
    ])
})

test('editPath - special merge - zum Beispiel', () => {
    expect(editPath(['ein', 'z.', 'B.', 'test'], ['ein', 'zum', 'Beispiel', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'zum Beispiel'],
        ['match', 'test'],
    ])
})

test('editPath - special merge - ok', () => {
    expect(editPath(['ein', 'ok', 'test'], ['ein', 'okay', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'okay'],
        ['match', 'test'],
    ])
    expect(editPath(['ein', 'okay', 'test'], ['ein', 'ok', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'ok'],
        ['match', 'test'],
    ])
})

test('editPath - special merge - zum Beispiel 2', () => {
    expect(editPath(['ein', 'z.B', 'test'], ['ein', 'zum', 'Beispiel', 'test'], normalize)).toStrictEqual([
        ['match', 'ein'],
        ['match', 'zum Beispiel'],
        ['match', 'test'],
    ])
})

test('editPath - special merge with a normalize function', () => {
    expect(editPath(['ein', 'Café', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'],
        (a: string) => a.toUpperCase().replaceAll(/[\.,:;\?\!\"\'„“«»’\-—\(\)\[\]]/gi, ""))).toStrictEqual([
            ['match', 'ein'],
            ['match', 'Kaffee-Desaster'],
            ['match', 'test'],
        ])
})

test('editPath - handle numbers as numbers and as words', () => {
    expect(editPath(['a', '324', 'b'], ['a', 'dreihundertvierundzwanzig', 'b'], normalize)).toStrictEqual([
        ['match', 'a'],
        ['match', 'dreihundertvierundzwanzig'],
        ['match', 'b'],
    ])
    expect(editPath(['a', 'dreihundertvierundzwanzig', 'b'], ['a', '324', 'b'], normalize)).toStrictEqual([
        ['match', 'a'],
        ['match', '324'],
        ['match', 'b'],
    ])
})

test('editPath - handle 6:30 vs halb 7', () => {
    const norm = (a: string) => a.toUpperCase().replaceAll(/[\.,:;\?\!\"\'„“«»’\-—\(\)\[\]]/gi, "")
    expect(editPath(['a', '6:30', 'Uhr', 'b'], ['a', 'halb', '7', 'b'], norm)).toStrictEqual([
        ['match', 'a'],
        ['match', 'halb 7'],
        ['match', 'b'],
    ])
    expect(editPath(['a', '6:30', 'Uhr', 'b'], ['a', 'halb', 'sieben', 'b'], norm)).toStrictEqual([
        ['match', 'a'],
        ['match', 'halb sieben'],
        ['match', 'b'],
    ])
})