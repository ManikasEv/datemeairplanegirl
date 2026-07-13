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
    blurb: 'Candlelight and shared dessert.',
    image: dinnerImg,
  },
  {
    id: 'bowling',
    label: 'Bowling',
    blurb: 'Gutter balls welcome.',
    image: bowlingImg,
  },
  {
    id: 'swimming',
    label: 'Swimming',
    blurb: 'Floats over freestyle.',
    image: swimmingImg,
  },
]
const WEEKDAY_TIME_SLOTS = ['17:00', '18:00', '19:00', '20:00', '21:00']
const WEEKEND_TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '17:00', '18:00', '19:00', '20:00', '21:00']

function isWeekendDate(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function getTimeSlotsForDay(isoDate) {
  if (!isoDate) return WEEKDAY_TIME_SLOTS
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return isWeekendDate(date) ? WEEKEND_TIME_SLOTS : WEEKDAY_TIME_SLOTS
}

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
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
      weekend: isWeekendDate(date),
    }
  })
}

function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${(i * 12 + 6) % 94}%`,
        delay: `${(i * 0.9) % 7}s`,
        duration: `${11 + (i % 4) * 2}s`,
        size: `${0.8 + (i % 3) * 0.25}rem`,
        glyph: i % 2 === 0 ? '♥' : '♡',
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

  const tauntLines = ['nice try ♡', 'nope ♥', 'still no', 'catch me~', 'say yes instead', 'heart says yes']

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
      <p className="pointer-events-none absolute inset-x-2 top-2 z-0 text-center text-[0.7rem] font-medium text-[var(--rose)]/75 sm:top-3 sm:text-xs">
        try tapping No… if you can ♥
      </p>

      <button
        type="button"
        className="animate-soft-pulse absolute left-1/2 top-[48%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--pink)] px-9 py-3.5 text-base font-bold text-white shadow-[0_14px_36px_rgba(255,93,158,0.42)] transition active:scale-[0.98] sm:px-11 sm:text-lg"
        onClick={onYes}
      >
        Yes ♥
      </button>

      <button
        ref={btnRef}
        type="button"
        aria-label="No (good luck)"
        className="runaway-no z-20 rounded-2xl border-2 border-[var(--rose)]/40 bg-white/90 font-semibold text-[var(--rose)] shadow-[0_8px_22px_rgba(232,58,122,0.18)] backdrop-blur-sm transition-[left,top] duration-150 ease-out"
        style={
          pos
            ? { position: 'absolute', left: pos.x, top: pos.y }
            : { position: 'absolute', right: 12, bottom: 16 }
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
    <div key={stepKey} className="animate-fade-up sheet">
      {image ? (
        <div className="hero-frame animate-floaty mb-4 sm:mb-5">
          <img src={image} alt={imageAlt || ''} />
        </div>
      ) : null}

      <h1 className="mb-1.5 text-center text-[1.35rem] font-bold leading-tight text-[var(--night)] sm:text-2xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mx-auto mb-5 max-w-sm text-center text-[0.84rem] leading-relaxed text-[var(--ink)]/68 sm:mb-6 sm:text-[0.95rem]">
          {subtitle}
        </p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </div>
  )
}

function ProgressDots({ step }) {
  const index = STEPS.indexOf(step)
  if (step === 'done') return null
  return (
    <div className="relative z-10 mb-3 flex justify-center gap-1.5 sm:mb-5 sm:gap-2" aria-hidden>
      {STEPS.filter((s) => s !== 'done').map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= index ? 'w-7 bg-[var(--pink)] sm:w-8' : 'w-2.5 bg-[var(--rose)]/20 sm:w-3'
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
  const timeSlots = useMemo(() => getTimeSlotsForDay(answers.dateDay), [answers.dateDay])
  const availableDays = useMemo(() => weekDays.filter((day) => day.available), [weekDays])

  useEffect(() => {
    if (answers.dateDay) {
      const day = weekDays.find((d) => d.iso === answers.dateDay)
      if (day && !day.available) {
        setAnswers((prev) => ({ ...prev, dateDay: '', dateTime: '' }))
      }
    }
  }, [answers.dateDay, weekDays])

  useEffect(() => {
    if (answers.dateTime && !timeSlots.includes(answers.dateTime)) {
      setAnswers((prev) => ({ ...prev, dateTime: '' }))
    }
  }, [answers.dateTime, timeSlots])

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
    <main className="app-main">
      <FloatingHearts />

      <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center opacity-70">
        <div className="animate-floaty h-36 w-36 rounded-full bg-[var(--glow)] blur-3xl sm:h-44 sm:w-44" />
      </div>

      <ProgressDots step={step} />

      {step === 'ask' && (
        <StepShell
          stepKey="ask"
          title="Will you date me?"
          subtitle={
            escapeCount > 2
              ? 'No keeps running away. Your heart already knows.'
              : 'Butterflies included. One correct answer.'
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
        </StepShell>
      )}

      {step === 'when' && (
        <StepShell
          stepKey="when"
          title="When should we go?"
          subtitle="Pick a day this week, then a time."
        >
          <div className="chip-row mb-5">
            {availableDays.map((day) => {
              const selected = answers.dateDay === day.iso
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => savePartial({ dateDay: day.iso, dateTime: '' })}
                  className={`min-w-[4.6rem] rounded-2xl px-3.5 py-3 text-left transition ${
                    selected
                      ? 'bg-[var(--pink)] text-white shadow-lg shadow-pink-300/40'
                      : 'bg-white/80 text-[var(--night)]'
                  }`}
                >
                  <span className="block text-[0.65rem] uppercase tracking-wide opacity-80">{day.label}</span>
                  <span className="block text-sm font-bold">
                    {day.date.getDate()} {day.date.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mb-2.5 text-sm font-semibold text-[var(--rose)]">Pick a time ♥</p>
          <div className="mb-6 flex flex-wrap gap-2">
            {timeSlots.map((slot) => {
              const selected = answers.dateTime === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => savePartial({ dateTime: slot })}
                  className={`min-h-11 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    selected
                      ? 'bg-[var(--rose)] text-white'
                      : 'bg-white/80 text-[var(--night)]'
                  }`}
                >
                  {slot}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!answers.dateDay || !answers.dateTime}
            onClick={() => setStep('what')}
          >
            Next: the date vibe
          </button>
        </StepShell>
      )}

      {step === 'what' && (
        <StepShell
          stepKey="what"
          title="Choose our adventure"
          subtitle="Dinner, bowling, or swimming — pick your vibe."
        >
          <div className="mb-6 flex flex-col gap-2.5">
            {ACTIVITIES.map((activity) => {
              const selected = answers.activity === activity.id
              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => savePartial({ activity: activity.id })}
                  className={`flex items-center gap-3 overflow-hidden rounded-2xl p-1.5 pr-3 text-left transition ${
                    selected
                      ? 'bg-[var(--pink)] text-white shadow-lg shadow-pink-300/40'
                      : 'bg-white/80 text-[var(--night)]'
                  }`}
                >
                  <img
                    src={activity.image}
                    alt=""
                    className="h-[4.25rem] w-[4.25rem] shrink-0 rounded-[0.9rem] object-cover sm:h-20 sm:w-20"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.98rem] font-bold">{activity.label}</span>
                    <span
                      className={`mt-0.5 block text-[0.8rem] leading-snug ${
                        selected ? 'text-white/85' : 'text-[var(--ink)]/65'
                      }`}
                    >
                      {activity.blurb}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="action-row">
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => setStep('when')}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary w-full flex-1 sm:w-auto"
              disabled={!answers.activity}
              onClick={() => setStep('notes')}
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
          subtitle="Something sweet, practical, or mysterious."
          image={ACTIVITIES.find((a) => a.id === answers.activity)?.image || heroRomance}
          imageAlt="Chosen date activity"
        >
          <label className="mb-2 block text-sm font-semibold text-[var(--rose)]" htmlFor="notes">
            Message ♡
          </label>
          <textarea
            id="notes"
            rows={4}
            maxLength={1000}
            value={answers.notes}
            onChange={(e) => savePartial({ notes: e.target.value })}
            placeholder="e.g. please bring flowers… or just your best smile"
            className="mb-4 w-full resize-y rounded-2xl border border-[var(--pink)]/30 bg-white/85 px-3.5 py-3 text-sm text-[var(--night)] outline-none placeholder:text-[var(--ink)]/35 focus:border-[var(--pink)]"
          />

          <div className="mb-4 rounded-2xl bg-white/75 px-3.5 py-3 text-[0.8rem] leading-relaxed text-[var(--ink)]/80">
            <p>
              <span className="font-semibold text-[var(--rose)]">Yes ♥</span> · {answers.dateDay || '—'} at{' '}
              {answers.dateTime || '—'} · {answers.activity || '—'}
            </p>
          </div>

          {error ? <p className="mb-3 text-sm text-[var(--rose)]">{error}</p> : null}

          <div className="action-row">
            <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => setStep('what')}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary animate-heartbeat w-full flex-1 sm:w-auto"
              disabled={submitting}
              onClick={submit}
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
          subtitle="Saved and sent. See you soon ♥"
          image={ACTIVITIES.find((a) => a.id === answers.activity)?.image || heroRomance}
          imageAlt="Confirmed date vibe"
        >
          <div className="rounded-2xl border border-[var(--pink)]/25 bg-white/80 px-4 py-4 text-[var(--night)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
              Confirmed with love
            </p>
            <ul className="space-y-1.5 text-sm">
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
