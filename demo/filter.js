var fs = require('fs');
var BMP24 = require('../BMP24');//gd-bmp

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

const srcFile = 'C:/Users/admin/Desktop/pet.bmp';
const sharpFile = 'C:/Users/admin/Desktop/sharp.bmp';

BMP24.loadFromFile(srcFile, function (err, img) {
    if (err) {
        console.error(err);
        return;
    }
    console.time('time');

    sharp(img);
    fs.writeFileSync(sharpFile, img.getFileData());

    console.log('done.');
    console.timeEnd('time');
})