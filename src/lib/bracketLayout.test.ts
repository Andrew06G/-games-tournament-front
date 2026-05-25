import { describe, expect, it } from 'vitest';
import {
  BRACKET_ROW_UNIT,
  bracketCanvasHeight,
  computeBracketTops,
} from './bracketLayout';

describe('computeBracketTops', () => {
  it('returns an empty array when there are no rounds', () => {
    expect(computeBracketTops([])).toEqual([]);
  });

  it('places first-round matches at evenly spaced vertical offsets', () => {
    const tops = computeBracketTops([4]);
    expect(tops).toHaveLength(1);
    expect(tops[0]).toEqual([0, 148, 296, 444]);
    expect(tops[0]![1]! - tops[0]![0]!).toBe(BRACKET_ROW_UNIT);
  });

  it('centers later rounds between their feeder matches (8-team bracket)', () => {
    const tops = computeBracketTops([4, 2, 1]);
    expect(tops).toHaveLength(3);
    expect(tops[0]).toEqual([0, 592, 1184, 1776]);
    expect(tops[1]).toEqual([296, 1480]);
    expect(tops[2]).toEqual([888]);
    expect(tops[1]![0]).toBe((tops[0]![0]! + tops[0]![1]!) / 2);
    expect(tops[1]![1]).toBe((tops[0]![2]! + tops[0]![3]!) / 2);
    expect(tops[2]![0]).toBe((tops[1]![0]! + tops[1]![1]!) / 2);
  });

  it('handles a single match in the final column only', () => {
    const tops = computeBracketTops([1]);
    expect(tops[0]).toEqual([0]);
  });

  it('treats missing counts in a column as zero matches', () => {
    const tops = computeBracketTops([2, 0]);
    expect(tops[1]).toEqual([]);
  });
});

describe('bracketCanvasHeight', () => {
  it('returns 400 when there are no rounds', () => {
    expect(bracketCanvasHeight([])).toBe(400);
  });

  it('returns 400 when the first round has no matches', () => {
    expect(bracketCanvasHeight([0])).toBe(400);
  });

  it('extends below the last first-round match plus padding', () => {
    const counts = [4];
    const tops = computeBracketTops(counts);
    const lastTop = tops[0]![tops[0]!.length - 1]!;
    expect(bracketCanvasHeight(counts)).toBe(lastTop + BRACKET_ROW_UNIT + 48);
  });
});
