import { Outlet } from "react-router-dom";
import { AppHeader } from "@/features/header";

export function App() {
  return (
    <div>
      <AppHeader />
      <Outlet />
    </div>
  );
}
