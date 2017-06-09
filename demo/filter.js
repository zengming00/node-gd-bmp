var fs = require('fs');
var BMP24 = require('../BMP24');//gd-bmp

/**
 * 高斯模糊
 * @param  {Array} pixes  pix array
 * @param  {Number} width 图片的宽度
 * @param  {Number} height 图片的高度
 * @param  {Number} radius 取样区域半径, 正数, 可选, 默认为 3.0
 * @param  {Number} sigma 标准方差, 可选, 默认取值为 radius / 3
 * @return {Array}
 */
function gaussBlur(img, radius, sigma) {
  var width = img.w;
  var height = img.h;
  var gaussMatrix = [],
    gaussSum = 0,
    x, y,
    r, g, b, a,
    i, j, k, len;

  var radius = Math.floor(radius || 3);
  var sigma = sigma || radius / 3;

  a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  b = -1 / (2 * sigma * sigma);
  //生成高斯矩阵
  for (i = 0, x = -radius; x <= radius; x++ , i++) {
    g = a * Math.exp(b * x * x);
    gaussMatrix[i] = g;
    gaussSum += g;

  }
  //归一化, 保证高斯矩阵的值在[0,1]之间
  for (i = 0, len = gaussMatrix.length; i < len; i++) {
    gaussMatrix[i] /= gaussSum;
  }
  //x 方向一维高斯运算
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for (j = -radius; j <= radius; j++) {
        k = x + j;
        if (k >= 0 && k < width) {//确保 k 没超出 x 的范围
          //r,g,b,a 四个一组
          // i = (y * width + k) * 4;
          var c = img.getPointRGB(k, y);
          r += c.red * gaussMatrix[j + radius];
          g += c.green * gaussMatrix[j + radius];
          b += c.blue * gaussMatrix[j + radius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + radius];
        }
      }
      // i = (y * width + x) * 4;
      // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
      // console.log(gaussSum)
      img.drawPointRGB(x, y, {
        red: r / gaussSum,
        green: g / gaussSum,
        blue: b / gaussSum,
      })
      // pixes[i + 3] = a ;
    }
  }
  //y 方向一维高斯运算
  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for (j = -radius; j <= radius; j++) {
        k = y + j;
        if (k >= 0 && k < height) {//确保 k 没超出 y 的范围
          // i = (k * width + x) * 4;
          var c = img.getPointRGB(x, k);
          r += c.red * gaussMatrix[j + radius];
          g += c.green * gaussMatrix[j + radius];
          b += c.blue * gaussMatrix[j + radius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + radius];
        }
      }
      // i = (y * width + x) * 4;
      img.drawPointRGB(x, y, {
        red: r / gaussSum,
        green: g / gaussSum,
        blue: b / gaussSum,
      })
      // pixes[i] = r ;
      // pixes[i + 1] = g ;
      // pixes[i + 2] = b ;
      // pixes[i + 3] = a ;
    }
  }
}

// 锐化
function sharp(img, arg) {
    var lamta = arg || 0.6;
    var width = img.w;
    var height = img.h;

    // 根据像素点的左上角、上边和左边像素进行运算
    // col    0    1   2 3 4
    // row
    // 0:    a:0  b:1  2 3 4 
    // 1:    e:5  c:6  7 8 9

    function calculateColor(a, b, e, c) {
        var delta = c - (b + e + a) / 3;
        var r = c + delta * lamta;
        // 颜色值边界检查
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        return r;
    }

    for (var y = 1; y < height; y++) {
        for (var x = 1; x < width; x++) {
            var a = img.getPointRGB(x - 1, y - 1);
            var b = img.getPointRGB(x, y - 1);
            var e = img.getPointRGB(x - 1, y);
            var c = img.getPointRGB(x, y);
            var color = {
                red: calculateColor(a.red, b.red, e.red, c.red),
                green: calculateColor(a.green, b.green, e.green, c.green),
                blue: calculateColor(a.blue, b.blue, e.blue, c.blue),
            }
            img.drawPointRGB(x, y, color);
        }
    }
}

const srcFile = './lena.bmp';
const sharpFile = './output/sharp.bmp';
const gaussBlurFile = './output/gaussBlur.bmp';

BMP24.loadFromFile(srcFile, function (err, img) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('w=%d, h=%d', img.w, img.h);
    console.time('time');
    
    sharp(img, 1);
    fs.writeFileSync(sharpFile, img.getFileData());

    gaussBlur(img, 30);
    fs.writeFileSync(gaussBlurFile, img.getFileData());

    console.log('done.');
    console.timeEnd('time');
})