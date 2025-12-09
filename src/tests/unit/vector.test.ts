import { describe, it, expect } from 'vitest';
import { Vec2 } from '../../../lib/common/vector.js';

describe('Vec2', () => {
  describe('constructor and getters', () => {
    it('should create vector with default values', () => {
      const vec = new Vec2();
      expect(vec.x).toBe(0);
      expect(vec.y).toBe(0);
    });

    it('should create vector with specified values', () => {
      const vec = new Vec2(3, 4);
      expect(vec.x).toBe(3);
      expect(vec.y).toBe(4);
    });
  });

  describe('setters', () => {
    it('should set x and y values', () => {
      const vec = new Vec2(1, 2);
      vec.x = 5;
      vec.y = 6;
      expect(vec.x).toBe(5);
      expect(vec.y).toBe(6);
    });
  });

  describe('basic operations', () => {
    it('should clone vector', () => {
      const vec1 = new Vec2(3, 4);
      const vec2 = vec1.clone();
      expect(vec2.x).toBe(3);
      expect(vec2.y).toBe(4);
      expect(vec2).not.toBe(vec1); // Different objects
    });

    it('should check equality', () => {
      const vec1 = new Vec2(3, 4);
      const vec2 = new Vec2(3, 4);
      const vec3 = new Vec2(5, 6);
      expect(vec1.equal(vec2)).toBe(true);
      expect(vec1.equal(vec3)).toBe(false);
    });

    it('should create new vectors with modified coordinates', () => {
      const vec = new Vec2(3, 4);
      const newX = vec.setX(7);
      const newY = vec.setY(8);
      
      expect(newX.x).toBe(7);
      expect(newX.y).toBe(4);
      expect(newY.x).toBe(3);
      expect(newY.y).toBe(8);
      expect(vec.x).toBe(3); // Original unchanged
      expect(vec.y).toBe(4);
    });
  });

  describe('addition', () => {
    it('should add vectors', () => {
      const vec1 = new Vec2(1, 2);
      const vec2 = new Vec2(3, 4);
      const result = vec1.add(vec2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should add scalars', () => {
      const vec = new Vec2(1, 2);
      const result = vec.addScalar(5);
      expect(result.x).toBe(6);
      expect(result.y).toBe(7);
    });

    it('should add to x coordinate only', () => {
      const vec = new Vec2(1, 2);
      const result = vec.addX(5);
      expect(result.x).toBe(6);
      expect(result.y).toBe(2);
    });

    it('should add to y coordinate only', () => {
      const vec = new Vec2(1, 2);
      const result = vec.addY(5);
      expect(result.x).toBe(1);
      expect(result.y).toBe(7);
    });
  });

  describe('subtraction', () => {
    it('should subtract vectors', () => {
      const vec1 = new Vec2(5, 7);
      const vec2 = new Vec2(2, 3);
      const result = vec1.subtract(vec2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should subtract scalars', () => {
      const vec = new Vec2(10, 15);
      const result = vec.subtractScalar(5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });
  });

  describe('multiplication and division', () => {
    it('should multiply vectors', () => {
      const vec1 = new Vec2(2, 3);
      const vec2 = new Vec2(4, 5);
      const result = vec1.multiply(vec2);
      expect(result.x).toBe(8);
      expect(result.y).toBe(15);
    });

    it('should multiply by scalar', () => {
      const vec = new Vec2(2, 3);
      const result = vec.multiplyScalar(4);
      expect(result.x).toBe(8);
      expect(result.y).toBe(12);
    });

    it('should divide vectors', () => {
      const vec1 = new Vec2(8, 15);
      const vec2 = new Vec2(2, 3);
      const result = vec1.divide(vec2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(5);
    });

    it('should divide by scalar', () => {
      const vec = new Vec2(8, 12);
      const result = vec.divideScalar(4);
      expect(result.x).toBe(2);
      expect(result.y).toBe(3);
    });
  });

  describe('vector math', () => {
    it('should calculate dot product', () => {
      const vec1 = new Vec2(3, 4);
      const vec2 = new Vec2(2, 1);
      const result = vec1.dot(vec2);
      expect(result).toBe(10); // 3*2 + 4*1
    });

    it('should calculate length', () => {
      const vec = new Vec2(3, 4);
      const length = vec.length();
      expect(length).toBeCloseTo(5); // sqrt(3^2 + 4^2)
    });

    it('should normalize vector', () => {
      const vec = new Vec2(3, 4);
      const normalized = vec.normalize();
      expect(normalized.length()).toBeCloseTo(1);
      expect(normalized.x).toBeCloseTo(0.6);
      expect(normalized.y).toBeCloseTo(0.8);
    });

    it('should project vector', () => {
      const vec1 = new Vec2(3, 4);
      const vec2 = new Vec2(1, 0); // Unit vector along x-axis
      const projection = vec1.project(vec2);
      expect(projection.x).toBe(3);
      expect(projection.y).toBe(0);
    });
  });

  describe('rotation', () => {
    it('should rotate vector by 90 degrees', () => {
      const vec = new Vec2(1, 0);
      const rotated = vec.rotate(Math.PI / 2);
      expect(rotated.x).toBeCloseTo(0, 5);
      expect(rotated.y).toBeCloseTo(-1, 5); // Note: negative due to coordinate system
    });

    it('should rotate vector by 180 degrees', () => {
      const vec = new Vec2(1, 1);
      const rotated = vec.rotate(Math.PI);
      expect(rotated.x).toBeCloseTo(-1, 5);
      expect(rotated.y).toBeCloseTo(-1, 5);
    });
  });
});