import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, IconButton,
  LinearProgress, Chip, InputAdornment, Stack, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Snackbar, Alert,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search, Edit, Delete, Add, Layers, MedicalServicesOutlined,
  Construction, Waves, BuildOutlined, Refresh, Close,
  WarningAmberOutlined, CheckCircleOutlineOutlined, TimerOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from './PageLayout';

const useStyles = makeStyles({ name: 'MaintenancePage' })((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      width: '100%',
      flex: 1,
      boxSizing: 'border-box',
      padding: theme.spacing(3),
      [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      background: theme.palette.background.default,
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
      fontSize: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      [theme.breakpoints.down('sm')]: { fontSize: '1.05rem' },
    },
    pageSubtitle: { color: theme.palette.text.secondary, fontSize: '0.85rem' },
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
        background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
        borderRadius: '25px',
        width: '350px',
        height: '45px',
        fontSize: '0.9rem',
        color: theme.palette.text.primary,
        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider },
        '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider },
      },
      '& .MuiOutlinedInput-input::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
      [theme.breakpoints.down('md')]: {
        '& .MuiOutlinedInput-root': { width: '100%' },
      },
    },
    filterIcon: {
      width: 40,
      height: 40,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
      background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
      color: theme.palette.text.secondary,
      borderRadius: '8px',
    },
    filterIconActive: {
      background: 'rgba(99,102,241,0.2)',
      border: '1px solid rgba(99,102,241,0.4)',
      color: '#818cf8',
    },
    createButton: {
      borderRadius: '25px',
      textTransform: 'none',
      fontWeight: 600,
      padding: '8px 24px',
      background: '#6366f1',
      color: '#fff',
      '&:hover': { background: '#4f46e5' },
      [theme.breakpoints.down('sm')]: { width: '100%' },
    },
    maintenanceCard: {
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
      backdropFilter: 'blur(12px)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
    },
    bgRed: { background: 'linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(255,255,255,0.04) 100%)' },
    bgOrange: { background: 'linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(255,255,255,0.04) 100%)' },
    bgGreen: { background: 'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(255,255,255,0.04) 100%)' },
    bgTeal: { background: 'linear-gradient(180deg, rgba(20,184,166,0.12) 0%, rgba(255,255,255,0.04) 100%)' },
    cardHeader: {
      padding: '16px 16px 8px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: '0.95rem',
      fontWeight: 700,
      color: theme.palette.text.primary,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    priceChip: { fontWeight: 700, borderRadius: '4px', height: '24px' },
    vehicleInfo: {
      fontSize: '0.75rem',
      color: theme.palette.text.secondary,
      padding: '0 16px 16px 40px',
      fontWeight: 500,
    },
    detailsGrid: {
      padding: '0 16px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      rowGap: '4px',
      columnGap: '12px',
      fontSize: '0.8rem',
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
      },
    },
    label: { color: theme.palette.text.disabled },
    value: { color: theme.palette.text.primary, fontWeight: 600 },
    progressSection: { padding: '16px' },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      '& span': { fontSize: '0.75rem', color: theme.palette.text.disabled, fontWeight: 600 },
    },
    progressBar: { height: 6, borderRadius: 3 },
    cardActions: {
      display: 'flex',
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : theme.palette.divider}`,
      '& button': {
        flex: 1,
        textTransform: 'none',
        color: theme.palette.text.secondary,
        fontSize: '0.8rem',
        padding: '8px',
      },
    },
    summaryBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 16px',
      borderRadius: 12,
      background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.action.hover,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
      fontSize: '0.85rem',
      fontWeight: 600,
      [theme.breakpoints.down('sm')]: {
        width: '100%',
        justifyContent: 'center',
        padding: '8px 10px',
        gap: 6,
        fontSize: '0.78rem',
      },
    },
  };
});

const TYPE_LABELS = {
  totalDistance: 'Distance totale',
  odometer: 'Odomètre',
  hours: 'Heures moteur',
  drivingTime: 'Temps de conduite',
  deviceTime: 'Date/Heure',
  fixTime: 'Heure GPS',
  serverTime: 'Heure serveur',
};

const FILTER_ALL = 'all';
const FILTER_EXPIRED = 'expired';
const FILTER_URGENT = 'urgent';
const FILTER_UPCOMING = 'upcoming';

const formatStart = (type, start) => {
  if (!type || start == null) return '—';
  if (type.endsWith('Time')) return dayjs(start).format('DD/MM/YYYY');
  if (type === 'hours' || type === 'drivingTime') return `${(start / 3600000).toFixed(0)} h`;
  return `${(start / 1000).toFixed(0)} km`;
};

const formatPeriod = (type, period) => {
  if (!type || period == null) return '—';
  if (type.endsWith('Time')) return `${(period / 86400000).toFixed(0)} jours`;
  if (type === 'hours' || type === 'drivingTime') return `${(period / 3600000).toFixed(0)} h`;
  return `${(period / 1000).toFixed(0)} km`;
};

const computeProgress = (type, start, period, currentValue) => {
  if (!type || start == null || period == null || period === 0) return { progress: 0, remaining: '—', endValue: null };
  if (type.endsWith('Time')) {
    const now = Date.now();
    const end = start + period;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / period) * 100));
    const remainingMs = end - now;
    const remainingDays = Math.ceil(remainingMs / 86400000);
    const remaining = remainingDays <= 0 ? '0 jours' : `${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    return { progress: Math.round(progress), remaining, endValue: dayjs(end).format('DD/MM/YYYY'), expired: remainingDays <= 0 };
  }
  if (type === 'hours' || type === 'drivingTime') {
    const end = start + period;
    const curr = currentValue || 0;
    const progress = Math.min(100, Math.max(0, ((curr - start) / period) * 100));
    const remainingH = Math.max(0, (end - curr) / 3600000);
    const remaining = remainingH <= 0 ? '0 h' : `${remainingH.toFixed(1)} h`;
    return { progress: Math.round(progress), remaining, endValue: `${(end / 3600000).toFixed(0)} h`, expired: remainingH <= 0 };
  }
  const end = start + period;
  const curr = currentValue || 0;
  const progress = Math.min(100, Math.max(0, ((curr - start) / period) * 100));
  const remainingM = Math.max(0, end - curr);
  const remaining = remainingM <= 0 ? '0 km' : `${(remainingM / 1000).toFixed(0)} km`;
  return { progress: Math.round(progress), remaining, endValue: `${(end / 1000).toFixed(0)} km`, expired: remainingM <= 0 };
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
  return (
    <Box sx={{ width: '100%', flexShrink: 0 }}>
      <Box sx={{
        borderRadius: '12px', p: 2,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
        background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
      }}>
        <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
        <Skeleton variant="text" width="40%" height={18} sx={{ mb: 1, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
      </Box>
    </Box>
  );
};

const EDITABLE_TYPES = [
  { key: 'totalDistance', label: 'Distance totale (km)' },
  { key: 'odometer', label: 'Odomètre (km)' },
  { key: 'hours', label: 'Heures moteur' },
  { key: 'fixTime', label: 'Date GPS (date)' },
  { key: 'deviceTime', label: 'Date appareil (date)' },
];

const MaintenanceDialog = ({ open, onClose, onSave, devices, editItem }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isEdit = !!editItem;
  const [form, setForm] = useState({ name: '', type: 'totalDistance', start: '', period: '', deviceId: '' });

  const dialogSx = {
    borderRadius: '20px',
    background: isDark ? 'rgba(10,15,30,0.97)' : theme.palette.background.paper,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
      color: theme.palette.text.primary,
      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider },
      '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': { color: theme.palette.text.disabled },
    '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
    '& .MuiSelect-select': { color: theme.palette.text.primary },
  };

  useEffect(() => {
    if (editItem) {
      setForm({ name: editItem.name || '', type: editItem.type || 'totalDistance', start: editItem._startDisplay || '', period: editItem._periodDisplay || '', deviceId: editItem._deviceId || '' });
    } else {
      setForm({ name: '', type: 'totalDistance', start: '', period: '', deviceId: '' });
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
    const payload = { name: form.name, type: form.type, start: toRaw('start', form.start), period: toRaw('period', form.period) };
    await onSave(payload, form.deviceId, editItem?.id);
    onClose();
  };

  const startLabel = isTimeType ? 'Date de début' : (form.type === 'hours' || form.type === 'drivingTime') ? 'Début (heures)' : 'Début (km)';
  const periodLabel = isTimeType ? 'Durée (jours)' : (form.type === 'hours' || form.type === 'drivingTime') ? 'Période (heures)' : 'Période (km)';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogSx }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', pb: 1, color: theme.palette.text.primary }}>
        {isEdit ? 'Modifier la maintenance' : 'Créer une maintenance'}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12, color: theme.palette.text.secondary }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" sx={inputSx} />
        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, start: '', period: '' })}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider }, '& .MuiSvgIcon-root': { color: theme.palette.text.disabled } }}>
            {EDITABLE_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label={startLabel} type={isTimeType ? 'date' : 'number'} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} fullWidth size="small" sx={inputSx} InputLabelProps={isTimeType ? { shrink: true } : undefined} />
        <TextField label={periodLabel} type="number" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} fullWidth size="small" sx={inputSx} />
        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel>Véhicule (optionnel)</InputLabel>
          <Select label="Véhicule (optionnel)" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider }, '& .MuiSvgIcon-root': { color: theme.palette.text.disabled } }}>
            <MenuItem value=""><em style={{ color: theme.palette.text.disabled }}>Aucun</em></MenuItem>
            {devices.map((d) => <MenuItem key={d.id} value={d.id}>{d.name || d.uniqueId}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: theme.palette.text.secondary }}>Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={!form.name || !form.type || !form.start || !form.period}
          sx={{ textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2 }}>
          {isEdit ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteDialog = ({ open, onClose, onConfirm, name }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dialogSx = {
    borderRadius: '20px',
    background: isDark ? 'rgba(10,15,30,0.97)' : theme.palette.background.paper,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogSx }}>
      <DialogTitle sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Supprimer la maintenance</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: theme.palette.text.primary }}>Voulez-vous vraiment supprimer <strong style={{ color: theme.palette.text.primary }}>{name}</strong> ?</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: theme.palette.text.secondary }}>Annuler</Button>
        <Button onClick={onConfirm} variant="contained" sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, borderRadius: 2 }}>Supprimer</Button>
      </DialogActions>
    </Dialog>
  );
};

const MaintenanceDashboard = () => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
      const mRes = await fetch('/api/maintenance');
      if (!mRes.ok) throw new Error('Impossible de charger les maintenances');
      const mData = await mRes.json();
      setMaintenances(mData);

      const dRes = await fetch('/api/devices');
      if (!dRes.ok) throw new Error('Impossible de charger les véhicules');
      const dData = await dRes.json();
      setDevices(dData);

      const pRes = await fetch('/api/positions');
      if (pRes.ok) {
        const pData = await pRes.json();
        const pMap = {};
        pData.forEach((p) => { pMap[p.deviceId] = p; });
        setPositions(pMap);
      }

      const devMainMap = {};
      await Promise.all(dData.map(async (device) => {
        try {
          const r = await fetch(`/api/maintenance?deviceId=${device.id}`);
          if (r.ok) {
            const linked = await r.json();
            linked.forEach((m) => {
              if (!devMainMap[m.id]) devMainMap[m.id] = [];
              devMainMap[m.id].push(device.id);
            });
          }
        } catch (_) { }
      }));
      setDeviceMaintenanceMap(devMainMap);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deviceMap = useMemo(() => { const map = {}; devices.forEach((d) => { map[d.id] = d; }); return map; }, [devices]);

  const cards = useMemo(() => maintenances.flatMap((m) => {
    const linkedDeviceIds = deviceMaintenanceMap[m.id] || [];
    const deviceEntries = linkedDeviceIds.length > 0
      ? linkedDeviceIds.map((did) => ({ deviceId: did, device: deviceMap[did] }))
      : [{ deviceId: null, device: null }];
    return deviceEntries.map(({ deviceId, device }) => {
      const position = deviceId ? positions[deviceId] : null;
      const currValue = currentValueForType(m.type, position);
      const { progress, remaining, endValue, expired } = computeProgress(m.type, m.start, m.period, currValue);
      const status = statusFromProgress(progress, expired);
      const typeLabel = TYPE_LABELS[m.type] || m.type;
      const price = m.attributes?.cost;
      const vehicleName = device ? (device.name || device.uniqueId || `#${device.id}`) : '—';
      return {
        _id: `${m.id}-${deviceId ?? 'none'}`, _maintenanceId: m.id, _deviceId: deviceId,
        _startDisplay: formatStart(m.type, m.start), _periodDisplay: formatPeriod(m.type, m.period),
        id: m.id, name: m.name, type: m.type, typeLabel, start: m.start, period: m.period,
        vehicleName, price, debut: formatStart(m.type, m.start), fin: endValue || '—',
        remaining, progress, status, expired, attributes: m.attributes,
      };
    });
  }), [maintenances, deviceMaintenanceMap, deviceMap, positions]);

  const filtered = useMemo(() => {
    let result = cards;
    if (activeFilter === FILTER_EXPIRED) result = result.filter((c) => c.expired);
    if (activeFilter === FILTER_URGENT) result = result.filter((c) => !c.expired && c.progress >= 75);
    if (activeFilter === FILTER_UPCOMING) result = result.filter((c) => !c.expired && c.progress < 75);
    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(kw) || c.vehicleName.toLowerCase().includes(kw) || c.typeLabel.toLowerCase().includes(kw));
    }
    return result;
  }, [cards, activeFilter, searchValue]);

  const countExpired = cards.filter((c) => c.expired).length;
  const countUrgent = cards.filter((c) => !c.expired && c.progress >= 75).length;
  const countOk = cards.filter((c) => !c.expired && c.progress < 75).length;

  const handleSave = async (payload, deviceId, existingId) => {
    try {
      let savedId = existingId;
      if (existingId) {
        const r = await fetch(`/api/maintenance/${existingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existingId, ...payload }) });
        if (!r.ok) throw new Error('Erreur lors de la mise à jour');
      } else {
        const r = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Erreur lors de la création');
        const created = await r.json();
        savedId = created.id;
        if (deviceId && savedId) {
          await fetch('/api/permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: parseInt(deviceId, 10), maintenanceId: savedId }) });
        }
      }
      setSnack({ open: true, msg: existingId ? 'Maintenance mise à jour' : 'Maintenance créée', severity: 'success' });
      fetchAll();
    } catch (err) { setSnack({ open: true, msg: err.message, severity: 'error' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`/api/maintenance/${deleteTarget.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erreur lors de la suppression');
      setSnack({ open: true, msg: 'Maintenance supprimée', severity: 'success' });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) { setSnack({ open: true, msg: err.message, severity: 'error' }); }
  };

  const statusColors = (status) => ({
    red: { bg: classes.bgRed, bar: '#ef4444', text: '#ef4444', chipBg: 'rgba(239,68,68,0.15)' },
    orange: { bg: classes.bgOrange, bar: '#f59e0b', text: '#f59e0b', chipBg: 'rgba(245,158,11,0.15)' },
    green: { bg: classes.bgGreen, bar: '#22c55e', text: '#22c55e', chipBg: 'rgba(34,197,94,0.15)' },
    teal: { bg: classes.bgTeal, bar: '#14b8a6', text: '#14b8a6', chipBg: 'rgba(20,184,166,0.15)' },
  }[status] || { bg: classes.bgTeal, bar: '#14b8a6', text: '#14b8a6', chipBg: 'rgba(20,184,166,0.15)' });

  const typeIcon = (type) => {
    if (type?.endsWith('Time') || type === 'deviceTime' || type === 'fixTime') return <TimerOutlined sx={{ fontSize: 18 }} />;
    if (type === 'hours' || type === 'drivingTime') return <BuildOutlined sx={{ fontSize: 18 }} />;
    return <Construction sx={{ fontSize: 18 }} />;
  };

  return (
    <PageLayout>
      <Box className={classes.root}>

        <Box className={classes.headerRow}>
          <Box>
            <Typography className={classes.pageTitle}>Maintenances</Typography>
            <Typography className={classes.pageSubtitle}>Gérer les maintenances et planifications de véhicules</Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton onClick={fetchAll} disabled={loading}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.action.selected },
              }}>
              <Refresh sx={{ color: loading ? theme.palette.text.disabled : '#10b981' }} />
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
              <WarningAmberOutlined sx={{ color: '#ef4444', fontSize: 18 }} />
              <span style={{ color: '#ef4444' }}>{countExpired}</span>
              <span style={{ color: theme.palette.text.secondary, fontWeight: 400 }}>Expirées</span>
            </Box>
            <Box className={classes.summaryBadge}>
              <WarningAmberOutlined sx={{ color: '#f59e0b', fontSize: 18 }} />
              <span style={{ color: '#f59e0b' }}>{countUrgent}</span>
              <span style={{ color: theme.palette.text.secondary, fontWeight: 400 }}>Urgentes (&gt;75%)</span>
            </Box>
            <Box className={classes.summaryBadge}>
              <CheckCircleOutlineOutlined sx={{ color: '#10b981', fontSize: 18 }} />
              <span style={{ color: '#10b981' }}>{countOk}</span>
              <span style={{ color: theme.palette.text.secondary, fontWeight: 400 }}>En cours</span>
            </Box>
          </Box>
        )}

        {error && (
          <Box sx={{ bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 2, p: 2, mb: 3 }}>
            <Typography sx={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>⚠ {error}</Typography>
          </Box>
        )}

        <Box className={classes.searchAndFilterRow}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' }, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <TextField
              placeholder="Rechercher par nom, véhicule ou type..."
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
              { key: FILTER_ALL, Icon: Layers, title: 'Tout', color: theme.palette.text.secondary },
              { key: FILTER_EXPIRED, Icon: MedicalServicesOutlined, title: 'Expirées', color: '#ef4444' },
              { key: FILTER_URGENT, Icon: Waves, title: 'Urgentes', color: '#f59e0b' },
              { key: FILTER_UPCOMING, Icon: BuildOutlined, title: 'En cours', color: '#10b981' },
            ].map(({ key, Icon, title, color }) => (
              <Tooltip key={key} title={title}>
                <IconButton onClick={() => setActiveFilter(key)}
                  className={cx(classes.filterIcon, activeFilter === key && classes.filterIconActive)}>
                  <Icon sx={{ fontSize: 18, color: activeFilter === key ? '#818cf8' : color }} />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
          <Button startIcon={<Add />} className={classes.createButton} onClick={() => { setEditItem(null); setDialogOpen(true); }}>
            Créer une maintenance
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5 }}>
          {loading ? (
            [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.95rem' }}>Aucune maintenance trouvée</Typography>
            </Box>
          ) : (
            filtered.map((item) => {
              const colors = statusColors(item.status);
              const isExpired = item.remaining === '0 jours' || item.remaining === '0 km' || item.remaining === '0 h';
              return (
                <Box key={item._id} sx={{ minWidth: 0 }}>
                  <Box className={cx(classes.maintenanceCard, colors.bg)}>
                    <Box className={classes.cardHeader}>
                      <Typography className={classes.cardTitle}>
                        {typeIcon(item.type)}
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.price != null ? `${parseFloat(item.price).toFixed(2)} Dh` : item.typeLabel}
                        className={classes.priceChip}
                        sx={{ color: colors.text, bgcolor: colors.chipBg, fontSize: '0.72rem', border: `1px solid ${colors.text}33` }}
                      />
                    </Box>
                    <Typography className={classes.vehicleInfo}>{item.vehicleName}</Typography>
                    <Box className={classes.detailsGrid}>
                      <span className={classes.label}>début: <span className={classes.value}>{item.debut}</span></span>
                      <span className={classes.label}>fin: <span className={classes.value}>{item.fin}</span></span>
                      <span className={classes.label}>restants: <span className={classes.value} style={{ fontWeight: 800, color: isExpired ? '#ef4444' : colors.text }}>{item.remaining}</span></span>
                      <span className={classes.label}>période: <span className={classes.value}>{item._periodDisplay}</span></span>
                    </Box>
                    <Box className={classes.progressSection}>
                      <Box className={classes.progressHeader}>
                        <span>Progrès</span>
                        <span style={{ color: theme.palette.text.primary }}>{item.progress}%</span>
                      </Box>
                      <LinearProgress variant="determinate" value={item.progress} className={classes.progressBar}
                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.action.disabledBackground, '& .MuiLinearProgress-bar': { bgcolor: colors.bar } }} />
                    </Box>
                    <Box className={classes.cardActions}>
                      <Button startIcon={<Edit sx={{ fontSize: 16 }} />} onClick={() => { setEditItem(item); setDialogOpen(true); }}>Modifier</Button>
                      <Button startIcon={<Delete sx={{ fontSize: 16 }} />} onClick={() => setDeleteTarget(item)} sx={{ color: '#ef4444 !important' }}>Supprimer</Button>
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      <MaintenanceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} devices={devices} editItem={editItem} />
      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} name={deleteTarget?.name} />

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default MaintenanceDashboard;
