import { Route, Routes } from "react-router-dom"
import { Register } from "./pages/Register"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { Landing } from "./pages/Landing"
import { BudgetDetail } from "./pages/BudgetDetail"

const App = () => {
  return (
    <Routes>
      <Route element={<Register/>} path="/register"/>
      <Route element={<Login/>} path="/login"/>
      <Route element={<Dashboard/>} path="/dashboard"/>
      <Route element={<BudgetDetail/>} path="/budgets/:id"/>
      <Route element={<Landing/>} path="/"/>
    </Routes>
  )
}

export default App