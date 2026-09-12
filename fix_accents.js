const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/Mǭgicos/g, 'Mágicos');
html = html.replace(/lǭpiz/g, 'lápiz');
html = html.replace(/Lǭpiz/g, 'Lápiz');
html = html.replace(/cǭmara/g, 'cámara');
html = html.replace(/estǭtica/g, 'estática');
html = html.replace(/vibracin/g, 'vibración');
html = html.replace(/matemǭtico/g, 'matemático');
html = html.replace(/orgǭnico/g, 'orgánico');
html = html.replace(/mǭs/g, 'más');
html = html.replace(/demǭs/g, 'demás');
html = html.replace(/robticos/g, 'robóticos');
html = html.replace(/snicos/g, 'Únicos');
html = html.replace(/Tamao/g, 'Tamaño');
html = html.replace(/Resolucin/g, 'Resolución');
html = html.replace(/Estimacin/g, 'Estimación');
html = html.replace(/Y-\<\\?/g, '🖋️');
html = html.replace(/Y"\/g, '📺');
html = html.replace(/YOS/g, '🌊');
html = html.replace(/YO\\?/g, '🌪️');

fs.writeFileSync('index.html', html, 'utf8');
