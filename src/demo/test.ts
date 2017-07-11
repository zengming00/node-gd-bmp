import * as http from 'http';
import { BMP24 } from '../BMP24'; // gd-bmp
import * as font from '../font';

// tslint:disable:no-console
/*
 用PCtoLCD2002取字模
 行列式扫描，正向取模（高位在前）
 */
const cnfonts: font.IFont = { // 自定义字模
    w: 16,
    h: 16,
    fonts: '中国',
    data: [
        [0x01, 0x01, 0x01, 0x01, 0x3F, 0x21, 0x21, 0x21, 0x21, 0x21, 0x3F, 0x21, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0xF8, 0x08, 0x08, 0x08, 0x08, 0x08, 0xF8, 0x08, 0x00, 0x00, 0x00, 0x00], /*"中",0*/
        [0x00, 0x7F, 0x40, 0x40, 0x5F, 0x41, 0x41, 0x4F, 0x41, 0x41, 0x41, 0x5F, 0x40, 0x40, 0x7F, 0x40, 0x00, 0xFC, 0x04, 0x04, 0xF4, 0x04, 0x04, 0xE4, 0x04, 0x44, 0x24, 0xF4, 0x04, 0x04, 0xFC, 0x04], /*"国",1*/
    ],
};

// 测试字库
function makeImg2() {
    const img = new BMP24(300, 140);
    img.drawString('helloworld', 20, 10, BMP24.font8x16, 0xff0000);
    img.drawString('helloworld', 20, 25, BMP24.font12x24, 0x00ff00);
    img.drawString('helloworld', 20, 50, BMP24.font16x32, 0x0000ff);
    img.drawString('中国', 20, 85, cnfonts, 0xffffff);
    return img;
}

// 仿PHP的rand函数
function rand(min: number, max: number) {
    return Math.random() * (max - min + 1) + min | 0; // 特殊的技巧，|0可以强制转换为整数
}

// 制造验证码图片
function makeCapcha() {
    const img = new BMP24(100, 40);
    img.drawCircle(rand(0, 100), rand(0, 40), rand(10, 40), rand(0, 0xffffff));
    // 边框
    img.drawRect(0, 0, img.w - 1, img.h - 1, rand(0, 0xffffff));
    img.fillRect(rand(0, 100), rand(0, 40), rand(10, 35), rand(10, 35), rand(0, 0xffffff));
    img.drawLine(rand(0, 100), rand(0, 40), rand(0, 100), rand(0, 40), rand(0, 0xffffff));
    // return img;

    // 画曲线
    const w = img.w / 2;
    const h = img.h;
    const color = rand(0, 0xffffff);
    const y1 = rand(-5, 5); // Y轴位置调整
    const w2 = rand(10, 15); // 数值越小频率越高
    const h3 = rand(4, 6); // 数值越小幅度越大
    const bl = rand(1, 5);
    for (let i = -w; i < w; i += 0.1) {
        const y = Math.floor(h / h3 * Math.sin(i / w2) + h / 2 + y1);
        const x = Math.floor(i + w);
        for (let j = 0; j < bl; j++) {
            img.drawPoint(x, y + j, color);
        }
    }

    const p = 'ABCDEFGHKMNPQRSTUVWXYZ3456789';
    let str = '';
    for (let i = 0; i < 5; i++) {
        str += p.charAt(Math.random() * p.length | 0);
    }

    const fonts = [BMP24.font8x16, BMP24.font12x24, BMP24.font16x32];
    let x = 15, y = 8; // tslint:disable-line
    for (const ch of str) {
        const f = fonts[Math.random() * fonts.length | 0];
        y = 8 + rand(-10, 10);
        img.drawChar(ch, x, y, f, rand(0, 0xffffff));
        x += f.w + rand(2, 8);
    }
    return img;
}



// 测试生成验证码的效率
const start = Date.now();
let i = 0;
while ((Date.now() - start) < 1000) {
    // makeCapcha();
    makeImg2();
    i++;
}
console.log('1秒钟生成：' + i);



http.createServer(function (req, res) {
    switch (req.url) {
        case '/favicon.ico':
            res.end();
            break;
        case '/img2': {
            console.time('makeImg2');
            const img = makeImg2();
            console.timeEnd('makeImg2');
            res.setHeader('Content-Type', 'image/bmp');
            res.end(img.getFileData());
            break;
        }
        case '/data': {
            const img = makeImg2();
            const dataUrl = 'data:image/bmp;base64,' + img.getFileData().toString('base64');
            res.setHeader('Content-Type', 'text/html');
            res.end(`<img src="${dataUrl}"/>`);
            break;
        }
        case '/':
        default: {
            console.time('makeCapcha');
            const img = makeCapcha();
            console.timeEnd('makeCapcha');
            res.setHeader('Content-Type', 'image/bmp');
            res.end(img.getFileData());
        }
    }
}).listen(3000);

console.log('localhost:3000');
