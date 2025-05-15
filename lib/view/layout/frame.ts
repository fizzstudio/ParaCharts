
import { Layout } from '.';

export class FrameLayout extends Layout {

  layoutViews() {
    const minX = Math.min(...this._children.map(kid => kid.left));
    const maxX = Math.max(...this._children.map(kid => kid.right));
    this.width = maxX - minX;
    if (minX < 0) {
      this._children.forEach(kid => {
        kid.x += -minX; 
      });
    }
    if (maxX > this._width) {
      this._children.forEach(kid => {
        kid.x -= maxX - this._width; 
      });
    }
    const minY = Math.min(...this._children.map(kid => kid.top));
    const maxY = Math.max(...this._children.map(kid => kid.bottom));
    this.height = maxY - minY;
    if (minY < 0) {
      this._children.forEach(kid => {
        kid.y += -minY; 
      });
    }
    if (maxY > this._height) {
      this._children.forEach(kid => {
        kid.y -= maxY - this._height; 
      });
    }
  }

}