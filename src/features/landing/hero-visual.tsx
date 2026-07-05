"use client";

import { useEffect, useRef } from "react";

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const WebGLContext = window.WebGLRenderingContext;
    if (!WebGLContext) return undefined;

    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (!(gl instanceof WebGLContext)) return undefined;

    const syncSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.floor(width));
      const nextHeight = Math.max(1, Math.floor(height));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
    };

    const vertexSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec3 teal = vec3(0.0, 0.749, 0.682);
        vec3 cyan = vec3(0.85, 0.95, 1.0);
        vec3 surface = vec3(0.988, 0.973, 0.984);
        float wave = sin(uv.x * 2.0 + u_time * 0.4) * cos(uv.y * 1.5 - u_time * 0.2);
        wave += sin(uv.y * 3.0 + u_time * 0.15) * 0.5;
        float lift = clamp(wave * 0.4 + 0.3, 0.0, 1.0);
        vec3 color = mix(surface, cyan, lift);
        color = mix(color, teal, clamp(uv.x * 0.5 + uv.y * 0.5 - 0.7, 0.0, 1.0) * 0.2);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return undefined;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const timeUniform = gl.getUniformLocation(program, "u_time");
    const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;

    const render = (time: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (timeUniform) gl.uniform1f(timeUniform, time * 0.001);
      if (resolutionUniform) gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reducedMotion) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    render(0);
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="landing-hero-aurora relative h-[500px] w-full overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_28px_90px_rgba(100,246,227,0.18)] lg:h-[600px]">
      <canvas
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        ref={canvasRef}
      />
      <div className="absolute inset-10 rounded-[2rem] border border-white/50 bg-white/20 blur-3xl" />
    </div>
  );
}
