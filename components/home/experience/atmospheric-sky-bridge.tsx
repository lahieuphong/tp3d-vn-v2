/** Decorative, temporary atmosphere. Its renderer is prepared on scroll intent
 * by the existing HomeStory owner; SSR and the first view request no WebGL. */
export function AtmosphericSkyBridge() {
  return (
    <div
      className="atmospheric-sky-bridge"
      data-atmospheric-sky-bridge
      aria-hidden="true"
    />
  );
}
