/*** ImagePalette v1 ***/
class ImagePalette {
   #colors;
   #virtualElement;
   constructor() {
      this.version = "1";
      this.scale = 40;
      this.#virtualElement = document.createElement('div');
      this.#colors = [];
      this.accentColors = [];
      this.neutralColors = [];
      this.eventTarget = new EventTarget();
   }
   selectImage(elm) {
      this.img = new Image();
      this.img.src = elm.src;
      this.img.onload = () => {
         this.#canvas();
      };
   }
   srcImage(src) {
      this.img = new Image();
      this.img.src = src;
      this.img.onload = () => {
         this.#canvas();
      };
   }
   uploadImage() {
      let input = document.createElement('input');
      input.type = 'file';
      input.accept = "image/png, image/jpeg";
      input.addEventListener('change', async (event) => {
         let file = event.target.files[0];
         let dataUrl = await new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
         });
         this.img = new Image();
         this.img.src = dataUrl;
         this.img.onload = () => {
            this.#canvas();
         };
      })
      input.click();
   }
   set onrender(callback) {
      this.#virtualElement.addEventListener('render', callback)
   }
   get onrender() {
      return undefined
   }
   #RemoveSimilarColors(colors, range) {
         let hueFrequency = colors.reduce((acc, color) => {
            acc[color.h] = (acc[color.h] || 0) + 1;
            return acc;
         }, {});
         let sortedHues = Object.entries(hueFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(entry => Number(entry[0]));
         let result = [];
         while (sortedHues.length > 0) {
            let current = sortedHues[0];
            result.push(current);
            sortedHues = sortedHues.filter(num => Math.abs(num - current) > range);
         }
         colors = colors.filter(color => {
            if (result.includes(color.h)) {
               result = result.filter(h => h !== color.h);
               return true;
            }
            return false;
         });
         return colors;
      }
   #rgbToHsl(r, g, b, a) {
      r /= 255;
      g /= 255;
      b /= 255;
      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max == min) {
         h = s = 0;
      } else {
         let d = max - min;
         s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
         switch (max) {
            case r:
               h = (g - b) / d + (g < b ? 6 : 0);
               break;
            case g:
               h = (b - r) / d + 2;
               break;
            case b:
               h = (r - g) / d + 4;
               break;
         }
         h /= 6;
      }
      h = parseInt((h * 360).toFixed(0));
      s = parseInt((s * 100).toFixed(0));
      l = parseInt((l * 100).toFixed(0));
      return { h, s, l, a }
   }
   #hslToHex(h, s, l) {
      h = h / 360;
      s = s / 100;
      l = l / 100;
      let c = (1 - Math.abs(2 * l - 1)) * s;
      let x = c * (1 - Math.abs((h * 6) % 2 - 1));
      let m = l - c / 2;
      let r, g, b;
      switch (true) {
         case (h >= 0 && h < 1 / 6):
            r = c;
            g = x;
            b = 0;
            break;
         case (h >= 1 / 6 && h < 2 / 6):
            r = x;
            g = c;
            b = 0;
            break;
         case (h >= 2 / 6 && h < 3 / 6):
            r = 0;
            g = c;
            b = x;
            break;
         case (h >= 3 / 6 && h < 4 / 6):
            r = 0;
            g = x;
            b = c;
            break;
         case (h >= 4 / 6 && h < 5 / 6):
            r = x;
            g = 0;
            b = c;
            break;
         default:
            r = c;
            g = 0;
            b = x;
            break;
      }
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      let toHex = (value) => {
         let hex = value.toString(16);
         return hex.length == 1 ? '0' + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
   }
   #canvas() {
      this.#colors = [];
      this.accentColors = [];
      this.neutralColors = [];
      let cvs = document.createElement('canvas');
      let ctx = cvs.getContext('2d');
      [cvs.width, cvs.height] = [this.img.naturalWidth, this.img.naturalHeight];
      ctx.drawImage(this.img, 0, 0, cvs.width, cvs.height);
      let ratio = parseFloat((cvs.height / cvs.width).toFixed(2));
      let scale = this.scale;
      let wScale = ratio <= 1 ? parseInt(scale * ratio) : scale;
      let hScale = ratio <= 1 ? scale : parseInt(scale * ratio);
      for (let i = 1; i < wScale + 1; i++) {
         for (let j = 1; j < hScale + 1; j++) {
            let x = Math.ceil((i * cvs.width / wScale) - (cvs.width / wScale));
            let y = Math.ceil((j * cvs.height / hScale) - (cvs.width / wScale));
            let imageData = ctx.getImageData(y, x, 1, 1);
            let pixel = imageData.data;
            let r = pixel[0];
            let g = pixel[1];
            let b = pixel[2];
            let a = pixel[3];
            this.#colors.push(this.#rgbToHsl(r, g, b, a));
         }
      }
      this.#render();
   }
   #render() {
      let accent, neutral;
      accent = neutral = this.#colors;
      accent = this.#colors.filter(color => (color.l >= 30 && color.l <= 70) && (color.s >= 40));
      neutral = this.#colors.filter(color => (color.l >= 10 && color.l <= 90) && (color.l < 30 || color.l > 70) && (color.s < 40));
      accent.sort((a, b) => b.s - a.s)
      neutral.sort((a, b) => b.s - a.s)
      accent = this.#RemoveSimilarColors(accent, 10);
      neutral = this.#RemoveSimilarColors(neutral, 10);
      accent.sort((a, b) => Math.abs(a.l - 50) - Math.abs(b.l - 50));
      neutral.sort((a, b) => b.l - a.l)
      accent.forEach(c => this.accentColors.push(this.#hslToHex(c.h, c.s, c.l)));
      neutral.forEach(c => this.neutralColors.push(this.#hslToHex(c.h, c.s, c.l)));
      let renderEvent = new CustomEvent('render', {});
      this.#virtualElement.dispatchEvent(renderEvent);
   }
}