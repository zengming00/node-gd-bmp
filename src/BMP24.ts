import * as fs from 'fs';
import * as font from './font';

// 初始版本确定于：20161103 18:31


export interface IRGB {
  red: number;
  green: number;
  blue: number;
}


function makeHeader(buf: Buffer, fileLen: number, dataLen: number, w: number, h: number) {
  const header = buf;
  header.write('BM');
  header.writeInt32LE(fileLen, 2); //  BMP文件大小
  header.writeInt8(122, 6); //  特殊标识
  header.writeInt32LE(54, 10);
  header.writeInt32LE(40, 14);
  header.writeInt32LE(w, 18); // w
  header.writeInt32LE(h, 22); // h
  header.writeInt16LE(1, 26);
  header.writeInt16LE(24, 28);
  header.writeInt32LE(dataLen, 34); // 数据大小
}

export class BMP24 {
  public static font8x16 = font.font8x16;
  public static font12x24 = font.font12x24;
  public static font16x32 = font.font16x32;

  public w: number;
  public h: number;
  public fileLen: number;

  protected _lineByteNum: number;  // tslint:disable-line
  protected _data: Buffer;  // tslint:disable-line

  constructor(w: number, h: number) {
    /*
     BMP数据的每一行必需能被4整除
     例如宽度=10则一行的实际字节数=32=Math.ceil(10*3/4)*4，补了2字节的0
     例如宽度=11则一行的实际字节数=36=Math.ceil(11*3/4)*4，补了3字节的0
     算法： Math.ceil(宽度*每个像素占用的字节/4)*4
    */
    const lineByteNum = Math.ceil(w * 3 / 4) * 4; // 每行数据的实际字节数
    const dataLen = lineByteNum * h;

    this.w = w;
    this.h = h;
    this.fileLen = dataLen + 54;
    this._lineByteNum = lineByteNum;
    this._data = new Buffer(this.fileLen).fill(0);

    // BMP文件头初始化
    makeHeader(this._data, this.fileLen, dataLen, w, h);
  }

  // 获取BMP整个文件数据
  public getFileData() {
    return this._data;
  }

  // 获取BMP图像数据
  public getData() {
    return this._data.slice(54);
  }

  // 画点
  public drawPoint(x: number, y: number, rgb: number) {
    if (x >= this.w || y >= this.h || x < 0 || y < 0) {
      return;
    }
    // 数据第一行为图像的最底一行，颜色数据在十六进制编辑器中的排列是蓝绿红
    const line = this.h - y - 1; // 因为data的第一行是图片的最后一行，所以要反过来
    const pos = 54 + (x * 3) + (this._lineByteNum * line);

    this._data.writeUInt8(rgb & 0xFF, pos);   // 蓝
    this._data.writeUInt8((rgb >> 8) & 0xFF, pos + 1); // 绿
    this._data.writeUInt8((rgb >> 16) & 0xFF, pos + 2); // 红
  }

  // 画点
  public drawPointRGB(x: number, y: number, rgb: IRGB) {
    if (x >= this.w || y >= this.h || x < 0 || y < 0) {
      return;
    }
    // 数据第一行为图像的最底一行，颜色数据在十六进制编辑器中的排列是蓝绿红
    const line = this.h - y - 1; // 因为data的第一行是图片的最后一行，所以要反过来
    const pos = 54 + (x * 3) + (this._lineByteNum * line);

    this._data.writeUInt8(rgb.blue, pos); // 蓝
    this._data.writeUInt8(rgb.green, pos + 1); // 绿
    this._data.writeUInt8(rgb.red, pos + 2); // 红
  }

  /**
   * 获取像素点颜色, 返回 { blue:number, green:number, red:number }
   */
  public getPointRGB(x: number, y: number): IRGB {
    if (x >= this.w || y >= this.h || x < 0 || y < 0) {
      throw new Error('out of range');
    }
    // 数据第一行为图像的最底一行，颜色数据在十六进制编辑器中的排列是蓝绿红
    const line = this.h - y - 1; // 因为data的第一行是图片的最后一行，所以要反过来
    const pos = 54 + (x * 3) + (this._lineByteNum * line);
    return {
      blue: this._data.readUInt8(pos),
      green: this._data.readUInt8(pos + 1),
      red: this._data.readUInt8(pos + 2),
    };
  }

  // 画水平线
  public drawLineH(x1: number, x2: number, y: number, rgb: number) {
    if (x1 > x2) {
      const tmp = x2;
      x2 = x1;
      x1 = tmp;
    }
    for (; x1 <= x2; x1++) {
      this.drawPoint(x1, y, rgb);
    }
  }

  public drawLineV(y1: number, y2: number, x: number, rgb: number) {
    if (y1 > y2) {
      const tmp = y2;
      y2 = y1;
      y1 = tmp;
    }
    for (; y1 <= y2; y1++) {
      this.drawPoint(x, y1, rgb);
    }
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number, rgb: number) {
    let x, y, dx, dy, s1, s2, p, temp, interchange, i; //tslint:disable-line
    x = x1;
    y = y1;
    dx = x2 > x1 ? (x2 - x1) : (x1 - x2);
    dy = y2 > y1 ? (y2 - y1) : (y1 - y2);

    s1 = x2 > x1 ? 1 : -1;
    s2 = y2 > y1 ? 1 : -1;

    if (dy > dx) {
      temp = dx;
      dx = dy;
      dy = temp;
      interchange = true;
    } else {
      interchange = false;
    }

    p = (dy << 1) - dx;
    for (i = 0; i <= dx; i++) {
      this.drawPoint(x, y, rgb);
      if (p >= 0) {
        if (interchange) {
          x = x + s1;
        } else {
          y = y + s2;
        }
        p = p - (dx << 1);
      }
      if (interchange) {
        y = y + s2;
      } else {
        x = x + s1;
      }
      p = p + (dy << 1);
    }
  }

  public drawRect(x1: number, y1: number, x2: number, y2: number, rgb: number) {
    this.drawLineH(x1, x2, y1, rgb);
    this.drawLineH(x1, x2, y2, rgb);
    this.drawLineV(y1, y2, x1, rgb);
    this.drawLineV(y1, y2, x2, rgb);
  }

  public fillRect(x1: number, y1: number, x2: number, y2: number, rgb: number) {
    let x;
    if (x1 > x2) {
      const tmp = x2;
      x2 = x1;
      x1 = tmp;
    }
    if (y1 > y2) {
      const tmp = y2;
      y2 = y1;
      y1 = tmp;
    }
    for (; y1 <= y2; y1++) {
      for (x = x1; x <= x2; x++) {
        this.drawPoint(x, y1, rgb);
      }
    }
  }

  // 画圆，xy为中心点位置
  public drawCircle(x: number, y: number, r: number, rgb: number) {
    let a, b, c; // tslint:disable-line
    a = 0;
    b = r;
    //   c = 1.25 - r;
    c = 3 - 2 * r;
    while (a < b) {
      this.drawPoint(x + a, y + b, rgb);
      this.drawPoint(x - a, y + b, rgb);
      this.drawPoint(x + a, y - b, rgb);
      this.drawPoint(x - a, y - b, rgb);
      this.drawPoint(x + b, y + a, rgb);
      this.drawPoint(x - b, y + a, rgb);
      this.drawPoint(x + b, y - a, rgb);
      this.drawPoint(x - b, y - a, rgb);
      if (c < 0) {
        c = c + 4 * a + 6;
      } else {
        c = c + 4 * (a - b) + 10;
        b -= 1;
      }
      a = a + 1;  // 控制打点间隔
    }
    if (a === b) {
      this.drawPoint(x + a, y + b, rgb);
      this.drawPoint(x - a, y + b, rgb);
      this.drawPoint(x + a, y - b, rgb);
      this.drawPoint(x - a, y + b, rgb);
      this.drawPoint(x + b, y + a, rgb);
      this.drawPoint(x - b, y + a, rgb);
      this.drawPoint(x + b, y - a, rgb);
      this.drawPoint(x - b, y - a, rgb);
    }
  }

  public drawChar(ch: string, x: number, y: number, font: font.IFont, color: number) {
    const index = font.fonts.indexOf(ch);
    if (index < 0) {
      return;
    }
    const fontData = font.data[index];
    let y0 = y;
    let x0 = x;
    for (const data of fontData) {
      x0 = x;
      for (let b = data; b > 0; b <<= 1) {
        if (b & 0x80) {
          this.drawPoint(x0, y0, color);
        }
        x0++;
      }
      y0++;
      if ((y0 - y) >= font.h) {
        y0 = y;
        x += 8;
      }
    }
  }

  public drawString(str: string, x: number, y: number, font: font.IFont, color: number) {
    for (const c of str) {
      this.drawChar(c, x, y, font, color);
      x += font.w;
    }
  }


  /*
  从文件加载bmp
  参数：文件路径 ， cb(err,bmp24)
  注意！必需确保文件是24位bmp
   */
  public static loadFromFile(filename: string, cb: (err: Error | null, bmp24: BMP24) => void): void {
    fs.readFile(filename, function (err, data) {
      const img = new BMP24(0, 0);
      if (err) {
        return cb(err, img);
      }

      //  简单的判断是否是支持的格式
      if (data.readInt32LE(10) !== 54) {
        return cb(new Error('unsupported format: headlen !== 54'), img);
      } else if (data.readInt32LE(14) !== 40) {
        return cb(new Error('unsupported format: bitmapInfoHead.length !== 40'), img);
      } else if (data.readInt32LE(28) !== 24) {
        return cb(new Error('unsupported format: only support 24bit bmp'), img);
      }

      img.w = data.readInt32LE(18);
      img.h = data.readInt32LE(22);
      img.fileLen = data.length;
      img._lineByteNum = Math.ceil(img.w * 3 / 4) * 4;
      img._data = data;
      cb(null, img);
    });
  }

}


/////////////////////////////Copyright zengming 2010-2018/////////////////////////////////////
