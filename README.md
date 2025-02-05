# ImagePalette v1

**ImagePalette** is a JavaScript library that extracts color palettes from images. It categorizes colors into two groups: `accent` colors (vibrant colors) and `neutral` colors (subdued tones). The library uses lightness and saturation values to classify and filter colors, and removes similar colors based on their hue.

## Features:
- Extracts color palettes from images.
- Categorizes colors into `accent` and `neutral` based on lightness and saturation.
- Filters out similar colors based on hue.
- Converts colors to Hex format for easy usage.

## How to Use:

### 1. Initialize the Library
To get started, you need to create an instance of `ImagePalette`:
```javascript
let palette = new ImagePalette();
palette.range
palette.imageSrc('path/to/image.png');
/* or */ // palette.imageElm(elm);
/* or */ // palette.uploadImage();
palette.onrender = () => {
   console.log(palette.accentColors);
   console.log(palette.neutralColors);
}