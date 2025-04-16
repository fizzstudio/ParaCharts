/* ParaCharts: Color Types
Copyright (C) 2025 Fizz Studios

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.*/

export interface Palette {
  key: string;
  title: string;
  cvd?: boolean;
  colors: Color[];
}

interface Key {
  id?: string;
  index: number;
  base: string | null;
  light: null;
  dark: null;
}

interface Record {
  index: number;
  base: null;
  light: null;
  dark: null;
}

export interface Color {
  value: string;
  name: string;
}

export class Colors {
  readonly palettes: Palette[];
  keys = new Map<string, Key>();

  private paletteIndex = 0;
  private primary = 'hsl(270, 50%, 50%)';
  private accent = 'hsl(270, 50%, 25%)';
  private active = 'hsl(270, 50%, 65%)';

  constructor() {
    this.palettes = [
      {
        key: 'diva',
        title: 'diva (color-blind safe)',
        colors: [
          {
            value: 'hsl(225, 30%, 52%)',
            name: 'blue'
          },
          {
            value: 'hsl(12, 69%, 35%)',
            name: 'red'
          },
          {
            value: 'hsl(75, 43%, 45%)',
            name: 'green'
          },
          {
            value: 'hsl(40, 98%, 69%)',
            name: 'yellow'
          },
          {
            value: 'hsl(215, 37%, 66%)',
            name: 'light blue'
          },
          {
            value: 'hsl(63, 100%, 23%)',
            name: 'olive green'
          },
          {
            value: 'hsl(34, 57%, 46%)',
            name: 'caramel'
          },
          {
            value: 'hsl(51, 56%, 64%)',
            name: 'tan'
          },
          {
            value: 'hsl(253, 26%, 43%)',
            name: 'purple'
          },
          {
            value: 'hsl(85, 65%, 36%)',
            name: 'forest green'
          },
          {
            value: 'hsl(12, 56%, 51%)',
            name: 'red-orange'
          },
          {
            value: 'hsl(30, 42%, 35%)',
            name: 'brown'
          },
          {
            value: 'hsl(0, 100%, 50%)',
            name: 'bright red'
          },
          {
            value: 'hsl(240, 100%, 50%)',
            name: 'bright blue'
          },
          {
            value: 'hsl(120, 100%, 50%)',
            name: 'lime green'
          },
          {
            value: 'hsl(39, 100%, 50%)',
            name: 'orange'
          },
          {
            value: 'hsl(300, 100%, 25%)',
            name: 'royal purple'
          },
          {
            value: 'hsl(51, 100%, 50%)',
            name: 'lemon yellow'
          },
          {
            value: 'hsl(328, 100%, 54%)',
            name: 'fuschia'
          },
          {
            value: 'hsl(177, 70%, 41%)',
            name: 'cyan'
          }
        ]
      },
      {
        key: 'warm',
        title: 'warm hues (color-blind safe)',
        colors: [
          {
            value: 'hsl(38, 96%, 58%)',
            name: 'orange'
          },
          {
            value: 'hsl(82, 77%, 40%)',
            name: 'green'
          },
          {
            value: 'hsl(54, 81%, 73%)',
            name: 'yellow'
          },
          {
            value: 'hsl(22, 97%, 51%)',
            name: 'red'
          },
          {
            value: 'hsl(77, 98%, 25%)',
            name: 'forest green'
          }
        ]
      },
      {
        key: 'cold',
        title: 'cold hues (color-blind safe)',
        colors: [
          {
            value: 'hsl(223, 100%, 70%)',
            name: 'blue'
          },
          {
            value: 'hsl(331, 72%, 51%)',
            name: 'pink'
          },
          {
            value: 'hsl(23, 100%, 50%)',
            name: 'tangerine'
          },
          {
            value: 'hsl(251, 83%, 65%)',
            name: 'purple'
          },
          {
            value: 'hsl(41, 100%, 50%)',
            name: 'orange'
          }
        ]
      },
      {
        key: 'rainbow',
        title: 'rainbow (color-blind safe)',
        colors: [
          {
            value: 'hsl(270, 100%, 29%)',
            name: 'purple'
          },
          {
            value: 'hsl(330, 100%, 71%)',
            name: 'pink'
          },
          {
            value: 'hsl(30, 100%, 43%)',
            name: 'cinnamon'
          },
          {
            value: 'hsl(180, 100%, 14%)',
            name: 'green'
          },
          {
            value: 'hsl(210, 100%, 43%)',
            name: 'blue'
          },
          {
            value: 'hsl(0, 100%, 29%)',
            name: 'red'
          },
          {
            value: 'hsl(120, 100%, 57%)',
            name: 'pale green'
          },
          {
            value: 'hsl(60, 100%, 71%)',
            name: 'pale yellow'
          },
          {
            value: 'hsl(330, 100%, 86%)',
            name: 'pale pink'
          },
          {
            value: 'hsl(210, 100%, 86%)',
            name: 'pale blue'
          },
          {
            value: 'hsl(30, 100%, 29%)',
            name: 'brown'
          },
          {
            value: 'hsl(180, 100%, 29%)',
            name: 'blue-gree'
          },
          {
            value: 'hsl(270, 100%, 71%)',
            name: 'lavendar'
          },
          {
            value: 'hsl(210, 100%, 71%)',
            name: 'light blue'
          },
          {
            value: 'hsl(0, 0%, 0%)',
            name: 'black'
          }
        ]
      },
      {
        key: 'deutan',
        title: 'deutan',
        cvd: true,
        colors: [
          {
            value: '#800080',
            name: ''
          },
          {
            value: '#ff00ff',
            name: ''
          },
          {    
            value: '#ca0088',
            name: ''
          },
          {
             value: '#fa0080',
             name: ''
          },
          {
             value: '#b400b4',
             name: ''
          },
          {
             value: '#4477AA',
             name: ''
          },
          {
             value: '#EE6677',
             name: ''
          },
          {
             value: '#228833',
             name: ''
          },
          {
             value: '#CCBB44',
             name: ''
          },
          {
             value: '#66CCEE',
             name: ''
          },
          {
            value: '#AA3377',
            name: ''
          }
        ]
      },
      {
        key: 'protan',
        title: 'protan',
        cvd: true,
        colors: [
          {
            value: 'hsl(39, 70%, 54%)',
            name: ''
          },
          {
            value: 'hsl(206, 68%, 66%)',
            name: ''
          },
          {
            value: 'hsl(154, 39%, 44%)',
            name: ''
          },
          {
            value: 'hsl(56, 81%, 66%)',
            name: ''
          },
          {
            value: 'hsl(209, 57%, 43%)',
            name: ''
          },
          {
            value: 'hsl(24, 68%, 46%)',
            name: ''
          },
          {
            value: 'hsl(324, 35%, 62%)',
            name: ''
          }
        ]
      },
      {
        key: 'tritan',
        title: 'tritan',
        cvd: true,
        colors: [
          {
            value: '#77AADD',
            name: ''
          },
          {
            value: '#99DDFF',
            name: ''
          },
          {
            value: '#44BB99',
            name: ''
          },
          {
            value: '#BBCC33',
            name: ''
          },
          {
            value: '#AAAAOO',
            name: ''
          },
          {
            value: '#EEDD88',
            name: ''
          },
          {
            value: '#FFAABB',
            name: ''
          }
        ]
      },
      {
        key: 'grayscale',
        title: 'grayscale',
        cvd: true,
        colors: [
          {
            value: '#262626',
            name: ''
          },
          {
            value: '#595959',
            name: ''
          },
          {
            value: '#7f7f7f',
            name: ''
          },
          {
            value: '#a1a1a1',
            name: ''
          },
          {
            value: '#bababa',
            name: ''
          },
          {
            value: '#d4d4d4',
            name: ''
          },
          {
            value: '#ededed',
            name: ''
          }
        ]
      }
    ];

    this.selectPalette(0); // default
  }

  get palette() {
    const palette = this.palettes[this.paletteIndex];
    if (palette) {
      return palette;
    }
    throw new Error(`no palette at index ${this.paletteIndex}`);
  }

  addPalette(palette: Palette) {
    this.palettes.push(palette);
  }

  indexOfPalette(key: string) {
    return this.palettes.findIndex(p => p.key === key);
  }

  colorAt(index: number) {
    return this.palette.colors[index]?.name ?? 'default';
  }

  /** Simply returns `index`, or -1 if it's out of bounds. */
  colorIndex(index: number) {
    return this.palette.colors[index] !== undefined ? index : -1;
  }

  colorValue(color: string) {
    if (color === 'default') {
      return 'gray';
    }
    const c = this.palette.colors.find(entry => entry.name === color);
    if (!c) {
      throw new Error(`no color named '${color}'`);
    }
    return c.value;
  }

  colorValueAt(index: number) {
    return this.palette.colors[index]?.value ?? 'gray';
  }

  registerKey(key: string) {
    // TEMP: just a simple way to make sure each key has a unique color seed
    if (!this.keys.has(key)) {
      this.keys.set(key, {
        index: this.keys.size,
        base: null,
        light: null,
        dark: null
      });
    }
  }

  getPaletteList() {
    // this.paletteList = this.palettes.map()
  }

  // set_colors(color_obj: Colors) {
  //   if (!color_obj.palette) {
  //     // if no palette, use the default palette
  //     this.setPalette(0);
  //   } else {
  //     // if palette, append the default palette to the supplied palette, for more values
  //     this.palette = color_obj.palette.concat(this.palette);
  //   }
  //   this.primary = color_obj.primary;
  //   this.accent = color_obj.accent;
  //   this.active = color_obj.active;
  // }

  selectPalette(index: number) {
    if (index < 0 || index > this.palettes.length - 1) {
      throw new Error(`invalid palette index '${index}'`);
    }
    this.paletteIndex = index;
  }

  selectPaletteWithKey(key: string) {
    this.selectPalette(this.indexOfPalette(key));
  }

  /*get_palettes  ( palette_ids ) {
    if (!palette_ids) {
      return this.palettes;
    }

    if ( `string` === typeof palette_ids) {
      return this.palettes[palette_ids];
    }

    let palettes = [];
    for (let i = 0, i_len = palette_ids.length; i_len > i; ++i) {
      let palette = this.palettes[palette_ids[i]];
      if (!palette) {
        palette = this.palettes[`palette-${palette_ids[i]}`];
      }

      if (palette) {
        palettes.push(palette);
      }
    }
    return palettes;
  }*/

  /*set_palette_color_by_index  ( palette_id, index, color ) {
    let palette = this.palettes[palette_id];
    if (palette) {
      palette[index] = color;
    }
  }*/

  /*create_palette  ( id, colors, metadata ) {
    let palette = this.palettes[id];
    if (!palette) {
      this.palettes[id] = {};
      palette = this.palettes[id];
    }
    palette.name = metadata.name;
    palette.title = metadata.title;
    palette.type = metadata.type;
    palette.colors = colors;
  }*/

  getHslComponents(hsla: string) {
    let hsl_regex = /hsl[a]?\(\s*(-?\d+|-?\d*.\d+)\s*,\s*(-?\d+|-?\d*.\d+)%\s*,\s*(-?\d+|-?\d*.\d+)%\s*\)/;
    let hsl_array = hsla.match(hsl_regex)!;
    let hsla_components = {
      hue: +hsl_array[1],
      h: +hsl_array[1],

      saturation: +hsl_array[2],
      s: +hsl_array[2],

      lightness: +hsl_array[3],
      l: +hsl_array[3],

      alpha: 1,
      a: 1
    };
    return hsla_components
  }

  lighten(hsl: string, shade_count: number) {
    let hsl_comp = this.getHslComponents(hsl);

    let h = hsl_comp.hue;
    let s = hsl_comp.saturation;
    let l = hsl_comp.lightness;

    const new_l = Math.min((l + (shade_count * 5)), 100);
    return `hsl(${h}, ${s}%, ${new_l}%)`;
  }

  generateSequentialPalette(hsl: string, count: number, is_lighter: boolean) { //, palette_id) {
    let hsl_comp = this.getHslComponents(hsl);

    let h = hsl_comp.hue;
    let s = hsl_comp.saturation;
    let l = hsl_comp.lightness;

    let s_range = s - 15;
    if (is_lighter) {
      s_range = 85 - s;
    }

    let s_interval = Math.round((s_range / count) / 5);

    let l_range = l - 15;
    if (is_lighter) {
      l_range = 85 - l;
    }

    let l_interval = Math.round(l_range / count);

    let palette = [];
    for (let i = 0, i_len = count; i_len > i; ++i) {
      palette.push(`hsl(${h}, ${s}%, ${l}%)`);
      if (is_lighter) {
        s += s_interval;
        l += l_interval;
      } else {
        s -= s_interval;
        l -= l_interval;
      }
    }

    /*if (palette_id) {
      this.create_palette( palette_id, palette,
        {
          name: palette_id,
          title: palette_id,
          type: `numeric`
        }
      );
    } else {*/
    return palette;
    //}
  }

  /*generate_interpolation_palette  ( hsl1, hsl2, count, palette_id ) {
    let hsl_comp1 = this.getHslComponents(hsl1);
    let h1 = hsl_comp1.hue;
    let s1 = hsl_comp1.saturation;
    let l1 = hsl_comp1.lightness;

    let hsl_comp2 = this.getHslComponents(hsl2);
    let h2 = hsl_comp2.hue;
    let s2 = hsl_comp2.saturation;
    let l2 = hsl_comp2.lightness;

    count -= 1;

    let h_range = h1 - h2;
    let h_interval = h_range/count;

    let s_range = s1 - s2;
    let s_interval = s_range/count;

    let l_range = l1 - l2;
    let l_interval = l_range/count;

    let palette = [];
    for (let i = 0, i_len = count; i_len > i; ++i) {
      palette.push(`hsl(${Math.round(h1)}, ${Math.round(s1)}%, ${Math.round(l1)}%)`);
      h1 -= h_interval;
      s1 -= s_interval;
      l1 -= l_interval;
    }
    palette.push(`hsl(${h2}, ${s2}%, ${l2}% )`);

    this.create_palette( palette_id, palette,
      {
        name: palette_id,
        title: palette_id,
        type: `numeric`
      }
    )
  }*/

  /*hsl_to_hex (h, s, l) {
    // function credit to https://stackoverflow.com/questions/7609130/set-the-value-of-an-input-field
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }*/

  //https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
  /*hex_to_hsl (hex, is_formatted) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    s = s*100;
    s = Math.round(s);
    l = l*100;
    l = Math.round(l);
    h = Math.round(360*h);

    let colorInHSL=[h,s,l];
    if (!is_formatted) {
      return colorInHSL;
    } else {
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }*/

}
