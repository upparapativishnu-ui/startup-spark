import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Routes user to the correct dashboard based on their role.
const RoleGate = () => {
  const { profile, loading } = useAuth();
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  return <Navigate to={profile.role === "investor" ? "/discover" : "/dashboard"} replace />;
};

export default RoleGate;
