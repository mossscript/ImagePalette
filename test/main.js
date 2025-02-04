let [accenElm,neutralElm] = document.querySelectorAll('#accent,#neutral');
let C = new ImagePalette();

C.onrender = ()=> {
   accenElm.innerHTML = neutralElm.innerHTML = '';
   C.accentColors.forEach(color=> accenElm.innerHTML+=`<div style="background: ${color}"></div>`);
   C.neutralColors.forEach(color=> neutralElm.innerHTML+=`<div style="background: ${color}"></div>`);
   if (C.accentColors.length == 0) accenElm.innerHTML = '<div> nothing </div>'
   if (C.neutralColors.length == 0) neutralElm.innerHTML = '<div> nothing </div>'
}