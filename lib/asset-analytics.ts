export type AssetOutboundClick = { product_slug: string } & (
  | { destination: 'viewer'; provider: 'sketchfab' }
  | { destination: 'purchase'; provider: 'fab' }
);

/** Provider-neutral integration point. No cookies, SDK, network request or log. */
export function trackAssetOutboundClick(detail: AssetOutboundClick) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<AssetOutboundClick>('asset_outbound_click', { detail }),
  );
}
