"use strict";


window.onload = function() {
  init();
};

var near = 0.3;
var far = 25.0;
var radius = 6.0;



var  fovy = 30.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0;       // Viewport aspect ratio


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;
const target = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function vec3() // ıt is vector like array creation
{
  var result = _argumentsToArray( arguments );

  switch ( result.length ) {
    case 0: result.push( 0.0 );
    case 1: result.push( 0.0 );
    case 2: result.push( 0.0 );
  }

  return result.splice( 0, 3 );
}


function radians( degrees ) {
  return degrees * Math.PI / 180.0;
}


function perspective( fovy, aspect, near, far )
{
  var f = 1.0 / Math.tan( radians(fovy) / 2 );
  var d = far - near;

  var result = mat4();
  result[0][0] = f / aspect;
  result[1][1] = f;
  result[2][2] = -(near + far) / d;
  result[2][3] = -2 * near * far / d;
  result[3][2] = -1;
  result[3][3] = 0.0;

  return result;
}

function length( u )
{
  return Math.sqrt( dot(u, u) );
}


function transpose( m )
{
  var result = [];
  for ( var i = 0; i < m.length; ++i ) {
    result.push( [] );
    for ( var j = 0; j < m[i].length; ++j ) {
      result[i].push( m[j][i] );
    }
  }

  result.matrix = true;

  return result;
}



function floats( v ) // ıt makes first matrices transpose then make an float array and returns the float array
{

  v = transpose( v );
  var n = 16;
  var floats = new Float32Array( n );
  var idx = 0;
  for ( var i = 0; i < v.length; ++i ) {
    for ( var j = 0; j < v[i].length; ++j ) {
      floats[idx++] = v[i][j];
    }
  }


  return floats;
}


function normalize( u, excludeLastComponent )
{
  if ( excludeLastComponent ) {
    var last = u.pop();
  }

  var len = length( u );



  for ( var i = 0; i < u.length; ++i ) {
    u[i] /= len;
  }

  if ( excludeLastComponent ) {
    u.push( last );
  }

  return u;
}
function _argumentsToArray( args )
{
  return [].concat.apply( [], Array.prototype.slice.apply(args) );
}
function vec4()
{
  var result = _argumentsToArray( arguments );

  switch ( result.length ) {
    case 0: result.push( 0.0 );
    case 1: result.push( 0.0 );
    case 2: result.push( 0.0 );
    case 3: result.push( 1.0 );
  }

  return result.splice( 0, 4 );
}

function mat4()
{
  var v = _argumentsToArray( arguments );

  var m = [];

  switch ( v.length ) {

    case 0:
      v[0] = 1;

    case 1:
      m = [
        vec4( v[0], 0.0,  0.0,   0.0 ),
        vec4( 0.0,  v[0], 0.0,   0.0 ),
        vec4( 0.0,  0.0,  v[0],  0.0 ),
        vec4( 0.0,  0.0,  0.0,  v[0] )
      ];
      break;


    default:
      m.push( vec4(v) );  v.splice( 0, 4 );
      m.push( vec4(v) );  v.splice( 0, 4 );
      m.push( vec4(v) );  v.splice( 0, 4 );
      m.push( vec4(v) );
      break;
  }



  m.matrix = true;

  return m;
}

function lookAt( eye, at, up )
{

  var v = normalize( subtract(at, eye) );
  var n = normalize( cross(v, up) );
  var u = normalize( cross(n, v) );

  v = negate( v );

  var result = mat4(
    vec4( n, -dot(n, eye) ),
    vec4( u, -dot(u, eye) ),
    vec4( v, -dot(v, eye) ),
    vec4()
  );

  return result;
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]];
}

function dot( u, v )
{
  var sum = 0.0;
  for ( var i = 0; i < u.length; ++i ) {
    sum += u[i] * v[i];
  }

  return sum;
}


function negate( u )
{
  var result = [];
  for ( var i = 0; i < u.length; ++i ) {
    result.push( -u[i] );
  }

  return result;
}

function subtract( a, b )
{
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}


function parseOBJ(text) { // I modified this according to just position and faces
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];


  // same order as `f` indices
  const objVertexData = [
    objPositions,

  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions

  ];


  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },

    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };



  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return {

    position: webglVertexData[0],

  };
}




function create_buffers (gl,type,color){
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); //bind the buffer to be able to use bind point

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(type.concat(color)), gl.STATIC_DRAW);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(type));
  gl.bufferSubData(gl.ARRAY_BUFFER, type.length * 4, new Float32Array(color));


  return buffer;
}





function init() {
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl2");





  if (!gl) { // if your browser does not support webgl2
    alert("WebGL2 is not working on this browser!");
    return;
  }

  //create shaders
  const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertex_shader, v_shader);
  gl.compileShader(vertex_shader);
  if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
    var info = gl.getShaderInfoLog(vertex_shader);
    alert("Could not compile vertex shader. \n\n" + info);
    return;
  }

  const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragment_shader, f_shader);
  gl.compileShader(fragment_shader);
  if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
    var info = gl.getShaderInfoLog(fragment_shader);
    alert("Could not compile fragment shader. \n\n" + info);
    return;
  }

  //create program
  var program = gl.createProgram();
  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var info = gl.getProgramInfoLog(program);
    alert("Could not link WebGL2 program. \n\n" + info);
    return;
  }

  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;


  var vertex_location = gl.getAttribLocation(program, "a_position"); //get the vertex position"
  var color_location = gl.getAttribLocation(program, "a_color"); //get the color position
  var rotationLocation = gl.getUniformLocation(program, "u_rotation");

  modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
  projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

  aspect =  canvas.width/canvas.height;


  gl.useProgram( program );

  gl.clearColor(0.0, 0.0, 0.0,1.0);  // Clear to white, fully opaque
  gl.clear(gl.COLOR_BUFFER_BIT);

  var buffer_square = create_buffers(gl,square,square_color);


  async function main() {
    const response = await fetch('dragon_10k (1).obj');
    const text = await response.text();
    const data = parseOBJ(text);


    var color_d = [0.0,1.0,0.0];
    var color_dragon = [];
    for (var i = 0 ;i<data.position.length;i++){
      color_dragon.concat(color_d);

    }

    var v_position = [];

    v_position.concat(data.position);

    var buffer_dragon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_dragon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.position), gl.STATIC_DRAW);


    var buffer_dragon_color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer_dragon_color);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(color_dragon),gl.STATIC_DRAW);

    gl.clearColor(1.0, 1.0, 1.0,1.0);  // Clear to white, fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT);

    //pointer lock
    document.addEventListener('pointerlockchange', lockChangeAlert, false);

    function lockChangeAlert() {
      if (document.pointerLockElement === canvas ) {
        console.log('The pointer lock status is now locked');
        document.addEventListener("mousemove", updatePosition, false);
      } else {
        console.log('The pointer lock status is now unlocked');
        document.removeEventListener("mousemove", updatePosition, false);
      }
    }

    canvas.onclick = function() {
      canvas.requestPointerLock();
    };

    function updatePosition(e) {
      eye_z += e.movementX;
      eye_y += e.movementY;

    }

    document.addEventListener('keyup', onKeyUp, false);

    function onKeyUp(event){

      if(event.key === 'w'){
        radius +=0.1;
      }else if(event.key==='s'){
        radius -=0.1;
      }else if(event.key==='d'){

        eye_z +=0.1;

      }else if(event.key==='a'){

        eye_z -=0.1;
      }else if(event.key === "o"){
        eye_y +=0.1;
      }else if(event.key === "p"){
        eye_y -=0.1;
      }else if(event.key ==="4"){
        angle_per_second += 1.0;
      }else if(event.key === "-"){
        angle_per_second -= 1.0;
      }

    }






    var degree = [0,0,1];

    var angle_per_second = +1.0;
    var angle = 0;
    var situation = 2;

    var tick_ =function () {
      angle = updateAngle(angle,situation);

      var angleInRadians = angle * Math.PI / 180;
      degree[0] = Math.sin(angleInRadians);
      degree[2] = Math.cos(angleInRadians);



      bindAndDraw(buffer_dragon,data,((data.position).length)/3,degree,buffer_dragon_color);
      bindAndDraw_square(buffer_square,square,square.length,[0.0,0.0,1.0]);



      requestAnimationFrame(tick_);


    };

    tick_();



    function updateAngle(angle,situation){
      var now = Date.now();




      if(situation === 1){
        return angle = angle- angle_per_second;

      }else
        return angle = angle + angle_per_second;






    }


    bindAndDraw_square(buffer_square,square,square.length);
    bindAndDraw(buffer_dragon,data,((data.position).length)/3,degree,buffer_dragon_color);

  }
  main();


  function bindAndDraw_square(buffer,type_object,count,degree){

    gl.enable(gl.DEPTH_TEST);



    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform3fv(rotationLocation, degree);
    gl.vertexAttribPointer(vertex_location, numComponents, type, normalize, stride, offset);


    gl.enableVertexAttribArray(vertex_location);



    /**/
    gl.enableVertexAttribArray(color_location);
    gl.vertexAttribPointer(color_location, 3, type, normalize, stride, type_object.length * 4);


    /**/
    gl.drawArrays(gl.TRIANGLE_FAN, offset,count);

  }

  var eye_x ;
  var eye_y = 0.3;
  var eye_z = -0.1;





  function bindAndDraw(buffer,type_object,count,degree,color_buffer){

    gl.enable(gl.DEPTH_TEST);

    eye_x = radius*-0.76*0.84;



    eye = vec3(eye_x,eye_y,eye_z);
    modelViewMatrix = lookAt(eye, target , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, floats(modelViewMatrix ));
    gl.uniformMatrix4fv( projectionMatrixLoc, false, floats(projectionMatrix));


    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform3fv(rotationLocation, degree);
    gl.vertexAttribPointer(vertex_location, numComponents, type, normalize, stride, offset);


    gl.enableVertexAttribArray(vertex_location);



    /**/
    gl.enableVertexAttribArray(color_location);
    gl.vertexAttribPointer(color_location, 3, type, normalize, stride, offset);


    /**/
    gl.drawArrays(gl.TRIANGLES, offset,count);

  }

}
