import { Route, Routes } from "react-router-dom"
import { Register } from "./pages/Register"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { Landing } from "./pages/Landing"

const App = () => {
  return (
    <Routes>
      <Route element={<Register/>} path="/register"/>
      <Route element={<Login/>} path="/login"/>
      <Route element={<Dashboard/>} path="/dashboard"/>
      <Route element={<Landing/>} path="/"/>
    </Routes>
  )
}

export default App