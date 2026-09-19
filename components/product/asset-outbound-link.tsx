'use client';

import type { ReactNode } from 'react';
import {
  trackAssetOutboundClick,
  type AssetOutboundClick,
} from '@/lib/asset-analytics';
import { assetExternalUrl } from '@/lib/product-assets';

export function AssetOutboundLink({
  href,
  event,
  children,
}: {
  href: string;
  event: AssetOutboundClick;
  children: ReactNode;
}) {
  const url = assetExternalUrl(event.provider, href);
  if (!url) return null;
  return (
    <a
      className="text-link asset-outbound-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAssetOutboundClick(event)}
      onAuxClick={(e) => {
        if (e.button === 1) trackAssetOutboundClick(event);
      }}
    >
      <span>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
