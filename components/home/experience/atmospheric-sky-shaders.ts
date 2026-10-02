/** No textures, lighting passes or raymarching. Two/three noise octaves and
 * broad asymmetric banks provide quiet cloud silhouettes on real Z planes. */
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
`;

export const cloudFragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform float uDensity;
  uniform float uInside;
  uniform float uSkyMix;
  uniform float uOpening;
  uniform float uDrift;
  uniform float uOctaves;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uNear;
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
    // A tiny deterministic displacement preserves exact reverse sampling.
    vec2 q = p + vec2(uSeed * 2.31, uSeed * 1.27 + uDrift);
    float massNoise = noise21(q * 1.15);
    float edgeNoise = noise21(q * 3.7 + 8.9);
    vec2 bend = vec2(massNoise - 0.4, edgeNoise - 0.5) * 0.36;
    vec2 shaped = p + bend;
    // Distinct large banks, not uniform full-screen fog. Their projected size
    // grows as the camera approaches each spatially separated plane.
    float left = bank(shaped, vec2(-1.36 + uSeed * 0.15, 0.18), vec2(1.2, 0.85));
    float right = bank(shaped, vec2(1.25, -0.28 + uSeed * 0.1), vec2(1.15, 0.94));
    float top = bank(shaped, vec2(-0.12, 1.22), vec2(1.4, 0.68));
    float lower = bank(shaped, vec2(0.36, -1.42), vec2(1.65, 0.64));
    float banks = max(max(left, right), max(top * 0.9, lower * 0.76));
    // Medium breakup bends the bank contour into broad billows. Reuse the
    // existing noise samples rather than adding octaves or fine surface grain.
    float field = banks * 0.61 + massNoise * 0.32 + edgeNoise * 0.16;
    float threshold = mix(0.72, 0.33, uDensity) - uInside * 0.13;
    float cloud = smoothstep(threshold - 0.075, threshold + 0.095, field);
    // The central opening widens through irregular edges, revealing the real
    // DOM sky. There is never a whole-canvas opacity crossfade.
    float openingField = 0.29 + banks * 0.48 + massNoise * 0.35;
    float aperture = 1.0 - smoothstep(openingField - 0.13, openingField + 0.13,
                                     uOpening * 1.5);
    float alpha = cloud * uOpacity * aperture;
    // Once a bank fills the lens, retain broad internal lighting variation.
    // The world-space silhouette still projects through actual camera Z;
    // this low-frequency near-field term prevents a uniform cropped centre.
    // Spend the existing FBM budget on the light field inside the cloud.
    // The macro silhouette still uses world coordinates; near-field shading
    // opens its sample domain before projection crops it to a uniform centre.
    vec2 lightDomain = mix(q * 1.15,
      screen * 4.0 + vec2(uSeed * 1.3, 4.9), uNear * 0.92);
    float lensNoise = fbm(lightDomain);
    float structure = smoothstep(0.19, 0.64, lensNoise);
    float lobe = bank(screen, vec2(0.38, 0.38), vec2(0.82, 0.55));
    vec2 slope = vec2(dFdx(field), dFdy(field)) * uResolution.y;
    float relief = clamp(dot(slope, vec2(0.6, 0.8)) * 0.065, -0.075, 0.075);
    float light = clamp(0.17 + structure * 0.73 + lobe * 0.13 + relief, 0.0, 1.0);
    vec3 base = mix(uIvory, uDaylight, uSkyMix);
    vec3 cloudShadow = mix(uShadow, uIvory * 0.69, (1.0 - uSkyMix) * 0.68);
    vec3 colour = mix(cloudShadow, base, light);
    colour += (edgeNoise - 0.5) * 0.008;
    gl_FragColor = vec4(colour, alpha);
    #include <colorspace_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

export const skyFragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform float uDensity;
  uniform float uSkyMix;
  uniform float uSkyCover;
  uniform float uOpening;
  uniform float uDrift;
  uniform float uOctaves;
  uniform float uAspect;
  uniform float uInside;
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
    float structure = fbm(p * 2.8 + vec2(3.4, 8.3 + uDrift * 0.15));
    float detail = noise21(p * 7.0 + 7.3);
    vec2 shaped = p + vec2(structure - 0.4, detail - 0.5) * 0.22;
    float left = bank(shaped, vec2(-0.78, -0.13), vec2(0.8, 0.52));
    float right = bank(shaped, vec2(0.87, 0.26), vec2(0.73, 0.57));
    float top = bank(shaped, vec2(0.01, 0.65), vec2(0.91, 0.42));
    float lower = bank(shaped, vec2(0.38, -0.68), vec2(0.93, 0.44));
    float banks = max(max(left, right), max(top, lower * 0.92));
    float field = banks * 0.70 + structure * 0.27 + detail * 0.17;
    float coverThreshold = (1.0 - uSkyCover) * 1.8 - 0.65;
    float cover = smoothstep(coverThreshold, coverThreshold + 0.24, structure);
    // Stable sky sits far behind the moving cloud field. Subtle structure
    // remains even in the highest-confidence occlusion window.
    vec3 sky = mix(uSkyLower, uSkyUpper, smoothstep(0.06, 0.95, screenUv.y));
    vec2 slope = vec2(dFdx(field), dFdy(field)) * uResolution.y;
    float relief = clamp(dot(slope, vec2(0.6, 0.8)) * 0.065, -0.085, 0.085);
    float tonalStructure = smoothstep(0.19, 0.64, structure);
    float upperLight = clamp(0.17 + tonalStructure * 0.65 + banks * 0.2
                             + screenUv.y * 0.06 + relief, 0.0, 1.0);
    vec3 cloudShadow = mix(uShadow, uIvory * 0.69, (1.0 - uSkyMix) * 0.68);
    vec3 atmosphere = mix(cloudShadow, mix(uIvory, uDaylight, uSkyMix), upperLight);
    float cloudMass = smoothstep(0.30, 0.47, field - uSkyMix * 0.3 + uInside * 0.1);
    float cloudAmount = mix(1.0, cloudMass, smoothstep(0.12, 0.7, uSkyMix));
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
