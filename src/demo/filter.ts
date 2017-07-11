import { BMP24 } from '../BMP24'; // gd-bmp
import * as fs from 'fs';
import * as path from 'path';

// tslint:disable:no-console
// tslint:disable:one-variable-per-declaration

/**
 * 高斯模糊
 * @param  {Array} pixes  pix array
 * @param  {Number} width 图片的宽度
 * @param  {Number} height 图片的高度
 * @param  {Number} radius 取样区域半径, 正数, 可选, 默认为 3.0
 * @param  {Number} sigma 标准方差, 可选, 默认取值为 radius / 3
 * @return {Array}
 */
function gaussBlur(img: BMP24, radius: number, sigma?: number) {
  const width = img.w;
  const height = img.h;
  const gaussMatrix = [];
  let gaussSum = 0;
  let x, y;
  let r, g, b, a;
  let i, j, k, len;

  const mradius = Math.floor(radius || 3);
  const msigma = sigma || radius / 3;

  a = 1 / (Math.sqrt(2 * Math.PI) * msigma);
  b = -1 / (2 * msigma * msigma);
  // 生成高斯矩阵
  for (i = 0, x = -mradius; x <= mradius; x++ , i++) {
    g = a * Math.exp(b * x * x);
    gaussMatrix[i] = g;
    gaussSum += g;

  }
  // 归一化, 保证高斯矩阵的值在[0,1]之间
  for (i = 0, len = gaussMatrix.length; i < len; i++) {
    gaussMatrix[i] /= gaussSum;
  }
  // x 方向一维高斯运算
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for (j = -mradius; j <= mradius; j++) {
        k = x + j;
        if (k >= 0 && k < width) { // 确保 k 没超出 x 的范围
          // r,g,b,a 四个一组
          // i = (y * width + k) * 4;
          const c = img.getPointRGB(k, y);
          r += c.red * gaussMatrix[j + mradius];
          g += c.green * gaussMatrix[j + mradius];
          b += c.blue * gaussMatrix[j + mradius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + mradius];
        }
      }
      // i = (y * width + x) * 4;
      // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
      // console.log(gaussSum)
      img.drawPointRGB(x, y, {
        red: r / gaussSum,
        green: g / gaussSum,
        blue: b / gaussSum,
      });
      // pixes[i + 3] = a ;
    }
  }
  //  y 方向一维高斯运算
  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for (j = -mradius; j <= mradius; j++) {
        k = y + j;
        if (k >= 0 && k < height) {// 确保 k 没超出 y 的范围
          // i = (k * width + x) * 4;
          const c = img.getPointRGB(x, k);
          r += c.red * gaussMatrix[j + mradius];
          g += c.green * gaussMatrix[j + mradius];
          b += c.blue * gaussMatrix[j + mradius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + mradius];
        }
      }
      // i = (y * width + x) * 4;
      img.drawPointRGB(x, y, {
        red: r / gaussSum,
        green: g / gaussSum,
        blue: b / gaussSum,
      });
      // pixes[i] = r ;
      // pixes[i + 1] = g ;
      // pixes[i + 2] = b ;
      // pixes[i + 3] = a ;
    }
  }
}

// 锐化
function sharp(img: BMP24, arg: number) {
  const lamta = arg || 0.6;
  const width = img.w;
  const height = img.h;

  // 根据像素点的左上角、上边和左边像素进行运算
  // col    0    1   2 3 4
  // row
  // 0:    a:0  b:1  2 3 4
  // 1:    e:5  c:6  7 8 9

  function calculateColor(a: number, b: number, e: number, c: number) {
    const delta = c - (b + e + a) / 3;
    let r = c + delta * lamta;
    // 颜色值边界检查
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    return r;
  }

  for (let y = 1; y < height; y++) {
    for (let x = 1; x < width; x++) {
      const a = img.getPointRGB(x - 1, y - 1);
      const b = img.getPointRGB(x, y - 1);
      const e = img.getPointRGB(x - 1, y);
      const c = img.getPointRGB(x, y);
      const color = {
        red: calculateColor(a.red, b.red, e.red, c.red),
        green: calculateColor(a.green, b.green, e.green, c.green),
        blue: calculateColor(a.blue, b.blue, e.blue, c.blue),
      };
      img.drawPointRGB(x, y, color);
    }
  }
}

const srcFile = path.resolve(__dirname, '../../res/lena.bmp');
const sharpFile = path.resolve(__dirname, '../../output/sharp.bmp');
const gaussBlurFile = path.resolve(__dirname, '../../output/gaussBlur.bmp');

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
});
