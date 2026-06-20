import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { paths } from "../routes/paths";
import { getAuthToken } from "../utils/authStorage";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to={paths.login} replace />;
  }
  return children;
}
