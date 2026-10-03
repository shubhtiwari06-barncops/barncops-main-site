import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/layout/page-hero";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "Terms | Barnstorm Co-operations",
      "Terms for using the Barnstorm Co-operations site. An enquiry is not a retainer. Electoral outcomes are not guaranteed.",
      "/terms",
    ),
  component: Terms,
});

function Terms() {
  return (
    <main>
      <PageHero
        kicker="Legal"
        title="Terms"
        lede="The site describes the practice. It is not itself an engagement."
      />
      <section>
        <div className="mx-auto max-w-3xl space-y-5 px-6 py-16 text-sm leading-relaxed text-muted md:px-12 md:py-24">
          <p>
            Material on this site is for principals considering Barnstorm Co-operations or mandata.ai. It is not legal advice, and it is not a promise of an electoral result.
          </p>
          <p>
            Submitting the contact form, or writing on WhatsApp, Messenger, Instagram, or X, is a request for a reply. It does not create a retainer. Work begins only when both sides agree the scope.
          </p>
          <p>
            Questions about these terms:{" "}
            <a className="text-fg underline-offset-4 hover:underline" href="mailto:poll@barncops.in">
              poll@barncops.in
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
