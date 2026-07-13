import { useEffect, useMemo, useRef, useState } from 'react'
import heroRomance from './assets/hero-romance.png'
import dinnerImg from './assets/activity-dinner.png'
import bowlingImg from './assets/activity-bowling.png'
import swimmingImg from './assets/activity-swimming.png'

const STEPS = ['ask', 'when', 'what', 'notes', 'done']
const ACTIVITIES = [
  {
    id: 'dinner',
    label: 'Dinner',
    blurb: 'Candlelight, shared dessert, and me trying not to spill.',
    image: dinnerImg,
  },
  {
    id: 'bowling',
    label: 'Bowling',
    blurb: 'I will pretend the gutter balls were intentional.',
    image: bowlingImg,
  },
  {
    id: 'swimming',
    label: 'Swimming',
    blurb: 'Pool floats, soft light, and zero serious swimming.',
    image: swimmingImg,
  },
]
const TIME_SLOTS = ['17:00', '18:00', '19:00', '20:00', '21:00']

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? ''

function pad(n) {
  return String(n).padStart(2, '0')
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function startOfWeek(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function isDayBookable(date, now = new Date()) {
  const cutoff = new Date(date)
  cutoff.setHours(20, 0, 0, 0)
  return now < cutoff
}

function getThisWeekDays() {
  const start = startOfWeek()
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return {
      date,
      iso: toISODate(date),
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      available: isDayBookable(date),
    }
  })
}

function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 7.3 + 4) % 96}%`,
        delay: `${(i * 0.7) % 8}s`,
        duration: `${10 + (i % 5) * 2.2}s`,
        size: `${0.85 + (i % 4) * 0.28}rem`,
        glyph: i % 3 === 0 ? '♥' : i % 3 === 1 ? '♡' : '❤',
      })),
    [],
  )

  return (
    <div className="heart-field" aria-hidden>
      {hearts.map((heart) => (
        <span
          key={heart.id}
          style={{
            left: heart.left,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            fontSize: heart.size,
          }}
        >
          {heart.glyph}
        </span>
      ))}
    </div>
  )
}

function RunawayNoButton({ onYes, onAlmostCaught }) {
  const arenaRef = useRef(null)
  const btnRef = useRef(null)
  const lastFlee = useRef(0)
  const [pos, setPos] = useState(null)
  const [taunts, setTaunts] = useState(0)

  const tauntLines = [
    'nice try ♡',
    'nope ♥',
    'still no',
    'catch me~',
    'say yes instead',
    'the heart says yes',
  ]

  function clampInside(preferredX, preferredY) {
    const arena = arenaRef.current
    const btn = btnRef.current
    if (!arena || !btn) return null

    const pad = 8
    const maxX = Math.max(pad, arena.clientWidth - btn.offsetWidth - pad)
    const maxY = Math.max(pad, arena.clientHeight - btn.offsetHeight - pad)

    return {
      x: Math.min(maxX, Math.max(pad, preferredX)),
      y: Math.min(maxY, Math.max(pad, preferredY)),
    }
  }

  function flee(e) {
    e.preventDefault()
    e.stopPropagation()

    const now = Date.now()
    if (now - lastFlee.current < 180) return
    lastFlee.current = now

    onAlmostCaught?.(taunts + 1)
    setTaunts((t) => t + 1)

    const arena = arenaRef.current
    const btn = btnRef.current
    if (!arena || !btn) return

    const pad = 8
    const maxX = Math.max(pad, arena.clientWidth - btn.offsetWidth - pad)
    const maxY = Math.max(pad, arena.clientHeight - btn.offsetHeight - pad)
    const arenaRect = arena.getBoundingClientRect()

    const pointerX =
      ('clientX' in e && typeof e.clientX === 'number'
        ? e.clientX
        : (e.touches?.[0]?.clientX ?? arenaRect.left + arena.clientWidth / 2)) - arenaRect.left
    const pointerY =
      ('clientY' in e && typeof e.clientY === 'number'
        ? e.clientY
        : (e.touches?.[0]?.clientY ?? arenaRect.top + arena.clientHeight / 2)) - arenaRect.top

    let x =
      pointerX > arena.clientWidth / 2
        ? pad + Math.random() * (maxX * 0.4)
        : maxX * 0.6 + Math.random() * (maxX * 0.35)
    let y =
      pointerY > arena.clientHeight / 2
        ? pad + Math.random() * (maxY * 0.4)
        : maxY * 0.55 + Math.random() * (maxY * 0.4)

    if (Math.hypot(x - pointerX, y - pointerY) < 64) {
      x = pad + Math.random() * (maxX - pad)
      y = pad + Math.random() * (maxY - pad)
    }

    const next = clampInside(x, y)
    if (next) setPos(next)
  }

  useEffect(() => {
    function keepInside() {
      setPos((current) => {
        if (!current) return current
        return clampInside(current.x, current.y) ?? current
      })
    }
    window.addEventListener('resize', keepInside)
    return () => window.removeEventListener('resize', keepInside)
  }, [])

  return (
    <div ref={arenaRef} className="playfield">
      <p className="pointer-events-none absolute left-1/2 top-3 z-0 -translate-x-1/2 text-xs font-medium text-[var(--rose)]/70">
        try clicking No… if you can ♥
      </p>

      <button
        type="button"
        className="animate-soft-pulse absolute left-1/2 top-[46%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--pink)] px-10 py-3.5 text-base font-bold text-white shadow-[0_14px_40px_rgba(255,93,158,0.4)] transition hover:brightness-110 active:scale-[0.98]"
        onClick={onYes}
      >
        Yes ♥
      </button>

      <button
        ref={btnRef}
        type="button"
        aria-label="No (good luck)"
        className="runaway-no z-20 rounded-2xl border-2 border-[var(--rose)]/40 bg-white/85 px-7 py-3 text-base font-semibold text-[var(--rose)] shadow-[0_8px_24px_rgba(232,58,122,0.2)] backdrop-blur-sm transition-[left,top] duration-150 ease-out"
        style={
          pos
            ? { position: 'absolute', left: pos.x, top: pos.y }
            : { position: 'absolute', right: 20, bottom: 28 }
        }
        onMouseEnter={flee}
        onFocus={flee}
        onClick={flee}
        onTouchStart={flee}
      >
        {taunts === 0 ? 'No' : tauntLines[taunts % tauntLines.length]}
      </button>
    </div>
  )
}

function StepShell({ title, subtitle, children, stepKey, image, imageAlt }) {
  return (
    <div key={stepKey} className="animate-fade-up mx-auto w-full max-w-xl px-5">
      <p className="font-display mb-1 text-center text-5xl leading-none text-[var(--rose)] sm:text-6xl md:text-7xl">
        AskMeOut
      </p>
      <p className="mb-5 text-center text-sm font-medium tracking-wide text-[var(--ink)]/55">a little love quest ♥</p>

      {image ? (
        <div className="animate-floaty mb-6 overflow-hidden rounded-[1.75rem] border border-[var(--pink)]/25 shadow-[0_18px_50px_rgba(232,58,122,0.22)]">
          <img src={image} alt={imageAlt || ''} className="aspect-[16/10] w-full object-cover" />
        </div>
      ) : null}

      <h1 className="mb-2 text-center text-xl font-bold text-[var(--night)] sm:text-2xl">{title}</h1>
      {subtitle ? (
        <p className="mx-auto mb-8 max-w-md text-center text-sm leading-relaxed text-[var(--ink)]/70 sm:text-base">
          {subtitle}
        </p>
      ) : null}
      {children}
    </div>
  )
}

function ProgressDots({ step }) {
  const index = STEPS.indexOf(step)
  if (step === 'done') return null
  return (
    <div className="relative z-10 mb-6 flex justify-center gap-2" aria-hidden>
      {STEPS.filter((s) => s !== 'done').map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= index ? 'w-8 bg-[var(--pink)]' : 'w-3 bg-[var(--rose)]/20'
          }`}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState('ask')
  const [answers, setAnswers] = useState({
    willDate: null,
    dateDay: '',
    dateTime: '',
    activity: '',
    notes: '',
  })
  const [escapeCount, setEscapeCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const weekDays = useMemo(() => getThisWeekDays(), [])

  useEffect(() => {
    if (answers.dateDay) {
      const day = weekDays.find((d) => d.iso === answers.dateDay)
      if (day && !day.available) {
        setAnswers((prev) => ({ ...prev, dateDay: '' }))
      }
    }
  }, [answers.dateDay, weekDays])

  function savePartial(patch) {
    setAnswers((prev) => ({ ...prev, ...patch }))
    setError('')
  }

  async function notifyGentleman(payload) {
    if (!WEB3FORMS_KEY) return

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Date confirmed: ${payload.activity} on ${payload.dateDay} at ${payload.dateTime}`,
        from_name: 'AskMeOut',
        name: 'AskMeOut Date Form',
        will_date: 'YES',
        day: payload.dateDay,
        time: payload.dateTime,
        activity: payload.activity,
        notes: payload.notes || '(no notes)',
        message: [
          'She said YES.',
          '',
          `Day: ${payload.dateDay}`,
          `Time: ${payload.dateTime}`,
          `Activity: ${payload.activity}`,
          `Notes for the gentleman: ${payload.notes || '(none)'}`,
        ].join('\n'),
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.success === false) {
      console.warn('Web3Forms email failed:', data.message || response.statusText)
    }
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    const payload = {
      willDate: true,
      dateDay: answers.dateDay,
      dateTime: answers.dateTime,
      activity: answers.activity,
      notes: answers.notes,
    }
    try {
      const res = await fetch(`${API_BASE}/api/date-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        throw new Error(data.errors?.[0] || 'Submit failed')
      }

      await notifyGentleman(payload)
      setStep('done')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden py-14 sm:py-20">
      <FloatingHearts />

      <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
        <div className="animate-floaty h-44 w-44 rounded-full bg-[var(--glow)] blur-3xl" />
      </div>

      <ProgressDots step={step} />

      {step === 'ask' && (
        <StepShell
          stepKey="ask"
          title="Will you date me?"
          subtitle={
            escapeCount > 2
              ? 'The No button is emotionally unavailable. Your heart already knows.'
              : 'A scientifically optimized dating protocol. Side effects may include butterflies.'
          }
          image={heroRomance}
          imageAlt="Soft pink roses and hearts"
        >
          <RunawayNoButton
            onAlmostCaught={setEscapeCount}
            onYes={() => {
              savePartial({ willDate: true })
              setStep('when')
            }}
          />
          <p className="mt-6 text-center text-xs text-[var(--ink)]/45">
            Debug tip: rejecting this form is not a supported code path ♡
          </p>
        </StepShell>
      )}

      {step === 'when' && (
        <StepShell
          stepKey="when"
          title="When should our story begin?"
          subtitle="Only this week. After 20:00 that day closes. No booking the year 2035."
        >
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {weekDays.map((day) => {
              const selected = answers.dateDay === day.iso
              return (
                <button
                  key={day.iso}
                  type="button"
                  disabled={!day.available}
                  onClick={() => savePartial({ dateDay: day.iso })}
                  className={`rounded-2xl px-3 py-3 text-left transition ${
                    !day.available
                      ? 'cursor-not-allowed bg-white/30 text-[var(--ink)]/30 line-through'
                      : selected
                        ? 'bg-[var(--pink)] text-white shadow-lg shadow-pink-300/40'
                        : 'bg-white/60 text-[var(--night)] hover:bg-white/90'
                  }`}
                >
                  <span className="block text-xs uppercase tracking-wide opacity-80">{day.label}</span>
                  <span className="block text-sm font-semibold">
                    {day.date.getDate()} {day.date.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mb-3 text-sm font-semibold text-[var(--rose)]">Pick a time ♥</p>
          <div className="mb-8 flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => {
              const selected = answers.dateTime === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => savePartial({ dateTime: slot })}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? 'bg-[var(--rose)] text-white'
                      : 'bg-white/65 text-[var(--night)] hover:bg-white'
                  }`}
                >
                  {slot}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            disabled={!answers.dateDay || !answers.dateTime}
            onClick={() => setStep('what')}
            className="w-full rounded-2xl bg-[var(--pink)] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-300/40 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            Next: the date vibe
          </button>
        </StepShell>
      )}

      {step === 'what' && (
        <StepShell
          stepKey="what"
          title="Choose our little adventure"
          subtitle="Three romantic side quests. Pick the one that makes your heart smile."
        >
          <div className="mb-8 flex flex-col gap-3">
            {ACTIVITIES.map((activity) => {
              const selected = answers.activity === activity.id
              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => savePartial({ activity: activity.id })}
                  className={`flex items-center gap-4 overflow-hidden rounded-2xl p-2 pr-4 text-left transition ${
                    selected
                      ? 'bg-[var(--pink)] text-white shadow-lg shadow-pink-300/40'
                      : 'bg-white/70 text-[var(--night)] hover:bg-white'
                  }`}
                >
                  <img
                    src={activity.image}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <span>
                    <span className="block text-base font-bold">{activity.label}</span>
                    <span
                      className={`mt-1 block text-sm ${selected ? 'text-white/85' : 'text-[var(--ink)]/65'}`}
                    >
                      {activity.blurb}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep('when')}
              className="rounded-2xl border border-[var(--rose)]/30 bg-white/50 px-5 py-3 text-sm font-semibold text-[var(--rose)] hover:bg-white"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!answers.activity}
              onClick={() => setStep('notes')}
              className="rounded-2xl bg-[var(--pink)] px-6 py-3 text-sm font-bold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next: notes
            </button>
          </div>
        </StepShell>
      )}

      {step === 'notes' && (
        <StepShell
          stepKey="notes"
          title="Notes for the gentleman"
          subtitle="Dress code hints, allergies, playlist wishes, or just something sweet."
          image={ACTIVITIES.find((a) => a.id === answers.activity)?.image || heroRomance}
          imageAlt="Chosen date activity"
        >
          <label className="mb-2 block text-sm font-semibold text-[var(--rose)]" htmlFor="notes">
            Message ♡
          </label>
          <textarea
            id="notes"
            rows={5}
            maxLength={1000}
            value={answers.notes}
            onChange={(e) => savePartial({ notes: e.target.value })}
            placeholder="e.g. please bring flowers… or just your best smile"
            className="mb-6 w-full resize-y rounded-2xl border border-[var(--pink)]/30 bg-white/70 px-4 py-3 text-sm text-[var(--night)] outline-none placeholder:text-[var(--ink)]/35 focus:border-[var(--pink)]"
          />

          <div className="mb-4 rounded-2xl bg-white/65 px-4 py-3 text-sm text-[var(--ink)]/80">
            <p>
              <span className="font-semibold text-[var(--rose)]">Yes ♥</span> · {answers.dateDay || '—'} at{' '}
              {answers.dateTime || '—'} · {answers.activity || '—'}
            </p>
          </div>

          {error ? <p className="mb-4 text-sm text-[var(--rose)]">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep('what')}
              className="rounded-2xl border border-[var(--rose)]/30 bg-white/50 px-5 py-3 text-sm font-semibold text-[var(--rose)] hover:bg-white"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="animate-heartbeat rounded-2xl bg-[var(--pink)] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Submit with love ♥'}
            </button>
          </div>
        </StepShell>
      )}

      {step === 'done' && (
        <StepShell
          stepKey="done"
          title="She said yes."
          subtitle="Your answers are saved and the gentleman has been notified. See you soon ♥"
          image={ACTIVITIES.find((a) => a.id === answers.activity)?.image || heroRomance}
          imageAlt="Confirmed date vibe"
        >
          <div className="rounded-2xl border border-[var(--pink)]/25 bg-white/75 px-5 py-5 text-[var(--night)] shadow-[0_16px_40px_rgba(232,58,122,0.15)]">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--rose)]">
              Confirmed with love
            </p>
            <ul className="space-y-1 text-sm sm:text-base">
              <li>Status: she said yes ♥</li>
              <li>
                When: {answers.dateDay} · {answers.dateTime}
              </li>
              <li>Activity: {answers.activity}</li>
              <li>Notes: {answers.notes?.trim() || '(none — mysterious romance)'}</li>
            </ul>
          </div>
        </StepShell>
      )}
    </main>
  )
}
