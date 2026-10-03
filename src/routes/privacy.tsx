import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/layout/page-hero";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Privacy | Barnstorm Co-operations",
      "How Barnstorm Co-operations collects enquiry messages, uses them only to respond, stores them securely, and deletes them on request.",
      "/privacy",
    ),
  component: Privacy,
});

function Privacy() {
  return (
    <main>
      <PageHero
        kicker="Legal"
        title="Privacy"
        lede="What we collect when you write to Barnstorm Co-operations, and what we do with it."
      />
      <section>
        <div className="mx-auto max-w-3xl space-y-5 px-6 py-16 text-sm leading-relaxed text-muted md:px-12 md:py-24">
          <p>Last updated 26 September 2026.</p>
          <p>
            If you use the contact form, we collect your name, phone number, email address, and the message you write. If you message us on WhatsApp, Messenger, Instagram, or X, we collect the content of that message and the name or handle it arrives with.
          </p>
          <p>We use that information only to reply to enquiries and to arrange calls. We do not use it for anything else.</p>
          <p>
            Some of that work is done for us by other companies: Meta for WhatsApp, Messenger, and Instagram messages; Vercel to host this website; Neon to store the database; and Resend to send email. They process the information on our behalf.
          </p>
          <p>We keep enquiry records for up to 24 months, then delete them.</p>
          <p>We do not sell personal information. We do not share it for advertising.</p>
          <p>
            Under India’s Digital Personal Data Protection Act, 2023, you can ask us for access to your information, for a correction, or for deletion.
          </p>
          <p>
            The grievance contact is{" "}
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
