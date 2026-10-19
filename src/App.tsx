import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Landing from './pages/Landing';
import Plan from './pages/Plan';
import SpaceDetails from './pages/SpaceDetails';
import BookingForm from './pages/BookingForm';
import Confirmation from './pages/Confirmation';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';
import AdminRequest from './pages/AdminRequest';
import Payment from './pages/Payment';
import Passes from './pages/Passes';
import GateScan from './pages/GateScan';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="plan" element={<Plan />} />
        <Route path="spaces/:id" element={<SpaceDetails />} />
        <Route path="book" element={<BookingForm />} />
        <Route path="book/confirmation/:ref" element={<Confirmation />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="admin" element={<Admin />} />
        <Route path="admin/requests/:ref" element={<AdminRequest />} />
        <Route path="pay/:ref" element={<Payment />} />
        <Route path="passes/:ref" element={<Passes />} />
        <Route path="gate-scan" element={<GateScan />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
