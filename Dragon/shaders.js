const v_shader= `#version 300 es
    in vec4 a_position;
    in vec4 a_color;
    out vec4 color;
    uniform vec3 u_rotation;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;



    void main() {

        gl_Position = vec4(
     a_position.x * u_rotation.z + a_position.z * u_rotation.x,
     a_position.y,a_position.z * u_rotation.z - a_position.x * u_rotation.x,1.0);
        gl_Position = projectionMatrix*modelViewMatrix*gl_Position;


        color = a_color;
    }
`;

const f_shader = `#version 300 es
    precision mediump float;
    in vec4 color;
    out vec4 o_color;
    void main() {
        o_color = color;
    }
`;
