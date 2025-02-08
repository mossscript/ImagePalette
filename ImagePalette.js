/*** ImagePalette v1 ***/
class ImagePalette {
   #img;
   #scale;
   #range;
   #colors;
   #virtualElement;
   constructor() {
      this.version = "1";
      this.#scale = 50;
      this.#range = 30;
      this.#virtualElement = document.createElement('div');
      this.#colors = [];
      this.accentColors = [];
      this.neutralColors = [];
      this.eventTarget = new EventTarget();
   }
   imageElm(elm) {
      this.#img = new Image();
      this.#img.src = elm.src;
      this.#img.onload = () => {
         this.#canvas();
      };
   }
   imageSrc(src) {
      this.#img = new Image();
      this.#img.src = src;
      this.#img.onload = () => {
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
         this.#img = new Image();
         this.#img.src = dataUrl;
         this.#img.onload = () => {
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
   get range() {
      return this.#range;
   }
   set range(num) {
      this.#range = num;
      if (this.#img) this.#render();
   }
   get scale() {
      return this.#scale;
   }
   set scale(num) {
      this.#scale = num;
      if (this.#img) this.#canvas();
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
      let cvs = document.createElement('canvas');
      let ctx = cvs.getContext('2d');
      [cvs.width, cvs.height] = [this.#img.naturalWidth, this.#img.naturalHeight];
      ctx.drawImage(this.#img, 0, 0, cvs.width, cvs.height);
      let ratio = parseFloat((cvs.height / cvs.width).toFixed(2));
      let wScale = ratio <= 1 ? parseInt(this.#scale * ratio) : this.#scale;
      let hScale = ratio <= 1 ? this.#scale : parseInt(this.#scale * ratio);
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
      this.accentColors = [];
      this.neutralColors = [];
      accent = neutral = this.#colors;
      accent = this.#colors.filter(color => (color.l >= 20 && color.l <= 80) && (color.s >= 30));
      neutral = this.#colors.filter(color => (color.l >= 10 && color.l <= 90) && (color.l < 20 || color.l > 80) && (color.s < 30));
      accent = this.#RemoveSimilarColors(accent, this.#range);
      neutral = this.#RemoveSimilarColors(neutral, this.#range);
      neutral.sort((a, b) => b.l - a.l)
      accent.forEach(c => this.accentColors.push(this.#hslToHex(c.h, c.s, c.l)));
      neutral.forEach(c => this.neutralColors.push(this.#hslToHex(c.h, c.s, c.l)));
      let renderEvent = new CustomEvent('render', {});
      this.#virtualElement.dispatchEvent(renderEvent);
   }
}