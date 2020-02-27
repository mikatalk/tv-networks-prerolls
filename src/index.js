import './reset.scss'

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

vec3 makeBackground (vec2 st, float modifier) {
  st.x *= 100.0;
  vec2 ipos = floor(st);  // get the integer coords
  st.x += sin(st.x) * sin(25.0 + modifier * 205.0) * 4.0;
  ipos = floor(st);
  if (random(ipos) < 0.2) {
    return vec3(0);
  }
  return vec3(
    0.25 + random(ipos+3.0),
    mod(random(ipos+ 1.0)*5.0, 1.0) * 0.5, 
    0.4 + random(ipos+1.0) * 0.6
  );
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;   
    vec3 color = makeBackground(st, st.y / 10.0 + u_time);
    gl_FragColor = vec4(color, 1.0);
}

`

class App {

  container
  camera
  scene
  renderer
  uniforms
  
  constructor (container) {
    this.container = container
    this.init()
    this.animate()
  }

  init () {

    this.camera = new Camera()
    this.camera.position.z = 1

    this.scene = new Scene()

    const geometry = new PlaneBufferGeometry(2, 2)

    this.uniforms = {
      u_time: { type: 'f', value: 4.72 },
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

    document.body.classList.add('intro')

  }
  
  onMouseMove = event => {
    this.uniforms.u_mouse.value.x = event.pageX
    this.uniforms.u_mouse.value.y = event.pageY
  }

  onWindowResize = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.uniforms.u_resolution.value.x = this.renderer.domElement.width
    this.uniforms.u_resolution.value.y = this.renderer.domElement.height
  }

  animate = elapsedTime => {
    requestAnimationFrame(this.animate)
    this.uniforms.u_time.value = elapsedTime * 0.000001
    this.render()
  }
  
  render() {
    this.renderer.render(this.scene, this.camera)
  }
}

new App(document.getElementById('app'))

const div = document.createElement('div')
div.innerHTML += `
<div class="info">
  <p>
    In this project <a href="https://twitter.com/michael_iriarte" style="padding:0;">I</a> tried replicating network pre-roll 
    animations as a mean to practice and get better at coding fragment shaders.
    <br/>
    <br/>
    <a href="https://mikatalk.github.io/tv-networks-prerolls/netflix.html">netflix</a>
    |
    <a href="https://mikatalk.github.io/tv-networks-prerolls/hulu.html">hulu</a>
    |
    <a href="https://mikatalk.github.io/tv-networks-prerolls/hbo.html">hbo</a>
    <br/>
    <br/>
    Keep in mind these animations are not videos and are generated in real time with WebGL in your GPU.
    <br/>
    <br/>
    <a href="https://tips4devs.com">Stay tuned for a tutorial on tips4Devs.com</a>
    <br/>
    <br/>
    Oh and if you're wondering about the background choice, it was a cute bug so i ended up keeping it.
  </p>
</div>`
document.body.appendChild(div)