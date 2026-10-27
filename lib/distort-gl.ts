/**
 * Minimal WebGL layer for the hero wordmark: shows a 2D canvas as a texture and
 * melts it around the pointer (streaky horizontal smear + stippled edge dissolve).
 * Colour comes from the texture, so the caller decides it (from a design token).
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uPower;
uniform float uRadius;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 px = vUv * uSize;
  float m = smoothstep(uRadius, 0.0, distance(px, uPointer)) * uPower;

  // Rows slide sideways by different amounts (the "melt"), with a little wobble.
  float streak = noise(vec2(px.y * 0.06, uTime * 0.9)) - 0.5;
  float wobble = noise(px * 0.025 + uTime * 0.4) - 0.5;
  vec2 shift = vec2(streak * 2.0, wobble * 0.6) * m * uRadius * 0.45;
  float spread = m * uRadius * 0.05;

  vec4 c = vec4(0.0);
  for (int i = -2; i <= 2; i++) {
    c += texture2D(uTex, vUv + (shift + vec2(float(i) * spread * 0.5, 0.0)) / uSize);
  }
  c /= 5.0;

  // Dither the soft edge into spray; solid interiors stay solid.
  float grain = hash(floor(px * 0.5) + floor(uTime * 14.0));
  float dither = smoothstep(0.05, 0.6, m);
  float a = mix(c.a, step(grain, c.a), dither);
  vec3 rgb = c.rgb / max(c.a, 0.001);
  gl_FragColor = vec4(rgb * a, a);
}`;

export interface DistortState {
  /** Pointer position in CSS px from the canvas's top-left. */
  pointer: readonly [number, number];
  /** 0 = untouched text, 1 = full effect. */
  power: number;
  /** Seconds, drives the noise. */
  time: number;
  /** Effect radius in CSS px. */
  radius: number;
}

export interface DistortRenderer {
  resize: (cssWidth: number, cssHeight: number, dpr: number) => void;
  setTexture: (source: TexImageSource) => void;
  render: (state: DistortState) => void;
  onContextLost: (handler: () => void) => void;
  destroy: () => void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader error");
  return shader;
}

/** Returns `null` when WebGL is unavailable so callers can keep the plain text. */
export function createDistortRenderer(canvas: HTMLCanvasElement): DistortRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    const created = gl.createProgram();
    if (!created) return null;
    gl.attachShader(created, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(created, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(created);
    if (!gl.getProgramParameter(created, gl.LINK_STATUS)) return null;
    program = created;
  } catch {
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uSize = uniform("uSize");
  const uPointer = uniform("uPointer");
  const uPower = uniform("uPower");
  const uRadius = uniform("uRadius");
  const uTime = uniform("uTime");

  let cssWidth = 0;
  let cssHeight = 0;
  let lostHandler: (() => void) | null = null;

  const handleLost = (event: Event) => {
    event.preventDefault();
    lostHandler?.();
  };
  canvas.addEventListener("webglcontextlost", handleLost);

  return {
    resize(width, height, dpr) {
      cssWidth = width;
      cssHeight = height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    setTexture(source) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    },
    render({ pointer, power, time, radius }) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uSize, cssWidth, cssHeight);
      // The shader's y axis points up; pointer coordinates point down.
      gl.uniform2f(uPointer, pointer[0], cssHeight - pointer[1]);
      gl.uniform1f(uPower, power);
      gl.uniform1f(uRadius, radius);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    onContextLost(handler) {
      lostHandler = handler;
    },
    destroy() {
      canvas.removeEventListener("webglcontextlost", handleLost);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
