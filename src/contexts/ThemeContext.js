import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export const lightColors = {
  primary:        '#1a6b47',
  primaryDark:    '#134d33',
  primaryLight:   '#2d8a5e',
  primarySurface: '#e8f5ee',
  background:     '#f4f6f4',
  surface:        '#ffffff',
  surfaceAlt:     '#f0f4f1',
  border:         '#dde8e2',
  textPrimary:    '#0f1f18',
  textSecondary:  '#3d5c4a',
  textMuted:      '#8aa396',
  white:          '#ffffff',
  success:        '#22c55e',
  error:          '#ef4444',
  warning:        '#f59e0b',
  info:           '#3b82f6',
  agendada:       '#3b82f6',
  realizada:      '#22c55e',
  cancelada:      '#ef4444',
  credits:        '#f97316',
  creditsLight:   '#fff7ed',
  emergency:      '#dc2626',
  card:           '#ffffff',
  tabBar:         '#ffffff',
  headerBg:       '#1a6b47',
  inputBg:        '#f4f6f4',
  shadow:         '#000000',
};

export const darkColors = {
  primary:        '#34d399',
  primaryDark:    '#059669',
  primaryLight:   '#6ee7b7',
  primarySurface: '#064e3b',
  background:     '#0a0f0d',
  surface:        '#111a15',
  surfaceAlt:     '#162019',
  border:         '#1e3028',
  textPrimary:    '#ecfdf5',
  textSecondary:  '#a7c4b5',
  textMuted:      '#4d7a63',
  white:          '#ffffff',
  success:        '#22c55e',
  error:          '#f87171',
  warning:        '#fbbf24',
  info:           '#60a5fa',
  agendada:       '#60a5fa',
  realizada:      '#22c55e',
  cancelada:      '#f87171',
  credits:        '#fb923c',
  creditsLight:   '#1c1008',
  emergency:      '#ef4444',
  card:           '#111a15',
  tabBar:         '#0d1610',
  headerBg:       '#0d1610',
  inputBg:        '#162019',
  shadow:         '#000000',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const FontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 };
export const BorderRadius = { sm: 6, md: 10, lg: 16, xl: 22, full: 999 };

export const getShadow = (dark) => ({
  sm: {
    shadowColor: dark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: dark ? 0.4 : 0.06,
    shadowRadius: 6,
    elevation: dark ? 4 : 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: dark ? 0.5 : 0.10,
    shadowRadius: 12,
    elevation: dark ? 8 : 4,
  },
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggle = () => setIsDark(d => !d);
  const colors = isDark ? darkColors : lightColors;
  const Shadow = getShadow(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggle, colors, Shadow, Spacing, FontSize, BorderRadius }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
};
