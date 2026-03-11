"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';

export type ThemeOption = 'light' | 'dark';
export type KeybindingOption = 'standard' | 'vim' | 'emacs';
export type FontSizeOption = '12' | '14' | '16' | '18';

interface PreferencesContextType {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  keybinding: KeybindingOption;
  setKeybinding: (kb: KeybindingOption) => void;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, _setTheme] = useState<ThemeOption>('dark');
  const [keybinding, _setKeybinding] = useState<KeybindingOption>('standard');
  const [fontSize, _setFontSize] = useState<FontSizeOption>('14');

  // initialize from localStorage when the provider mounts
  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem('theme') as ThemeOption) ||
        'dark';
      const storedKb = (localStorage.getItem('keybinding') as KeybindingOption) ||
        'standard';
      const storedFs = (localStorage.getItem('fontSize') as FontSizeOption) ||
        '14';

      _setTheme(storedTheme);
      _setKeybinding(storedKb);
      _setFontSize(storedFs);
    } catch (e) {
      // failing to read localStorage is not fatal, just keep defaults
      console.warn('preferences init failed', e);
    }
  }, []);

  // whenever theme changes we need to reflect it on the <html> element and
  // optionally listen for system preference updates
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // persist to localStorage whenever the values update
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('keybinding', keybinding);
    } catch {}
  }, [keybinding]);

  useEffect(() => {
    try {
      localStorage.setItem('fontSize', fontSize);
    } catch {}
  }, [fontSize]);

  const setTheme = (t: ThemeOption) => {
    _setTheme(t);
  };
  const setKeybinding = (kb: KeybindingOption) => {
    _setKeybinding(kb);
  };
  const setFontSize = (fs: FontSizeOption) => {
    _setFontSize(fs);
  };

  return (
    <PreferencesContext.Provider
      value={{ theme, setTheme, keybinding, setKeybinding, fontSize, setFontSize }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
};
