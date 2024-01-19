import { InsertOp, MergeOp, NoOp, RemoveOp, editPath } from './edit-path'
import { expect, test } from 'vitest'

const normalize = (a: string) => a

test('editPath - empty to empty', () => {
    expect(editPath([], [], normalize)).toStrictEqual([])
})

test('editPath - identity', () => {
    expect(editPath(['a', 'b'], ['a', 'b'], normalize)).toStrictEqual([
        new NoOp(0, 0),
        new NoOp(1, 1),
    ])
})

test('editPath - from empty to non-empty', () => {
    expect(editPath([], ['a', 'b'], normalize)).toStrictEqual([
        new InsertOp(0),
        new InsertOp(1),
    ])
})

test('editPath - from non-empty to empty', () => {
    expect(editPath(['a', 'b'], [], normalize)).toStrictEqual([
        new RemoveOp(0),
        new RemoveOp(1),
    ])
})

test('editPath - add in the middle', () => {
    expect(editPath(['a', 'c'], ['a', 'b', 'c'], normalize)).toStrictEqual([
        new NoOp(0, 0),
        new InsertOp(1),
        new NoOp(1, 2),
    ])
})

test('editPath - remove in the middle', () => {
    expect(editPath(['a', 'b', 'c'], ['a', 'c'], normalize)).toStrictEqual([
        new NoOp(0, 0),
        new RemoveOp(1),
        new NoOp(2, 1),
    ])
})

test('editPath - merge with hyphen', () => {
    expect(editPath(['ein', 'Kaffee', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'], normalize)).toStrictEqual([
        new NoOp(0, 0),
        new MergeOp([1, 2], 1),
        new NoOp(3, 2),
    ])
})

test('editPath - merge without hyphen', () => {
    expect(editPath(['ein', 'Kaffee', 'Desaster', 'test'], ['ein', 'KaffeeDesaster', 'test'], normalize)).toStrictEqual([
        new NoOp(0, 0),
        new MergeOp([1, 2], 1),
        new NoOp(3, 2),
    ])
})

test('editPath - special merge', () => {
    expect(editPath(['ein', 'Café', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'], normalize)).toStrictEqual([
        new NoOp(0, 0),
        new MergeOp([1, 2], 1),
        new NoOp(3, 2),
    ])
})

test('editPath - special merge with a normalize function', () => {
    expect(editPath(['ein', 'Café', 'Desaster', 'test'], ['ein', 'Kaffee-Desaster', 'test'],
        (a: string) => a.toUpperCase().replaceAll(/[\.,:;\?\!\"\'„“«»’\-—\(\)\[\]]/gi, ""))).toStrictEqual([
            new NoOp(0, 0),
            new MergeOp([1, 2], 1),
            new NoOp(3, 2),
        ])
})