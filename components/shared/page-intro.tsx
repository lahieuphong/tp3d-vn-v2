export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="container page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <div className="page-intro-grid">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
