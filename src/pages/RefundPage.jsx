import React from 'react';
import LegalShell, { H2, P, UL } from '../components/common/LegalShell';
import { COMPANY } from '../utils/company';

const RefundPage = () => (
  <LegalShell title="Refund & Cancellation Policy" updated={COMPANY.lastUpdated}>
    <P>
      This policy explains how cancellations and refunds work for paid {COMPANY.name} plans
      and add-ons. By purchasing a plan you agree to this policy.
    </P>

    <H2>1. Subscriptions</H2>
    <P>
      Paid plans (Pro and Enterprise) and storage add-ons are billed in advance for the
      stated period (monthly). Payment is collected at the time of purchase through Razorpay.
    </P>

    <H2>2. Cancellation</H2>
    <UL>
      <li>You can cancel anytime from the Subscription page in your workspace.</li>
      <li>On cancellation, your plan remains active until the end of the current paid period; it then reverts to the Free plan.</li>
      <li>We do not auto-charge after a period ends unless you renew.</li>
    </UL>

    <H2>3. Refunds</H2>
    <P>
      Because access to paid features is granted immediately, payments are generally
      non-refundable once the billing period has started. However, we will consider refunds in
      these cases:
    </P>
    <UL>
      <li>A duplicate or accidental charge.</li>
      <li>A technical billing error on our side.</li>
      <li>You were charged but were unable to access the paid features due to a fault on our side that we could not resolve.</li>
    </UL>
    <P>
      Approved refunds are processed back to the original payment method via Razorpay,
      typically within 5–7 business days.
    </P>

    <H2>4. How to Request a Refund</H2>
    <P>
      Email <strong>{COMPANY.email}</strong> from your registered email within 7 days of the
      charge, including your workspace name and the Razorpay payment ID. We will respond within
      a reasonable time.
    </P>

    <H2>5. Contact</H2>
    <P>
      For any billing question, reach us at <strong>{COMPANY.email}</strong> or see our Contact
      page.
    </P>
  </LegalShell>
);

export default RefundPage;
