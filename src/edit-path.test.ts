import { editPath } from './edit-path'
import { expect, test } from 'vitest'

const normalize = (a: string) => a

test('editPath - empty to empty', () => {
    expect(editPath([], [], normalize)).toStrictEqual([])
})

test('editPath - identity', () => {
    expect(editPath(['a', 'b'], ['a', 'b'], normalize)).toStrictEqual([
        ['NoOp', 'a'],
        ['NoOp', 'b']
    ])
})

test('editPath - from empty to non-empty', () => {
    expect(editPath([], ['a', 'b'], normalize)).toStrictEqual([
        ['InsertOp', 'a'],
        ['InsertOp', 'b'],
    ])
})

test('editPath - from non-empty to empty', () => {
    expect(editPath(['a', 'b'], [], normalize)).toStrictEqual([
        ['RemoveOp', 'a'],
        ['RemoveOp', 'b'],
    ])
})

test('editPath - add in the middle', () => {
    expect(editPath(['a', 'c'], ['a', 'b', 'c'], normalize)).toStrictEqual([
        ['NoOp', 'a'],
        ['InsertOp', 'b'],
        ['NoOp', 'c'],
    ])
})

test('editPath - remove in the middle', () => {
    expect(editPath(['a', 'b', 'c'], ['a', 'c'], normalize)).toStrictEqual([
        ['NoOp', 'a'],
        ['RemoveOp', 'b'],
        ['NoOp', 'c']
    ])
})

test('editPath - merge with hyphen', () => {
    expect(editPath(['ein', 'Kaffee', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'], normalize)).toStrictEqual([
        ['NoOp', 'ein'],
        ['NoOp', 'Kaffee-Desaster'],
        ['NoOp', 'test'],
    ])
})

test('editPath - merge without hyphen', () => {
    expect(editPath(['ein', 'Kaffee', 'Desaster', 'test'], ['ein', 'KaffeeDesaster', 'test'], normalize)).toStrictEqual([
        ['NoOp', 'ein'],
        ['NoOp', 'KaffeeDesaster'],
        ['NoOp', 'test'],
    ])
})

test('editPath - special merge', () => {
    expect(editPath(['ein', 'Café', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'], normalize)).toStrictEqual([
        ['NoOp', 'ein'],
        ['NoOp', 'Kaffee-Desaster'],
        ['NoOp', 'test'],
    ])
})

test('editPath - special merge - zum Beispiel', () => {
    expect(editPath(['ein', 'z.', 'B.', 'test'], ['ein', 'zum', 'Beispiel', 'test'], normalize)).toStrictEqual([
        ['NoOp', 'ein'],
        ['NoOp', 'zum Beispiel'],
        ['NoOp', 'test'],
    ])
})

test('editPath - special merge - zum Beispiel 2', () => {
    expect(editPath(['ein', 'z.B', 'test'], ['ein', 'zum', 'Beispiel', 'test'], normalize)).toStrictEqual([
        ['NoOp', 'ein'],
        ['NoOp', 'zum Beispiel'],
        ['NoOp', 'test'],
    ])
})

test('editPath - special merge with a normalize function', () => {
    expect(editPath(['ein', 'Café', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'],
        (a: string) => a.toUpperCase().replaceAll(/[\.,:;\?\!\"\'„“«»’\-—\(\)\[\]]/gi, ""))).toStrictEqual([
            ['NoOp', 'ein'],
            ['NoOp', 'Kaffee-Desaster'],
            ['NoOp', 'test'],
        ])
})

test('editPath - handle numbers as numbers and as words', () => {
    expect(editPath(['a', '324', 'b'], ['a', 'dreihundertvierundzwanzig', 'b'], normalize)).toStrictEqual([
        ['NoOp', 'a'],
        ['NoOp', 'dreihundertvierundzwanzig'],
        ['NoOp', 'b'],
    ])
    expect(editPath(['a', 'dreihundertvierundzwanzig', 'b'], ['a', '324', 'b'], normalize)).toStrictEqual([
        ['NoOp', 'a'],
        ['NoOp', '324'],
        ['NoOp', 'b'],
    ])
})