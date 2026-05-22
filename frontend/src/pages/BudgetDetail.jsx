import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Doughnut, Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Plus, Trash, ArrowLeft, X } from "lucide-react"

ChartJS.register(ArcElement, Tooltip, Legend)

export const BudgetDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [budget, setBudget] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [showCreateExpense, setShowCreateExpense] = useState(false)
  const [creatingExpense, setCreatingExpense] = useState(false)
  const [expenseName, setExpenseName] = useState("")

  const [selectedExpenseId, setSelectedExpenseId] = useState(null)
  const [selectedExpenseTransactions, setSelectedExpenseTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [creatingTransaction, setCreatingTransaction] = useState(false)
  const [transactionData, setTransactionData] = useState({ name: "", amount: "", date: "" })

  const fetchBudgetAndExpenses = async () => {
    setLoading(true)
    setError("")
    try {
      const budgetRes = await fetch(`http://localhost:3000/budgets`, {
        credentials: "include",
      })
      const budgetResult = await budgetRes.json()
      if (!budgetRes.ok || !budgetResult.success) throw new Error("Failed to load budgets.")

      const foundBudget = budgetResult.data.find((b) => b.id === parseInt(id, 10))
      if (!foundBudget) throw new Error("Budget not found.")
      setBudget(foundBudget)

      const expensesRes = await fetch(`http://localhost:3000/expenses?budgetId=${id}`, {
        credentials: "include",
      })
      const expensesResult = await expensesRes.json()
      if (!expensesRes.ok || !expensesResult.success) throw new Error("Failed to load expenses.")
      setExpenses(expensesResult.data || [])
    } catch (err) {
      setError(err.message || "Failed to load budget details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBudgetAndExpenses()
  }, [id])

  const createExpense = async (e) => {
    e.preventDefault()
    setCreatingExpense(true)
    setMessage("")
    try {
      const res = await fetch("http://localhost:3000/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: expenseName,
          budgetId: parseInt(id, 10),
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to create expense.")
      setExpenses((list) => [...list, result.data])
      setMessage(result.message)
      setShowCreateExpense(false)
      setExpenseName("")
    } catch (err) {
      setMessage(err.message || "Failed to create expense.")
    } finally {
      setCreatingExpense(false)
    }
  }

  const deleteExpense = async (expenseId) => {
    setMessage("")
    try {
      const res = await fetch(`http://localhost:3000/expenses/${expenseId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to delete expense.")
      setExpenses((list) => list.filter((e) => e.id !== expenseId))
      setMessage(result.message)
    } catch (err) {
      setMessage(err.message || "Failed to delete expense.")
    }
  }

  const viewTransactions = async (expenseId) => {
    setLoadingTransactions(true)
    setMessage("")
    try {
      const res = await fetch(`http://localhost:3000/transactions?expenseId=${expenseId}`, {
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to load transactions.")
      setSelectedExpenseId(expenseId)
      setSelectedExpenseTransactions(result.data || [])
    } catch (err) {
      setMessage(err.message || "Failed to load transactions.")
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    setTransactionData((prev) => ({ ...prev, [name]: value }))
  }

  const createTransaction = async (e) => {
    e.preventDefault()
    setCreatingTransaction(true)
    setMessage("")
    try {
      const res = await fetch("http://localhost:3000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: transactionData.name,
          amount: parseInt(transactionData.amount, 10),
          date: transactionData.date,
          expenseId: selectedExpenseId,
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to create transaction.")
      setSelectedExpenseTransactions((list) => [...list, result.data])
      
      // Refresh expenses to update amounts
      const expensesRes = await fetch(`http://localhost:3000/expenses?budgetId=${id}`, {
        credentials: "include",
      })
      const expensesResult = await expensesRes.json()
      if (expensesRes.ok && expensesResult.success) {
        setExpenses(expensesResult.data || [])
      }

      setMessage(result.message)
      setShowAddTransaction(false)
      setTransactionData({ name: "", amount: "", date: "" })
    } catch (err) {
      setMessage(err.message || "Failed to create transaction.")
    } finally {
      setCreatingTransaction(false)
    }
  }

  const deleteTransaction = async (transactionId) => {
    setMessage("")
    try {
      const res = await fetch(`http://localhost:3000/transactions/${transactionId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to delete transaction.")
      setSelectedExpenseTransactions((list) => list.filter((t) => t.id !== transactionId))
      
      // Refresh expenses to update amounts
      const expensesRes = await fetch(`http://localhost:3000/expenses?budgetId=${id}`, {
        credentials: "include",
      })
      const expensesResult = await expensesRes.json()
      if (expensesRes.ok && expensesResult.success) {
        setExpenses(expensesResult.data || [])
      }

      setMessage(result.message)
    } catch (err) {
      setMessage(err.message || "Failed to delete transaction.")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Loading budget details...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </main>
    )
  }

  const remainingAmount = budget?.amount ?? 0
  const totalAmount = budget?.totalAmount ?? remainingAmount
  const spentAmount = Math.max(totalAmount - remainingAmount, 0)

  const budgetOverviewChartData = {
    labels: ["Spent", "Remaining"],
    datasets: [
      {
        data: [spentAmount, remainingAmount],
        backgroundColor: ["rgba(39, 39, 42, 0.9)", "rgba(168, 85, 247, 0.95)"],
        borderColor: ["rgba(55, 65, 81, 1)", "rgba(168, 85, 247, 1)"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  const centerTextPlugin = {
    id: "centerTextPlugin",
    beforeDraw(chart) {
      const { ctx } = chart
      const { width, height } = chart
      const centerX = width / 2
      const centerY = height / 2

      ctx.save()
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      ctx.fillStyle = "#ffffff"
      ctx.font = "700 15px sans-serif"
      ctx.fillText(`Total: $${totalAmount}`, centerX, centerY - 14)

      ctx.fillStyle = "#a1a1aa"
      ctx.font = "600 14px sans-serif"
      ctx.fillText(`Remaining: $${remainingAmount}`, centerX, centerY + 2)

      ctx.restore()
    },
  }

  const expenseChartData = {
    labels: expenses.map((e) => e.name),
    datasets: [
      {
        data: expenses.map((e) => e.amount),
        backgroundColor: [
          "rgba(168, 85, 247, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(109, 40, 217, 0.8)",
          "rgba(88, 28, 135, 0.8)",
          "rgba(147, 51, 234, 0.8)",
          "rgba(126, 34, 206, 0.8)",
        ],
        borderColor: [
          "rgba(168, 85, 247, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(109, 40, 217, 1)",
          "rgba(88, 28, 135, 1)",
          "rgba(147, 51, 234, 1)",
          "rgba(126, 34, 206, 1)",
        ],
        borderWidth: 2,
      },
    ],
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_30%)]" />

      <section className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="absolute -right-16 top-6 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {message && (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {message}
          </div>
        )}

        {budget && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">Budget Details</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{budget.name}</h1>
          </div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0b0d]/80 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Budget Overview</h2>
            <div className="mx-auto w-full max-w-xs">
              <Doughnut
                data={budgetOverviewChartData}
                options={{
                  responsive: true,
                  cutout: "58%",
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#e4e4e7",
                        font: { size: 12 },
                        padding: 12,
                      },
                    },
                  },
                }}
                plugins={[centerTextPlugin]}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0b0d]/80 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Expenses Breakdown</h2>
            <div className="mx-auto w-full max-w-xs">
              <Pie
                data={expenseChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#e4e4e7",
                        font: { size: 12 },
                        padding: 12,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-base font-semibold text-zinc-300">My expenses:</p>
          <button
            onClick={() => setShowCreateExpense(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-700 px-4 py-2 text-sm font-semibold shadow-[0_12px_30px_rgba(109,40,217,0.25)]"
          >
            <Plus size={16} /> New Expense
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.length === 0 ? (
            <p className="text-zinc-400">No expenses yet.</p>
          ) : (
            expenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-[#0b0b0d]/80 p-4 cursor-pointer transition hover:bg-[#0b0b0d]/95 hover:border-white/20"
                onClick={() => viewTransactions(e.id)}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-300/90">{e.name}</p>
                  <p className="mt-1 text-lg font-semibold text-white">${e.amount}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedExpenseId(e.id)
                      setShowAddTransaction(true)
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-purple-600/80 px-3 py-2 text-sm"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteExpense(e.id)
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-red-600/80 px-3 py-2 text-sm"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showCreateExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateExpense(false)} />
          <form onSubmit={createExpense} className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Expense</h2>
              <button type="button" onClick={() => setShowCreateExpense(false)} className="text-zinc-400 cursor-pointer">
                <X />
              </button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm text-zinc-300">Expense Name</span>
              <input
                type="text"
                name="name"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateExpense(false)} className="rounded-2xl bg-white/5 px-4 py-2 cursor-pointer">
                Cancel
              </button>
              <button
                disabled={creatingExpense}
                type="submit"
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white"
              >
                {creatingExpense ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedExpenseId(null)} />
          <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {expenses.find((e) => e.id === selectedExpenseId)?.name} - Transactions
              </h2>
              <button
                onClick={() => setSelectedExpenseId(null)}
                className="text-zinc-400 cursor-pointer hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {loadingTransactions ? (
              <p className="text-zinc-400">Loading transactions...</p>
            ) : selectedExpenseTransactions.length === 0 ? (
              <p className="text-zinc-400">No transactions yet.</p>
            ) : (
              <div className="grid gap-3">
                {selectedExpenseTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-300">{t.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-white">${t.amount}</p>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600/80 px-2 py-1 text-xs"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddTransaction && selectedExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowAddTransaction(false); setTransactionData({ name: "", amount: "", date: "" }) }} />
          <form
            onSubmit={createTransaction}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <button
                type="button"
                onClick={() => { setShowAddTransaction(false); setTransactionData({ name: "", amount: "", date: "" }) }}
                className="text-zinc-400 cursor-pointer"
              >
                <X />
              </button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm text-zinc-300">Transaction Name</span>
              <input
                type="text"
                name="name"
                value={transactionData.name}
                onChange={handleTransactionChange}
                className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
                placeholder="e.g. Grocery Shopping"
              />
            </label>

            <label className="mt-4 grid gap-2">
              <span className="text-sm text-zinc-300">Amount</span>
              <input
                type="number"
                name="amount"
                value={transactionData.amount}
                onChange={handleTransactionChange}
                className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
                placeholder="e.g. 50"
              />
            </label>

            <label className="mt-4 grid gap-2">
              <span className="text-sm text-zinc-300">Date</span>
              <input
                type="date"
                name="date"
                value={transactionData.date}
                onChange={handleTransactionChange}
                className="rounded-xl bg-white/5 px-3 py-2 text-white outline-none"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowAddTransaction(false); setTransactionData({ name: "", amount: "", date: "" }) }}
                className="rounded-2xl bg-white/5 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={creatingTransaction}
                type="submit"
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white"
              >
                {creatingTransaction ? "Adding..." : "Add Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

