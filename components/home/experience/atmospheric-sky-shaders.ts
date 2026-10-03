/** No textures, lighting passes or raymarching. Two/three noise octaves and
 * broad asymmetric banks provide quiet cloud silhouettes on real Z planes.
 * Scroll uniforms carry the narrative; uFlow/uTime are integrated ambient
 * values that only let the air live. Value noise is aperiodic here, so no
 * evolution path loops or resets. */
export const skyVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const noise = /* glsl */ `
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
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.57;
    for (int i = 0; i < 3; i++) {
      if (float(i) >= uOctaves) break;
      value += amplitude * noise21(p);
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.08 + 11.7;
      amplitude *= 0.46;
    }
    return value;
  }
  float bank(vec2 p, vec2 centre, vec2 radius) {
    vec2 d = (p - centre) / radius;
    return exp(-dot(d, d) * 1.4);
  }
  // Soft windows of sky inside the atmosphere. Every layer evaluates the same
  // screen-space field, so a window is a real gap through all the cloud.
  float skyWindowField(vec2 w) {
    return noise21(w * 1.6 + vec2(5.1, 2.3)) * 0.62
         + noise21(w * 3.3 + vec2(1.7, 9.4)) * 0.38;
  }
  float skyWindow(vec2 screen, vec2 flow, float amount) {
    return smoothstep(0.56, 0.74, skyWindowField(screen - flow)) * amount;
  }
  // A bounded, non-repeating wander for large masses: smooth value noise of
  // integrated time, so banks reform and separate without leaving the frame.
  vec2 wander(float time, float seed) {
    return vec2(noise21(vec2(time * 0.043, seed * 5.3)),
                noise21(vec2(seed * 3.7 + 11.0, time * 0.037))) - 0.5;
  }
`;

export const cloudFragmentShader = /* glsl */ `
  uniform float uDensity;
  uniform float uInside;
  uniform float uSkyMix;
  uniform float uOpening;
  uniform float uDrift;
  uniform float uOctaves;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uNear;
  uniform float uTime;
  uniform float uMorph;
  uniform float uBreath;
  uniform float uPatches;
  uniform vec2 uFlow;
  uniform vec2 uSkyFlow;
  uniform vec2 uPlaneSize;
  uniform vec2 uResolution;
  uniform vec3 uIvory;
  uniform vec3 uDaylight;
  uniform vec3 uShadow;
  varying vec2 vUv;
  ${noise}
  void main() {
    vec2 p = (vUv - 0.5) * uPlaneSize * 0.22;
    vec2 screen = (gl_FragCoord.xy / uResolution - 0.5)
                  * vec2(uResolution.x / uResolution.y, 1.0);
    // Breakup flows with the shared air current; scroll drift is unchanged.
    vec2 q = p + vec2(uSeed * 2.31, uSeed * 1.27 + uDrift) - uFlow;
    if (uMorph > 0.0) {
      // Slow domain warp: edges and internal forms re-form continuously.
      q += (vec2(noise21(q * 0.55 + vec2(uTime * 0.031, 1.7)),
                 noise21(q * 0.55 + vec2(4.3, -uTime * 0.027))) - 0.5)
           * 0.22 * uMorph;
    }
    float massNoise = noise21(q * 1.15);
    float edgeNoise = noise21(q * 3.7 + 8.9);
    vec2 bend = vec2(massNoise - 0.4, edgeNoise - 0.5) * 0.36;
    vec2 shaped = p + bend - wander(uTime, uSeed) * 0.36;
    // Distinct large banks, not uniform full-screen fog. Their projected size
    // grows as the camera approaches each spatially separated plane.
    float left = bank(shaped, vec2(-1.36 + uSeed * 0.15, 0.18), vec2(1.2, 0.85));
    float right = bank(shaped, vec2(1.25, -0.28 + uSeed * 0.1), vec2(1.15, 0.94));
    float top = bank(shaped, vec2(-0.12, 1.22), vec2(1.4, 0.68));
    float lower = bank(shaped, vec2(0.36, -1.42), vec2(1.65, 0.64));
    float banks = max(max(left, right), max(top * 0.9, lower * 0.76));
    float field = banks * 0.61 + massNoise * 0.32 + edgeNoise * 0.16;
    // Breathing: a narrow, aperiodic density drift. Never a visible pulse.
    float breath = (noise21(vec2(uTime * 0.071, uSeed * 9.1)) - 0.5) * 0.04 * uBreath;
    float threshold = mix(0.72, 0.33, uDensity) - uInside * 0.06 + breath;
    // Close to the lens a bank keeps readable edges instead of a uniform veil.
    float soft = mix(1.0, 0.6, uNear);
    float cloud = smoothstep(threshold - 0.075 * soft, threshold + 0.095 * soft,
                             field);
    // The central opening widens through irregular edges, revealing the real
    // DOM sky. There is never a whole-canvas opacity crossfade.
    float openingField = 0.29 + banks * 0.48 + massNoise * 0.35;
    float aperture = 1.0 - smoothstep(openingField - 0.13, openingField + 0.13,
                                     uOpening * 1.5);
    float alpha = cloud * uOpacity * aperture
                  * (1.0 - skyWindow(screen, uSkyFlow, uPatches));
    // Once a bank fills the lens, retain broad internal lighting variation.
    // Near-field shading opens its sample domain before projection crops it
    // to a uniform centre; its light drifts slightly faster than the mass.
    vec2 lightDomain = mix(q * 1.15 - uFlow * 0.6,
      screen * 4.0 + vec2(uSeed * 1.3, 4.9) - uFlow * 1.8, uNear * 0.92);
    float lensNoise = fbm(lightDomain);
    float structure = mix(smoothstep(0.26, 0.66, lensNoise),
                          smoothstep(0.4, 0.58, lensNoise), uNear * 0.6);
    float lobe = bank(screen, vec2(0.38, 0.38), vec2(0.82, 0.55));
    vec2 slope = vec2(dFdx(field), dFdy(field)) * uResolution.y;
    float relief = clamp(dot(slope, vec2(0.6, 0.8)) * 0.065, -0.075, 0.075);
    // Inside a bank: broad volume (softly shaded cores, luminous rims) so the
    // lens never reads as a flat sheet.
    float volume = mix(1.0, 0.74 + 0.4 * smoothstep(0.22, 0.78, massNoise), uNear);
    float light = clamp((0.16 + structure * 0.76 + lobe * 0.14 + relief) * volume,
                        0.0, 1.0);
    vec3 base = mix(uIvory, uDaylight, uSkyMix);
    vec3 cloudShadow = mix(uShadow, uIvory * 0.74, (1.0 - uSkyMix) * 0.62);
    vec3 colour = mix(cloudShadow, base, light);
    colour += (edgeNoise - 0.5) * 0.008;
    gl_FragColor = vec4(colour, alpha);
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

export const skyFragmentShader = /* glsl */ `
  uniform float uSkyMix;
  uniform float uSkyCover;
  uniform float uOpening;
  uniform float uDrift;
  uniform float uOctaves;
  uniform float uAspect;
  uniform float uInside;
  uniform float uPatches;
  uniform float uTime;
  uniform vec2 uFlow;
  uniform vec2 uSkyFlow;
  uniform vec2 uResolution;
  uniform vec3 uSkyUpper;
  uniform vec3 uSkyLower;
  uniform vec3 uIvory;
  uniform vec3 uDaylight;
  uniform vec3 uShadow;
  varying vec2 vUv;
  ${noise}
  void main() {
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    vec2 p = (screenUv - 0.5) * vec2(uAspect, 1.0);
    // The far field drifts slowest, in screen units along the same current.
    vec2 a = p - uFlow;
    float structure = fbm(a * 2.8 + vec2(3.4, 8.3 + uDrift * 0.15));
    float detail = noise21(a * 7.0 + 7.3);
    float fine = noise21(a * 13.0 + vec2(3.7, 1.9));
    vec2 shaped = p + vec2(structure - 0.4, detail - 0.5) * 0.22
                  - wander(uTime, 0.37) * 0.12;
    float left = bank(shaped, vec2(-0.78, -0.13), vec2(0.8, 0.52));
    float right = bank(shaped, vec2(0.87, 0.26), vec2(0.73, 0.57));
    float top = bank(shaped, vec2(0.01, 0.65), vec2(0.91, 0.42));
    float lower = bank(shaped, vec2(0.38, -0.68), vec2(0.93, 0.44));
    float banks = max(max(left, right), max(top, lower * 0.92));
    float field = banks * 0.70 + structure * 0.27 + detail * 0.17;
    float coverThreshold = (1.0 - uSkyCover) * 1.8 - 0.65;
    float cover = smoothstep(coverThreshold, coverThreshold + 0.24, structure);
    // Stable sky sits far behind the moving cloud field; its gradient follows
    // the real oculus sky (deeper overhead, paler toward the rim).
    vec3 sky = mix(uSkyLower, uSkyUpper, smoothstep(0.06, 0.95, screenUv.y));
    vec2 slope = vec2(dFdx(field), dFdy(field)) * uResolution.y;
    // Open-sky banks take the plate's light: brighter tops, shaded bases.
    float relief = clamp(dot(slope, vec2(0.6, 0.8)) * mix(0.065, 0.11, uSkyMix),
                         -0.12, 0.12);
    float tonalStructure = smoothstep(0.19, 0.64, structure);
    // Inside the atmosphere the far field becomes luminous haze behind the
    // shaded banks: light through cloud rather than a flat sheet.
    float upperLight = clamp(0.14 + tonalStructure * 0.7 + banks * 0.2
                             + screenUv.y * 0.06 + relief + uInside * 0.18,
                             0.0, 1.0);
    vec3 cloudShadow = mix(uShadow, uIvory * 0.74, (1.0 - uSkyMix) * 0.62);
    vec3 atmosphere = mix(cloudShadow, mix(uIvory, uDaylight, uSkyMix), upperLight);
    // Fine breakup and crisper edges keep open-sky banks from reading as soft
    // blobs beside the photograph's cumulus. The finest term is desktop-only.
    float breakup = (fine - 0.5) * mix(0.12, 0.2, uSkyMix);
    if (uOctaves > 2.5) breakup += (noise21(a * 29.0 + vec2(4.4, 0.6)) - 0.5) * 0.08 * uSkyMix;
    float edge = mix(0.17, 0.09, uSkyMix);
    float cloudMass = smoothstep(0.30, 0.30 + edge, field - uSkyMix * 0.3
                                 + uInside * 0.1 + breakup);
    float cloudAmount = mix(1.0, cloudMass, smoothstep(0.12, 0.7, uSkyMix));
    // Inside the atmosphere a few soft windows of sky drift past. They change
    // colour only; coverage of both DOM worlds is untouched.
    cloudAmount = min(cloudAmount, 1.0 - skyWindow(p, uSkyFlow, uPatches));
    vec3 colour = mix(sky, atmosphere, cloudAmount);
    colour += (detail - 0.5) * mix(0.019, 0.002, uSkyMix);
    // Match-cut follows the asymmetric banks. No circular wipe or fading
    // rectangle: the blue gaps clear first and their soft cloud edges follow.
    float openingField = 0.25 + cloudMass * 0.48 + structure * 0.27;
    float opening = 1.0 - smoothstep(openingField - 0.12, openingField + 0.12,
                                    uOpening * 1.5);
    // Sub-LSB fixed dither prevents a static blue gradient from banding.
    colour += (hash21(gl_FragCoord.xy) - 0.5) * 0.0012;
    gl_FragColor = vec4(colour, cover * opening);
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;
