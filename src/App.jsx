import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PoemReadPage from './pages/PoemReadPage'
import TextbookReadPage from './pages/TextbookReadPage'
import EnWordPage from './pages/EnWordPage'
import EnSentencePage from './pages/EnSentencePage'
import EnArticlePage from './pages/EnArticlePage'
import BossChallengePage from './pages/BossChallengePage'
import ParentDashboard from './pages/ParentDashboard'
import CourseManagerPage from './pages/CourseManagerPage'
import SettingsPage from './pages/SettingsPage'
import CalendarHistoryPage from './pages/CalendarHistoryPage'
import useRecordStore from './stores/recordStore'

export default function App() {
  const loadFromDB = useRecordStore((s) => s.loadFromDB)
  const loaded = useRecordStore((s) => s.loaded)

  useEffect(() => { loadFromDB() }, [])

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f6f7f8' }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>加载中...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/boss" element={<BossChallengePage />} />
        </Route>
        <Route path="/task/poem/:taskId" element={<PoemReadPage />} />
        <Route path="/task/textbook/:taskId" element={<TextbookReadPage />} />
        <Route path="/task/word/:taskId" element={<EnWordPage />} />
        <Route path="/task/sentence/:taskId" element={<EnSentencePage />} />
        <Route path="/task/article/:taskId" element={<EnArticlePage />} />
        <Route path="/parent" element={<ParentDashboard />} />
        <Route path="/courses" element={<CourseManagerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<CalendarHistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

