/** The oculus's sky: one full-box shader, no texture, no lighting pass.
 *
 * The box is looked through as the opening is: its lower edge is the sky
 * low over the drum's far wall, its upper edge the sky nearly overhead. A
 * place in the box is a direction, and the clouds lie on two level sheets
 * above it, so they are small and slow low in the opening and large and
 * quick high in it: that is the depth. Each sheet has its own height, wind
 * and scale; the higher one is thin and slow, and the cumulus passes under
 * it.
 *
 * `uTime` is integrated sky time (oculus-sky.ts). Value noise is aperiodic,
 * so nothing loops or resets. */
export const oculusSkyVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const oculusSkyFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDetail;
  uniform float uAspect;
  uniform float uSpan;
  uniform float uPitch;
  uniform float uCover;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uLight;
  uniform vec3 uShade;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x), u.y);
  }
  float fbm(vec2 p, float octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float total = 0.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) >= octaves) break;
      value += amplitude * noise21(p);
      total += amplitude;
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 17.3;
      amplitude *= 0.5;
    }
    return value / total;
  }

  // How much cloud stands at a place on a sheet (a cloud is where this
  // passes the sheet's cover). Broad masses decide where clouds are; a
  // billowed field heaps them into rounded tops; a finer one frays their
  // edges. Each part drifts and changes at its own slow rate, so a cloud
  // keeps re-forming as it passes.
  float heap(vec2 p, float time) {
    vec2 warp = vec2(noise21(p * 0.9 + vec2(1.3, time * 0.021)),
                     noise21(p * 0.9 + vec2(7.9, -time * 0.018))) - 0.5;
    vec2 q = p + warp * 0.55;
    float mass = fbm(q * 0.7 + vec2(0.0, time * 0.007), 3.0);
    float billow = abs(2.0 * fbm(q * 2.3 + vec2(time * 0.015, 4.1), uDetail - 2.0) - 1.0);
    float fray = fbm(q * 6.1 + vec2(-time * 0.035, 9.7), uDetail - 2.0);
    return mass + (billow - 0.22) * 0.3 + (fray - 0.5) * 0.15;
  }

  void main() {
    // The look through this place of the box: a camera pitched up at the
    // opening, the box's height a few degrees of sky. Where that look meets
    // a level sheet one unit up is the place on the sheet.
    vec2 view = (vUv - 0.5) * vec2(uAspect, 1.0) * uSpan;
    vec3 ray = normalize(vec3(view.x, sin(uPitch) + view.y * cos(uPitch),
                              cos(uPitch) - view.y * sin(uPitch)));
    vec2 ground = ray.xz / ray.y;

    // Clear sky: deeper overhead, paler low down.
    float height = smoothstep(0.0, 1.0, vUv.y);
    vec3 colour = mix(uHorizon, uZenith, height);

    // The sun stands to the upper left, as on the plate.
    vec2 sun = normalize(vec2(-0.8, -0.5));

    // High, thin and slow.
    vec2 high = ground * 2.1 + vec2(uTime * 0.016, uTime * 0.006) + 31.0;
    float veil = smoothstep(0.52, 0.8, heap(high, uTime * 0.5));
    colour = mix(colour, mix(uShade, uLight, 0.85), veil * 0.5);

    // The cumulus: lower, larger, quicker.
    vec2 low = ground * 4.2 + vec2(uTime * 0.058, uTime * 0.021);
    float here = heap(low, uTime);
    float toward = heap(low + sun * 0.09, uTime);
    float cloud = smoothstep(uCover - 0.05, uCover + 0.07, here);
    // Lit where less cloud stands toward the sun; a thick cloud's heart and
    // its far side are in its own shade.
    float thick = smoothstep(uCover + 0.06, uCover + 0.34, here);
    float lit = clamp(0.82 + (here - toward) * 3.0 - thick * 0.36, 0.0, 1.0);
    vec3 body = mix(uShade, uLight, lit);
    colour = mix(colour, body, cloud);

    // Haze low in the opening, where the look is long.
    colour = mix(colour, uHorizon, (1.0 - height) * (1.0 - height) * 0.3);
    colour += (hash21(gl_FragCoord.xy) - 0.5) * 0.004;
    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }
`;
