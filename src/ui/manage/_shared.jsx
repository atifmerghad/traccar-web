import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Add, Refresh, WarningAmberRounded } from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../../common/components/LocalizationProvider';

/**
 * Shared styles & primitives for pages under /ui/manage.
 * Keeps every new entity page consistent and tight.
 */

export const useManageStyles = makeStyles({ name: 'ManagePage' })((theme) => {
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
    createButton: {
      borderRadius: theme.spacing(1.5),
      textTransform: 'none',
      fontWeight: 700,
      padding: theme.spacing(1, 2.25),
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': { backgroundColor: theme.palette.primary.dark },
      [theme.breakpoints.down('sm')]: { width: '100%' },
    },
    searchField: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.06)
          : theme.palette.action.hover,
        borderRadius: theme.spacing(1.75),
        height: theme.spacing(5.5),
        fontSize: theme.typography.body2.fontSize,
        color: theme.palette.text.primary,
        '& fieldset': {
          borderColor: isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider,
        },
      },
      '& .MuiOutlinedInput-input::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing(1.5),
      [theme.breakpoints.down('md')]: { gridTemplateColumns: 'repeat(3, 1fr)' },
      [theme.breakpoints.down('sm')]: { gridTemplateColumns: 'repeat(2, 1fr)' },
    },
    statCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      backdropFilter: `blur(${theme.spacing(1.5)})`,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.75),
      padding: theme.spacing(1.75, 2),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      transition: theme.transitions.create(['border-color', 'box-shadow', 'transform'], {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': { borderColor: theme.palette.action.selected },
    },
    statIcon: {
      width: theme.spacing(4.75),
      height: theme.spacing(4.75),
      borderRadius: theme.spacing(1.25),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      fontSize: theme.typography.pxToRem(18.4),
      fontWeight: 800,
      color: theme.palette.text.primary,
      lineHeight: 1.1,
    },
    statLabel: {
      fontSize: theme.typography.pxToRem(11.5),
      color: theme.palette.text.secondary,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: theme.spacing(1.75),
    },
    card: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.75),
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      transition: theme.transitions.create(['transform', 'border-color', 'box-shadow'], {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': {
        transform: `translateY(-${theme.spacing(0.25)})`,
        borderColor: alpha(theme.palette.primary.main, 0.4),
        boxShadow: isDark
          ? `0 ${theme.spacing(0.75)} ${theme.spacing(2.75)} ${alpha(theme.palette.common.black, 0.5)}`
          : `0 ${theme.spacing(0.75)} ${theme.spacing(2.75)} ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: theme.spacing(1.5) },
    cardTitle: {
      fontSize: theme.typography.pxToRem(15.7),
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    cardSub: { fontSize: theme.typography.pxToRem(12.5), color: theme.palette.text.secondary },
    actionRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: theme.spacing(0.5),
      borderTop: `1px solid ${theme.palette.divider}`,
      paddingTop: theme.spacing(1),
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
    emptyWrap: {
      textAlign: 'center',
      padding: theme.spacing(6, 2),
      color: theme.palette.text.secondary,
      border: `1px dashed ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.75),
    },
    dialogPaper: {
      borderRadius: theme.spacing(2.25),
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.97)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
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
    chip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      padding: theme.spacing(0.5, 1.25),
      borderRadius: theme.spacing(0.75),
      fontSize: theme.typography.pxToRem(11.8),
      fontWeight: 600,
    },
    chipRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(0.75),
      marginTop: theme.spacing(0.5),
    },
    attrRow: {
      display: 'flex',
      gap: theme.spacing(1),
      alignItems: 'center',
    },
    attrPair: {
      fontSize: theme.typography.pxToRem(12),
      display: 'flex',
      gap: theme.spacing(0.5),
      alignItems: 'center',
      padding: theme.spacing(0.5, 1.25),
      borderRadius: theme.spacing(0.75),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.action.hover,
      color: theme.palette.text.secondary,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    attrKey: { color: theme.palette.text.disabled, fontWeight: 600 },
    attrValue: { color: theme.palette.text.primary, fontWeight: 600 },
    avatar: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      borderRadius: '50%',
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
      color: theme.palette.primary.main,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: theme.typography.pxToRem(16),
      flexShrink: 0,
    },
    uidRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(1, 1.25),
      borderRadius: theme.spacing(1.25),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.action.hover,
      border: `1px solid ${theme.palette.divider}`,
      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      fontSize: theme.typography.pxToRem(13),
      color: theme.palette.text.primary,
      overflow: 'hidden',
    },
    groupIconBox: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      borderRadius: theme.spacing(1.5),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: alpha(theme.palette.primary.main, 0.18),
      color: theme.palette.primary.main,
      flexShrink: 0,
    },
    countChip: {
      height: theme.spacing(3.25),
      borderRadius: theme.spacing(1),
      fontSize: theme.typography.pxToRem(11.8),
      fontWeight: 600,
      '& .MuiChip-icon': { fontSize: 14 },
    },
    sectionLabel: {
      fontSize: theme.typography.pxToRem(12),
      fontWeight: 700,
      color: theme.palette.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: theme.spacing(0.75),
    },
  };
});

// ─── Page header ──────────────────────────────────────────────────────────────

export const PageHeader = ({
  icon,
  title,
  subtitle,
  onRefresh,
  onCreate,
  createLabel: createLabelProp,
  classes,
}) => {
  const t = useTranslation();
  const createLabel = createLabelProp ?? t('managePageV2');
  return (
    <Box className={classes.headerRow}>
      <Box>
        <Typography className={classes.pageTitle}>
          {icon}
          {title}
        </Typography>
        {subtitle && <Typography className={classes.pageSubtitle}>{subtitle}</Typography>}
      </Box>
      <Stack direction="row" spacing={1}>
        {onRefresh && (
          <Tooltip title={t('sharedRefresh')}>
            <IconButton onClick={onRefresh} className={classes.iconBtn}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onCreate && (
          <Button
            startIcon={<Add />}
            className={classes.createButton}
            onClick={onCreate}
            disableElevation
          >
            {createLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────

export const StatCard = ({ icon, label, value, color, bg, classes }) => (
  <Box className={classes.statCard}>
    <Box className={classes.statIcon} sx={{ bgcolor: bg, color }}>
      {icon}
    </Box>
    <Box>
      <Typography className={classes.statValue}>{value}</Typography>
      <Typography className={classes.statLabel}>{label}</Typography>
    </Box>
  </Box>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

export const EmptyState = ({ icon, title, hint, ctaLabel: ctaLabelProp, onCta, classes }) => {
  const t = useTranslation();
  const ctaLabel = ctaLabelProp ?? t('managePageCreate');
  return (
    <Box className={classes.emptyWrap}>
      {icon}
      <Typography sx={{ fontWeight: 600, mt: 1 }}>{title}</Typography>
      {hint && (
        <Typography
          sx={{ fontSize: (th) => th.typography.pxToRem(13.1), color: 'text.disabled', mb: 2 }}
        >
          {hint}
        </Typography>
      )}
      {onCta && (
        <Button
          startIcon={<Add />}
          variant="contained"
          disableElevation
          onClick={onCta}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          {ctaLabel}
        </Button>
      )}
    </Box>
  );
};

// ─── Card skeleton grid ───────────────────────────────────────────────────────

export const CardSkeletons = ({ count = 6, classes }) => {
  const theme = useTheme();
  return (
    <Box className={classes.cardGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={theme.spacing(17.5)}
          sx={{ borderRadius: theme.spacing(1.75) }}
        />
      ))}
    </Box>
  );
};

// ─── Confirm delete dialog ────────────────────────────────────────────────────

export const ConfirmDeleteDialog = ({
  open,
  onClose,
  onConfirm,
  title: titleProp,
  deleting,
  target,
  warning,
  classes,
}) => {
  const theme = useTheme();
  const t = useTranslation();
  const title = titleProp ?? t('sharedDelete');
  const body = target
    ? t('confirmDeleteBodyNamed').replace('{name}', target)
    : t('confirmDeleteBodyPlain');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ className: classes.dialogPaper }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <WarningAmberRounded color="warning" /> {title}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: theme.typography.body2.fontSize, color: 'text.secondary' }}>
          {body}
        </Typography>
        {warning && (
          <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
            {warning}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting} sx={{ textTransform: 'none' }}>
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={deleting}
          variant="contained"
          color="error"
          disableElevation
          sx={{
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          {deleting ? t('sharedDeleting') : t('sharedDelete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
