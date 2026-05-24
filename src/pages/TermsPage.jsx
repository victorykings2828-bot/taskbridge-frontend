import React from 'react';
import LegalShell, { H2, P, UL } from '../components/common/LegalShell';
import { COMPANY } from '../utils/company';

const TermsPage = () => (
  <LegalShell title="Terms & Conditions" updated={COMPANY.lastUpdated}>
    <P>
      These Terms & Conditions ("Terms") govern your access to and use of {COMPANY.name}
      (the "Service"), operated by {COMPANY.legalName}. By creating an account or using the
      Service, you agree to these Terms. If you do not agree, do not use the Service.
    </P>

    <H2>1. The Service</H2>
    <P>
      {COMPANY.name} is a team task-management platform that lets organizations create
      accounts for managers and employees, assign and track tasks, and manage their
      workspace. We may add, change, or remove features at any time.
    </P>

    <H2>2. Accounts</H2>
    <UL>
      <li>You must provide accurate information when creating a workspace or account.</li>
      <li>You are responsible for keeping your password secure and for all activity under your account.</li>
      <li>A workspace administrator may create, deactivate, or reset accounts within their organization.</li>
      <li>You must be authorized to act on behalf of any organization you register.</li>
    </UL>

    <H2>3. Acceptable Use</H2>
    <P>You agree not to misuse the Service. In particular, you will not:</P>
    <UL>
      <li>Upload unlawful, harmful, or infringing content.</li>
      <li>Attempt to gain unauthorized access to other organizations' data or our systems.</li>
      <li>Disrupt or overload the Service, or bypass usage limits.</li>
      <li>Use the Service to violate any applicable law.</li>
    </UL>

    <H2>4. Subscriptions & Payments</H2>
    <P>
      Paid plans (Pro, Enterprise) and add-ons are billed in advance through our payment
      provider, Razorpay. Prices are shown on our Pricing page in INR. Access to paid
      features is granted for the billing period purchased and reverts to the Free plan when
      the period ends unless renewed. Please see our Refund & Cancellation Policy for details.
    </P>

    <H2>5. Your Content</H2>
    <P>
      You retain ownership of the data and files you submit to the Service. You grant us a
      limited license to host and process that content solely to provide the Service. You are
      responsible for the content you and your organization upload.
    </P>

    <H2>6. Availability & Disclaimer</H2>
    <P>
      The Service is provided "as is" and "as available" without warranties of any kind. We do
      not guarantee uninterrupted or error-free operation. To the maximum extent permitted by
      law, {COMPANY.legalName} is not liable for indirect, incidental, or consequential damages,
      or for loss of data or profits arising from your use of the Service.
    </P>

    <H2>7. Termination</H2>
    <P>
      You may stop using the Service at any time. We may suspend or terminate access if you
      breach these Terms or use the Service unlawfully.
    </P>

    <H2>8. Changes to these Terms</H2>
    <P>
      We may update these Terms from time to time. Continued use of the Service after changes
      take effect constitutes acceptance of the revised Terms.
    </P>

    <H2>9. Contact</H2>
    <P>
      Questions about these Terms? Email us at <strong>{COMPANY.email}</strong> or see our
      Contact page.
    </P>
  </LegalShell>
);

export default TermsPage;
