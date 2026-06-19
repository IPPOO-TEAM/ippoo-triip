import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/app-layout";
import { HomePage } from "./components/home-page";
import { LoginPage } from "./components/login-page";
import { OnboardingPage } from "./components/onboarding-page";
import { BookRidePage } from "./components/book-ride-page";
import { DeliveryPage } from "./components/delivery-page";
import { HeavyTransportPage } from "./components/heavy-transport-page";
import { GroupOrdersPage } from "./components/group-orders-page";
import { CarpoolPage } from "./components/carpool-page";
import { WalletPage } from "./components/wallet-page";
import { HistoryPage } from "./components/history-page";
import { NotificationsPage } from "./components/notifications-page";
import { ProfilePage } from "./components/profile-page";
import { SupportPage } from "./components/support-page";
import { RideTrackingPage } from "./components/ride-tracking-page";
import { CouponsPage } from "./components/coupons-page";
import { PromoDetailPage } from "./components/promo-detail-page";
import { NotFoundPage } from "./components/not-found-page";
import { SubscriptionsPage } from "./components/subscriptions-page";
import { LOAPage } from "./components/loa-page";
import { RatingPage } from "./components/rating-page";
import { MissionPage } from "./components/mission-page";
import { ReferralPage } from "./components/referral-page";
import { LOARotationPage } from "./components/loa-rotation-page";
import { AirFreightPage } from "./components/air-freight-page";
import { LandingPage } from "./components/landing-page";
import { DriverLayout } from "./components/driver/driver-layout";
import { DriverHomePage } from "./components/driver/driver-home";
import { DriverMissionsPage } from "./components/driver/driver-missions";
import { DriverEarningsPage } from "./components/driver/driver-earnings";
import { DriverHistoryPage } from "./components/driver/driver-history";
import { DriverNotificationsPage } from "./components/driver/driver-notifications";
import { DriverProfilePage } from "./components/driver/driver-profile";
import { DriverTrackingPage } from "./components/driver/driver-tracking";
import { DriverRatingPage } from "./components/driver/driver-rating";
import { DriverSupportPage } from "./components/driver/driver-support";
import { AdminLayout } from "./components/admin/admin-layout";
import { AdminDashboardPage } from "./components/admin/admin-dashboard";
import { AdminUsersPage } from "./components/admin/admin-users";
import { AdminDriversPage } from "./components/admin/admin-drivers";
import { AdminRidesPage } from "./components/admin/admin-rides";
import { AdminFinancesPage } from "./components/admin/admin-finances";
import { AdminSupportPage } from "./components/admin/admin-support";
import { AdminNotificationsPage } from "./components/admin/admin-notifications";
import { AdminSettingsPage } from "./components/admin/admin-settings";

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