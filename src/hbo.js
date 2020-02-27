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
  // side left bar
  float box = square(st + vec2(0.13, 0.0), vec2(0.13, 0.572));
  color = max(color, box);
  // side right bar
  box = square(st + vec2(-0.13, 0.0), vec2(0.13, 0.572));
  color = max(color, box);
  // middle bar
  box = square(st + vec2(0.0, 0.0), vec2(0.25, 0.13));
  color = max(color, box);

  return color;
}

vec3 drawLetterB (vec2 st) {

  // top circle base
  float box = roundBox(st - vec2(0.5, 0.619), vec2(0.01, 0.0), 0.165);
  vec3 color = vec3(box);
  
  // bottom circle base
  box = roundBox(st - vec2(0.5, 0.381), vec2(0.01, 0.0), 0.165);
  color = max(color, box);

  // top circle mask inside
  box = roundBox(st - vec2(0.475, 0.62), vec2(0.03, 0.0), 0.045);
  color = mix(color, vec3(0), box);
  
  // bottom circle mask inside
  box = roundBox(st - vec2(0.475, 0.38), vec2(0.03, 0.0), 0.045);
  color = mix(color, vec3(0), box);
  
 
  
  
  // left edge bar
  box = square(st + vec2(0.12, 0.0), vec2(0.15, 0.5));
  color = max(color, box);
  // color.g = box;
 
  
  // top edge bar
  box = square(st + vec2(0.16, -0.237), vec2(0.35, 0.1));
  color = max(color, box);
  // color.g = box;
 
  
  
  // bottom edge bar
  box = square(st + vec2(0.16, 0.237), vec2(0.35, 0.1));
  color = max(color, box);
  // color.g = box;
 
  
  
  // mask left side
  box = square(st + vec2(0.27, 0.0), vec2(0.2, 0.7));
  color = mix(color, vec3(0), box);
  
 
  return color;
}

vec3 drawLetterO (vec2 st) {
  vec3 color = vec3(0.0);

  // main base
  float box = roundBox(st - vec2(0.25, 0.5), vec2(0.0, 0.0), 0.285);
  color = vec3(box);

  // mask inside
  box = roundBox(st - vec2(0.25, 0.5), vec2(0.0, 0.0), 0.145);
  color = mix(color, vec3(0), box);

  // dot inside
  box = roundBox(st - vec2(0.25, 0.5), vec2(0.0, 0.0), 0.11);
  color = max(color, box);

  return color;
}

float mapTime (float from, float to, float time) {
  return clamp((time - from) / (to - from), 0.0, 1.0);
}


vec3 drawBack (vec2 st, float noise, vec2 scale) {
  vec3 color = vec3(0.0);
  
  st -= vec2(0.5);
  st *= 1.0 / scale;
  st += vec2(0.5);
  // main background light flashes
  vec2 pos = st - vec2(0.5, 0.5);
  float radius = 0.1;
  float box = length(max(abs(pos) - scale, 0.0)) - radius;
  float bg = (1.0 - smoothstep(0.0, 1.0, box)) * 1.0;
  bg *= 1.0 + mapTime(1.0, 1.25, u_time) * 2.0;
  bg *= 1.0 - mapTime(1.5, 2.0, u_time) * 0.5;
  
  // noisy foreground
  float fg = (1.0 - smoothstep(0.0, 0.005, box)) * noise;
  // wait 1.5 second before showing the noise
  fg *= mapTime(1.5, 2.5, u_time);

  color = vec3(mix(bg, fg, fg));

  color *= (1.0 - mapTime(6.0, 8.0, u_time));

  return color;
}

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand(float c){
return rand(vec2(c,1.0));
}

float makeBackWhiteLight (vec2 st) {
  return 1.0 - clamp(distance(vec2(0.4, 0.33) + st / vec2(5.0, 3.0), vec2(0.5)) * 4.0, 0.0, 1.0);
}

void main() {

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
  
    float noise = rand(u_time + st);


    vec3 darkGrey = vec3(0.3, 0.29, 0.3);
    vec3 grey = vec3(0.49, 0.5, 0.58);

    vec3 color = vec3(0.0);

    // draw the frame around
    color = max(color, 
      drawBack(
        st,
        noise,
        vec2(
          mapTime(0.5, 2.0, u_time),
          0.02 + 2.0 * mapTime(1.5, 3.0, u_time)
    )));

    color *= darkGrey;

    
    

    
    
    // scale down all the letter at once
    float downScale = 2.2;// - mapTime(5.0, 5.25, u_time) * 2.0;
    st -= vec2(0.5);
    st = scale2D(vec2(downScale)) * st;
    st += vec2(0.5);

    float light = makeBackWhiteLight(st);
    // color = mix(color, vec3(light), light);
    
    float animationOpacity = mapTime(1.5, 4.5, u_time);

    // H
    color = max(color, drawLetterH(st + vec2(0.4, 0.0)) * animationOpacity);
    
    // B
    color = max(color, drawLetterB(st + vec2(0.0, 0.0)) * animationOpacity);
    
    // 0
    color = max(color, drawLetterO(st + vec2(-0.69, 0.0)) * animationOpacity);

    // make grey less noisy as time goes
    grey = mix(vec3(noise), grey, mapTime(3.5, 7.5, u_time));
    
    color *= mix(vec3(1.0), grey, animationOpacity);

    // final fade away
    color = mix(color, vec3(0.0),  mapTime(9.0, 10.0, u_time));

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
    this.playing = true
    this.slider.value = 0
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

    document.body.classList.add('preroll-hbo')
    
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
