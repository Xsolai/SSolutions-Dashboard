"use client"; // Required for React state management in Next.js
import React, { createContext, useState, useContext } from "react";

// 1. Create the Context
const VisibilityContext = createContext();

// 2. Create the Provider Component
export const VisibilityProvider = ({ children }) => {
  // This state keeps track of which dashboards are visible
  const [visibility, setVisibility] = useState({
    callAnalysis: true,  // Call Analysis Dashboard is visible by default
    emailAnalysis: true, // Email Analysis Dashboard is visible by default
  });

  // Function to toggle visibility of a component
  const toggleVisibility = (key) => {
    setVisibility((prev) => ({
      ...prev,
      [key]: !prev[key], // Flip the value (true <-> false)
    }));
  };

  return (
    <VisibilityContext.Provider value={{ visibility, toggleVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
};

// 3. Create a Hook to Use the Context
export const useVisibility = () => useContext(VisibilityContext);
    