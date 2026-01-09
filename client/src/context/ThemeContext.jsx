import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_COLORS = {
    blue: { h: '221', s: '83%', l: '53%' },
    green: { h: '142', s: '71%', l: '45%' },
    purple: { h: '271', s: '81%', l: '56%' },
    orange: { h: '25', s: '95%', l: '53%' },
    rose: { h: '343', s: '87%', l: '56%' },
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentColor, setCurrentColor] = useState('blue');

    // Initialize Theme
    useEffect(() => {
        // Mode
        const savedMode = localStorage.getItem('theme-mode');
        const isDark = savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(isDark);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        // Color
        const savedColor = localStorage.getItem('theme-color') || 'blue';
        setCurrentColor(savedColor);
        applyThemeColor(savedColor);
    }, []);

    const applyThemeColor = (colorKey) => {
        const theme = THEME_COLORS[colorKey] || THEME_COLORS.blue;
        const root = document.documentElement;
        root.style.setProperty('--primary-h', theme.h);
        root.style.setProperty('--primary-s', theme.s);
        root.style.setProperty('--primary-l', theme.l);
        // Explicitly set the composite variable to ensure immediate global availability
        root.style.setProperty('--primary', `hsl(${theme.h}, ${theme.s}, ${theme.l})`);
    };

    const toggleTheme = (mode) => {
        const newMode = mode === 'dark';
        setIsDarkMode(newMode);
        localStorage.setItem('theme-mode', mode); // 'light' or 'dark'
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    const setThemeColor = (color) => {
        setCurrentColor(color);
        localStorage.setItem('theme-color', color);
        applyThemeColor(color);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, currentColor, setThemeColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
