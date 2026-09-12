import { TextLink } from './text-link';
export function SectionHeading({
  eyebrow,
  title,
  href,
  link,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  href?: string;
  link?: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {href && link && <TextLink href={href}>{link}</TextLink>}
    </div>
  );
}
