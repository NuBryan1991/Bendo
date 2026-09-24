import { HashRouter, Route, Routes } from 'react-router-dom'
import ComparePage from './pages/ComparePage'
import HomePage from './pages/HomePage'
import MapEditorPage from './pages/MapEditorPage'
import NotFound from './pages/NotFound'
import ProjectPage from './pages/ProjectPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/proyecto/:projectId" element={<ProjectPage />} />
        <Route path="/proyecto/:projectId/mapa/:mapId" element={<MapEditorPage />} />
        <Route path="/proyecto/:projectId/comparar" element={<ComparePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
