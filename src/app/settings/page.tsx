'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Nav from '@/components/Nav';

const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: 'DE' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'fr', label: 'Français', flag: 'FR' },
];

const STORAGE_KEY = 'studypod-settings';

interface Settings {
  language: string;
  autoRenderAudio: boolean;
  autoRenderCount: number;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

const defaultSettings: Settings = {
  language: 'de',
  autoRenderAudio: true,
  autoRenderCount: 2,
};

function saveSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [feedToken, setFeedToken] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSettings());

    // Load feed token
    async function loadFeedToken() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('feed_token')
            .eq('id', user.id)
            .single();
          if (profile?.feed_token) setFeedToken(profile.feed_token);
        }
      } catch {}
    }
    loadFeedToken();
  }, []);

  function update(partial: Partial<Settings>) {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {}
  };

  return (
    <main className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
      <Nav rightContent={
        <Link href="/dashboard" className="text-xs text-[var(--c-muted)] hover:text-[var(--c-fg)] transition-pixel py-2">Back</Link>
      } />

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-press-start)] text-lg mb-6">SETTINGS</h1>

        {saved && (
          <div className="pixel-border-sm bg-[var(--c-accent)]/10 text-[var(--c-accent)] px-4 py-2 mb-4 text-sm font-[family-name:var(--font-press-start)] text-[10px] text-center">
            SAVED!
          </div>
        )}

        {/* Language */}
        <div className="pixel-border bg-[var(--c-surface)] p-5 mb-4">
          <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-3">STUDY LANGUAGE</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => update({ language: lang.code })}
                className={`pixel-border-sm px-4 py-3 text-sm font-medium transition-pixel ${
                  settings.language === lang.code
                    ? 'bg-[var(--c-primary)] text-white'
                    : 'bg-[var(--c-bg)] text-[var(--c-muted)] hover:text-white'
                }`}
              >
                <span className="font-[family-name:var(--font-press-start)] text-[8px] mr-2">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="pixel-border bg-[var(--c-surface)] p-5 mb-4">
          <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-3">THEME</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Dark / Light mode</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Audio */}
        <div className="pixel-border bg-[var(--c-surface)] p-5 mb-4">
          <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-3">AUDIO</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Auto-render audio for new cards</span>
            <button
              onClick={() => update({ autoRenderAudio: !settings.autoRenderAudio })}
              className={`w-12 h-7 rounded-full transition-pixel relative ${
                settings.autoRenderAudio ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-border)]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                settings.autoRenderAudio ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
          {settings.autoRenderAudio && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--c-muted)]">Cards to auto-render</span>
              <div className="flex items-center gap-2">
                {[2, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => update({ autoRenderCount: n })}
                    className={`pixel-border-sm px-3 py-1.5 text-xs font-medium ${
                      settings.autoRenderCount === n
                        ? 'bg-[var(--c-primary)] text-white'
                        : 'bg-[var(--c-bg)] text-[var(--c-muted)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Podcast Feed */}
        {feedToken && (
          <div className="pixel-border bg-[var(--c-surface)] p-5 mb-4">
            <p className="font-[family-name:var(--font-press-start)] text-[8px] text-[var(--c-muted)] mb-3">PODCAST FEED</p>
            <input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/feed/${feedToken}`}
              className="w-full bg-[var(--c-bg)] text-xs text-[var(--c-muted)] px-3 py-2 pixel-border-sm font-mono"
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
                navigator.clipboard?.writeText((e.target as HTMLInputElement).value);
              }}
            />
            <p className="text-xs text-[var(--c-muted)] mt-1">Tap to copy. Add to Apple Podcasts or Pocket Casts.</p>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full pixel-border-sm bg-[var(--c-danger)]/10 text-[var(--c-danger)] py-3 font-semibold hover:bg-[var(--c-danger)]/20 transition-pixel"
        >
          SIGN OUT
        </button>
      </div>
    </main>
  );
}
