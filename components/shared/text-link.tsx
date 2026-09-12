import Link from 'next/link';
export function TextLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`text-link ${className}`}>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
