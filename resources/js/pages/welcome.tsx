import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';

type SharedProps = {
    auth: {
        user: {
            name?: string;
        } | null;
    };
};

const highlights = [
    {
        title: 'Examinations',
        desc: 'Create, schedule, and manage district and school exams from one place.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        title: 'Results',
        desc: 'Collect marks, calculate performance, and publish reports faster.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        title: 'Analytics',
        desc: 'See trends, rankings, and subject performance at a glance.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
        ),
    },
    {
        title: 'Secure Access',
        desc: 'Role-based access for administrators, officers, and teachers.',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
];

const stats = [
    { value: 'District-wide', label: 'Coverage' },
    { value: 'Iramba DEO', label: 'Managed by' },
    { value: 'IDEMS', label: 'Platform' },
];

export default function Welcome() {
    const { auth } = usePage<SharedProps>().props;

    return (
        <>
            <Head title="IDEMS - Iramba District Examination Management System" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

                :root {
                    color-scheme: dark;
                }

                * {
                    font-family: 'Inter', sans-serif;
                }

                .page-shell {
                    background:
                        radial-gradient(circle at top left, rgba(34, 197, 94, 0.22), transparent 28%),
                        radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 24%),
                        linear-gradient(135deg, #05111f 0%, #09192c 42%, #0b2744 72%, #0f3a61 100%);
                }

                .glass {
                    background: rgba(8, 15, 28, 0.55);
                    backdrop-filter: blur(18px);
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
                }

                .soft-border {
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .brand-ring {
                    box-shadow:
                        0 0 0 1px rgba(34, 197, 94, 0.22),
                        0 0 42px rgba(34, 197, 94, 0.16);
                }

                .button-primary {
                    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                    box-shadow: 0 16px 36px rgba(21, 128, 61, 0.35);
                    transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
                }

                .button-primary:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.04);
                    box-shadow: 0 18px 42px rgba(21, 128, 61, 0.42);
                }

                .button-secondary {
                    background: rgba(255, 255, 255, 0.06);
                    transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
                }

                .button-secondary:hover {
                    transform: translateY(-1px);
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.18);
                }

                @keyframes floaty {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes revealUp {
                    from {
                        opacity: 0;
                        transform: translateY(22px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .floaty { animation: floaty 6s ease-in-out infinite; }
                .reveal-1 { animation: revealUp 0.7s ease forwards; }
                .reveal-2 { animation: revealUp 0.7s 0.12s ease both; }
                .reveal-3 { animation: revealUp 0.7s 0.24s ease both; }
                .reveal-4 { animation: revealUp 0.7s 0.36s ease both; }
            `}</style>

            <div className="page-shell min-h-screen text-white">
                <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="brand-ring glass flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden">
                            <img
                                src="/logo.png"
                                alt="Iramba District Council logo"
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-sm font-semibold tracking-[0.22em] text-emerald-200/90">IDEMS</div>
                            <div className="text-xs text-slate-300">Iramba District Examination Management System</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                id="nav-dashboard-link"
                                href={dashboard()}
                                className="button-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                Open dashboard
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        ) : (
                            <Link
                                id="nav-login-link"
                                href={login()}
                                className="button-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                Sign in
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-6 pb-16 pt-8 sm:px-8 lg:pb-20 lg:pt-12">
                    <div className="reveal-1 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.85)]" />
                        District examination operations, simplified
                    </div>

                    <section className="grid w-full items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
                        <div className="text-center lg:text-left">
                            <p className="reveal-2 mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                                Iramba District Council
                            </p>

                            <h1 className="reveal-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                                Examination management that feels
                                <span className="block bg-gradient-to-r from-emerald-300 via-sky-300 to-cyan-200 bg-clip-text text-transparent">
                                    organized from day one.
                                </span>
                            </h1>

                            <p className="reveal-3 mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg lg:mx-0">
                                IDEMS brings together exam setup, results, reports, and district-wide oversight in one clean
                                workspace for schools and administrators.
                            </p>

                            <div className="reveal-4 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                                {auth.user ? (
                                    <Link
                                        id="hero-dashboard-btn"
                                        href={dashboard()}
                                        className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white sm:w-auto"
                                    >
                                        Go to dashboard
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <Link
                                        id="hero-login-btn"
                                        href={login()}
                                        className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white sm:w-auto"
                                    >
                                        Sign in to continue
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                )}

                                <a
                                    href="#overview"
                                    className="button-secondary inline-flex w-full items-center justify-center rounded-2xl border border-white/10 px-7 py-3.5 text-base font-semibold text-white sm:w-auto"
                                >
                                    Explore features
                                </a>
                            </div>

                            <div className="reveal-4 mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="glass soft-border rounded-2xl px-5 py-4">
                                        <div className="text-sm font-bold text-white">{stat.value}</div>
                                        <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-emerald-400/20 blur-3xl" />
                            <div className="absolute -right-4 bottom-6 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl" />

                            <div className="glass floaty relative overflow-hidden rounded-[2rem] p-5 shadow-2xl shadow-black/25">
                                <div className="soft-border rounded-[1.6rem] bg-white/5 p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="brand-ring h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] bg-white">
                                            <img
                                                src="/logo.png"
                                                alt="Iramba District Council logo"
                                                className="h-full w-full object-cover"
                                                draggable={false}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                                                Official district platform
                                            </p>
                                            <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
                                                Iramba District Examination Management System
                                            </h2>
                                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                                Built to support secure exam workflows, faster reporting, and better visibility across schools.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Access</div>
                                            <div className="mt-2 text-base font-semibold text-white">Role-based control</div>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">Administrators, officers, and teachers get the right tools.</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reporting</div>
                                            <div className="mt-2 text-base font-semibold text-white">Clear result output</div>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">Summaries, analytics, and school comparisons in one flow.</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </span>
                                            <div>
                                                <div className="text-sm font-semibold text-white">Ready for daily operations</div>
                                                <div className="text-xs text-emerald-100/80">Fast, secure, and simple for district use.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="overview" className="w-full">
                        <div className="mb-6 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200/80">Overview</p>
                                <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Everything the district needs in one place</h3>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {highlights.map((item) => (
                                <article
                                    key={item.title}
                                    className="soft-border rounded-3xl bg-white/5 p-6 transition duration-200 hover:-translate-y-1 hover:bg-white/8 hover:border-white/14"
                                >
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
                                        {item.icon}
                                    </div>
                                    <h4 className="text-base font-semibold text-white">{item.title}</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <footer className="mt-16 w-full border-t border-white/8 pt-6 text-center text-xs text-slate-400">
                        Powered by{' '}
                        <a
                            href="https://nativetechnology.africa/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-200 hover:text-emerald-100"
                        >
                            Native Technology
                        </a>
                        {' '}and designed for Iramba District Council.
                    </footer>
                </main>
            </div>
        </>
    );
}
