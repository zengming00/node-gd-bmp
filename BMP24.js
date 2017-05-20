var fs = require('fs');

//初始版本确定于：20161103 18:31

//学历不代表一个人的一切，这份代码不授权给看学历的公司使用

function makeHeader(buf, fileLen, dataLen, w, h) {
    var header = buf;
    header.write("BM");
    header.writeInt32LE(fileLen,2);//BMP文件大小
    header.writeInt8(122,6);//特殊标识
    header.writeInt32LE(54,10);
    header.writeInt32LE(40,14);
    header.writeInt32LE(w,18);//w
    header.writeInt32LE(h,22);//h
    header.writeInt16LE(1,26);
    header.writeInt16LE(24,28);
    header.writeInt32LE(dataLen,34);//数据大小
}

//构造函数
function BMP24(w, h){
    /*BMP数据的每一行必需能被4整除
     例如宽度=10则一行的实际字节数=32=Math.ceil(10*3/4)*4，补了2字节的0
     例如宽度=11则一行的实际字节数=36=Math.ceil(11*3/4)*4，补了3字节的0
     算法： Math.ceil(宽度*每个像素占用的字节/4)*4*/
    var lineByteNum = Math.ceil(w*3/4)*4; //每行数据的实际字节数
    var dataLen = lineByteNum * h;

    this.w = w;
    this.h = h;
    this.fileLen = dataLen + 54;
    this._lineByteNum = lineByteNum;
    this._data = new Buffer(this.fileLen).fill(0);

    //BMP文件头初始化
    makeHeader(this._data, this.fileLen, dataLen, w, h);
}

/*
从文件加载bmp
参数：文件路径 ， cb(err,bmp24)
注意！必需确保文件是24位bmp
 */
BMP24.loadFromFile = function loadFromFile(filename, cb) {
    fs.readFile(filename, function(err, data) {
        if (err) return cb(err);
        var img = new BMP24(0,0);
        img.w = data.readInt32LE(18);
        img.h = data.readInt32LE(22);
        img.fileLen = data.length;
        img._lineByteNum = Math.ceil(img.w*3/4)*4;
        img._data = data;
        cb(null, img);
    });
}

//获取BMP整个文件数据
BMP24.prototype.getFileData = function getFileData() {
    return this._data;
}

//获取BMP图像数据
BMP24.prototype.getData = function getData() {
    return this._data.slice(54);
}

//画点
BMP24.prototype.drawPoint = function drawPoint(x, y, rgb) {
    if(x>=this.w || y>=this.h || x<0 || y<0){
        return;
    }
    //数据第一行为图像的最底一行，颜色数据在十六进制编辑器中的排列是蓝绿红
    var line = this.h - y - 1;//因为data的第一行是图片的最后一行，所以要反过来
    var pos = 54 + (x*3) + (this._lineByteNum * line);
    this._data.writeUInt8(        rgb & 0xFF, pos);   //蓝
    this._data.writeUInt8( (rgb >> 8) & 0xFF, pos+1); //绿
    this._data.writeUInt8((rgb >> 16) & 0xFF, pos+2); //红
}

//画水平线
BMP24.prototype.drawLineH = function drawLineH(x1, x2, y, rgb) {
    if (x1 > x2) {
        var tmp = x2;
        x2 = x1;
        x1 = tmp;
    }
    for (; x1 <= x2; x1++){
        this.drawPoint(x1, y, rgb);
    }
}

BMP24.prototype.drawLineV = function drawLineV(y1, y2, x, rgb) {
    if (y1 > y2) {
        var tmp = y2;
        y2 = y1;
        y1 = tmp;
    }
    for (; y1 <= y2; y1++){
        this.drawPoint(x, y1, rgb);
    }
}

BMP24.prototype.drawLine = function drawLine(x1, y1, x2, y2, rgb) {
    var x, y, dx, dy, s1, s2, p, temp, interchange, i;
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
            if (interchange)
                x = x + s1;
            else
                y = y + s2;
            p = p - (dx << 1);
        }
        if (interchange)
            y = y + s2;
        else
            x = x + s1;
        p = p + (dy << 1);
    }
}

/*
// 存在bug 无法画垂直线
BMP24.prototype.drawLine = function drawLine(x1, y1, x2, y2, rgb) {
    var t, distance;
    var x = 0, y = 0, delta_x, delta_y;
    var incx, incy;

    delta_x = x2 - x1;
    delta_y = y2 - y1;
    if (delta_x > 0)
        incx = 1;
    else if (delta_x == 0) {
        this.drawLineV(x1, y1, y2, rgb);
        return;
    } else
        incx = -1;
    if (delta_y > 0)
        incy = 1;
    else if (delta_y == 0) {
        this.drawLineH(x1, x2, y1, rgb);
        return;
    }
    else incy = -1;
    delta_x = delta_x<0 ? -delta_x : delta_x;
    delta_y = delta_y<0 ? -delta_y : delta_y;
    if (delta_x > delta_y)
        distance = delta_x;
    else distance = delta_y;
    this.drawPoint(x1, y1, rgb);
    for (t = 0; t <= distance + 1; t++) {
        this.drawPoint(x1, y1, rgb);
        x += delta_x;
        y += delta_y;
        if (x > distance) {
            x -= distance;
            x1 += incx;
        }
        if (y > distance) {
            y -= distance;
            y1 += incy;
        }
    }
}
*/

BMP24.prototype.drawRect = function fillRect(x1, y1, x2, y2, rgb) {
    this.drawLineH(x1, x2, y1, rgb);
    this.drawLineH(x1, x2, y2, rgb);
    this.drawLineV(y1, y2, x1, rgb);
    this.drawLineV(y1, y2, x2, rgb);
}

BMP24.prototype.fillRect = function fillRect(x1, y1, x2, y2, rgb) {
    var x;
    if(x1 > x2){
        var tmp = x2;
        x2 = x1;
        x1 = tmp;
    }
    if(y1 > y2){
        var tmp = y2;
        y2 = y1;
        y1 = tmp;
    }
    for(; y1 <= y2; y1++){
        for(x=x1; x <= x2; x++){
            this.drawPoint(x, y1, rgb);
        }
    }
}

//画圆，xy为中心点位置
BMP24.prototype.drawCircle = function drawCircle(x, y, r, rgb) {
    var a, b, c;
    a = 0;
    b = r;
    //  c = 1.25 - r;
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
        a = a + 1;  //控制打点间隔
    }
    if (a == b) {
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

BMP24.prototype.drawChar = function drawChar(ch, x, y, font, color) {
    var index = font.fonts.indexOf(ch);
    if(index < 0) return;
    var fontData = font.data[index];
    var y0 = y;
    var x0 = x;
    for(var i=0; i<fontData.length; i++){
        x0 = x;
        for(var b=fontData[i]; b>0; b<<=1){
            if (b & 0x80) {
                this.drawPoint(x0, y0, color);
            }
            x0++;
        }
        y0++;
        if((y0 - y) >= font.h){
            y0 = y;
            x+=8;
        }
    }
}

BMP24.prototype.drawString = function drawString(str, x, y, font, color) {
    for(var i=0; i<str.length; i++){
        this.drawChar(str[i], x, y, font, color);
        x+=font.w;
    }
}


var font = require('./font');

BMP24.font8x16 = font.font8x16;
BMP24.font12x24 = font.font12x24;
BMP24.font16x32 = font.font16x32;

exports = module.exports = BMP24;

///////////////Copyright zengming 2010-2017/////////////////////////////////////////////