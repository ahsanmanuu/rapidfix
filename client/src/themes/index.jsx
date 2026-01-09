import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const color = {
    paper: '#ffffff',
    primaryLight: '#e3f2fd',
    primary200: '#90caf9',
    primaryMain: '#2196f3',
    primaryDark: '#1e88e5',
    secondaryLight: '#ede7f6',
    secondaryMain: '#673ab7',
    secondaryDark: '#5e35b1',
    successLight: '#b9f6ca',
    successMain: '#00e676',
    successDark: '#00c853',
    errorLight: '#ef9a9a',
    errorMain: '#f44336',
    errorDark: '#c62828',
    orangeLight: '#fbe9e7',
    orangeMain: '#ffab91',
    orangeDark: '#d84315',
    warningLight: '#fff8e1',
    warningMain: '#ffe57f',
    warningDark: '#ffc107',
    grey50: '#F8FAFC',
    grey100: '#EEF2F6',
    grey200: '#E3E8EF',
    grey300: '#CDD5DF',
    grey500: '#697586',
    grey900: '#121926',
    darkPaper: '#111936',
    darkBackground: '#1a223f',
    darkLevel1: '#29314f',
    darkLevel2: '#212946',
    darkTextTitle: '#d7dcec',
    darkTextPrimary: '#bdc8f0',
    darkTextSecondary: '#8492c4',
    darkPrimaryLight: '#eef2f6',
    darkPrimaryMain: '#2196f3',
    darkPrimaryDark: '#1e88e5',
    darkSecondaryLight: '#d1c4e9',
    darkSecondaryMain: '#7c4dff',
    darkSecondaryDark: '#651fff',

};

import { useTheme } from '../context/ThemeContext';

// ... (keep color definition)

export const theme = (customization) => {
    const mode = customization.isDarkMode ? 'dark' : 'light';
    // ... (rest of simple colors)

    const themeOptions = {
        direction: 'ltr',
        palette: {
            mode: mode, // DYNAMIC MODE
            primary: {
                light: customization.isDarkMode ? color.darkPrimaryLight : color.primaryLight,
                main: customization.isDarkMode ? color.darkPrimaryMain : color.primaryMain,
                dark: customization.isDarkMode ? color.darkPrimaryDark : color.primaryDark,
            },
            background: {
                paper: customization.isDarkMode ? color.darkPaper : color.paper,
                default: customization.isDarkMode ? color.darkBackground : color.backgroundDefault,
            },
            // ... (keep other palette items, maybe adjust for dark mode if needed, but primary/background are key)
            text: {
                primary: customization.isDarkMode ? color.darkTextPrimary : color.grey900,
                secondary: customization.isDarkMode ? color.darkTextSecondary : color.grey500,
            }
        },
        // ... (typography)
        components: {
            // ...
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                    rounded: {
                        borderRadius: '12px',
                    },
                },
            },
        }
    };

    return createTheme(themeOptions);
};

const ThemeCustomization = ({ children }) => {
    const { isDarkMode } = useTheme();

    // value logic to pass to theme function
    const themes = theme({ isDarkMode });

    return (
        <MUIThemeProvider theme={themes}>
            <CssBaseline />
            {children}
        </MUIThemeProvider>
    );
};

export default ThemeCustomization;
