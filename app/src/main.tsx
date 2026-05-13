import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AuthPage } from './pages/AuthPage'
import { AddItemPage } from './pages/AddItemPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditItemPage } from './pages/EditItemPage'
import { HomeFeedPage } from './pages/HomeFeedPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { MyOrdersPage } from './pages/MyOrdersPage'
import { OrderTrackingPage } from './pages/OrderTrackingPage'
import { ProfilePage } from './pages/ProfilePage'
import { PrivateRoute } from './routes/PrivateRoute'
import { ProfileGuard } from './routes/ProfileGuard'

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
           
            <Route path="/auth" element={<AuthPage />} />
           <Route element={<PrivateRoute />}>
  <Route element={<ProfileGuard />}>
              <Route path="/" element={<HomeFeedPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/items/new" element={<AddItemPage />} />
              <Route path="/items/:id" element={<ItemDetailPage />} />
              <Route path="/items/:id/edit" element={<EditItemPage />} />
              <Route path="/my-listings" element={<MyListingsPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/orders/:id" element={<OrderTrackingPage />} />
              
            </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)
