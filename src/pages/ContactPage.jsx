import React from 'react';
import LegalShell, { H2, P } from '../components/common/LegalShell';
import { COMPANY } from '../utils/company';

const ContactPage = () => (
  <LegalShell title="Contact Us" updated={COMPANY.lastUpdated}>
    <P>
      We'd love to hear from you. For support, billing, or any question about {COMPANY.name},
      reach us using the details below.
    </P>

    <div className="bg-surface border border-navy-200 rounded-2xl p-6 shadow-card space-y-4 mt-2">
      <div>
        <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-0.5">Email</p>
        <a href={`mailto:${COMPANY.email}`} className="text-sm text-brand font-medium">{COMPANY.email}</a>
      </div>
      <div>
        <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-0.5">Phone</p>
        <p className="text-sm text-navy">{COMPANY.phone}</p>
      </div>
      <div>
        <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-0.5">Address</p>
        <p className="text-sm text-navy">{COMPANY.address}</p>
      </div>
      <div>
        <p className="text-xs text-navy-400 uppercase tracking-wide font-medium mb-0.5">Business name</p>
        <p className="text-sm text-navy">{COMPANY.legalName}</p>
      </div>
    </div>

    <H2>Support hours</H2>
    <P>We typically respond to emails within 1–2 business days (Monday–Friday).</P>
  </LegalShell>
);

export default ContactPage;
