import Point from '../src/Point';

describe('Point', () => {
  it('stores x and y', () => {
    const p = new Point(2, 3);
    expect(p.x).toBe(2);
    expect(p.y).toBe(3);
  });

  describe('equals', () => {
    it('returns true for points with the same coordinates', () => {
      expect(new Point(1, 2).equals(new Point(1, 2))).toBe(true);
    });

    it('returns false for points with different coordinates', () => {
      expect(new Point(1, 2).equals(new Point(2, 1))).toBe(false);
    });
  });

  describe('toString', () => {
    it('renders as "x,y"', () => {
      expect(new Point(3, 4).toString()).toBe('3,4');
    });
  });
});
