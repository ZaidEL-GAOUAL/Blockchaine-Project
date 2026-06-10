import { Route, Routes } from 'react-router-dom'

import { CardCheckoutPage } from '@/buyer/pages/card-checkout-page'
import { EthCheckoutPage } from '@/buyer/pages/eth-checkout-page'
import { EventPage } from '@/buyer/pages/event-page'
import { HomePage } from '@/buyer/pages/home-page'
import { MyTicketsPage } from '@/buyer/pages/my-tickets-page'
import { CreateCategoryPage } from '@/seller/pages/create-category-page'
import { CreateEventPage } from '@/seller/pages/create-event-page'
import { SellerDashboardPage } from '@/seller/pages/seller-dashboard-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:eventId" element={<EventPage />} />
      <Route path="/checkout/eth" element={<EthCheckoutPage />} />
      <Route path="/checkout/card" element={<CardCheckoutPage />} />
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="/seller" element={<SellerDashboardPage />} />
      <Route path="/seller/events/new" element={<CreateEventPage />} />
      <Route
        path="/seller/events/:eventId/categories/new"
        element={<CreateCategoryPage />}
      />
    </Routes>
  )
}
