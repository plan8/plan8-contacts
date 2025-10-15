import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { ContactManager } from "./components/ContactManager";
import { PartyManager } from "./components/PartyManager";
import { Navigation } from "./components/Navigation";
import { PartyDetailsWrapper } from "./components/PartyDetailsWrapper";
import { ContactDetailsWrapper } from "./components/ContactDetailsWrapper";
import { PublicAttendanceWrapper } from "./components/PublicAttendanceWrapper";
import { DoormanWrapper } from "./components/DoormanWrapper";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Content />
        <Toaster />
      </div>
    </Router>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const location = useLocation();

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle redirect after successful authentication
  if (loggedInUser) {
    // Check for redirect URL in localStorage (set before OAuth)
    const storedRedirect = localStorage.getItem('authRedirect');
    if (storedRedirect) {
      localStorage.removeItem('authRedirect');
      window.location.href = storedRedirect;
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
  }

  return (
    <>
      <Authenticated>
        <Navigation />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-2">
            <Routes>
              <Route path="/" element={<Navigate to="/contacts" replace />} />
              <Route path="/contacts" element={<ContactManager />} />
              <Route
                path="/contacts/:contactId"
                element={<ContactDetailsWrapper />}
              />
              <Route path="/parties" element={<PartyManager />} />
              <Route
                path="/parties/:partyId"
                element={<PartyDetailsWrapper />}
              />
              <Route
                path="/parties/:partyId/attendance"
                element={<PublicAttendanceWrapper />}
              />
              <Route
                path="/parties/:partyId/doorman"
                element={<DoormanWrapper />}
              />
            </Routes>
          </div>
        </main>
      </Authenticated>

      <Unauthenticated>
        <Routes>
          <Route
            path="/parties/:partyId/attendance"
            element={<PublicAttendanceWrapper />}
          />
          <Route
            path="*"
            element={
              <div className="min-h-screen flex justify-center items-center">
                <div className="max-w-7xl mx-auto p-6">
                  <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-primary mb-4">
                        Plan8 Contacts
                      </h1>
                     
                    </div>
                    <SignInForm redirectTo={location.pathname} />
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </Unauthenticated>
    </>
  );
}
