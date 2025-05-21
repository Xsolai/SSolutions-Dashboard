"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/"); // Redirect to home if no token
          return;
        }

        // Verify the token with the backend
        const response = await fetch("https://solasolution.ecomtask.de/auth/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Log response for debugging
          console.error("Response error: ", response.status, await response.text());
          localStorage.removeItem("access_token");
          router.push("/"); // Redirect if token is not valid
          return;
        }

        const data = await response.json();

        if (data.isAuthenticated) {
          setIsAuthenticated(true); // Token valid, user authenticated
        } else {
          localStorage.removeItem("access_token"); // Invalid token, clear it
          router.push("/"); // Redirect if authentication fails
        }
      } catch (error) {
        console.error("Authentication error:", error); // Log the error for debugging
        localStorage.removeItem("access_token");
        router.push("/"); // Redirect on error
      } finally {
        setIsLoading(false); // Finish loading state
      }
    };
    const timeoutId = setTimeout(() => setIsLoading(false), 10000); // safety timeout

    checkAuth();

    return () => clearTimeout(timeoutId);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return isAuthenticated ? children : null; // If authenticated, render children
};

export default ProtectedRoute;
