// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";

import { auth, googleProvider } from "./firebase";
import HomePage from "./pages/HomePage.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

const ALLOWED_EMAILS = ["laurengibson0202@gmail.com", "client@email.com"].map(
  (e) => e.trim().toLowerCase(),
);

type AdminStatus = "loading" | "signedOut" | "authorized" | "forbidden";

function ProtectedAdminRoute() {
  const [status, setStatus] = useState<AdminStatus>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user: User | null) => {
        if (!user) {
          setStatus("signedOut");
          setUserEmail(null);
          return;
        }

        const email = (user.email ?? "").trim().toLowerCase();
        setUserEmail(email || null);

        if (email && ALLOWED_EMAILS.includes(email)) {
          setStatus("authorized");
        } else {
          setStatus("forbidden");
        }
      },
      (error) => {
        console.error("[Auth] onAuthStateChanged error:", error);
        setStatus("signedOut");
      },
    );

    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will fire after this and update `status`
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setStatus("signedOut");
      setUserEmail(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700 text-sm">
        Checking admin authorization...
      </main>
    );
  }

  if (status === "signedOut") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 px-6 py-5 max-w-sm w-full">
          <h1 className="text-lg font-semibold mb-2">Admin login</h1>
          <p className="text-sm text-gray-600 mb-4">
            Sign in with the Google account that has access to the content
            manager.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-500"
          >
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
        <div className="rounded-2xl bg-white shadow-sm border border-red-200 px-6 py-5 max-w-md w-full">
          <h1 className="text-lg font-semibold mb-2 text-red-700">
            Access denied
          </h1>
          <p className="text-sm text-gray-700 mb-3">
            This page is only available to a specific Google account.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            You are signed in as{" "}
            <span className="font-mono">
              {userEmail ?? "unknown@example.com"}
            </span>
            . Switch to the authorized account to continue.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  // status === "authorized"
  return <AdminDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
