import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { AuthProvider, useAuth, homeFor } from './auth/AuthContext.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import AppLayout from './layout/AppLayout.jsx';
import AuthLayout from './layout/AuthLayout.jsx';
import Loading from './components/Loading.jsx';
import StyleGuide from './pages/dev/StyleGuide.jsx';
import NotFound from './pages/NotFound.jsx';
import SignIn from './pages/auth/SignIn.jsx';
import SignUp from './pages/auth/SignUp.jsx';
import CheckEmail from './pages/auth/CheckEmail.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import Rooms from './pages/guest/Rooms.jsx';
import RoomPage from './pages/guest/RoomPage.jsx';
import BookRoom from './pages/guest/BookRoom.jsx';
import MyBookings from './pages/guest/MyBookings.jsx';
import BookingDetail from './pages/guest/BookingDetail.jsx';
import ExtendStay from './pages/guest/ExtendStay.jsx';
import MeetingHall from './pages/guest/MeetingHall.jsx';
import Profile from './pages/guest/Profile.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import BookingRequests from './pages/admin/BookingRequests.jsx';
import BookingReview from './pages/admin/BookingReview.jsx';
import ExtensionRequests from './pages/admin/ExtensionRequests.jsx';
import InternationalBooking from './pages/admin/InternationalBooking.jsx';
import BlockRooms from './pages/admin/BlockRooms.jsx';
import ChangeRoom from './pages/admin/ChangeRoom.jsx';
import RoomsAndHall from './pages/admin/RoomsAndHall.jsx';
import RateTable from './pages/admin/RateTable.jsx';
import InchargeBookings from './pages/incharge/InchargeBookings.jsx';
import Today from './pages/incharge/Today.jsx';
import CheckInOut from './pages/incharge/CheckInOut.jsx';
import Accounts from './pages/super/Accounts.jsx';

const ADMINS = ['Admin', 'Super Admin'];
const STAFF = ['Incharge', 'Admin', 'Super Admin'];

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return <Navigate to={homeFor(user)} replace />;
}

// Signed-in users skip the sign-in pages.
function SignedOutOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<AuthLayout />}>
              <Route path="/sign-in" element={<SignedOutOnly><SignIn /></SignedOutOnly>} />
              <Route path="/sign-up" element={<SignedOutOnly><SignUp /></SignedOutOnly>} />
              <Route path="/check-email" element={<CheckEmail />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              {/* Guest (any signed-in user can book) */}
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:id" element={<RoomPage />} />
              <Route path="/rooms/:id/book" element={<BookRoom />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
              <Route path="/bookings/:id/extend" element={<ExtendStay />} />
              <Route path="/hall" element={<MeetingHall />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin and Super Admin */}
              <Route path="/admin" element={<RequireAuth roles={ADMINS}><Dashboard /></RequireAuth>} />
              <Route path="/admin/requests" element={<RequireAuth roles={ADMINS}><BookingRequests /></RequireAuth>} />
              <Route path="/admin/requests/:id" element={<RequireAuth roles={ADMINS}><BookingReview /></RequireAuth>} />
              <Route path="/admin/extensions" element={<RequireAuth roles={ADMINS}><ExtensionRequests /></RequireAuth>} />
              <Route path="/admin/international" element={<RequireAuth roles={ADMINS}><InternationalBooking /></RequireAuth>} />
              <Route path="/admin/blocks" element={<RequireAuth roles={ADMINS}><BlockRooms /></RequireAuth>} />
              <Route path="/admin/change-room" element={<RequireAuth roles={ADMINS}><ChangeRoom /></RequireAuth>} />
              <Route path="/admin/rooms" element={<RequireAuth roles={ADMINS}><RoomsAndHall /></RequireAuth>} />
              <Route path="/admin/rates" element={<RequireAuth roles={ADMINS}><RateTable /></RequireAuth>} />

              {/* Incharge (admins may use these too) */}
              <Route path="/incharge/bookings" element={<RequireAuth roles={STAFF}><InchargeBookings /></RequireAuth>} />
              <Route path="/incharge/today" element={<RequireAuth roles={STAFF}><Today /></RequireAuth>} />
              <Route path="/incharge/desk" element={<RequireAuth roles={STAFF}><CheckInOut /></RequireAuth>} />

              {/* Super Admin */}
              <Route path="/super/accounts" element={<RequireAuth roles={['Super Admin']}><Accounts /></RequireAuth>} />
            </Route>

            {/* Developer page from F-01 */}
            <Route path="/dev/style-guide" element={<StyleGuide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
