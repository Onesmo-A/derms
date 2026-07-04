import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props as { auth: { user: { name?: string } | null } };

    return (
        <>
            <Head title="IDEMS — Iramba District Examination Management System" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                * { font-family: 'Inter', sans-serif; }

                .hero-bg {
                    background: linear-gradient(135deg, #0a1628 0%, #0d2144 40%, #0f3460 70%, #1a4a7a 100%);
                }
                .glass-card {
                    background: rgba(255,255,255,0.06);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.12);
                }
                .feature-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    transition: all 0.3s ease;
                }
                .feature-card:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(99,179,237,0.35);
                    transform: translateY(-3px);
                }
                .badge {
                    background: rgba(59,130,246,0.2);
                    border: 1px solid rgba(59,130,246,0.35);
                    color: #93c5fd;
                }
                .btn-primary {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    box-shadow: 0 4px 20px rgba(37,99,235,0.4);
                    transition: all 0.25s ease;
                }
                .btn-primary:hover {
                    background: linear-gradient(135deg, #1d4ed8, #1e40af);
                    box-shadow: 0 6px 28px rgba(37,99,235,0.55);
                    transform: translateY(-1px);
                }
                .btn-secondary {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.2);
                    transition: all 0.25s ease;
                }
                .btn-secondary:hover {
                    background: rgba(255,255,255,0.14);
                    border-color: rgba(255,255,255,0.35);
                }
                .glow-ring {
                    box-shadow: 0 0 0 1px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.15);
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .float-anim { animation: float 5s ease-in-out infinite; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-in-1 { animation: fadeInUp 0.7s ease forwards; }
                .fade-in-2 { animation: fadeInUp 0.7s 0.15s ease both; }
                .fade-in-3 { animation: fadeInUp 0.7s 0.3s ease both; }
                .fade-in-4 { animation: fadeInUp 0.7s 0.45s ease both; }
            `}</style>

            <div className="hero-bg min-h-screen flex flex-col text-white">

                {/* ── NAV ── */}
                <nav className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="glow-ring w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg tracking-tight select-none">
                            ID
                        </div>
                        <span className="font-semibold text-white text-base tracking-wide hidden sm:block">IDEMS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                id="nav-dashboard-link"
                                href={dashboard()}
                                className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold text-white"
                            >
                                Open Dashboard
                            </Link>
                        ) : (
                            <Link
                                id="nav-login-link"
                                href={login()}
                                className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold text-white"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </nav>

                {/* ── HERO ── */}
                <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

                    <div className="fade-in-1 badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        District Examination Management Platform · v1.0.0
                    </div>

                    <h1 className="fade-in-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mb-5">
                        Iramba District{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            Examination
                        </span>
                        {' '}Management System
                    </h1>

                    <p className="fade-in-3 text-slate-300 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
                        A district-wide platform for examinations, results, reports, analytics, and operations.
                    </p>

                    <div className="fade-in-4 flex flex-col sm:flex-row items-center gap-4 mb-20">
                        {auth.user ? (
                            <Link
                                id="hero-dashboard-btn"
                                href={dashboard()}
                                className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white"
                            >
                                Open Dashboard
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    id="hero-login-btn"
                                    href={login()}
                                    className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white"
                                >
                                    Sign In
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* ── FEATURE CARDS ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full mb-16 fade-in-4">
                        {[
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                ),
                                title: 'Examinations',
                                desc: 'Create and manage school and district-level exams with ease.',
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                ),
                                title: 'Results & Reports',
                                desc: 'Generate comprehensive result sheets and performance reports.',
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                    </svg>
                                ),
                                title: 'Analytics',
                                desc: 'Track trends, rankings, and key performance indicators across schools.',
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                ),
                                title: 'Secure Access',
                                desc: 'Role-based access control for administrators, officers, and teachers.',
                            },
                        ].map((f, i) => (
                            <div key={i} className="feature-card rounded-2xl p-6 text-left">
                                <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 mb-4">
                                    {f.icon}
                                </div>
                                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── STATS STRIP ── */}
                    <div className="glass-card rounded-2xl px-8 py-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mb-8 fade-in-4">
                        {[
                            { label: 'Schools Supported', value: 'District-Wide' },
                            { label: 'Managed by', value: 'Iramba DEO' },
                            { label: 'Platform', value: 'IDEMS' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-lg font-bold text-white">{s.value}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── POWERED BY ── */}
                    <p className="fade-in-4 text-xs text-slate-300">
                        Powered By{' '}
                        <a
                            href="https://nativetechnology.africa/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
                        >
                            Native Technology
                        </a>
                        {' '}· v1.0.0
                    </p>
                </main>

            </div>
        </>
    );
}
