import { Link, useLocation } from "react-router-dom";
import { SignOutButton } from "../SignOutButton";

export function Navigation() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Contact Manager</h2>
        <div className="flex items-center gap-4">
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Link
              to="/contacts"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                location.pathname === "/contacts" || location.pathname === "/"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Contacts
            </Link>
            <Link
              to="/parties"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                location.pathname === "/parties"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Parties & Events
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
