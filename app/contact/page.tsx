import type { Metadata } from 'next';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { TextLink } from '@/components/shared/text-link';
import { images } from '@/data/images';
export const metadata: Metadata = {
  title: 'Contact',
  description:
    'A conversation about space, materials and the way you live. Get in touch with Tân Phong.',
};
export default function ContactPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="CONTACT"
        title="Every space begins with a conversation."
        description="A room, a material, an idea still taking shape. There is always a good place to begin."
      />
      <section className="container section listing-content contact-layout">
        <EditorialImage
          src={images.workspace}
          alt="A warm timber desk alcove with a softly upholstered chair"
          priority
        />
        <div className="contact-copy">
          <p className="eyebrow">GET IN TOUCH</p>
          <h2>
            Let’s talk
            <br />
            about <em>your space.</em>
          </h2>
          <p>Studio enquiries and project conversations will open here soon.</p>
          <p className="contact-detail">
            Vietnam
            <br />
            <span>Visits by appointment — details to follow.</span>
          </p>
          <div id="follow" className="contact-social">
            <p className="eyebrow">FOLLOW THE STUDIO</p>
            <p>
              Instagram and Pinterest profiles will be added when the studio
              opens.
            </p>
          </div>
          <TextLink href="/journal">In the meantime, read the journal</TextLink>
        </div>
      </section>
    </main>
  );
}
