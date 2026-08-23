import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import { ArrowLeft, Target, Users, TrendingUp, ShieldCheck } from 'lucide-react'

const stats = [
  { label: 'Community campaigns launched', value: '150+', icon: Target },
  { label: 'Volunteers actively contributing', value: '2,400+', icon: Users },
  { label: 'Verified volunteer hours logged', value: '18,000+', icon: TrendingUp },
]

const steps = [
  { title: 'Discover a cause', text: 'Browse active campaigns by category, city, and required skills, and see exactly how many volunteers each project still needs.' },
  { title: 'Apply and get matched', text: 'Submit an application in a click. Project managers review your profile and skill match, then approve you onto the team.' },
  { title: 'Contribute and track impact', text: 'Pick up tasks from the project board, collaborate in the discussion forum, and watch your volunteer points and impact score grow.' },
]

const about = (
  <div className="space-y-10">
    <section>
      <h2 className="text-lg font-bold">Our Mission</h2>
      <p className="mt-3 leading-8 text-gray-600 dark:text-gray-300">
        ImpactHub exists to close the gap between people who want to help and the community
        projects that need them. We give project managers the tools to organize real, measurable
        campaigns, and give volunteers a transparent way to find causes that match their skills,
        their city, and their schedule — then prove the difference they made.
      </p>
    </section>
    <section>
      <h2 className="text-lg font-bold">How It Works</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
            <h3 className="mt-3 font-bold text-sm">{step.title}</h3>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-6">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
    <section>
      <h2 className="text-lg font-bold">Impact So Far</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-brand-50 dark:bg-brand-950/30 p-5 text-center">
            <Icon className="h-5 w-5 mx-auto text-brand-600" />
            <p className="mt-2 text-2xl font-extrabold text-brand-700 dark:text-brand-400">{value}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
)

const privacy = (
  <div className="space-y-6 leading-8 text-gray-600 dark:text-gray-300">
    <p>This Privacy Policy explains how ImpactHub collects, uses, and protects information when you register, apply to campaigns, and use volunteer management features on the platform.</p>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">1. Information We Collect</h2>
      <p className="mt-2">We collect the account details you provide at registration (name, email, phone, city, skills, and an optional profile photo), plus activity data generated as you use the platform — applications, tasks, comments, and volunteer points.</p>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">2. How We Use Your Information</h2>
      <p className="mt-2">Your information is used to operate core features: matching you to relevant campaigns, routing your applications to the correct project manager, powering the leaderboard, and sending you notifications about applications, tasks, and project updates.</p>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">3. Data Sharing</h2>
      <p className="mt-2">Project managers can see the contact and skill details of volunteers who apply to their own campaigns. We do not sell personal information to third parties.</p>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">4. Your Choices</h2>
      <p className="mt-2">You can update your profile details, skills, and photo at any time from your Profile page, and can change your password from the security section.</p>
    </div>
  </div>
)

const terms = (
  <div className="space-y-6 leading-8 text-gray-600 dark:text-gray-300">
    <p>These Terms of Service govern your use of ImpactHub as a student volunteer, project manager, or administrator.</p>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">1. Accounts</h2>
      <p className="mt-2">You are responsible for keeping your login credentials secure and for the accuracy of the information on your profile.</p>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">2. Project Manager Responsibilities</h2>
      <p className="mt-2">Project managers must provide accurate campaign information, review volunteer applications in good faith, and keep task boards up to date for approved volunteers.</p>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">3. Community Conduct</h2>
      <p className="mt-2">Comments and forum discussion must stay respectful and on-topic. Content that harasses other users or misrepresents a campaign may be removed by administrators.</p>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">4. Platform Availability</h2>
      <p className="mt-2">ImpactHub is provided as-is during the evaluation period; features and data may change as the platform evolves.</p>
    </div>
  </div>
)

const content = {
  '/about': { title: 'About Us', icon: Target, body: about },
  '/privacy': { title: 'Privacy Policy', icon: ShieldCheck, body: privacy },
  '/terms': { title: 'Terms of Service', icon: ShieldCheck, body: terms },
}

export default function InfoPage() {
  const page = content[useLocation().pathname] || content['/about']
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-md ring-1 ring-brand-100 transition-all hover:-translate-x-0.5 hover:shadow-lg dark:bg-gray-900 dark:text-brand-400 dark:ring-brand-900/50"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Dashboard
          </Link>
        </div>
        <article className="card p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold">{page.title}</h1>
          <div className="mt-6">{page.body}</div>
        </article>
      </div>
    </main>
  )
}
