import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { AddItemPage } from './pages/AddItemPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditItemPage } from './pages/EditItemPage'
import { HomeFeedPage } from './pages/HomeFeedPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { PrivateRoute } from './routes/PrivateRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomeFeedPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/items/new" element={<AddItemPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/items/:id/edit" element={<EditItemPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
