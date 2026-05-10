import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  InputAdornment,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Edit,
  Delete,
  Add,
  Layers,
  MedicalServicesOutlined,
  Construction,
  Waves,
  BuildOutlined,
  Refresh,
  Close,
  WarningAmberOutlined,
  CheckCircleOutlineOutlined,
  TimerOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from '../layout/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const useStyles = makeStyles({ name: 'MaintenancePage' })((theme) => {
  const isDark = theme.palette.mode === 'dark';
  const gradEnd = isDark
    ? alpha(theme.palette.common.white, 0.04)
    : alpha(theme.palette.common.black, 0.04);
  const surfaceInput = isDark
    ? alpha(theme.palette.common.white, 0.06)
    : theme.palette.action.hover;
  const borderSoft = isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider;
  const borderSoft2 = isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider;
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
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing(3),
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
    searchAndFilterRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing(3),
      flexWrap: 'wrap',
      gap: theme.spacing(2),
    },
    searchField: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: surfaceInput,
        borderRadius: '25px',
        width: '350px',
        height: theme.spacing(5.5),
        fontSize: theme.typography.body2.fontSize,
        color: theme.palette.text.primary,
        '& fieldset': { borderColor: borderSoft2 },
        '&:hover fieldset': {
          borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
        },
      },
      '& .MuiOutlinedInput-input::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
      [theme.breakpoints.down('md')]: {
        '& .MuiOutlinedInput-root': { width: '100%' },
      },
    },
    filterIcon: {
      width: theme.spacing(5),
      height: theme.spacing(5),
      border: `1px solid ${borderSoft2}`,
      backgroundColor: surfaceInput,
      color: theme.palette.text.secondary,
      borderRadius: theme.spacing(1),
    },
    filterIconActive: {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      color: theme.palette.primary.main,
    },
    createButton: {
      borderRadius: '25px',
      textTransform: 'none',
      fontWeight: 600,
      padding: theme.spacing(1, 3),
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      transition: theme.transitions.create(['background-color'], {
        duration: theme.transitions.duration.short,
      }),
      '&:hover': { backgroundColor: theme.palette.primary.dark },
      [theme.breakpoints.down('sm')]: { width: '100%' },
    },
    maintenanceCard: {
      borderRadius: theme.spacing(1.5),
      overflow: 'hidden',
      border: `1px solid ${borderSoft}`,
      backdropFilter: 'blur(12px)',
      transition: theme.transitions.create(['transform', 'box-shadow'], {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': { transform: 'translateY(-3px)', boxShadow: theme.shadows[isDark ? 12 : 6] },
    },
    bgRed: {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.error.main, 0.12)} 0%, ${gradEnd} 100%)`,
    },
    bgOrange: {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${gradEnd} 100%)`,
    },
    bgGreen: {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${gradEnd} 100%)`,
    },
    bgTeal: {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.info.main, 0.12)} 0%, ${gradEnd} 100%)`,
    },
    cardHeader: {
      padding: theme.spacing(2, 2, 1, 2),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: theme.typography.pxToRem(15.2),
      fontWeight: 700,
      color: theme.palette.text.primary,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    },
    priceChip: { fontWeight: 700, borderRadius: theme.spacing(0.5), height: theme.spacing(3) },
    vehicleInfo: {
      fontSize: theme.typography.pxToRem(12),
      color: theme.palette.text.secondary,
      padding: theme.spacing(0, 2, 2, 5),
      fontWeight: 500,
    },
    detailsGrid: {
      padding: theme.spacing(0, 2),
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      rowGap: theme.spacing(0.5),
      columnGap: theme.spacing(1.5),
      fontSize: theme.typography.pxToRem(12.8),
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    },
    label: { color: theme.palette.text.disabled },
    value: { color: theme.palette.text.primary, fontWeight: 600 },
    progressSection: { padding: theme.spacing(2) },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: theme.spacing(0.75),
      '& span': {
        fontSize: theme.typography.pxToRem(12),
        color: theme.palette.text.disabled,
        fontWeight: 600,
      },
    },
    progressBar: { height: 6, borderRadius: 3 },
    cardActions: {
      display: 'flex',
      borderTop: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.divider}`,
      '& button': {
        flex: 1,
        textTransform: 'none',
        color: theme.palette.text.secondary,
        fontSize: theme.typography.body2.fontSize,
        padding: theme.spacing(1),
      },
    },
    summaryBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: theme.spacing(1.25, 2),
      borderRadius: theme.spacing(1.5),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : theme.palette.action.hover,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${borderSoft}`,
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 600,
      [theme.breakpoints.down('sm')]: {
        width: '100%',
        justifyContent: 'center',
        padding: theme.spacing(1, 1.25),
        gap: theme.spacing(0.75),
        fontSize: theme.typography.pxToRem(12.5),
      },
    },
  };
});

const buildTypeLabels = (t) => ({
  totalDistance: t('maintenanceMetricTotalDistance'),
  odometer: t('maintenanceMetricOdometer'),
  hours: t('maintenanceMetricHours'),
  drivingTime: t('maintenanceMetricDrivingTime'),
  deviceTime: t('maintenanceMetricDeviceTime'),
  fixTime: t('maintenanceMetricFixTime'),
  serverTime: t('maintenanceMetricServerTime'),
});

const FILTER_ALL = 'all';
const FILTER_EXPIRED = 'expired';
const FILTER_URGENT = 'urgent';
const FILTER_UPCOMING = 'upcoming';

const formatStart = (type, start, t) => {
  if (!type || start == null) return '—';
  if (type.endsWith('Time')) return dayjs(start).format('DD/MM/YYYY');
  if (type === 'hours' || type === 'drivingTime')
    return `${(start / 3600000).toFixed(0)} ${t('maintenanceUnitH')}`;
  return `${(start / 1000).toFixed(0)} ${t('maintenanceUnitKm')}`;
};

const formatPeriod = (type, period, t) => {
  if (!type || period == null) return '—';
  if (type.endsWith('Time')) return `${(period / 86400000).toFixed(0)} ${t('maintenanceUnitDays')}`;
  if (type === 'hours' || type === 'drivingTime')
    return `${(period / 3600000).toFixed(0)} ${t('maintenanceUnitH')}`;
  return `${(period / 1000).toFixed(0)} ${t('maintenanceUnitKm')}`;
};

const computeProgress = (type, start, period, currentValue, t) => {
  if (!type || start == null || period == null || period === 0)
    return { progress: 0, remaining: '—', endValue: null, expired: false };
  if (type.endsWith('Time')) {
    const now = Date.now();
    const end = start + period;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / period) * 100));
    const remainingMs = end - now;
    const remainingDays = Math.ceil(remainingMs / 86400000);
    const remaining =
      remainingDays <= 0
        ? t('maintenanceRemainingDaysZero')
        : t('maintenanceRemainingDays').replace('{n}', String(remainingDays));
    return {
      progress: Math.round(progress),
      remaining,
      endValue: dayjs(end).format('DD/MM/YYYY'),
      expired: remainingDays <= 0,
    };
  }
  if (type === 'hours' || type === 'drivingTime') {
    const end = start + period;
    const curr = currentValue || 0;
    const progress = Math.min(100, Math.max(0, ((curr - start) / period) * 100));
    const remainingH = Math.max(0, (end - curr) / 3600000);
    const remaining =
      remainingH <= 0
        ? t('maintenanceRemainingHoursZero')
        : t('maintenanceRemainingHours').replace('{n}', remainingH.toFixed(1));
    return {
      progress: Math.round(progress),
      remaining,
      endValue: `${(end / 3600000).toFixed(0)} ${t('maintenanceUnitH')}`,
      expired: remainingH <= 0,
    };
  }
  const end = start + period;
  const curr = currentValue || 0;
  const progress = Math.min(100, Math.max(0, ((curr - start) / period) * 100));
  const remainingM = Math.max(0, end - curr);
  const remaining =
    remainingM <= 0
      ? t('maintenanceRemainingKmZero')
      : t('maintenanceRemainingKm').replace('{n}', String((remainingM / 1000).toFixed(0)));
  return {
    progress: Math.round(progress),
    remaining,
    endValue: `${(end / 1000).toFixed(0)} ${t('maintenanceUnitKm')}`,
    expired: remainingM <= 0,
  };
};

const statusFromProgress = (progress, expired) => {
  if (expired || progress >= 100) return 'red';
  if (progress >= 75) return 'orange';
  if (progress >= 30) return 'green';
  return 'teal';
};

const currentValueForType = (type, position) => {
  if (!position) return 0;
  if (type === 'totalDistance') return position.attributes?.totalDistance || 0;
  if (type === 'odometer') return position.attributes?.odometer || 0;
  if (type === 'hours') return position.attributes?.hours || 0;
  if (type === 'drivingTime') return position.attributes?.drivingTime || 0;
  return 0;
};

const CardSkeleton = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const skelBg = isDark
    ? alpha(theme.palette.common.white, 0.08)
    : alpha(theme.palette.common.black, 0.08);
  return (
    <Box sx={{ width: '100%', flexShrink: 0 }}>
      <Box
        sx={{
          borderRadius: theme.spacing(1.5),
          p: 2,
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
          backgroundColor: isDark
            ? alpha(theme.palette.common.white, 0.04)
            : theme.palette.action.hover,
        }}
      >
        <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: skelBg }} />
        <Skeleton variant="text" width="40%" height={18} sx={{ mb: 1, bgcolor: skelBg }} />
        <Skeleton
          variant="rectangular"
          height={60}
          sx={{ borderRadius: 1, mb: 1, bgcolor: skelBg }}
        />
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, bgcolor: skelBg }} />
      </Box>
    </Box>
  );
};

const MaintenanceDialog = ({ open, onClose, onSave, devices, editItem }) => {
  const theme = useTheme();
  const t = useTranslation();
  const editableTypes = useMemo(
    () => [
      { key: 'totalDistance', label: t('maintenanceTypeTotalDistanceKm') },
      { key: 'odometer', label: t('maintenanceTypeOdometerKm') },
      { key: 'hours', label: t('maintenanceMetricHours') },
      { key: 'fixTime', label: t('maintenanceTypeFixDate') },
      { key: 'deviceTime', label: t('maintenanceTypeDeviceDate') },
    ],
    [t],
  );
  const isDark = theme.palette.mode === 'dark';
  const isEdit = !!editItem;
  const [form, setForm] = useState({
    name: '',
    type: 'totalDistance',
    start: '',
    period: '',
    deviceIds: [],
  });

  const dialogSx = {
    borderRadius: theme.spacing(2.5),
    backgroundColor: isDark
      ? alpha(theme.palette.background.default, 0.97)
      : theme.palette.background.paper,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.06)
        : theme.palette.action.hover,
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
      },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& .MuiInputLabel-root': { color: theme.palette.text.disabled },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
    '& .MuiSelect-select': { color: theme.palette.text.primary },
  };

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        type: editItem.type || 'totalDistance',
        start: editItem._startDisplay || '',
        period: editItem._periodDisplay || '',
        deviceIds: Array.isArray(editItem._deviceIds)
          ? editItem._deviceIds
          : editItem._deviceId
            ? [editItem._deviceId]
            : [],
      });
    } else {
      setForm({ name: '', type: 'totalDistance', start: '', period: '', deviceIds: [] });
    }
  }, [editItem, open]);

  const isTimeType = form.type?.endsWith('Time');
  const toRaw = (key, val) => {
    const v = parseFloat(val) || 0;
    if (key === 'start' && isTimeType) return dayjs(form.start).valueOf();
    if (key === 'period' && isTimeType) return v * 86400000;
    if (form.type === 'hours' || form.type === 'drivingTime') return v * 3600000;
    return v * 1000;
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      type: form.type,
      start: toRaw('start', form.start),
      period: toRaw('period', form.period),
    };
    await onSave(payload, form.deviceIds, editItem?.id);
    onClose();
  };

  const unitHint =
    form.type === 'hours' || form.type === 'drivingTime'
      ? t('maintenanceUnitH')
      : t('maintenanceUnitKm');
  const startLabel = isTimeType ? t('maintenanceStart') : `${t('maintenanceStart')} (${unitHint})`;
  const periodLabel = isTimeType
    ? t('maintenancePeriod')
    : `${t('maintenancePeriod')} (${unitHint})`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogSx }}>
      <DialogTitle
        sx={{
          fontWeight: 800,
          fontSize: theme.typography.pxToRem(17.6),
          pb: 1,
          color: theme.palette.text.primary,
        }}
      >
        {isEdit ? t('sharedEdit') : t('sharedNew')}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: theme.palette.text.secondary }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: `${theme.spacing(1.5)} !important`,
        }}
      >
        <TextField
          label={t('sharedName')}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
          size="small"
          sx={inputSx}
        />
        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel>{t('sharedType')}</InputLabel>
          <Select
            label={t('sharedType')}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, start: '', period: '' })}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.1)
                  : theme.palette.divider,
              },
              '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
            }}
          >
            {editableTypes.map((row) => (
              <MenuItem key={row.key} value={row.key}>
                {row.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={startLabel}
          type={isTimeType ? 'date' : 'number'}
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
          fullWidth
          size="small"
          sx={inputSx}
          InputLabelProps={isTimeType ? { shrink: true } : undefined}
        />
        <TextField
          label={periodLabel}
          type="number"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value })}
          fullWidth
          size="small"
          sx={inputSx}
        />
        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel>{t('sharedDevice')}</InputLabel>
          <Select
            multiple
            label={t('sharedDevice')}
            value={form.deviceIds}
            onChange={(e) => setForm({ ...form, deviceIds: e.target.value })}
            renderValue={(selected) => {
              if (!selected.length) return t('sharedNoData');
              return selected
                .map((id) => devices.find((d) => d.id === id))
                .filter(Boolean)
                .map((d) => d.name || d.uniqueId)
                .join(', ');
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.1)
                  : theme.palette.divider,
              },
              '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
            }}
          >
            {devices.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name || d.uniqueId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none', color: theme.palette.text.secondary }}
        >
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!form.name || !form.type || !form.start || !form.period}
          sx={{
            textTransform: 'none',
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            borderRadius: 2,
          }}
        >
          {isEdit ? t('sharedSave') : t('managePageCreate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteDialog = ({ open, onClose, onConfirm, name }) => {
  const theme = useTheme();
  const t = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const dialogSx = {
    borderRadius: theme.spacing(2.5),
    backgroundColor: isDark
      ? alpha(theme.palette.background.default, 0.97)
      : theme.palette.background.paper,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogSx }}>
      <DialogTitle sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
        {t('sharedRemove')}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: theme.palette.text.primary }}>
          {t('sharedRemoveConfirm')}{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>
            {name}
          </Box>{' '}
          ?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none', color: theme.palette.text.secondary }}
        >
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            textTransform: 'none',
            bgcolor: theme.palette.error.main,
            '&:hover': { bgcolor: theme.palette.error.dark },
            borderRadius: 2,
          }}
        >
          {t('sharedRemove')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MaintenanceDashboard = () => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maintenances, setMaintenances] = useState([]);
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState({});
  const [deviceMaintenanceMap, setDeviceMaintenanceMap] = useState({});
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mRes = await fetchOrThrow('/api/maintenance');
      const mData = await mRes.json();
      setMaintenances(mData);

      const dRes = await fetchOrThrow('/api/devices');
      const dData = await dRes.json();
      setDevices(dData);

      try {
        const pRes = await fetchOrThrow('/api/positions');
        const pData = await pRes.json();
        const pMap = {};
        pData.forEach((p) => {
          pMap[p.deviceId] = p;
        });
        setPositions(pMap);
      } catch {
        /* positions are optional */
      }

      const devMainMap = {};
      await Promise.all(
        dData.map(async (device) => {
          try {
            const r = await fetchOrThrow(`/api/maintenance?deviceId=${device.id}`);
            const linked = await r.json();
            linked.forEach((m) => {
              if (!devMainMap[m.id]) devMainMap[m.id] = [];
              devMainMap[m.id].push(device.id);
            });
          } catch {
            /* ignore per-device link failures */
          }
        }),
      );
      setDeviceMaintenanceMap(devMainMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deviceMap = useMemo(() => {
    const map = {};
    devices.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [devices]);

  const typeLabels = useMemo(() => buildTypeLabels(t), [t]);

  const cards = useMemo(
    () =>
      maintenances.flatMap((m) => {
        const linkedDeviceIds = deviceMaintenanceMap[m.id] || [];
        const deviceEntries =
          linkedDeviceIds.length > 0
            ? linkedDeviceIds.map((did) => ({ deviceId: did, device: deviceMap[did] }))
            : [{ deviceId: null, device: null }];
        return deviceEntries.map(({ deviceId, device }) => {
          const position = deviceId ? positions[deviceId] : null;
          const currValue = currentValueForType(m.type, position);
          const { progress, remaining, endValue, expired } = computeProgress(
            m.type,
            m.start,
            m.period,
            currValue,
            t,
          );
          const status = statusFromProgress(progress, expired);
          const typeLabel = typeLabels[m.type] || m.type;
          const price = m.attributes?.cost;
          const vehicleName = device ? device.name || device.uniqueId || `#${device.id}` : '—';
          return {
            _id: `${m.id}-${deviceId ?? 'none'}`,
            _maintenanceId: m.id,
            _deviceId: deviceId,
            _startDisplay: formatStart(m.type, m.start, t),
            _periodDisplay: formatPeriod(m.type, m.period, t),
            id: m.id,
            name: m.name,
            type: m.type,
            typeLabel,
            start: m.start,
            period: m.period,
            vehicleName,
            price,
            debut: formatStart(m.type, m.start, t),
            fin: endValue || '—',
            remaining,
            progress,
            status,
            expired,
            attributes: m.attributes,
          };
        });
      }),
    [maintenances, deviceMaintenanceMap, deviceMap, positions, typeLabels, t],
  );

  const filtered = useMemo(() => {
    let result = cards;
    if (activeFilter === FILTER_EXPIRED) result = result.filter((c) => c.expired);
    if (activeFilter === FILTER_URGENT)
      result = result.filter((c) => !c.expired && c.progress >= 75);
    if (activeFilter === FILTER_UPCOMING)
      result = result.filter((c) => !c.expired && c.progress < 75);
    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.vehicleName.toLowerCase().includes(kw) ||
          c.typeLabel.toLowerCase().includes(kw),
      );
    }
    return result;
  }, [cards, activeFilter, searchValue]);

  const countExpired = cards.filter((c) => c.expired).length;
  const countUrgent = cards.filter((c) => !c.expired && c.progress >= 75).length;
  const countOk = cards.filter((c) => !c.expired && c.progress < 75).length;

  const handleSave = async (payload, deviceIds, existingId) => {
    try {
      let savedId = existingId;
      if (existingId) {
        await fetchOrThrow(`/api/maintenance/${existingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingId, ...payload }),
        });
      } else {
        const r = await fetchOrThrow('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = await r.json();
        savedId = created.id;
      }

      if (savedId) {
        const targetIds = (deviceIds || [])
          .map((id) => parseInt(id, 10))
          .filter((id) => !Number.isNaN(id));
        const currentIds = deviceMaintenanceMap[savedId] || [];
        const toAdd = targetIds.filter((id) => !currentIds.includes(id));
        const toRemove = currentIds.filter((id) => !targetIds.includes(id));

        await Promise.all(
          toAdd.map((deviceId) =>
            fetchOrThrow('/api/permissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId, maintenanceId: savedId }),
            }),
          ),
        );
        await Promise.all(
          toRemove.map((deviceId) =>
            fetchOrThrow(`/api/permissions?deviceId=${deviceId}&maintenanceId=${savedId}`, {
              method: 'DELETE',
            }),
          ),
        );
      }
      setSnack({ open: true, msg: t('sharedSaved'), severity: 'success' });
      fetchAll();
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchOrThrow(`/api/maintenance/${deleteTarget.id}`, { method: 'DELETE' });
      setSnack({ open: true, msg: t('sharedSaved'), severity: 'success' });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' });
    }
  };

  const statusColors = (status) =>
    ({
      red: {
        bg: classes.bgRed,
        bar: theme.palette.error.main,
        text: theme.palette.error.main,
        chipBg: alpha(theme.palette.error.main, 0.15),
      },
      orange: {
        bg: classes.bgOrange,
        bar: theme.palette.warning.main,
        text: theme.palette.warning.main,
        chipBg: alpha(theme.palette.warning.main, 0.15),
      },
      green: {
        bg: classes.bgGreen,
        bar: theme.palette.success.main,
        text: theme.palette.success.main,
        chipBg: alpha(theme.palette.success.main, 0.15),
      },
      teal: {
        bg: classes.bgTeal,
        bar: theme.palette.info.main,
        text: theme.palette.info.main,
        chipBg: alpha(theme.palette.info.main, 0.15),
      },
    })[status] || {
      bg: classes.bgTeal,
      bar: theme.palette.info.main,
      text: theme.palette.info.main,
      chipBg: alpha(theme.palette.info.main, 0.15),
    };

  const typeIcon = (type) => {
    if (type?.endsWith('Time') || type === 'deviceTime' || type === 'fixTime')
      return <TimerOutlined sx={{ fontSize: 18 }} />;
    if (type === 'hours' || type === 'drivingTime') return <BuildOutlined sx={{ fontSize: 18 }} />;
    return <Construction sx={{ fontSize: 18 }} />;
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        <Box className={classes.headerRow}>
          <Box>
            <Typography className={classes.pageTitle}>{t('maintenancePageTitle')}</Typography>
            <Typography className={classes.pageSubtitle}>{t('maintenancePageSubtitle')}</Typography>
          </Box>
          <Tooltip title={t('sharedRefresh')}>
            <IconButton
              onClick={fetchAll}
              disabled={loading}
              sx={{
                bgcolor: isDark
                  ? alpha(theme.palette.common.white, 0.06)
                  : theme.palette.action.hover,
                border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
                '&:hover': {
                  bgcolor: isDark
                    ? alpha(theme.palette.common.white, 0.1)
                    : theme.palette.action.selected,
                },
              }}
            >
              <Refresh
                sx={{ color: loading ? theme.palette.text.disabled : theme.palette.success.main }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        {!loading && (
          <Box
            sx={{
              mb: 3,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box className={classes.summaryBadge}>
              <WarningAmberOutlined sx={{ color: theme.palette.error.main, fontSize: 18 }} />
              <Typography component="span" sx={{ color: 'error.main' }}>
                {countExpired}
              </Typography>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                {t('maintenanceSummaryExpired')}
              </Typography>
            </Box>
            <Box className={classes.summaryBadge}>
              <WarningAmberOutlined sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
              <Typography component="span" sx={{ color: 'warning.main' }}>
                {countUrgent}
              </Typography>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                {t('maintenanceSummaryUrgentHint')}
              </Typography>
            </Box>
            <Box className={classes.summaryBadge}>
              <CheckCircleOutlineOutlined
                sx={{ color: theme.palette.success.main, fontSize: 18 }}
              />
              <Typography component="span" sx={{ color: 'success.main' }}>
                {countOk}
              </Typography>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                {t('maintenanceSummaryOk')}
              </Typography>
            </Box>
          </Box>
        )}

        {error && (
          <Box
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
              borderRadius: 2,
              p: 2,
              mb: 3,
            }}
          >
            <Typography
              sx={{
                color: 'error.main',
                fontSize: theme.typography.body2.fontSize,
                fontWeight: 600,
              }}
            >
              ⚠ {error}
            </Typography>
          </Box>
        )}

        <Box className={classes.searchAndFilterRow}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: { xs: '100%', md: 'auto' }, flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            <TextField
              placeholder={`${t('sharedSearch')}...`}
              className={classes.searchField}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.disabled }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {[
              {
                key: FILTER_ALL,
                Icon: Layers,
                title: t('maintenanceFilterAll'),
                color: theme.palette.text.secondary,
              },
              {
                key: FILTER_EXPIRED,
                Icon: MedicalServicesOutlined,
                title: t('maintenanceFilterExpired'),
                color: theme.palette.error.main,
              },
              {
                key: FILTER_URGENT,
                Icon: Waves,
                title: t('maintenanceFilterUrgent'),
                color: theme.palette.warning.main,
              },
              {
                key: FILTER_UPCOMING,
                Icon: BuildOutlined,
                title: t('maintenanceFilterUpcoming'),
                color: theme.palette.success.main,
              },
            ].map(({ key, Icon, title, color }) => (
              <Tooltip key={key} title={title}>
                <IconButton
                  onClick={() => setActiveFilter(key)}
                  className={cx(
                    classes.filterIcon,
                    activeFilter === key && classes.filterIconActive,
                  )}
                >
                  <Icon
                    sx={{
                      fontSize: 18,
                      color: activeFilter === key ? theme.palette.primary.main : color,
                    }}
                  />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
          <Button
            startIcon={<Add />}
            className={classes.createButton}
            onClick={() => {
              setEditItem(null);
              setDialogOpen(true);
            }}
          >
            {t('sharedNew')}
          </Button>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
            gap: 2.5,
          }}
        >
          {loading ? (
            [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: theme.typography.body2.fontSize,
                }}
              >
                {t('sharedNoData')}
              </Typography>
            </Box>
          ) : (
            filtered.map((item) => {
              const colors = statusColors(item.status);
              const isExpired = item.expired;
              return (
                <Box key={item._id} sx={{ minWidth: 0 }}>
                  <Box className={cx(classes.maintenanceCard, colors.bg)}>
                    <Box className={classes.cardHeader}>
                      <Typography className={classes.cardTitle}>
                        {typeIcon(item.type)}
                        {item.name}
                      </Typography>
                      <Chip
                        label={
                          item.price != null ? parseFloat(item.price).toFixed(2) : item.typeLabel
                        }
                        className={classes.priceChip}
                        sx={{
                          color: colors.text,
                          bgcolor: colors.chipBg,
                          fontSize: theme.typography.caption.fontSize,
                          border: `1px solid ${alpha(colors.text, 0.2)}`,
                        }}
                      />
                    </Box>
                    <Typography className={classes.vehicleInfo}>{item.vehicleName}</Typography>
                    <Box className={classes.detailsGrid}>
                      <span className={classes.label}>
                        {t('maintenanceLabelStart')}:{' '}
                        <span className={classes.value}>{item.debut}</span>
                      </span>
                      <span className={classes.label}>
                        {t('maintenanceLabelEnd')}:{' '}
                        <span className={classes.value}>{item.fin}</span>
                      </span>
                      <span className={classes.label}>
                        {t('maintenanceLabelRemaining')}:{' '}
                        <Box
                          component="span"
                          className={classes.value}
                          sx={{ fontWeight: 800, color: isExpired ? 'error.main' : colors.text }}
                        >
                          {item.remaining}
                        </Box>
                      </span>
                      <span className={classes.label}>
                        {t('maintenanceLabelPeriod')}:{' '}
                        <span className={classes.value}>{item._periodDisplay}</span>
                      </span>
                    </Box>
                    <Box className={classes.progressSection}>
                      <Box className={classes.progressHeader}>
                        <span>{t('maintenanceProgress')}</span>
                        <Typography component="span" sx={{ color: 'text.primary' }}>
                          {item.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.progress}
                        className={classes.progressBar}
                        sx={{
                          bgcolor: isDark
                            ? alpha(theme.palette.common.white, 0.08)
                            : theme.palette.action.disabledBackground,
                          '& .MuiLinearProgress-bar': { bgcolor: colors.bar },
                        }}
                      />
                    </Box>
                    <Box className={classes.cardActions}>
                      <Button
                        startIcon={<Edit sx={{ fontSize: 16 }} />}
                        onClick={() => {
                          setEditItem({
                            ...item,
                            _deviceIds: deviceMaintenanceMap[item._maintenanceId] || [],
                          });
                          setDialogOpen(true);
                        }}
                      >
                        {t('sharedEdit')}
                      </Button>
                      <Button
                        startIcon={<Delete sx={{ fontSize: 16 }} />}
                        onClick={() => setDeleteTarget(item)}
                        sx={{ color: 'error.main' }}
                      >
                        {t('sharedRemove')}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      <MaintenanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        devices={devices}
        editItem={editItem}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.name}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.severity}
          sx={{ borderRadius: 2 }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default MaintenanceDashboard;
