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

export const theme = (customization) => {
    const themeOption = {
        colors: color,
        heading: color.grey900,
        paper: color.paper,
        backgroundDefault: color.grey100,
        background: color.primaryLight,
        darkTextPrimary: color.grey900,
        darkTextSecondary: color.grey500,
        textDark: color.grey900,
        menuSelected: color.secondaryDark,
        menuSelectedBack: color.secondaryLight,
        divider: color.grey200,
    };

    const themeOptions = {
        direction: 'ltr',
        palette: {
            mode: 'light',
            primary: {
                light: themeOption.colors.primaryLight,
                main: themeOption.colors.primaryMain,
                dark: themeOption.colors.primaryDark,
            },
            secondary: {
                light: themeOption.colors.secondaryLight,
                main: themeOption.colors.secondaryMain,
                dark: themeOption.colors.secondaryDark,
            },
            error: {
                light: themeOption.colors.errorLight,
                main: themeOption.colors.errorMain,
                dark: themeOption.colors.errorDark,
            },
            orange: {
                light: themeOption.colors.orangeLight,
                main: themeOption.colors.orangeMain,
                dark: themeOption.colors.orangeDark,
            },
            warning: {
                light: themeOption.colors.warningLight,
                main: themeOption.colors.warningMain,
                dark: themeOption.colors.warningDark,
            },
            success: {
                light: themeOption.colors.successLight,
                main: themeOption.colors.successMain,
                dark: themeOption.colors.successDark,
            },
            grey: {
                50: themeOption.colors.grey50,
                100: themeOption.colors.grey100,
                500: themeOption.colors.grey500,
                900: themeOption.colors.darkTextPrimary,
            },
            text: {
                primary: themeOption.darkTextPrimary,
                secondary: themeOption.darkTextSecondary,
                dark: themeOption.textDark,
                hint: themeOption.colors.grey100,
            },
            background: {
                paper: themeOption.paper,
                default: themeOption.backgroundDefault,
            },
        },
        typography: {
            fontFamily: `'Roboto', sans-serif`,
            h6: {
                fontWeight: 500,
                color: themeOption.heading,
                fontSize: '0.75rem',
            },
            h5: {
                fontSize: '0.875rem',
                color: themeOption.heading,
                fontWeight: 500,
            },
            h4: {
                fontSize: '1rem',
                color: themeOption.heading,
                fontWeight: 600,
            },
            h3: {
                fontSize: '1.25rem',
                color: themeOption.heading,
                fontWeight: 600,
            },
            h2: {
                fontSize: '1.5rem',
                color: themeOption.heading,
                fontWeight: 700,
            },
            h1: {
                fontSize: '2.125rem',
                color: themeOption.heading,
                fontWeight: 700,
            },
            subtitle1: {
                fontSize: '0.875rem',
                fontWeight: 500,
                color: themeOption.darkTextSecondary,
            },
            subtitle2: {
                fontSize: '0.75rem',
                fontWeight: 400,
                color: themeOption.darkTextSecondary,
            },
            caption: {
                fontSize: '0.75rem',
                color: themeOption.darkTextSecondary,
                fontWeight: 400,
            },
            body1: {
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: '1.334em',
            },
            body2: {
                letterSpacing: '0em',
                fontWeight: 400,
                lineHeight: '1.5em',
                color: themeOption.darkTextSecondary,
            },
            button: {
                textTransform: 'capitalize',
            },
        },
        components: {
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
            MuiCardContent: {
                styleOverrides: {
                    root: {
                        padding: '24px',
                        '&:last-child': {
                            paddingBottom: '24px',
                        },
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '12px',
                        color: themeOption.darkTextPrimary,
                        padding: '10px 16px',
                        '&.Mui-selected': {
                            color: themeOption.menuSelected,
                            backgroundColor: themeOption.menuSelectedBack,
                            '&:hover': {
                                backgroundColor: themeOption.menuSelectedBack,
                            },
                        },
                        '&:hover': {
                            backgroundColor: themeOption.colors.primaryLight,
                            color: themeOption.menuSelected,
                        },
                    },
                },
            },
        },
    };

    return createTheme(themeOptions);
};

// ... (colors definition is fine, keeping it)
// ... (theme function is fine, keeping it)

const ThemeCustomization = ({ children }) => {
    const themes = theme({});

    return (
        <MUIThemeProvider theme={themes}>
            <CssBaseline />
            {children}
        </MUIThemeProvider>
    );
};

export default ThemeCustomization;
