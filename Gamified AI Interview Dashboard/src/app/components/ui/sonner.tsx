"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";
import { usePreferences } from "../../../context/PreferencesContext";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = usePreferences();
  // sonner expects 'light' | 'dark' | 'auto' etc; we'll pass light/dark
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
