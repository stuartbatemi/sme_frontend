// src/pages/LegalPage.jsx
//
// Terms of Service + Privacy Policy for Fursa, written to align with
// Tanzania's Personal Data Protection Act, 2022 (PDPA) and its 2023
// regulations. Sourced from the Act itself (TanzLII) and PDPC guidance
// current as of August 2026 — see the drafting note at the bottom of
// this file for specifics and what still needs a real lawyer to fill in
// before this is a fully reviewed legal document rather than a
// good-faith solo-founder draft.
import React, { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const LAST_UPDATED = 'August 8, 2026'

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 'var(--space-8)', scrollMarginTop: 90 }}>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.3rem',
        marginBottom: 'var(--space-3)',
      }}>{title}</h2>
      <div style={{ color: 'var(--clr-text-2)', fontSize: 15, lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  )
}

export default function LegalPage() {
  const { t, lang } = useLanguage()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const targetId = hash ? hash.replace('#', '') : (pathname === '/privacy' ? 'privacy' : 'terms')
    const el = document.getElementById(targetId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
          {t('legal.page_title')}
        </h1>
        <p style={{ color: 'var(--clr-text-3)', fontSize: 13.5 }}>
          {t('legal.last_updated')}: {LAST_UPDATED}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
          <Link to="/terms" style={{ fontSize: 13.5, fontWeight: 600 }}>{t('legal.jump_terms')}</Link>
          <Link to="/privacy" style={{ fontSize: 13.5, fontWeight: 600 }}>{t('legal.jump_privacy')}</Link>
        </div>
      </div>

      <div style={{
        background: 'var(--clr-bg-2)', border: '1px solid var(--clr-border)',
        borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
        marginBottom: 'var(--space-8)', fontSize: 13.5, color: 'var(--clr-text-2)',
      }}>
        {t('legal.ownership_notice')}
      </div>

      {lang === 'sw' && (
        <div style={{
          background: 'var(--clr-primary-lt)', border: '1px solid var(--clr-primary)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
          marginBottom: 'var(--space-8)', fontSize: 13.5, color: 'var(--clr-text)',
        }}>
          {t('legal.sw_notice')}
        </div>
      )}

      {/* ══════════════════════ TERMS OF SERVICE ══════════════════════ */}
      <h1 id="terms" style={{
        fontFamily: 'var(--font-display)', fontSize: '1.6rem',
        marginBottom: 'var(--space-5)', scrollMarginTop: 90,
      }}>
        {t('legal.terms_heading')}
      </h1>

      <Section id="terms-who" title={t('legal.terms_who_title')}>
        <p>{t('legal.terms_who_body')}</p>
      </Section>

      <Section id="terms-what" title={t('legal.terms_what_title')}>
        <p>{t('legal.terms_what_body')}</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>{t('legal.terms_what_li1')}</li>
          <li>{t('legal.terms_what_li2')}</li>
          <li>{t('legal.terms_what_li3')}</li>
        </ul>
      </Section>

      <Section id="terms-not-advice" title={t('legal.terms_not_advice_title')}>
        <p>{t('legal.terms_not_advice_body')}</p>
      </Section>

      <Section id="terms-account" title={t('legal.terms_account_title')}>
        <p>{t('legal.terms_account_body')}</p>
      </Section>

      <Section id="terms-acceptable-use" title={t('legal.terms_acceptable_use_title')}>
        <ul style={{ paddingLeft: 20 }}>
          <li>{t('legal.terms_acceptable_use_li1')}</li>
          <li>{t('legal.terms_acceptable_use_li2')}</li>
          <li>{t('legal.terms_acceptable_use_li3')}</li>
          <li>{t('legal.terms_acceptable_use_li4')}</li>
        </ul>
      </Section>

      <Section id="terms-ai" title={t('legal.terms_ai_title')}>
        <p>{t('legal.terms_ai_body')}</p>
      </Section>

      <Section id="terms-ip" title={t('legal.terms_ip_title')}>
        <p>{t('legal.terms_ip_body')}</p>
      </Section>

      <Section id="terms-termination" title={t('legal.terms_termination_title')}>
        <p>{t('legal.terms_termination_body')}</p>
      </Section>

      <Section id="terms-liability" title={t('legal.terms_liability_title')}>
        <p>{t('legal.terms_liability_body')}</p>
      </Section>

      <Section id="terms-law" title={t('legal.terms_law_title')}>
        <p>{t('legal.terms_law_body')}</p>
      </Section>

      {/* ══════════════════════ PRIVACY POLICY ══════════════════════ */}
      <h1 id="privacy" style={{
        fontFamily: 'var(--font-display)', fontSize: '1.6rem',
        marginTop: 'var(--space-8)', marginBottom: 'var(--space-5)',
        scrollMarginTop: 90,
      }}>
        {t('legal.privacy_heading')}
      </h1>

      <Section id="privacy-controller" title={t('legal.privacy_controller_title')}>
        <p>{t('legal.privacy_controller_body')}</p>
      </Section>

      <Section id="privacy-what" title={t('legal.privacy_what_title')}>
        <p>{t('legal.privacy_what_intro')}</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>{t('legal.privacy_what_li1')}</li>
          <li>{t('legal.privacy_what_li2')}</li>
          <li>{t('legal.privacy_what_li3')}</li>
          <li>{t('legal.privacy_what_li4')}</li>
        </ul>
      </Section>

      <Section id="privacy-why" title={t('legal.privacy_why_title')}>
        <p>{t('legal.privacy_why_intro')}</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>{t('legal.privacy_why_li1')}</li>
          <li>{t('legal.privacy_why_li2')}</li>
          <li>{t('legal.privacy_why_li3')}</li>
          <li>{t('legal.privacy_why_li4')}</li>
        </ul>
      </Section>

      <Section id="privacy-basis" title={t('legal.privacy_basis_title')}>
        <p>{t('legal.privacy_basis_body')}</p>
      </Section>

      <Section id="privacy-sharing" title={t('legal.privacy_sharing_title')}>
        <p>{t('legal.privacy_sharing_intro')}</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>{t('legal.privacy_sharing_li1')}</li>
          <li>{t('legal.privacy_sharing_li2')}</li>
          <li>{t('legal.privacy_sharing_li3')}</li>
        </ul>
        <p style={{ marginTop: 8 }}>{t('legal.privacy_sharing_never')}</p>
      </Section>

      <Section id="privacy-transfer" title={t('legal.privacy_transfer_title')}>
        <p>{t('legal.privacy_transfer_body')}</p>
      </Section>

      <Section id="privacy-retention" title={t('legal.privacy_retention_title')}>
        <p>{t('legal.privacy_retention_body')}</p>
      </Section>

      <Section id="privacy-security" title={t('legal.privacy_security_title')}>
        <p>{t('legal.privacy_security_body')}</p>
      </Section>

      <Section id="privacy-rights" title={t('legal.privacy_rights_title')}>
        <p>{t('legal.privacy_rights_intro')}</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>{t('legal.privacy_rights_li1')}</li>
          <li>{t('legal.privacy_rights_li2')}</li>
          <li>{t('legal.privacy_rights_li3')}</li>
          <li>{t('legal.privacy_rights_li4')}</li>
          <li>{t('legal.privacy_rights_li5')}</li>
        </ul>
        <p style={{ marginTop: 8 }}>{t('legal.privacy_rights_complaint')}</p>
      </Section>

      <Section id="privacy-bots" title={t('legal.privacy_bots_title')}>
        <p>{t('legal.privacy_bots_body')}</p>
      </Section>

      <Section id="privacy-children" title={t('legal.privacy_children_title')}>
        <p>{t('legal.privacy_children_body')}</p>
      </Section>

      <Section id="privacy-changes" title={t('legal.privacy_changes_title')}>
        <p>{t('legal.privacy_changes_body')}</p>
      </Section>

      <Section id="privacy-contact" title={t('legal.privacy_contact_title')}>
        <p>{t('legal.privacy_contact_body')}</p>
      </Section>
    </div>
  )
}
