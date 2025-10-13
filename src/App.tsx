import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { ContactManager } from "./components/ContactManager";
import { PartyManager } from "./components/PartyManager";
import { Navigation } from "./components/Navigation";

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

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <Navigation />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/contacts" replace />} />
              <Route path="/contacts" element={<ContactManager />} />
              <Route path="/parties" element={<PartyManager />} />
            </Routes>
          </div>
        </main>
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">Contact Manager</h1>
            <p className="text-xl text-gray-600">
              Manage your company contacts and party invitations
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </>
  );
}
