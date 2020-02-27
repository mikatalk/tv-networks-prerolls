import './reset.scss'

import { iframeHandler } from './utils/iframeHandler'

import {
  Camera,
  Scene,
  PlaneBufferGeometry,
  Vector2,
  ShaderMaterial,
  Mesh,
  WebGLRenderer
} from 'three'

const vertexShader = `
void main() {
    gl_Position = vec4( position, 1.0 );
}`

const fragmentShader = `
#define PI 3.14159265359

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

mat2 rotate2d(float _angle){
  return mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle));
}

mat2 scale2D(vec2 _scale){
  return mat2(_scale.x,0.0,
              0.0,_scale.y);
}

float box(in vec2 _st, in vec2 _size){
  _size = vec2(0.5) - _size*0.5;
  vec2 uv = smoothstep(_size, _size+vec2(0.001), _st);
  uv *= smoothstep(_size, _size+vec2(0.001), vec2(1.0)-_st);
  return uv.x*uv.y;
}

float cross(in vec2 _st, float _size){
  return  box(_st, vec2(_size,_size/4.)) + box(_st, vec2(_size/4.,_size));
}

float circle(in vec2 _st, in float _radius){
  vec2 dist = _st-vec2(0.5);
  return 1.-smoothstep(_radius-(_radius*0.01), 
    _radius+(_radius*0.01),
    dot(dist,dist)*4.0);
}

float mapTime (float from, float to, float time) {
  return clamp((time - from) / (to - from), 0.0, 1.0);
}

vec3 makeBackground (vec2 st, float angle, float progress) {
  
  st -= vec2(0.5, 0.5);
  st = rotate2d(angle) * st;
  st += vec2(0.5, 0.5);
  st.x *= 100.0;
  // vec2 ipos = floor(st);  // get the integer coords
  vec2 ipos = fract(st);  // get the fractional coords
  st.x += sin(st.x) * sin(25.0 + progress * 150.0) * 4.0;
  ipos = floor(st);
  if (random(ipos) < 0.2) {
    return vec3(0);
  }
  return vec3(
    mod(random(ipos+ 1.0)*4.0, 1.0) * 0.5, 
    mod(random(ipos+ 1.0)*8.0, 1.0) * 0.25, 
    mod(random(ipos+ 1.0)*16.0, 1.0) * 0.75
    // random(ipos+1.0) * 0.5
  );
}

float makeNLeft (vec2 st, float scale) {
  st.x += 0.05;
  return box(st, vec2(0.08, 0.75));
}

float makeNRight (vec2 st, float scale) {
  st.x -= 0.13;
  return box(st, vec2(0.08, 0.75));
}

float makeNMid (vec2 st, float scale) {
  st -= vec2(0.54, 0.5);
  st = rotate2d(0.42) * st;
  st += vec2(0.5, 0.5);
  return box(st, vec2(0.08, 0.75));
}

float makeNShadow (vec2 st, float scale) {
  return 1.0 - clamp(distance(st, vec2(0.5)) * 4.0 / scale, 0.0, 1.0);
}

vec3 hsl2rgb(float h, float s, float l){
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
  
    // control the global scale and camera translation
    float scale = 1.0 - mapTime(6.0, 10.0, u_time) / 1.0;
    st -= vec2(0.5);
    st = scale2D( vec2(scale) ) * st;
    st += vec2(0.5);
    // slight translation to the right to focus on the left N side
    st.x -= mapTime(6.0, 10.0, u_time) * 0.07;

    
    vec3 color = vec3(0.0);
    vec3 bg;

    float masks = circle(st + vec2(-0.02, -0.92), 2.2);
    masks += circle(st + vec2(-0.02, 0.92), 2.2);
   

    // N - left line
    vec3 nLeft = vec3(0.0, 0.0, 0.0);
    nLeft = mix(
      nLeft,
      vec3(0.47, 0.047, 0.0),
      step(0.5, mapTime(0.0, 1.5, u_time - st.y / 2.0))
    );
    nLeft = mix(
      nLeft,
      makeBackground(st, 0.0, 0.25), 
      mapTime(4.5, 6.5, u_time + st.y / 2.0)
    );
    
    nLeft = mix(
      nLeft,
      makeBackground(st, 0.0, mapTime(0.0, 30.0, u_time)), 
      mapTime(7.0, 20.0, u_time)
    );
    nLeft = mix(
      nLeft,
      vec3(0.0, 0.0, 0.0), 
      mapTime(6.0, 12.0, u_time + st.y / 2.0)
    );
    float phi = 1.16;
    float base = 256.0;
    nLeft = mix(
      nLeft,
      hsl2rgb(st.x - st.x * u_time, 1.0, cos(st.x * base) / 2.0 + sin(st.x * base / phi * u_time / 64.0) / 2.0),
      mapTime(7.0, 11.0, u_time + st.y / 2.0)
    );
    
    // N - middle line
    vec3 nMid = vec3(0.0, 0.0, 0.0);
    nMid = mix(
      nMid,
      vec3(0.87, 0.12, 0.0),
      step(0.5, mapTime(0.5, 2.5, u_time + st.y / 2.0))
    );
    nMid = mix(
      nMid,
      makeBackground(st, 0.42, 0.5), 
      mapTime(4.25, 6.25, u_time - st.y / 2.0)
    );
    nMid = mix(
      nMid,
      vec3(0.0, 0.0, 0.0), 
      mapTime(5.75, 6.25, u_time - st.y / 2.0)
    );

    // N - right line
    vec3 nRight = vec3(0.0, 0.0, 0.0);
    nRight = mix(
      nRight,
      vec3(0.47, 0.047, 0.0),
      step(0.5, mapTime(0.5, 2.0, u_time - st.y / 2.0))
    );
    nRight = mix(
      nRight,
      makeBackground(st, 0.0, 0.5), 
      mapTime(4.0, 6.0, u_time + st.y / 2.0)
    );
    nRight = mix(
      nRight,
      vec3(0.0, 0.0, 0.0), 
      mapTime(5.5, 6.0, u_time + st.y / 2.0)
    );
   
    // merge and mask main elements
    color = mix(color, nLeft, mix(makeNLeft(st, 1.0), 0.0, masks));
    color = mix(color, nRight, mix(makeNRight(st, 1.0), 0.0, masks));
    color = mix(color, vec3(0), 0.5 * makeNShadow(st + vec2(-0.02, 0.0), 0.75));
    color = max(color, mix(vec3(0), nMid, mix(makeNMid(st, 1.0), 0.0, masks)));

    // add band top and bottom (not a nutflex thing but i thought it looked cool)
    if (st.y < 0.1 || st.y > 0.9) {
      bg = makeBackground(st, 0.0, mapTime(0.0, 10.0, u_time));
      color = mix(vec3(0.47, 0.047, 0.0), bg, mapTime(0.0, 10.0, u_time));
    }
    gl_FragColor = vec4(color,1.0);
}

`

class App {

  container
  camera
  scene
  renderer
  uniforms
  playing
  
  constructor (container) {
    this.container = container
    this.playing = true
    this.init()
    this.animate()
  }

  init () {

    this.camera = new Camera()
    this.camera.position.z = 1

    this.scene = new Scene()

    const geometry = new PlaneBufferGeometry(2, 2)

    this.uniforms = {
      u_time: { type: 'f', value: 0 },
      u_resolution: { type: 'v2', value: new Vector2() },
      u_mouse: { type: 'v2', value: new Vector2() }
    }

    const material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })

    const mesh = new Mesh(geometry, material)
    this.scene.add(mesh)

    this.renderer = new WebGLRenderer({
      antialias: true
    })
    this.renderer.setPixelRatio( window.devicePixelRatio)

    this.container.appendChild(this.renderer.domElement)

    this.onWindowResize()
    window.addEventListener('resize', this.onWindowResize, false)
    document.addEventListener('mousemove', this.onMouseMove, false)

    document.body.classList.add('preroll-nutflex')

    this.addCrontrols()
  
  }
  
  addCrontrols () {
    this.playBtn = document.createElement('button')
    this.label = document.createElement('span')
    this.label.classList.add('label')
    
    this.playBtn.innerText = this.playing ? '⎕' : '▶︎'
    this.playBtn.type = 'button'
    this.playBtn.classList.add('play-btn')
    this.playBtn.addEventListener('click', () => {
      this.playing = !this.playing
      this.playBtn.innerText = this.playing ? '⎕' : '▶︎'
    }, false)
    this.slider = document.createElement('input')
    this.slider.type = 'range'
    this.slider.min = 0
    this.slider.max = 1000
    this.slider.value = 0
    this.slider.classList.add('slider')
    this.slider.addEventListener('input', () => {
      this.playing = false
    })
    this.container.appendChild(this.playBtn)
    this.container.appendChild(this.label)
    this.container.appendChild(this.slider)
  }
  
  onMouseMove = event => {
    this.uniforms.u_mouse.value.x = event.pageX
    this.uniforms.u_mouse.value.y = event.pageY
  }

  onWindowResize = () => {
    const size = Math.min(window.innerWidth, window.innerHeight)
    this.renderer.setSize(size, size)
    this.uniforms.u_resolution.value.x = this.renderer.domElement.width
    this.uniforms.u_resolution.value.y = this.renderer.domElement.height
  }

  animate = (elaspedTime) => {
    requestAnimationFrame(this.animate)
    if (this.playing) {
      this.slider.value = (elaspedTime * 0.003) % 10 * 100
    }
    const time = this.slider.value / 100
    this.uniforms.u_time.value = time
    this.label.innerText = time
    this.render()
  }
  
  render() {
    this.renderer.render(this.scene, this.camera)
  }
}

new App(document.getElementById('app'))

iframeHandler()
