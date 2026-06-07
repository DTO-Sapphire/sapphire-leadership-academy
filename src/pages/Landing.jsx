import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BookOpen, FileText, TrendingUp, Copy, Check } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin
const REGISTER_URL = `${APP_URL}/register`

function CopyLinkButton({ className = '' }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(REGISTER_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors border border-white/30 text-sm ${className}`}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? 'Link copied!' : 'Copy registration link'}
    </button>
  )
}

const PILLARS = [
  {
    icon: BookOpen,
    title: 'Facilitated Sessions',
    body: 'Eight sessions led by Sapphire EXCO, working through John Maxwell\'s 21 Laws of Leadership with structured discussion, peer learning, and practical application.',
  },
  {
    icon: FileText,
    title: 'Written Reflection',
    body: 'After each session, participants write a structured reflection covering what they learned, the insight that stood out, and one specific action they will take before the next session.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Assessment',
    body: 'Participants rate themselves across eight leadership competencies at the start and again at the end. The difference between the two scores is your growth index.',
  },
]

const STATS = [
  { value: '4',   label: 'Weeks' },
  { value: '8',   label: 'Sessions' },
  { value: '21',  label: 'Laws of Leadership' },
  { value: '100', label: 'Point Scorecard' },
]

const LAWS = [
  { title: 'The Law of the Lid',          note: 'Leadership ability sets the ceiling on what a person can achieve.' },
  { title: 'The Law of Influence',         note: 'True leadership is measured by influence, not position or title.' },
  { title: 'The Law of Process',           note: 'Leadership develops daily, not in a single event or moment.' },
  { title: 'The Law of Solid Ground',      note: 'Trust is the foundation on which all leadership is built.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'General Sans', Inter, system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: '#0A3480' }} className="flex justify-end px-6 py-2.5">
        <Link to="/facilitator/login" className="text-[#98DFEA] text-xs hover:text-white transition-colors tracking-wide">
          Facilitator login →
        </Link>
      </div>

      {/* Hero */}
      <section
        style={{ background: 'linear-gradient(140deg, #0A3480 0%, #0F52BA 55%, #00C2CB 100%)' }}
        className="text-white px-4 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <svg width="56" height="52" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="4,2 38,2 34,20 0,20" fill="white" opacity="0.95"/>
              <polygon points="14,24 44,24 40,44 10,44" fill="#00C2CB"/>
              <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
            </svg>
          </div>

          <div className="inline-block bg-white/10 border border-white/20 rounded-full px-4 py-1 text-xs text-[#98DFEA] tracking-widest uppercase mb-6">
            June 2026 Cohort
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-5">
            Sapphire Leadership Academy
          </h1>

          <p className="text-xl sm:text-2xl text-white/80 font-medium mb-4 leading-snug">
            Leadership is a practice. This programme helps you build it.
          </p>

          <p className="text-white/60 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            A four-week programme for Sapphire Virtual Networks employees who are ready to examine how they lead, learn from each other, and return to work with concrete changes to make.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="bg-[#FFAF46] hover:bg-[#f09c2e] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg">
              Register Now
            </Link>
            <Link to="/login"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl transition-colors border-2 border-white/30 text-base">
              Log In
            </Link>
          </div>
          <div className="flex justify-center mt-4">
            <CopyLinkButton />
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-[#00C2CB] uppercase tracking-widest mb-4">About the programme</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3480] mb-6 leading-snug">
            Four weeks. Eight sessions. One cohort of leaders learning together.
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            The Sapphire Leadership Academy brings together high-potential employees from across the organisation to develop as leaders in a structured, measurable way. Participants attend eight facilitated sessions, complete weekly assignments, write reflections after each session, and receive a 1-on-1 mentorship session. At the start and end of the programme, each person completes a self-assessment across eight leadership competencies. The difference between the two scores tells you exactly how much you have grown.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-[#00C2CB] uppercase tracking-widest mb-2 text-center">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3480] mb-12 text-center">Three ways you grow</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                <div className="w-11 h-11 rounded-xl bg-[#0F52BA]/10 flex items-center justify-center mb-5">
                  <p.icon size={22} className="text-[#0F52BA]" />
                </div>
                <div className="text-[#FFAF46] text-xs font-bold mb-2">0{i + 1}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#0F52BA' }} className="px-4 py-14">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-5xl font-bold text-[#FFAF46]">{s.value}</p>
              <p className="text-white/70 text-sm mt-2 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum */}
      <section className="bg-white px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold text-[#00C2CB] uppercase tracking-widest mb-3">The curriculum</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3480] mb-5 leading-snug">
              Built on John Maxwell's 21 Laws of Leadership
            </h2>
            <p className="text-gray-600 text-base leading-relaxed mb-5">
              Each session is anchored to one or more of Maxwell's laws, selected because they speak directly to the challenges Sapphire leaders face. You will not just read about leadership concepts. You will examine your current habits, hear from others on the same team, and leave each session with a specific commitment to act on.
            </p>
            <p className="text-gray-600 text-base leading-relaxed">
              At the close of the programme, every participant receives a 100-point scorecard covering growth, attendance, reflections, assignments, and a facilitator rating. Those who score 75 or above graduate from the cohort.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {LAWS.map(law => (
              <div key={law.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-[#FFAF46] mt-2 shrink-0" />
                <div>
                  <p className="font-bold text-[#0F52BA] text-sm">{law.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed mt-0.5">{law.note}</p>
                </div>
              </div>
            ))}
            <div className="bg-[#0F52BA]/5 border border-[#0F52BA]/10 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">17 more laws across 8 sessions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section style={{ background: '#0A3480' }} className="px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-[#FFAF46] uppercase tracking-widest mb-10 text-center">The vision behind this</p>
          <div className="border-l-4 border-[#FFAF46] pl-8">
            <p className="text-white text-lg sm:text-xl leading-relaxed">
              Sapphire 4.0 is about building an organisation where capable, self-aware people lead well at every level. Leadership at Sapphire is not something reserved for those with a title. This programme is one part of building that culture, starting with the people in this room.
            </p>
            <p className="text-[#98DFEA] text-sm mt-6 font-semibold tracking-wide">
              Sapphire Virtual Networks · Leadership Academy 2026
            </p>
          </div>
        </div>
      </section>

      {/* What participants say / expectations */}
      <section className="bg-gray-50 px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-[#00C2CB] uppercase tracking-widest mb-2 text-center">What to expect</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3480] mb-12 text-center">What participants take away</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                heading: 'A clear picture of where you started',
                body: 'The baseline assessment gives you an honest, scored view of how you rate yourself across eight competencies today.',
              },
              {
                heading: 'Documented evidence of growth',
                body: 'The final assessment and growth index show exactly how your scores moved from week one to week four.',
              },
              {
                heading: 'Habits you can take back to your team',
                body: 'Every session ends with a specific action. By the close of the programme, you will have tested eight new leadership behaviours.',
              },
              {
                heading: 'A record of your leadership thinking',
                body: 'Your reflections and journal entries form a personal record of how you processed and applied each session.',
              },
            ].map(item => (
              <div key={item.heading} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4">
                <div className="w-1 rounded-full bg-[#00C2CB] shrink-0 self-stretch" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{item.heading}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Register CTA */}
      <section
        style={{ background: 'linear-gradient(140deg, #0F52BA 0%, #00C2CB 100%)' }}
        className="px-4 py-16 sm:py-20 text-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to register?</h2>
            <p className="text-white/70 text-base mb-8 leading-relaxed">
              Scan the QR code with your phone or click the button below. You will be asked to fill in a short form and confirm your email with a one-time code.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link to="/register"
                className="bg-[#FFAF46] hover:bg-[#f09c2e] text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg text-center">
                Register Now
              </Link>
              <Link to="/login"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl transition-colors border-2 border-white/30 text-base text-center">
                Already registered? Log In
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <QRCodeSVG value={REGISTER_URL} size={148} fgColor="#0F52BA" />
              <p className="text-[#0F52BA] text-xs text-center mt-3 font-medium">Scan to register</p>
            </div>
            <CopyLinkButton className="w-full justify-center" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0A3480' }} className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <svg width="22" height="20" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="4,2 38,2 34,20 0,20" fill="white" opacity="0.6"/>
            <polygon points="14,24 44,24 40,44 10,44" fill="#00C2CB" opacity="0.6"/>
            <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
          </svg>
          <span className="text-white/40 text-xs">Sapphire Virtual Networks Limited · Confidential</span>
        </div>
        <Link to="/facilitator/login" className="text-[#98DFEA] text-xs hover:text-white transition-colors">
          Facilitator login →
        </Link>
      </footer>

    </div>
  )
}
