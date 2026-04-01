import { useEffect, useState } from 'react'
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
import useTaskStore from './stores/taskStore'
import RewardEffect from './components/RewardEffect'

export default function App() {
  const loadFromDB = useRecordStore((s) => s.loadFromDB)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    async function init() {
      await fetchTasks()
      // Note: records load asynchronously, but we don't strictly block render on audio blobs,
      // However, we wait for it so the UI has the remoteUrls populated.
      await loadFromDB()
      setAppReady(true)
    }
    init()
  }, [])

  if (!appReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f6f7f8' }}>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>加载中...</p>
      </div>
    )
  }

  return (
    <>
    <RewardEffect />
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
    </>
  )
}

