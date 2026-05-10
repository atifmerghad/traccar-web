import { Box, Typography, Button, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../../common/components/LocalizationProvider';

/**
 * Shared styles + primitives for form-style pages under /ui/system.
 * Form pages are not lists; they show grouped sections (cards) and bottom actions.
 */

export const useSystemStyles = makeStyles({ name: 'SystemPage' })((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      width: '100%',
      flex: 1,
      boxSizing: 'border-box',
      padding: theme.spacing(3),
      [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2.5),
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing(1.5),
      flexWrap: 'wrap',
    },
    pageTitle: {
      fontWeight: 800,
      color: theme.palette.text.primary,
      fontSize: theme.typography.h6.fontSize,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      [theme.breakpoints.down('sm')]: { fontSize: theme.typography.pxToRem(16.8) },
    },
    pageSubtitle: {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.body2.fontSize,
    },
    container: {
      width: '100%',
      maxWidth: theme.spacing(115),
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    },
    section: {
      borderRadius: theme.spacing(2),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: theme.spacing(1.75, 2.25),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.25),
      borderBottom: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark ? alpha(theme.palette.common.white, 0.02) : 'transparent',
    },
    sectionTitle: {
      fontWeight: 700,
      fontSize: theme.typography.pxToRem(15.4),
      color: theme.palette.text.primary,
    },
    sectionHint: { fontSize: theme.typography.pxToRem(12.5), color: theme.palette.text.secondary },
    sectionBody: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    },
    formRow2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing(2),
      [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
    },
    formRow3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: theme.spacing(2),
      [theme.breakpoints.down('md')]: { gridTemplateColumns: '1fr 1fr' },
      [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
    },
    inputDark: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.05)
          : theme.palette.action.hover,
        borderRadius: theme.spacing(1.25),
        color: theme.palette.text.primary,
        fontSize: theme.typography.pxToRem(14.1),
        '& fieldset': { borderColor: theme.palette.divider },
        '&:hover fieldset': { borderColor: theme.palette.action.selected },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 2 },
      },
      '& .MuiInputLabel-root': {
        color: theme.palette.text.disabled,
        fontSize: theme.typography.body2.fontSize,
      },
      '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.light },
    },
    iconBtn: {
      width: theme.spacing(4),
      height: theme.spacing(4),
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      '&:hover': {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.action.selected,
      },
    },
    bottomBar: {
      position: 'sticky',
      bottom: 0,
      zIndex: 1,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.92)
        : alpha(theme.palette.background.paper, 0.92),
      backdropFilter: `blur(${theme.spacing(1.5)})`,
      borderTop: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5),
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(1),
      borderRadius: theme.spacing(1.5),
    },
  };
});

export const PageHeader = ({ icon, title, subtitle, classes, right }) => (
  <Box className={classes.headerRow}>
    <Box>
      <Typography className={classes.pageTitle}>
        {icon}
        {title}
      </Typography>
      {subtitle && <Typography className={classes.pageSubtitle}>{subtitle}</Typography>}
    </Box>
    {right && (
      <Stack direction="row" spacing={1}>
        {right}
      </Stack>
    )}
  </Box>
);

export const Section = ({ icon, title, hint, classes, children }) => {
  const theme = useTheme();
  return (
    <Box className={classes.section}>
      <Box className={classes.sectionHeader}>
        {icon && (
          <Box
            sx={{
              width: theme.spacing(4),
              height: theme.spacing(4),
              borderRadius: theme.spacing(1.25),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              color: 'primary.light',
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography className={classes.sectionTitle}>{title}</Typography>
          {hint && <Typography className={classes.sectionHint}>{hint}</Typography>}
        </Box>
      </Box>
      <Box className={classes.sectionBody}>{children}</Box>
    </Box>
  );
};

export const BottomBar = ({
  onCancel,
  onSave,
  saving,
  valid = true,
  classes,
  saveLabel: saveLabelProp,
  cancelLabel: cancelLabelProp,
}) => {
  const t = useTranslation();
  const saveLabel = saveLabelProp ?? t('sharedSave');
  const cancelLabel = cancelLabelProp ?? t('sharedCancel');
  return (
    <Box className={classes.bottomBar}>
      {onCancel && (
        <Button onClick={onCancel} sx={{ textTransform: 'none' }}>
          {cancelLabel}
        </Button>
      )}
      <Button
        onClick={onSave}
        disabled={!valid || saving}
        variant="contained"
        disableElevation
        sx={{
          textTransform: 'none',
          fontWeight: 700,
        }}
      >
        {saving ? t('sharedSaving') : saveLabel}
      </Button>
    </Box>
  );
};
