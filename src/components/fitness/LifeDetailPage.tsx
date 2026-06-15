'use client';

import { useState } from 'react';
import Link from 'next/link';
import '@/styles/pages/Fitness.css';

type Stat = { label: string; value: string; note: string };
type Item = { title: string; meta: string; detail: string; tone?: 'good' | 'warn' | 'cyan' };

type LifeDetailPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: string;
  backHref: string;
  backLabel: string;
  primaryAction?: string;
  stats: Stat[];
  items: Item[];
  sideTitle: string;
  sideItems: string[];
};

export function LifeDetailPage({ eyebrow, title, subtitle, icon, backHref, backLabel, primaryAction = 'Save local update', stats, items, sideTitle, sideItems }: LifeDetailPageProps) {
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState(items[0]?.title ?? '');
  const hasStats = stats.length > 0;
  const hasItems = items.length > 0;
  const hasSideItems = sideItems.length > 0;

  return (
    <main className="life-detail-page health-command-page hud-page fade-in">
      <Link href={backHref} className="life-detail-back">← {backLabel}</Link>
      <section className="life-detail-hero hud-card">
        <div className="title-cluster">
          <span className="panel-icon">{icon}</span>
          <div>
            <small>{eyebrow}</small>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <button type="button" className="life-detail-action" onClick={() => setSaved(true)}>{saved ? '✓ Saved locally' : primaryAction}</button>
      </section>

      <section className="life-detail-stat-grid">
        {hasStats ? stats.map((stat) => (
          <article className="daily-stat hud-card" key={stat.label}>
            <span>⌁</span>
            <div>
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
              <em>{stat.note}</em>
            </div>
          </article>
        )) : (
          <article className="daily-stat hud-card">
            <span>◎</span>
            <div>
              <small>Status</small>
              <strong>No data right now</strong>
              <em>Add real entries to populate this module.</em>
            </div>
          </article>
        )}
      </section>

      <section className="life-detail-grid">
        <article className="life-detail-panel hud-card">
          <h2>Control Surface</h2>
          <div className="life-detail-list">
            {hasItems ? items.map((item) => (
              <button type="button" className={`life-detail-row ${item.tone ?? 'cyan'} ${selected === item.title ? 'active' : ''}`} key={item.title} onClick={() => setSelected(item.title)}>
                <span>{item.title}</span>
                <strong>{item.meta}</strong>
                <small>{item.detail}</small>
              </button>
            )) : (
              <div className="life-detail-row cyan active" role="status">
                <span>No data right now</span>
                <strong>Clean slate</strong>
                <small>Real entries will appear here when connected.</small>
              </div>
            )}
          </div>
        </article>

        <aside className="life-detail-panel hud-card">
          <h2>{sideTitle}</h2>
          <div className="life-detail-side-list">
            {hasSideItems ? sideItems.map((item, index) => (
              <p key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</p>
            )) : <p><b>—</b>No data right now</p>}
          </div>
          <div className="insight-strip">◎ <span>No live data</span><small>This module now shows only real or empty-state data.</small></div>
        </aside>
      </section>
    </main>
  );
}
