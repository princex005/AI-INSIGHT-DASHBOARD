import { Navigate } from "react-router-dom";

export default function RedirectIfLoggedIn({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("authToken");

  if (token) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
