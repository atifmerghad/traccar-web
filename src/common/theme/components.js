export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      sizeMedium: {
        height: '40px',
      },
      containedPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
      }),
      outlinedPrimary: ({ theme }) => ({
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
      }),
      textPrimary: ({ theme }) => ({
        color: theme.palette.primary.main,
      }),
      containedSecondary: ({ theme }) => ({
        backgroundColor: theme.palette.secondary.main,
      }),
      outlinedSecondary: ({ theme }) => ({
        borderColor: theme.palette.secondary.main,
        color: theme.palette.secondary.main,
      }),
      textSecondary: ({ theme }) => ({
        color: theme.palette.secondary.main,
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      colorPrimary: ({ theme }) => ({
        color: theme.palette.primary.main,
      }),
      colorSecondary: ({ theme }) => ({
        color: theme.palette.secondary.main,
      }),
    },
  },
  MuiFab: {
    styleOverrides: {
      primary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
      }),
      secondary: ({ theme }) => ({
        backgroundColor: theme.palette.secondary.main,
      }),
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: ({ theme }) => ({
        '&.Mui-checked': {
          color: theme.palette.primary.main,
        },
        '&.Mui-checked + .MuiSwitch-track': {
          backgroundColor: theme.palette.primary.main,
        },
      }),
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.primary.main,
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      filledPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
      }),
      outlinedPrimary: ({ theme }) => ({
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
      }),
      filledSecondary: ({ theme }) => ({
        backgroundColor: theme.palette.secondary.main,
      }),
      outlinedSecondary: ({ theme }) => ({
        borderColor: theme.palette.secondary.main,
        color: theme.palette.secondary.main,
      }),
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      enterDelay: 500,
      enterNextDelay: 500,
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        '@media print': {
          color: theme.palette.alwaysDark.main,
        },
      }),
    },
  },
};
