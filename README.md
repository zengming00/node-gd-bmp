# node-gd-bmp
light and high speed and 100% js implement graphical library, it can running in any platform,
BUT only support bmp 24bit format, internal contains 3 fonts
# demo
```javascript
var http = require('http');
var fs = require('fs');
var BMP24 = require('../BMP24');//gd-bmp

/*
 用PCtoLCD2002取字模
 行列式扫描，正向取模（高位在前）
 */
var cnfonts = {//自定义字模
    w : 16,
    h : 16,
    fonts: "中国",
    data : [
        [0x01,0x01,0x01,0x01,0x3F,0x21,0x21,0x21,0x21,0x21,0x3F,0x21,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0xF8,0x08,0x08,0x08,0x08,0x08,0xF8,0x08,0x00,0x00,0x00,0x00],/*"中",0*/
        [0x00,0x7F,0x40,0x40,0x5F,0x41,0x41,0x4F,0x41,0x41,0x41,0x5F,0x40,0x40,0x7F,0x40,0x00,0xFC,0x04,0x04,0xF4,0x04,0x04,0xE4,0x04,0x44,0x24,0xF4,0x04,0x04,0xFC,0x04],/*"国",1*/
    ]
};

//测试字库
function makeImg2() {
    var img = new BMP24(300,140);
    img.drawString('helloworld', 20,10, BMP24.font8x16, 0xff0000);
    img.drawString('helloworld', 20,25, BMP24.font12x24, 0x00ff00);
    img.drawString('helloworld', 20,50, BMP24.font16x32, 0x0000ff);
    img.drawString('中国', 20,85, cnfonts, 0xffffff);
    return img;
}

//仿PHP的rand函数
function rand(min, max) {
    return Math.random()*(max-min+1) + min | 0; //特殊的技巧，|0可以强制转换为整数
}

//制造验证码图片
function makeCapcha() {
    var img = new BMP24(100, 40);
    img.drawCircle(rand(0, 100), rand(0, 40), rand(10 , 40), rand(0, 0xffffff));
    //边框
    img.drawRect(0, 0, img.w-1, img.h-1, rand(0, 0xffffff));
    img.fillRect(rand(0, 100), rand(0, 40), rand(10, 35), rand(10, 35), rand(0, 0xffffff));
    img.drawLine(rand(0, 100), rand(0, 40), rand(0, 100), rand(0, 40), rand(0, 0xffffff));
    //return img;

    //画曲线
    var w=img.w/2;
    var h=img.h;
    var color = rand(0, 0xffffff);
    var y1=rand(-5,5); //Y轴位置调整
    var w2=rand(10,15); //数值越小频率越高
    var h3=rand(4,6); //数值越小幅度越大
    var bl = rand(1,5);
    for(var i=-w; i<w; i+=0.1) {
        var y = Math.floor(h/h3*Math.sin(i/w2)+h/2+y1);
        var x = Math.floor(i+w);
        for(var j=0; j<bl; j++){
            img.drawPoint(x, y+j, color);
        }
    }

    var p = "ABCDEFGHKMNPQRSTUVWXYZ3456789";
    var str = '';
    for(var i=0; i<5; i++){
        str += p.charAt(Math.random() * p.length |0);
    }

    var fonts = [BMP24.font8x16, BMP24.font12x24, BMP24.font16x32];
    var x = 15, y=8;
    for(var i=0; i<str.length; i++){
        var f = fonts[Math.random() * fonts.length |0];
        y = 8 + rand(-10, 10);
        img.drawChar(str[i], x, y, f, rand(0, 0xffffff));
        x += f.w + rand(2, 8);
    }
    return img;
}



//测试生成验证码的效率
var start = Date.now();
var i = 0;
while((Date.now() - start) < 1000){
    // var img = makeCapcha();
    var img = makeImg2();
    i++;
}
console.log("1秒钟生成：" + i);



http.createServer(function (req,res) {
  if(req.url == '/favicon.ico'){
    return res.end();
  }
  console.time("bmp24");
  var img = makeCapcha();
  // var img = makeImg2();
  console.timeEnd("bmp24");

  res.setHeader('Content-Type', 'image/bmp');
  res.end(img.getFileData());

}).listen(3000);

console.log('localhost:3000');
```
# API
**获得对象的两种方式：**
* 构造函数，创建指定宽高的图片对象(初始化为一张全黑的图片)
```javascript
var BMP24 = require('gd-bmp');
var obj = new BMP24(w, h);
```
* 从文件加载bmp (注意！必需确保文件是24位bmp)
```javascript
//参数：文件路径 ，在回调cb(err, obj)中得到obj
BMP24.loadFromFile(filename, cb)
```

**获取BMP文件数据**
```js
obj.getFileData()
```

**Data Url**
```js
const dataUrl = 'data:image/bmp;base64,' + img.getFileData().toString('base64');
```

**API**
```js
//画点, RGB颜色值（例如红色0xff0000）
obj.drawPoint(x, y, rgb)

//画点, rgb:{ blue:number, green:number, red:number }， 注意颜色值要保证在0-255之间（包含0和255）
obj.drawPointRGB(x, y, rgb)

//获取像素点颜色, 返回 rgb: { blue:number, green:number, red:number } ，如果xy坐标超出图片范围将抛出错误
obj.getPointRGB(x, y)

//画线
obj.drawLine(x1, y1, x2, y2, rgb)

//画矩形&实心矩形（注意x2,y2是坐标并不是宽和高）
obj.drawRect(x1, y1, x2, y2, rgb)
obj.fillRect(x1, y1, x2, y2, rgb)

//画圆
obj.drawCircle(x, y, r, rgb)

//画字符&字符串，font参数为字库，color为RGB颜色值（例如红色0xff0000）
obj.drawChar(ch, x, y, font, color)
obj.drawString(str, x, y, font, color)
```

# 关于字体和颜色
已经内置了三种规格的字体（仅包含大小写英文字母和数字），可以通过：BMP24.font8x16、BMP24.font12x24和BMP24.font16x32得到

另外你也可以参考demo自己生成和定义字体

颜色采用数值的方式，按RGB排列，例如：红色0xff0000，绿色0x00ff00，蓝色0x0000ff

# 只支持24位bmp

推荐用windows自带的画图工具转码bmp

# License
MIT