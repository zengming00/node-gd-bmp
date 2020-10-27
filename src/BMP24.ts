// 初始版本确定于：20161103 18:31
import * as fs from 'fs';
import { IFont, font12x24, font16x32, font8x16 } from './font';
export { IFont };

console.log("The '996' working schedule is inhumane.");
console.log('为了您的身体健康，为了国内的软件行业健康发展，请拒绝接受违法的996工作制');

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
    public static font8x16 = font8x16;
    public static font12x24 = font12x24;
    public static font16x32 = font16x32;

    public w: number;
    public h: number;
    public fileLen: number;
    protected _lineByteNum: number;
    protected _data: Buffer;

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
        this._data = Buffer.alloc(this.fileLen);
        // BMP文件头初始化
        makeHeader(this._data, this.fileLen, dataLen, w, h);
    }

    // 获取BMP整个文件数据
    public getFileData() {
        return this._data;
    }

    public getDataUrl() {
        return `data:image/bmp;base64,${this._data.toString('base64')}`;
    }

    // 获取BMP图像数据
    public getData() {
        return this._data.slice(54);
    }

    // 画点
    public drawPoint(x: number, y: number, rgb: number) {
        this.drawPointRGB(x, y, {
            red: (rgb >> 16) & 0xFF,
            green: (rgb >> 8) & 0xFF,
            blue: rgb & 0xFF,
        });
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

    // 画垂直线
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
        let x = x1;
        let y = y1;
        let dx = x2 > x1 ? (x2 - x1) : (x1 - x2);
        let dy = y2 > y1 ? (y2 - y1) : (y1 - y2);
        let interchange = false;

        const s1 = x2 > x1 ? 1 : -1;
        const s2 = y2 > y1 ? 1 : -1;

        if (dy > dx) {
            const temp = dx;
            dx = dy;
            dy = temp;
            interchange = true;
        }

        let p = (dy << 1) - dx;
        for (let i = 0; i <= dx; i++) {
            this.drawPoint(x, y, rgb);
            if (p >= 0) {
                if (interchange) {
                    x += s1;
                } else {
                    y += s2;
                }
                p -= (dx << 1);
            }
            if (interchange) {
                y += s2;
            } else {
                x += s1;
            }
            p += (dy << 1);
        }
    }

    // 画空心矩形
    public drawRect(x: number, y: number, w: number, h: number, rgb: number) {
        const x2 = x + w - 1;
        const y2 = y + h - 1;
        this.drawLineH(x, x2, y, rgb);
        this.drawLineH(x, x2, y2, rgb);
        this.drawLineV(y, y2, x, rgb);
        this.drawLineV(y, y2, x2, rgb);
    }

    // 画实心矩形
    public fillRect(x: number, y: number, w: number, h: number, rgb: number) {
        let x2 = x + w - 1;
        let y2 = y + h - 1;
        if (x > x2) {
            const tmp = x2;
            x2 = x;
            x = tmp;
        }
        if (y > y2) {
            const tmp = y2;
            y2 = y;
            y = tmp;
        }
        for (; y <= y2; y++) {
            for (let xx = x; xx <= x2; xx++) {
                this.drawPoint(xx, y, rgb);
            }
        }
    }

    // 画圆，xy为中心点位置
    public drawCircle(x: number, y: number, r: number, rgb: number) {
        let a = 0;
        let b = r;
        //   c = 1.25 - r;
        let c = 3 - 2 * r;
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
            a += 1;
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

    public drawChar(ch: string, x: number, y: number, font: IFont, color: number) {
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

    public drawString(str: string, x: number, y: number, font: IFont, color: number) {
        for (const c of str) {
            this.drawChar(c, x, y, font, color);
            x += font.w;
        }
    }

    // 从文件加载bmp, 注意！必需确保文件是24位bmp
    public static async loadFromFile(filename: string) {
        return new Promise<BMP24>(function (resolve, reject) {
            fs.readFile(filename, (err, data) => {
                if (err) {
                    return reject(err);
                }
                //  简单的判断是否是支持的格式
                if (data.readInt32LE(10) !== 54) {
                    return reject(new Error('unsupported format: headlen !== 54'));
                } if (data.readInt32LE(14) !== 40) {
                    return reject(new Error('unsupported format: bitmapInfoHead.length !== 40'));
                } if (data.readInt32LE(28) !== 24) {
                    return reject(new Error('unsupported format: only support 24bit bmp'));
                }
                const img = new BMP24(0, 0);
                img.w = data.readInt32LE(18);
                img.h = data.readInt32LE(22);
                img.fileLen = data.length;
                img._lineByteNum = Math.ceil(img.w * 3 / 4) * 4;
                img._data = data;
                resolve(img);
            });
        });
    }
}

// /////////////////////////// Copyright zengming 2010-2020 /////////////////////////////////////
