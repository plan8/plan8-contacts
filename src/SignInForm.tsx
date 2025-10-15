"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();

  // Handle redirect after successful authentication
  useEffect(() => {
    // Check if we have a redirect URL in the URL params (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    if (redirectParam) {
      // Decode and navigate to the intended destination
      const decodedRedirect = decodeURIComponent(redirectParam);
      navigate(decodedRedirect, { replace: true });
    } else if (redirectTo && redirectTo !== '/') {
      // If we have a redirectTo prop and it's not the root, store it for after OAuth
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('redirect', encodeURIComponent(redirectTo));
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    try {
      // Store the redirect URL in localStorage as a fallback
      if (redirectTo && redirectTo !== '/') {
        localStorage.setItem('authRedirect', redirectTo);
      }
      
      await signIn("google");
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error("Failed to sign in with Google");
    }
  };

  return (
    <div className="w-full">
      {/* <form
        className="flex flex-col gap-form-field gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div> */}
      <button type="button" className="auth-button" onClick={() => void handleGoogleSignIn()}>Sign in with Google</button>
    </div>
  );
}
