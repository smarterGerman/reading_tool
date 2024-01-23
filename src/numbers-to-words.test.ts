import { expect, test } from 'vitest';
import numberToWords from './numbers-to-words';

test('Converts numbers 0 to 20 correctly', () => {
    const expected = [
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
        'dreizehn',
        'vierzehn',
        'fünfzehn',
        'sechzehn',
        'siebzehn',
        'achtzehn',
        'neunzehn',
        'zwanzig'
    ]
    for (let i = 0; i <= 20; i++) {
        expect(numberToWords(i)).toStrictEqual(expected[i])
    }
});

test('Converts two-digit numbers correctly', () => {
    expect(numberToWords(21)).toStrictEqual('einundzwanzig')
    expect(numberToWords(42)).toStrictEqual('zweiundvierzig')
    expect(numberToWords(55)).toStrictEqual('fünfundfünfzig')
    expect(numberToWords(78)).toStrictEqual('achtundsiebzig')
    expect(numberToWords(99)).toStrictEqual('neunundneunzig')
});

test('Converts three-digit numbers correctly', () => {
    expect(numberToWords(100)).toStrictEqual('einhundert')
    expect(numberToWords(101)).toStrictEqual('einhunderteins')
    expect(numberToWords(123)).toStrictEqual('einhundertdreiundzwanzig')
    expect(numberToWords(345)).toStrictEqual('dreihundertfünfundvierzig')
    expect(numberToWords(678)).toStrictEqual('sechshundertachtundsiebzig')
    expect(numberToWords(999)).toStrictEqual('neunhundertneunundneunzig')
});

test('Converts four-digit numbers correctly', () => {
    expect(numberToWords(1000)).toStrictEqual('eintausend')
    expect(numberToWords(1234)).toStrictEqual('eintausendzweihundertvierunddreißig')
    expect(numberToWords(5678)).toStrictEqual('fünftausendsechshundertachtundsiebzig')
    expect(numberToWords(9876)).toStrictEqual('neuntausendachthundertsechsundsiebzig')
    expect(numberToWords(9999)).toStrictEqual('neuntausendneunhundertneunundneunzig')
});

test('Refuses to handle out-of-range numbers', () => {
    expect(numberToWords(-1)).toStrictEqual(null)
    expect(numberToWords(43654)).toStrictEqual(null)
});