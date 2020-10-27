import * as fs from 'fs';
import * as http from 'http';
import * as querystring from 'querystring';
import * as path from 'path';
import { BMP24 } from '../BMP24';

const CHAR_H = 16;
const EN_CHAR_W = 8;
const CN_CHAR_W = 16;

// 字库，支持中文，总共65536个字符
const fontPath = path.join(__dirname, '../../res/gb16.uc2');
const fontBuffer = fs.readFileSync(fontPath);

function getCharWidthHeight(char: number | string) {
    const o = { width: CN_CHAR_W, height: CHAR_H };
    if (typeof char === 'string') {
        char = char.charCodeAt(0);
    }
    if (char < 128) {
        o.width = EN_CHAR_W;
    }
    return o;
}

function drawChar(img: BMP24, char: number | string, x: number, y: number, color: number) {
    if (typeof char === 'string') {
        char = char.charCodeAt(0);
    }
    const offset = char * 32; // 一行两字节，高度16，所以2*16=32字节
    const charData = fontBuffer.slice(offset, offset + 32);
    for (let iy = 0; iy < CHAR_H; iy++) {
        let data = charData.readUInt16BE(iy * 2);
        for (let ix = 0; data > 0; ix++) {
            if (data & (1 << 16)) {
                img.drawPoint(ix + x, iy + y, color);
            }
            data <<= 1;
        }
    }
}

function drawString(img: BMP24, str: string, x: number, y: number, color: number) {
    for (const c of str) {
        drawChar(img, c, x, y, color);
        x += getCharWidthHeight(c).width;
    }
}

http.createServer((req, res) => {
    switch (req.url) {
        case '/favicon.ico':
            res.end();
            break;
        default: {
            if (req.url) {
                let str = req.url;
                str = str.substring(str.indexOf('?') + 1);
                const o = querystring.parse(str);
                if (typeof o.str === 'string') {
                    const img = new BMP24(100, 40);
                    drawString(img, o.str, 0, 0, 0xff0000);
                    res.setHeader('Content-Type', 'image/bmp');
                    res.end(img.getFileData());

                } else if ((typeof o.start === 'string') && (typeof o.len === 'string')) {
                    console.time('printCharCode');
                    const img = new BMP24(800, 800);
                    img.fillRect(0, 0, img.w, img.h, 0xffffff);
                    const start = parseInt(o.start, 10);
                    const stop = start + parseInt(o.len, 10);
                    let x = 0, y = 0;
                    for (let i = start; i < stop; i++) {
                        if (x >= (img.w - getCharWidthHeight(i).width)) {
                            y += CHAR_H;
                            x = 0;
                        }
                        drawChar(img, i, x, y, 0xff0000);
                        x += getCharWidthHeight(i).width;
                    }
                    console.timeEnd('printCharCode');
                    res.setHeader('Content-Type', 'image/bmp');
                    res.end(img.getFileData());
                }
            }
            res.end();
        }
    }
}).listen(3000);
console.log('localhost:3000');
console.log('http://localhost:3000/?str=中国');
console.log('http://localhost:3000/?start=0&len=2000');




