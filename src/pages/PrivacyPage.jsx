import React from 'react';
import LegalShell, { H2, P, UL } from '../components/common/LegalShell';
import { COMPANY } from '../utils/company';

const PrivacyPage = () => (
  <LegalShell title="Privacy Policy" updated={COMPANY.lastUpdated}>
    <P>
      This Privacy Policy explains how {COMPANY.legalName} ("we", "us") collects, uses, and
      protects your information when you use {COMPANY.name} (the "Service").
    </P>

    <H2>1. Information We Collect</H2>
    <UL>
      <li><strong>Account information:</strong> name, email, role, department, and phone (if provided).</li>
      <li><strong>Organization data:</strong> company name, team members, tasks, comments, and files you upload.</li>
      <li><strong>Payment information:</strong> processed by Razorpay. We do not store your full card or bank details.</li>
      <li><strong>Technical data:</strong> IP address and basic logs used for security and audit purposes.</li>
    </UL>

    <H2>2. How We Use Your Information</H2>
    <UL>
      <li>To provide, operate, and maintain the Service.</li>
      <li>To authenticate users and keep accounts secure.</li>
      <li>To send transactional emails (account setup, password reset, notifications).</li>
      <li>To process payments and manage subscriptions.</li>
      <li>To detect, prevent, and address technical or security issues.</li>
    </UL>

    <H2>3. Sharing of Information</H2>
    <P>
      We do not sell your personal data. We share information only with service providers that
      help us operate the Service, such as our payment processor (Razorpay), email provider
      (Brevo), and file storage provider (Cloudinary), and only as needed to provide the
      Service or comply with law.
    </P>

    <H2>4. Data Isolation</H2>
    <P>
      Each organization's data is logically isolated. Users can only access data belonging to
      organizations they are a member of.
    </P>

    <H2>5. Data Security</H2>
    <P>
      Passwords are hashed, access tokens are short-lived, and sensitive secrets are never
      exposed to the client. No method of transmission or storage is 100% secure, but we take
      reasonable measures to protect your data.
    </P>

    <H2>6. Data Retention</H2>
    <P>
      We retain your data for as long as your account is active. You may request deletion of
      your account and associated data by contacting us.
    </P>

    <H2>7. Your Rights</H2>
    <P>
      You may access, correct, or request deletion of your personal information by emailing
      <strong> {COMPANY.email}</strong>.
    </P>

    <H2>8. Changes</H2>
    <P>
      We may update this Policy periodically. Material changes will be reflected by the "Last
      updated" date above.
    </P>

    <H2>9. Contact</H2>
    <P>
      For privacy questions, email <strong>{COMPANY.email}</strong> or see our Contact page.
    </P>
  </LegalShell>
);

export default PrivacyPage;
