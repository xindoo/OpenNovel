import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReaderProvider } from './components/ReaderContext';
import { ReaderOverlay } from './components/ReaderOverlay';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { Recent } from './pages/Recent';
import { Favorites } from './pages/Favorites';
import { BookDetail } from './pages/BookDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { NovelEditor } from './pages/admin/NovelEditor';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ReaderProvider>
        <Routes>
          {/* Public pages wrapped in Layout (Header + Sidebar + Outlet) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/recent" element={<Recent />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/novels/:id" element={<BookDetail />} />
          </Route>

          {/* Admin pages — no Layout wrapper */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/novel/:id" element={<NovelEditor />} />
        </Routes>

        {/* Full-screen reader overlay — rendered by context, not a route */}
        <ReaderOverlay />
      </ReaderProvider>
    </BrowserRouter>
  );
}

export default App;
