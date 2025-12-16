import { describe, it, expect } from 'vitest';

// These functions are pure mathematical calculations from symbol.ts
// Testing the math directly without DOM dependencies

const AREA = 100;

function circleInfo() {
  const r = Math.sqrt(AREA/Math.PI);
  const d = r*2;
  return { r, d, baseWidth: d, baseHeight: d };
}

function squareInfo() {
  const side = Math.sqrt(AREA);
  const apothem = side/2;
  return { side, apothem, baseWidth: side, baseHeight: side };
}

function triangleUpInfo() {
  const sqrt34 = Math.sqrt(3/4);
  const side = Math.sqrt(2*AREA/sqrt34);
  const height = side * sqrt34;
  return { side, height, sqrt34, baseWidth: side, baseHeight: height };
}

function diamondInfo() {
  const side = Math.sqrt(AREA);
  const radius = Math.sqrt(2*side**2)/2;
  return { side, radius, baseWidth: radius*2, baseHeight: radius*2 };
}

describe('Symbol Geometry Calculations', () => {
  describe('circle calculations', () => {
    it('should calculate circle radius correctly', () => {
      const { r } = circleInfo();
      const expectedRadius = Math.sqrt(100/Math.PI);
      expect(r).toBeCloseTo(expectedRadius, 5);
      expect(r).toBeCloseTo(5.641896, 5);
    });

    it('should have diameter twice the radius', () => {
      const { r, d } = circleInfo();
      expect(d).toBeCloseTo(r * 2, 5);
    });

    it('should have area equal to π*r²', () => {
      const { r } = circleInfo();
      const calculatedArea = Math.PI * r * r;
      expect(calculatedArea).toBeCloseTo(AREA, 5);
    });
  });

  describe('square calculations', () => {
    it('should calculate square side correctly', () => {
      const { side } = squareInfo();
      expect(side).toBeCloseTo(10, 5); // sqrt(100) = 10
    });

    it('should have apothem as half the side', () => {
      const { side, apothem } = squareInfo();
      expect(apothem).toBeCloseTo(side / 2, 5);
    });

    it('should have area equal to side²', () => {
      const { side } = squareInfo();
      const calculatedArea = side * side;
      expect(calculatedArea).toBeCloseTo(AREA, 5);
    });
  });

  describe('triangle calculations', () => {
    it('should calculate triangle side correctly for area 100', () => {
      const { side } = triangleUpInfo();
      // For equilateral triangle: side ≈ 15.1967 for area = 100
      expect(side).toBeCloseTo(15.1967, 3);
    });

    it('should calculate triangle height correctly', () => {
      const { side, height, sqrt34 } = triangleUpInfo();
      expect(height).toBeCloseTo(side * sqrt34, 5);
      // Height should be ≈ 13.161 for area = 100
      expect(height).toBeCloseTo(13.161, 2);
    });

    it('should have correct area calculation', () => {
      const { side, height } = triangleUpInfo();
      const calculatedArea = (side * height) / 2;
      expect(calculatedArea).toBeCloseTo(AREA, 3);
    });

    it('should use correct sqrt(3/4) constant', () => {
      const { sqrt34 } = triangleUpInfo();
      expect(sqrt34).toBeCloseTo(Math.sqrt(3/4), 10);
      expect(sqrt34).toBeCloseTo(0.866025, 5);
    });
  });

  describe('diamond calculations', () => {
    it('should calculate diamond dimensions correctly', () => {
      const { side, radius } = diamondInfo();
      expect(side).toBeCloseTo(10, 5); // sqrt(100) = 10
      
      // For a diamond (rotated square), radius is distance from center to vertex
      const expectedRadius = Math.sqrt(2*side**2)/2;
      expect(radius).toBeCloseTo(expectedRadius, 5);
      expect(radius).toBeCloseTo(side * Math.sqrt(2) / 2, 5);
    });

    it('should have base dimensions as diameter', () => {
      const { radius, baseWidth, baseHeight } = diamondInfo();
      expect(baseWidth).toBeCloseTo(radius * 2, 5);
      expect(baseHeight).toBeCloseTo(radius * 2, 5);
    });
  });

  describe('area consistency', () => {
    it('should maintain consistent area across all shapes', () => {
      // All shapes should be designed for the same visual area
      const circle = circleInfo();
      const square = squareInfo();
      const triangle = triangleUpInfo();
      
      // Circle area
      const circleArea = Math.PI * circle.r * circle.r;
      expect(circleArea).toBeCloseTo(AREA, 3);
      
      // Square area
      const squareArea = square.side * square.side;
      expect(squareArea).toBeCloseTo(AREA, 3);
      
      // Triangle area  
      const triangleArea = (triangle.side * triangle.height) / 2;
      expect(triangleArea).toBeCloseTo(AREA, 3);
    });
  });
});