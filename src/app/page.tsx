import Link from 'next/link';

const trendingTopics = [
  'Photosynthesis', 'World War II', 'Python Programming',
  'Organic Chemistry', 'Macroeconomics', 'Constitutional Law',
  'Machine Learning', 'Cell Biology', 'Statistics',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC]">
      {/* Nav */}
      <nav className="border-b border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#6C3AED]">study</span>pod<span className="text-[#10B981]">.ai</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/auth/login" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/auth/register" className="text-sm bg-[#6C3AED] hover:bg-[#5B21B6] text-white rounded-xl px-4 py-2 font-medium transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#6C3AED]/10 border border-[#6C3AED]/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
          <span className="text-sm text-[#6C3AED]">AI-powered study tool</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Study smarter with{' '}
          <span className="text-[#6C3AED]">audio flashcards</span>
        </h1>

        <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10">
          Enter any topic. Our AI researches it, creates flashcards, generates audio lessons, and exports to Anki — in seconds.
        </p>

        {/* Search Input */}
        <div className="max-w-xl mx-auto mb-6">
          <form action="/deck/new" className="relative">
            <input
              type="text"
              name="topic"
              placeholder="What do you want to study?"
              className="w-full bg-[#1E293B] border border-[#334155] rounded-2xl px-6 py-4 pr-32 text-lg text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#6C3AED] focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#6C3AED] hover:bg-[#5B21B6] text-white rounded-xl px-5 py-2.5 font-semibold transition-colors"
            >
              Generate
            </button>
          </form>
          <p className="text-xs text-[#94A3B8] mt-2">Free — no account required</p>
        </div>

        {/* Trending Topics */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {trendingTopics.map((topic) => (
            <Link
              key={topic}
              href={`/deck/new?topic=${encodeURIComponent(topic)}`}
              className="bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-sm text-[#94A3B8] hover:text-white rounded-full px-4 py-1.5 transition-colors"
            >
              {topic}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Enter a topic', desc: 'Type any study topic — from quantum physics to art history.', icon: '\uD83D\uDD0D' },
            { step: '2', title: 'AI creates your deck', desc: 'Our AI researches the topic and generates flashcards with audio explanations.', icon: '\uD83E\uDDE0' },
            { step: '3', title: 'Study & export', desc: 'Listen, flip cards, track progress. Export to Anki anytime.', icon: '\uD83C\uDFA7' },
          ].map((item) => (
            <div key={item.step} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-xs text-[#6C3AED] font-semibold uppercase tracking-wider mb-2">
                Step {item.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[#94A3B8]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-[#334155] py-12">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '50K+', label: 'Flashcards created' },
            { value: '12K+', label: 'Students studying' },
            { value: '200+', label: 'Topics covered' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-[#6C3AED]">{stat.value}</div>
              <div className="text-sm text-[#94A3B8] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#334155] py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-[#94A3B8]">
          <span>studypod.ai</span>
          <div className="flex items-center gap-4">
            <Link href="/guide/mobile-listening" className="hover:text-white transition-colors">Listen on mobile</Link>
            <span>Built with AI, designed for students</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
