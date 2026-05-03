import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Layout><div className="container mx-auto py-24 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <Layout>
      <div className="container mx-auto py-24 max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-2">Not Authorized</h1>
        <p className="text-muted-foreground">Your account does not have admin access. Contact the site owner.</p>
      </div>
    </Layout>
  );
  return <>{children}</>;
};

export default RequireAdmin;
