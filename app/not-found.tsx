import { TextLink } from '@/components/shared/text-link';
export default function NotFound() {
  return (
    <main id="main" className="container not-found">
      <p className="eyebrow">404 / A DIFFERENT DIRECTION</p>
      <h1>
        This space
        <br />
        isn’t here.
      </h1>
      <p>Perhaps another interior will feel like home.</p>
      <TextLink href="/spaces">Explore the spaces</TextLink>
    </main>
  );
}
