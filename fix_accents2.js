const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The file has some weird characters.
html = html.replace(/M\u012Bgicos/g, 'Mágicos');
html = html.replace(/M\u016Bgicos/g, 'Mágicos');
html = html.replace(/M.gicos/g, 'Mágicos');

html = html.replace(/l.piz/g, 'lápiz');
html = html.replace(/L.piz/g, 'Lápiz');
html = html.replace(/c.mara/g, 'cámara');
html = html.replace(/est.tica/g, 'estática');
html = html.replace(/vibraci.n/g, 'vibración');
html = html.replace(/matem.tico/g, 'matemático');
html = html.replace(/org.nico/g, 'orgánico');
html = html.replace(/m.s/g, 'más');
html = html.replace(/dem.s/g, 'demás');
html = html.replace(/rob.ticos/g, 'robóticos');
html = html.replace(/.nicos/g, 'Únicos');
html = html.replace(/Tama.o/g, 'Tamaño');

fs.writeFileSync('index.html', html, 'utf8');
