import { BrowserRouter, Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <div>
      <h1>Bienvenido a CAPYMEF 2026</h1>
      <p>Tu punto de inicio ya está listo.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
