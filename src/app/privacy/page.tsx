import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Privacy information for the Chronos & Steel portfolio demonstration.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal · Demo project"
      title="Privacy policy"
      intro="This notice explains what information the Chronos & Steel portfolio demonstration may handle when you browse or try its account and seller features."
      sections={[
        {
          title: "1. Information the demo handles",
          content: (
            <>
              <p>
                If you create an account, the app stores the name and email
                address you provide, along with a password hash (not your
                plaintext password). It also creates a session record and uses
                an essential, httpOnly session cookie to keep you signed in.
              </p>
              <p>
                If you use seller features, information and images you submit
                for listings may be stored. Items placed in your bag may also
                be saved to the app database. Checkout is disabled, so the demo
                does not accept orders or payment details.
              </p>
            </>
          ),
        },
        {
          title: "2. How information is used",
          content: (
            <p>
              Information is used to operate and demonstrate the app features
              you request, such as signing in, displaying listings, and
              remembering bag contents. Do not submit sensitive, financial, or
              confidential information.
            </p>
          ),
        },
        {
          title: "3. Service providers",
          content: (
            <p>
              The project uses hosting, database, and file-storage providers to
              run the demo. Account and app data may be processed by the
              configured hosting and database providers; listing images may be
              stored with Cloudflare R2 when image storage is enabled. Those
              providers may process technical request data under their own
              terms and privacy notices.
            </p>
          ),
        },
        {
          title: "4. Cookies and payments",
          content: (
            <p>
              The app uses an essential session cookie for account sign-in. It
              is httpOnly, uses SameSite=Lax, and is configured as secure in
              production. Checkout is disabled; do not enter payment
              information on this website. The demo does not need payment
              information to provide its current features.
            </p>
          ),
        },
        {
          title: "5. Retention and deletion",
          content: (
            <p>
              Demo data may remain in the project database or provider backups.
              There is currently no published retention schedule or
              self-service account deletion feature. Avoid submitting personal
              information you do not want stored, and do not use the demo for
              important records.
            </p>
          ),
        },
        {
          title: "6. Changes to this notice",
          content: (
            <p>
              This notice may be updated as the project changes. It describes
              this demonstration only and is not a substitute for legal advice
              or a privacy program for a commercial service.
            </p>
          ),
        },
      ]}
    />
  );
}
