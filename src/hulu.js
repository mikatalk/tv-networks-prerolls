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


mat2 rotate2d(float _angle){
  return mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle));
}

mat2 scale2D(vec2 _scale){
  return mat2(_scale.x,0.0,
              0.0,_scale.y);
}

float square(in vec2 _st, in vec2 _size){
  _size = vec2(0.5) - _size*0.5;
  vec2 uv = smoothstep(_size, _size+vec2(0.001), _st);
  uv *= smoothstep(_size, _size+vec2(0.001), vec2(1.0)-_st);
  return uv.x*uv.y;
}

// from http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float roundBox(vec2 pos, vec2 bounds, float radius) {
  return 1.0 - smoothstep(0.0, 0.005, length(max(abs(pos) - bounds, 0.0)) - radius);
}

vec3 drawLetterH (vec2 st) {
  vec3 color = vec3(0.0);

  // main base
  float box = roundBox(st - vec2(0.53, 0.5), vec2(0.10, 0.2), 0.15);
  color = vec3(box);
  // mask inside
  box = roundBox(st - vec2(0.5, 0.525), vec2(0.05, 0.12), 0.05);
  color = mix(color, vec3(0), box);
      
  // side left bar
  box = square(st + vec2(0.2, -0.25), vec2(0.17, 0.75));
  color = max(color, box);

  // mask the bottom
  box = square(st + vec2(0.0, 0.3), vec2(0.6, 0.4));
  color = mix(color, vec3(0), box);
  return color;
}

vec3 drawLetterU (vec2 st) {
  vec3 color = vec3(0.0);
 

  // main base
  float box = roundBox(st - vec2(0.5, 0.75), vec2(0.125, 0.2), 0.15);
  color = vec3(box);

  // mask inside
  box = roundBox(st - vec2(0.5, 0.74), vec2(0.05, 0.12), 0.05);
  color = mix(color, vec3(0), box);
  
  // mask the bottom
  box = square(st + vec2(0.0, -0.55), vec2(0.6, 0.4));
  color = mix(color, vec3(0), box);
  return color;
}

vec3 drawLetterL (vec2 st) {
  vec3 color = vec3(0.0);

  // main base
  float box = square(st + vec2(0.0, -0.27), vec2(0.16, 0.75));
  color = vec3(box);

  return color;
}

vec3 drawFrame (vec2 st, vec2 scale, float width) {
  vec3 color = vec3(0.0);
  st -= vec2(0.5);
  st *= 1.0 / scale;
  st += vec2(0.5);

  // main base
  float box = square(st + vec2(0.0, 0.0), vec2(1.0, 1.0));
  color = vec3(box);


  // mask inside
  box = square(st + vec2(0.0, 0.0), vec2(1.0 - width));
  color = mix(color, vec3(0), box);
  

  return color;
}

float mapTime (float from, float to, float time) {
  return clamp((time - from) / (to - from), 0.0, 1.0);
}

void main() {

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
  
    vec3 green = vec3(0.4, 0.98, 0.57);
    vec3 color = vec3(0.0);

    // draw the frame around
    color = max(color, 
      drawFrame(
        st,
        vec2(0.9, 0.65) * 0.8 + 0.2 * mapTime(4.0, 10.0, u_time),
        0.03
    ));
    // fade in/out
    color = mix(vec3(0), color, mapTime(4.0, 5.0, u_time));
    color = mix(color, vec3(0), mapTime(9.0, 10.0, u_time));
   

    // scale down all the letter at once
    float downScale = 10.0 - mapTime(5.0, 5.25, u_time) * 2.0;
    st -= vec2(0.5);
    st = scale2D(vec2(downScale)) * st;
    st += vec2(0.5);
    
    vec2 animationOffset = vec2(0);
    float animationOpacity = 0.0;
    
    // H
    animationOffset = vec2(
      1.5 * (1.0 - mapTime(4.0, 5.0, u_time)), 
      -sin(mapTime(0.2, 4.0, u_time) * PI) * 2.0);
    animationOpacity = mapTime(0.2, 1.0, u_time);
    color = max(color, drawLetterH(st + vec2(0.85, 0.2) + animationOffset) * animationOpacity);
    
    // U
    animationOffset = vec2(
      0.6 * (1.0 - mapTime(4.0, 5.0, u_time)), 
      -sin(mapTime(2.0, 4.0, u_time) * PI) * 2.0);
    animationOpacity = mapTime(2.0, 4.0, u_time);
    color = max(color, drawLetterU(st + vec2(0.15, 0.2) + animationOffset) * animationOpacity);
    
    // L
    animationOffset = vec2(
      -0.5 * (1.0 - mapTime(4.0, 5.0, u_time)), 
      -sin(mapTime(2.7, 4.0, u_time) * PI) * 2.0);
    animationOpacity = mapTime(2.7, 4.8, u_time);
    color = max(color, drawLetterL(st + vec2(-0.35, 0.2) + animationOffset) * animationOpacity);
    
    // U
    animationOffset = vec2(
      -1.5 * (1.0 - mapTime(4.0, 5.0, u_time)), 
      -sin(mapTime(1.0, 4.0, u_time) * PI) * 2.0);
    animationOpacity = mapTime(1.0, 2.4, u_time);
    color = max(color, drawLetterU(st + vec2(-0.85, 0.2) + animationOffset) * animationOpacity);
  
   
    color *= green;

    // add band top and bottom (not a nutflex thing but i thought it looked cool)
    st = gl_FragCoord.xy / u_resolution.xy;
    if (st.y < 0.1 || st.y > 0.9) {
      color = green;
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

    document.body.classList.add('preroll-hulu')
    
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
