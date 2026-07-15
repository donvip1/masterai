import AdminDashboard from "../../components/AdminDashboard";

export const metadata = {
  title: "Admin Control Room",
  description: "Restricted academy administration.",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <main className="admin-page">
      <AdminDashboard />
    </main>
  );
}
