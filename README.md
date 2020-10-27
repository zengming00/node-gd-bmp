<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg" alt="996.icu" /></a> 反对996是每个软件工程师的义务


# node-gd-bmp
light and high speed and 100% js implement graphical library, it can running in any platform,
BUT only support bmp 24bit format, internal contains 3 fonts
# demo

请看 src/demo，里面有关于如何做验证码、如何做图像处理的案例

# API
**获得对象的两种方式：**
* 构造函数，创建指定宽高的图片对象(初始化为一张全黑的图片)
```javascript
import { BMP24 } from 'gd-bmp';
const BMP24 = require('gd-bmp').BMP24;
const img = new BMP24(w, h);
```
* 从文件加载bmp (注意！必需确保文件是24位bmp)
```javascript
const img = await BMP24.loadFromFile(file);
```

**获取BMP文件数据**
```js
obj.getFileData()
```

**Data Url**
```js
const img = makeImg();
const dataUrl = img.getDataUrl();
res.setHeader('Content-Type', 'text/html');
res.end(`<img src="${dataUrl}"/>`);
```

**API**
```js
// 画点, RGB颜色值（例如红色0xff0000）
obj.drawPoint(x, y, rgb)

// 画点, rgb:{ blue:number, green:number, red:number }， 注意颜色值要保证在0-255之间（包含0和255）
obj.drawPointRGB(x, y, rgb)

// 获取像素点颜色, 返回 rgb: { blue:number, green:number, red:number } ，如果xy坐标超出图片范围将抛出错误
obj.getPointRGB(x, y)

// 画线
obj.drawLine(x1, y1, x2, y2, rgb)

// 画矩形
obj.drawRect(x, y, w, h, rgb)

// 实心矩形
obj.fillRect(x, y, w, h, rgb)

// 画圆
obj.drawCircle(x, y, r, rgb)

//画字符&字符串，font参数为字库，color为RGB颜色值（例如红色0xff0000）
obj.drawChar(ch, x, y, font, color)
obj.drawString(str, x, y, font, color)
```

# 关于字体和颜色
已经内置了三种规格的字体（仅包含大小写英文字母和数字），可以通过：BMP24.font8x16、BMP24.font12x24和BMP24.font16x32得到

另外你也可以参考demo自己生成和定义字体

demo内包含一个支持中文的字库文件，支持65535个字符，需要占用2M内存

颜色采用数值的方式，按RGB排列，例如：红色0xff0000，绿色0x00ff00，蓝色0x0000ff

# 只支持24位bmp

推荐用windows自带的画图工具转码bmp

# License
MIT
