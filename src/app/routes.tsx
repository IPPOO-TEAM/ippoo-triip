import { createBrowserRouter } from "react-router";
import { lazyRoute } from "./utils/lazy-route";

// Public pages
const LandingPage = lazyRoute(() => import("./components/landing-page"), "LandingPage");
const OnboardingPage = lazyRoute(() => import("./components/onboarding-page"), "OnboardingPage");
const LoginPage = lazyRoute(() => import("./components/login-page"), "LoginPage");
const NotFoundPage = lazyRoute(() => import("./components/not-found-page"), "NotFoundPage");

// App pages
const AppLayout = lazyRoute(() => import("./components/app-layout"), "AppLayout");
const HomePage = lazyRoute(() => import("./components/home-page"), "HomePage");
const BookRidePage = lazyRoute(() => import("./components/book-ride-page"), "BookRidePage");
const DeliveryPage = lazyRoute(() => import("./components/delivery-page"), "DeliveryPage");
const HeavyTransportPage = lazyRoute(() => import("./components/heavy-transport-page"), "HeavyTransportPage");
const GroupOrdersPage = lazyRoute(() => import("./components/group-orders-page"), "GroupOrdersPage");
const CarpoolPage = lazyRoute(() => import("./components/carpool-page"), "CarpoolPage");
const WalletPage = lazyRoute(() => import("./components/wallet-page"), "WalletPage");
const HistoryPage = lazyRoute(() => import("./components/history-page"), "HistoryPage");
const NotificationsPage = lazyRoute(() => import("./components/notifications-page"), "NotificationsPage");
const ProfilePage = lazyRoute(() => import("./components/profile-page"), "ProfilePage");
const SupportPage = lazyRoute(() => import("./components/support-page"), "SupportPage");
const RideTrackingPage = lazyRoute(() => import("./components/ride-tracking-page"), "RideTrackingPage");
const CouponsPage = lazyRoute(() => import("./components/coupons-page"), "CouponsPage");
const PromoDetailPage = lazyRoute(() => import("./components/promo-detail-page"), "PromoDetailPage");
const SubscriptionsPage = lazyRoute(() => import("./components/subscriptions-page"), "SubscriptionsPage");
const LOAPage = lazyRoute(() => import("./components/loa-page"), "LOAPage");
const RatingPage = lazyRoute(() => import("./components/rating-page"), "RatingPage");
const MissionPage = lazyRoute(() => import("./components/mission-page"), "MissionPage");
const ReferralPage = lazyRoute(() => import("./components/referral-page"), "ReferralPage");
const LOARotationPage = lazyRoute(() => import("./components/loa-rotation-page"), "LOARotationPage");
const AirFreightPage = lazyRoute(() => import("./components/air-freight-page"), "AirFreightPage");

// Driver pages
const DriverLayout = lazyRoute(() => import("./components/driver/driver-layout"), "DriverLayout");
const DriverHomePage = lazyRoute(() => import("./components/driver/driver-home"), "DriverHomePage");
const DriverMissionsPage = lazyRoute(() => import("./components/driver/driver-missions"), "DriverMissionsPage");
const DriverEarningsPage = lazyRoute(() => import("./components/driver/driver-earnings"), "DriverEarningsPage");
const DriverHistoryPage = lazyRoute(() => import("./components/driver/driver-history"), "DriverHistoryPage");
const DriverNotificationsPage = lazyRoute(() => import("./components/driver/driver-notifications"), "DriverNotificationsPage");
const DriverProfilePage = lazyRoute(() => import("./components/driver/driver-profile"), "DriverProfilePage");
const DriverTrackingPage = lazyRoute(() => import("./components/driver/driver-tracking"), "DriverTrackingPage");
const DriverRatingPage = lazyRoute(() => import("./components/driver/driver-rating"), "DriverRatingPage");
const DriverSupportPage = lazyRoute(() => import("./components/driver/driver-support"), "DriverSupportPage");

// Admin pages
const AdminLayout = lazyRoute(() => import("./components/admin/admin-layout"), "AdminLayout");
const AdminDashboardPage = lazyRoute(() => import("./components/admin/admin-dashboard"), "AdminDashboardPage");
const AdminOffersPage = lazyRoute(() => import("./components/admin/admin-offers"), "AdminOffersPage");
const AdminUsersPage = lazyRoute(() => import("./components/admin/admin-users"), "AdminUsersPage");
const AdminDriversPage = lazyRoute(() => import("./components/admin/admin-drivers"), "AdminDriversPage");
const AdminRidesPage = lazyRoute(() => import("./components/admin/admin-rides"), "AdminRidesPage");
const AdminFinancesPage = lazyRoute(() => import("./components/admin/admin-finances"), "AdminFinancesPage");
const AdminSupportPage = lazyRoute(() => import("./components/admin/admin-support"), "AdminSupportPage");
const AdminNotificationsPage = lazyRoute(() => import("./components/admin/admin-notifications"), "AdminNotificationsPage");
const AdminSettingsPage = lazyRoute(() => import("./components/admin/admin-settings"), "AdminSettingsPage");

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/landing",
    Component: LandingPage,
  },
  {
    path: "/onboarding",
    Component: OnboardingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/driver",
    Component: DriverLayout,
    children: [
      { index: true, Component: DriverHomePage },
      { path: "missions", Component: DriverMissionsPage },
      { path: "earnings", Component: DriverEarningsPage },
      { path: "history", Component: DriverHistoryPage },
      { path: "notifications", Component: DriverNotificationsPage },
      { path: "profile", Component: DriverProfilePage },
      { path: "tracking", Component: DriverTrackingPage },
      { path: "rating", Component: DriverRatingPage },
      { path: "support", Component: DriverSupportPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboardPage },
      { path: "offers", Component: AdminOffersPage },
      { path: "users", Component: AdminUsersPage },
      { path: "drivers", Component: AdminDriversPage },
      { path: "rides", Component: AdminRidesPage },
      { path: "finances", Component: AdminFinancesPage },
      { path: "support", Component: AdminSupportPage },
      { path: "notifications", Component: AdminNotificationsPage },
      { path: "settings", Component: AdminSettingsPage },
    ],
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "book-ride", Component: BookRidePage },
      { path: "delivery", Component: DeliveryPage },
      { path: "heavy-transport", Component: HeavyTransportPage },
      { path: "group-orders", Component: GroupOrdersPage },
      { path: "carpool", Component: CarpoolPage },
      { path: "wallet", Component: WalletPage },
      { path: "history", Component: HistoryPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "profile", Component: ProfilePage },
      { path: "support", Component: SupportPage },
      { path: "tracking", Component: RideTrackingPage },
      { path: "coupons", Component: CouponsPage },
      { path: "promo/:id", Component: PromoDetailPage },
      { path: "subscriptions", Component: SubscriptionsPage },
      { path: "loa", Component: LOAPage },
      { path: "loa/rotation", Component: LOARotationPage },
      { path: "air-freight", Component: AirFreightPage },
      { path: "rating", Component: RatingPage },
      { path: "mission", Component: MissionPage },
      { path: "referral", Component: ReferralPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
