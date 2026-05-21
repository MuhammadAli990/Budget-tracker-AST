import { useEffect, useState } from "react"
import { Plus, Edit2, Trash, X, Check } from "lucide-react"

export const Dashboard = () => {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createData, setCreateData] = useState({ name: "", amount: "" })

  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ name: "", amount: "" })

  const fetchBudgets = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("http://localhost:3000/budgets", {
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to load budgets.")
      setBudgets(result.data || [])
    } catch (err) {
      setError(err.message || "Failed to load budgets.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  const handleCreateChange = (e) => {
    const { name, value } = e.target
    setCreateData((c) => ({ ...c, [name]: value }))
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData((c) => ({ ...c, [name]: value }))
  }

  const createBudget = async (e) => {
    e.preventDefault()
    setCreating(true)
    setMessage("")
    try {
      const res = await fetch("http://localhost:3000/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createData.name,
          amount: parseInt(createData.amount, 10),
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to create budget.")
      setBudgets((b) => [result.data, ...b])
      setMessage(result.message)
      setShowCreate(false)
      setCreateData({ name: "", amount: "" })
    } catch (err) {
      setMessage(err.message || "Failed to create budget.")
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (budget) => {
    setEditingId(budget.id)
    setEditData({ name: budget.name, amount: String(budget.amount) })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({ name: "", amount: "" })
  }

  const submitEdit = async (id) => {
    setMessage("")
    try {
      const res = await fetch(`http://localhost:3000/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editData.name, amount: parseInt(editData.amount, 10) }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to update budget.")
      setBudgets((list) => list.map((b) => (b.id === id ? result.data : b)))
      setMessage(result.message)
      cancelEdit()
    } catch (err) {
      setMessage(err.message || "Failed to update budget.")
    }
  }

  const deleteBudget = async (id) => {
    setMessage("")
    try {
      const res = await fetch(`http://localhost:3000/budgets/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to delete budget.")
      setBudgets((list) => list.filter((b) => b.id !== id))
      setMessage(result.message)
    } catch (err) {
      setMessage(err.message || "Failed to delete budget.")
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_30%)]" />

      <section className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="absolute -right-16 top-6 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Alex — here's your budget summary</h1>
            <p className="mt-2 text-sm text-zinc-400">Static welcome message for now.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-700 px-4 py-2 text-sm font-semibold shadow-[0_12px_30px_rgba(109,40,217,0.25)]"
            >
              <Plus size={16} /> New Budget
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{message}</div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

          <div>
            <p className="mb-3 text-base font-semibold text-zinc-300">My budgets:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-zinc-400">Loading budgets...</p>
            ) : budgets.length === 0 ? (
              <p className="text-zinc-400">No budgets yet.</p>
            ) : (
              budgets.map((b) => (
                <div key={b.id} className="relative flex h-40 flex-col justify-between rounded-[1.25rem] border border-white/10 bg-[#0b0b0d]/80 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-300/90">{b.name}</p>
                  </div>

                  <div>
                    <p className="text-2xl font-semibold text-white">${b.amount}</p>
                    <p className="mt-1 text-xs text-zinc-400">Amount left</p>
                  </div>

                  <div className="absolute right-3 top-3 flex gap-2">
                    <button onClick={() => startEdit(b)} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white/5 px-2 py-1 text-sm">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteBudget(b.id)} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-red-600/80 px-2 py-1 text-sm">
                      <Trash size={14} />
                    </button>
                  </div>
                  {editingId === b.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div className="mx-4 flex items-center gap-2 rounded-[1rem] bg-[#0b0b0d]/95 p-4 shadow-lg border border-white/10">
                        <input name="name" value={editData.name} onChange={handleEditChange} className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none" />
                        <input name="amount" value={editData.amount} onChange={handleEditChange} className="w-20 rounded-xl bg-white/5 px-3 py-2 text-white outline-none" />
                        <button onClick={() => submitEdit(b.id)} className="cursor-pointer rounded-xl bg-green-600 px-3 py-2 text-sm"><Check size={14} /></button>
                        <button onClick={cancelEdit} className="cursor-pointer rounded-xl bg-red-600 px-3 py-2 text-sm"><X size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <form onSubmit={createBudget} className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Budget</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-zinc-400"><X /></button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm text-zinc-300">Name</span>
              <input name="name" value={createData.name} onChange={handleCreateChange} className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none" />
            </label>

            <label className="mt-4 grid gap-2">
              <span className="text-sm text-zinc-300">Amount</span>
              <input name="amount" value={createData.amount} onChange={handleCreateChange} type="number" className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none" />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-2xl bg-white/5 px-4 py-2">Cancel</button>
              <button disabled={creating} type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white">
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}