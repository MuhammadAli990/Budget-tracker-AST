import { useState, useEffect } from "react"
import { ArrowRight, LockKeyhole, Mail, Sparkles, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

export const Login = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                navigate("/dashboard")
            }, 2500)

            return () => clearTimeout(timer)
        }
    }, [success, navigate])

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        setError("")
        setSuccess("")
        setLoading(true)

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
                credentials: "include",
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Login failed.")
            }

            setSuccess(result.message)
        } catch (submitError) {
            setError(submitError.message || "Something went wrong.")
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen overflow-hidden bg-black text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_30%)]" />

            <section className="relative mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8 sm:px-6">
                <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0d]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
                    <div className="absolute -right-16 top-6 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl" />

                    <div className="relative">

                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">
                                Welcome back
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                                Login
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-zinc-300/70">
                                Sign in with your email.
                            </p>
                        </div>

                        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
                            <label className="grid gap-2">
                                <span className="text-sm font-medium text-zinc-200">Email</span>
                                <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-white transition focus-within:border-purple-400/50 focus-within:ring-4 focus-within:ring-purple-500/15">
                                    <Mail size={18} className="shrink-0 text-purple-300" />
                                    <input
                                        autoComplete="email"
                                        className="w-full bg-transparent outline-none placeholder:text-zinc-500"
                                        name="email"
                                        placeholder="alex@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium text-zinc-200">Password</span>
                                <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-white transition focus-within:border-purple-400/50 focus-within:ring-4 focus-within:ring-purple-500/15">
                                    <LockKeyhole size={18} className="shrink-0 text-purple-300" />
                                    <input
                                        autoComplete="current-password"
                                        className="w-full bg-transparent outline-none placeholder:text-zinc-500"
                                        name="password"
                                        placeholder="••••••••"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </label>

                            <button
                                className="mt-2 inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-700 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(109,40,217,0.35)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:brightness-100"
                                disabled={loading}
                                type="submit"
                            >
                                {loading ? "Signing in..." : "Sign in"}
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        {error ? (
                            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {error}
                            </p>
                        ) : null}

                        {success ? (
                            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                                <Loader2 size={18} className="shrink-0 animate-spin text-green-200" />
                                <p className="text-sm text-green-200">{success}</p>
                            </div>
                        ) : null}

                        {!success && (
                            <p className="mt-6 text-center text-sm text-zinc-400">
                                Don&apos;t have an account? <Link className="font-semibold text-purple-300 hover:text-purple-200" to="/register">Register</Link>
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}