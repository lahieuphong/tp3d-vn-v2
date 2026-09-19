import type { World } from '@/data/types';

export function WorldCredits({ worlds }: { worlds: World[] }) {
  if (!worlds.length) return null;
  return (
    <div className="container worlds-notes">
      <p>Each available world opens on Sketchfab in a new tab.</p>
      <details className="worlds-credits">
        <summary>
          Scene & preview credits <span aria-hidden="true">+</span>
        </summary>
        <p>Previews are cropped and resized from the original scene renders.</p>
        <ul>
          {worlds.map((world) => (
            <li key={world.id}>
              <a
                href={world.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {world.title}
                <span className="sr-only"> (opens in a new tab)</span> ↗
              </a>
              <span>
                Scene by{' '}
                <a
                  href={world.credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {world.credit.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{' '}
                ·{' '}
                <a
                  href={world.credit.license.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {world.credit.license.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
