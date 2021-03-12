const square = [
  1.0,0.02,-1.0,
  1.0,-0.02,1.0,
  -1.0,-0.02,1.0,
  -1.0,0.02,-1.0
]

const color_s = [1.0,0.0,0.0];

var square_color = [];
for(var i = 0; i < 12; i++){
  square_color = square_color.concat(color_s);
}
