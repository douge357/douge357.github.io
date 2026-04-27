(() => {
  const canvas = document.querySelector("[data-ripple-light]");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false
  });

  if (!gl) {
    canvas.remove();
    return;
  }

  const vertexShaderSource = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

  const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;

vec4 permute(vec4 value) {
  return value * (value * 34.0 + 133.0);
}

vec3 grad(float hash) {
  vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
  vec3 cuboct = cube;
  float index0 = step(0.0, 1.0 - floor(hash / 16.0));
  float index1 = step(0.0, floor(hash / 16.0) - 1.0);
  cuboct.x *= 1.0 - index0;
  cuboct.y *= 1.0 - index1;
  cuboct.z *= 1.0 - (1.0 - index0 - index1);
  float type = mod(floor(hash / 8.0), 2.0);
  vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
  vec3 result = cuboct * 1.22474487139 + rhomb;
  result *= (1.0 - 0.04294243672 * type) * 3.59463176861;
  return result;
}

vec4 bccNoisePart(vec3 point) {
  vec3 base = floor(point);
  vec4 point4 = vec4(point - base, 2.5);
  vec3 v1 = base + floor(dot(point4, vec4(0.25)));
  vec3 v2 = base + vec3(1.0, 0.0, 0.0) + vec3(-1.0, 1.0, 1.0) * floor(dot(point4, vec4(-0.25, 0.25, 0.25, 0.35)));
  vec3 v3 = base + vec3(0.0, 1.0, 0.0) + vec3(1.0, -1.0, 1.0) * floor(dot(point4, vec4(0.25, -0.25, 0.25, 0.35)));
  vec3 v4 = base + vec3(0.0, 0.0, 1.0) + vec3(1.0, 1.0, -1.0) * floor(dot(point4, vec4(0.25, 0.25, -0.25, 0.35)));
  vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
  hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
  hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
  vec3 d1 = point - v1;
  vec3 d2 = point - v2;
  vec3 d3 = point - v3;
  vec3 d4 = point - v4;
  vec4 attenuation = max(0.75 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
  vec4 attenuation2 = attenuation * attenuation;
  vec4 attenuation4 = attenuation2 * attenuation2;
  vec3 g1 = grad(hashes.x);
  vec3 g2 = grad(hashes.y);
  vec3 g3 = grad(hashes.z);
  vec3 g4 = grad(hashes.w);
  vec4 extrapolation = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
  vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (attenuation2 * attenuation * extrapolation)
    + mat4x3(g1, g2, g3, g4) * attenuation4;
  return vec4(derivative, dot(attenuation4, extrapolation));
}

vec4 bccNoise(vec3 point) {
  mat3 map = mat3(
    0.78867513459, -0.2113248654, -0.57735026919,
    -0.2113248654, 0.78867513459, -0.57735026919,
    0.57735026919, 0.57735026919, 0.57735026919
  );
  point = map * point;
  vec4 result = bccNoisePart(point) + bccNoisePart(point + 144.5);
  return vec4(result.xyz * map, result.w);
}

vec4 getNoise(vec3 point) {
  vec4 noise = bccNoise(point);
  return (noise + 0.5) * 0.5;
}

vec3 causticColor(vec3 point, vec4 noise) {
  float refraction = 1.3;
  vec4 balanceNoise = getNoise(point - vec3(noise.xyz / 32.0) * refraction);
  noise = getNoise(point - vec3(balanceNoise.xyz / 16.0) * refraction);
  float balancer = 0.5 + 0.5 * balanceNoise.w;
  float normalized = pow(0.5 + 0.5 * noise.w, 2.0);
  return vec3(0.2745) * mix(0.0, normalized + 0.2 * (1.0 - normalized), balancer);
}

float causticLine(vec2 uv, float time, float scale, float speed, float offset) {
  vec3 point = vec3(uv * scale, time * speed + offset);
  vec4 primary = getNoise(point);
  vec4 warped = getNoise(point + vec3(primary.xy * 0.72, primary.w * 0.35));
  float ridge = abs(primary.w - warped.w);
  float filament = 1.0 - smoothstep(0.018, 0.105, ridge);
  filament *= smoothstep(0.08, 0.42, max(primary.w, warped.w));
  filament *= 1.0 - smoothstep(0.82, 1.0, max(primary.w, warped.w));
  return filament;
}

float microRipples(vec2 uv, float time) {
  float waveA = sin((uv.x * 12.0 + uv.y * 5.0) + time * 0.7);
  float waveB = sin((uv.x * -7.0 + uv.y * 15.0) - time * 0.52);
  float waveC = sin((uv.x * 19.0 - uv.y * 9.0) + time * 0.34);
  return (waveA + waveB + waveC) * 0.5 + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 centered = (uv - 0.5) * aspect;
  vec2 mouse = mix(vec2(0.5), uMouse, 0.65);
  float mouseDist = distance(uv * aspect, mouse * aspect);
  float mouseField = smoothstep(0.48, 0.0, mouseDist);
  float vignette = smoothstep(1.24, 0.22, length(centered));
  float fadeTop = smoothstep(-0.72, -0.08, centered.y);
  float fadeBottom = 1.0 - smoothstep(0.52, 0.92, centered.y);

  vec2 mousePull = (mouse - 0.5) * aspect * mouseField * 0.09;
  vec2 flow = centered + mousePull;
  flow.x += sin(flow.y * 3.0 + uTime * 0.16) * 0.035;
  flow.y += sin(flow.x * 2.2 - uTime * 0.12) * 0.025;

  float fine = causticLine(flow, uTime, 6.3, 0.18, 0.0);
  float broad = causticLine(flow + vec2(0.19, -0.08), uTime, 3.8, -0.11, 5.7);
  float thread = causticLine(flow * mat2(0.86, -0.5, 0.5, 0.86), uTime, 9.2, 0.13, 11.4);
  float ripples = microRipples(flow, uTime);

  float shimmer = fine * 0.62 + broad * 0.28 + thread * 0.2;
  shimmer *= mix(0.72, 1.08, ripples);
  shimmer = smoothstep(0.24, 0.88, shimmer);
  shimmer *= vignette * fadeTop * fadeBottom * (0.82 + mouseField * 0.3);

  vec4 shadowNoise = getNoise(vec3((flow + vec2(-0.08, 0.06)) * 3.15, uTime * -0.095 + 8.4));
  float shadow = smoothstep(0.38, 0.82, shadowNoise.w);
  shadow *= 1.0 - smoothstep(0.18, 0.72, shimmer);
  shadow *= vignette * fadeTop * fadeBottom * mix(0.72, 1.08, 1.0 - ripples);

  vec3 lightColor = mix(vec3(0.5, 0.54, 0.56), vec3(0.88, 0.93, 0.94), shimmer) * shimmer;
  vec3 shadowColor = vec3(0.16, 0.17, 0.18) * shadow;
  float lightAlpha = clamp(shimmer * 0.46, 0.0, 0.22);
  float shadowAlpha = clamp(shadow * 0.16, 0.0, 0.12);
  vec3 color = mix(shadowColor, lightColor, smoothstep(0.04, 0.28, shimmer));
  float alpha = max(lightAlpha, shadowAlpha);
  fragColor = vec4(color, alpha);
}`;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || "Shader compile failed");
    }

    return shader;
  };

  const createProgram = () => {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(message || "Program link failed");
    }

    return program;
  };

  let program;

  try {
    program = createProgram();
  } catch (error) {
    console.warn("[ripple-light-background]", error);
    canvas.remove();
    return;
  }

  const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ]);
  const buffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const mouseLocation = gl.getUniformLocation(program, "uMouse");
  const timeLocation = gl.getUniformLocation(program, "uTime");
  const pointer = {
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5
  };
  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    raf: 0,
    startedAt: performance.now()
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resize = () => {
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    state.width = Math.max(window.innerWidth, 1);
    state.height = Math.max(window.innerHeight, 1);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const render = (now) => {
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;

    gl.useProgram(program);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(mouseLocation, pointer.x, 1 - pointer.y);
    gl.uniform1f(timeLocation, (now - state.startedAt) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (!reduceMotion.matches) {
      state.raf = requestAnimationFrame(render);
    }
  };

  const start = () => {
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(render);
  };

  const handlePointerMove = (event) => {
    pointer.targetX = event.clientX / Math.max(state.width, 1);
    pointer.targetY = event.clientY / Math.max(state.height, 1);
  };

  resize();
  start();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  reduceMotion.addEventListener("change", start);
})();
