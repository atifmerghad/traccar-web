import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, TextField,
  Stack, Avatar, CircularProgress, IconButton, ToggleButtonGroup,
  ToggleButton, Chip, Skeleton,
} from '@mui/material';
import {
  CalendarToday, DirectionsCar, KeyboardArrowDown, LocalGasStation,
  Speed, AccessTime, Domain, Refresh as RefreshIcon, ShowChart,
  BarChart as BarChartIcon, Landscape, CompareArrows, TrendingUp,
  FlashOn,
} from '@mui/icons-material';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from './PageLayout';

// ─── Styles ──────────────────────────────────────────────────────────────────

const PAGE_BG = '#080d1a';

const useStyles = makeStyles()(() => ({
  root: {
    padding: '24px',
    background: PAGE_BG,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  glassCard: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    padding: '20px 24px',
  },
  glassSelect: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    color: '#e2e8f0',
    minWidth: '200px',
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.1)' },
    '& .MuiSelect-select': { paddingLeft: '14px', fontWeight: 600, fontSize: '0.87rem' },
    '& .MuiSvgIcon-root': { color: '#475569' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
  },
  glassDate: {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      color: '#e2e8f0',
      fontSize: '0.84rem',
      '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& input': { color: '#e2e8f0', fontSize: '0.84rem' },
    '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)', cursor: 'pointer' },
  },
  metricCard: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'border-color 0.2s, transform 0.15s',
    '&:hover': { borderColor: 'rgba(255,255,255,0.15)', transform: 'translateY(-1px)' },
  },
  toggleBtn: {
    color: '#94a3b8 !important',
    border: '1px solid rgba(255,255,255,0.08) !important',
    padding: '0 14px !important',
    height: '32px !important',
    fontSize: '0.78rem !important',
    textTransform: 'none !important',
    lineHeight: '1 !important',
    '&.Mui-selected': {
      background: 'rgba(99,102,241,0.15) !important',
      color: '#a5b4fc !important',
      borderColor: 'rgba(99,102,241,0.35) !important',
    },
  },
  metricTabBtn: {
    color: '#94a3b8 !important',
    border: '1px solid rgba(255,255,255,0.08) !important',
    padding: '0 14px !important',
    height: '32px !important',
    fontSize: '0.8rem !important',
    textTransform: 'none !important',
    lineHeight: '1 !important',
    borderRadius: '10px !important',
    '&.Mui-selected': {
      background: 'rgba(99,102,241,0.18) !important',
      color: '#a5b4fc !important',
      borderColor: 'rgba(99,102,241,0.4) !important',
    },
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
}));

// ─── Shared dark menu props for Select dropdowns ─────────────────────────────

const DARK_MENU_PROPS = {
  PaperProps: {
    sx: {
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      mt: 0.5,
      '& .MuiMenuItem-root': { color: '#cbd5e1', fontSize: '0.87rem', py: 1 },
      '& .MuiMenuItem-root:hover': { background: 'rgba(255,255,255,0.06)' },
      '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
      '& .MuiMenuItem-root.Mui-selected:hover': { background: 'rgba(99,102,241,0.22)' },
    },
  },
};

// ─── Period presets ───────────────────────────────────────────────────────────

const PERIODS = [
  { label: "Aujourd'hui", value: 'today' },
  { label: 'Hier', value: 'yesterday' },
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: 'Personnalisé', value: 'custom' },
];

const getPeriodRange = (period) => {
  const now = dayjs();
  switch (period) {
    case 'today': return [now.startOf('day'), now];
    case 'yesterday': return [now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')];
    case '7d': return [now.subtract(7, 'day').startOf('day'), now];
    case '30d': return [now.subtract(30, 'day').startOf('day'), now];
    default: return null;
  }
};

const PERIOD_LABEL = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  custom: 'Personnalisé',
};

// ─── Metric configuration ─────────────────────────────────────────────────────

const CHART_METRICS = [
  { key: 'speed', label: 'Vitesse', unit: 'km/h', color: '#6366f1', Icon: Speed },
  { key: 'altitude', label: 'Altitude', unit: 'm', color: '#22c55e', Icon: Landscape },
];

const SUMMARY_CONFIG = [
  { label: 'Distance Totale', key: 'distance', Icon: Domain, color: '#3b82f6' },
  { label: 'Carburant', key: 'fuel', Icon: LocalGasStation, color: '#f59e0b' },
  { label: 'Vitesse Moy.', key: 'avgSpeed', Icon: Speed, color: '#22c55e' },
  { label: 'Durée', key: 'duration', Icon: AccessTime, color: '#a855f7' },
];

const KEY_STATS = [
  { label: 'Vitesse Max', key: 'maxSpeed', color: '#ef4444', Icon: TrendingUp },
  { label: 'Altitude Max', key: 'maxAlt', color: '#22c55e', Icon: Landscape },
  { label: 'Temps en mouvement', key: 'movingPct', color: '#6366f1', Icon: FlashOn },
  { label: 'Points collectés', key: 'pointCount', color: '#94a3b8', Icon: ShowChart },
];

// ─── Data helpers ─────────────────────────────────────────────────────────────

const downsample = (arr, max = 500) => {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  return arr.filter((_, i) => i % step === 0);
};

const toChartData = (positions) =>
  downsample(positions).map((p) => ({
    time: dayjs(p.fixTime).format('HH:mm'),
    speed: +(p.speed * 1.852).toFixed(1),
    altitude: +(p.altitude ?? 0).toFixed(0),
  }));

const mergeChartData = (primary, compare, metricKey) =>
  primary.map((d, i) => ({ ...d, cmp: compare[i]?.[metricKey] ?? null }));

const buildSpeedHistogram = (positions) => {
  const buckets = Array.from({ length: 13 }, (_, i) => ({
    range: `${i * 10}-${(i + 1) * 10}`,
    count: 0,
  }));
  positions.forEach((p) => {
    const idx = Math.min(Math.floor((p.speed * 1.852) / 10), 12);
    if (idx >= 0) buckets[idx].count += 1;
  });
  return buckets.filter((b) => b.count > 0);
};

const computeDerivedStats = (positions) => {
  if (!positions.length) {
    return { maxSpeed: '—', maxAlt: '—', movingPct: '—', pointCount: '0' };
  }
  const maxSpeed = Math.max(...positions.map((p) => p.speed * 1.852)).toFixed(1);
  const maxAlt = Math.max(...positions.map((p) => p.altitude ?? 0)).toFixed(0);
  const moving = positions.filter((p) => p.speed * 1.852 > 2).length;
  const movingPct = ((moving / positions.length) * 100).toFixed(0);
  return {
    maxSpeed: `${maxSpeed} km/h`,
    maxAlt: `${maxAlt} m`,
    movingPct: `${movingPct}%`,
    pointCount: `${positions.length}`,
  };
};

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', p: '10px 14px' }}>
      <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mb: 0.5 }}>{label}</Typography>
      {payload.map((e, i) => (
        <Typography key={i} sx={{ fontSize: '0.86rem', fontWeight: 700, color: e.color }}>
          {e.name}: {e.value} {unit}
        </Typography>
      ))}
    </Box>
  );
};

// ─── GraphPage ────────────────────────────────────────────────────────────────

const GraphPage = () => {
  const { classes } = useStyles();

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [compareDevice, setCompareDevice] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  const [period, setPeriod] = useState('today');
  const [fromTime, setFromTime] = useState(dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'));
  const [toTime, setToTime] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));

  const [loading, setLoading] = useState(false);
  const [primaryPositions, setPrimaryPositions] = useState([]);
  const [comparePositions, setComparePositions] = useState([]);
  const [primaryMetrics, setPrimaryMetrics] = useState({ distance: '—', fuel: '—', avgSpeed: '—', duration: '—' });
  const [compareMetrics, setCompareMetrics] = useState(null);

  const [chartType, setChartType] = useState('area');
  const [activeMetric, setActiveMetric] = useState('speed');

  const primaryChartData = useMemo(() => toChartData(primaryPositions), [primaryPositions]);
  const compareChartData = useMemo(() => toChartData(comparePositions), [comparePositions]);
  const hasCmp = showComparison && compareChartData.length > 0;

  const mergedData = useMemo(
    () => hasCmp ? mergeChartData(primaryChartData, compareChartData, activeMetric) : primaryChartData,
    [primaryChartData, compareChartData, hasCmp, activeMetric],
  );

  const speedHistogram = useMemo(() => buildSpeedHistogram(primaryPositions), [primaryPositions]);
  const derivedStats = useMemo(() => computeDerivedStats(primaryPositions), [primaryPositions]);

  const resolvedRange = useMemo(() => {
    if (period === 'custom') {
      return { from: new Date(fromTime).toISOString(), to: new Date(toTime).toISOString() };
    }
    const range = getPeriodRange(period);
    return { from: range[0].toISOString(), to: range[1].toISOString() };
  }, [period, fromTime, toTime]);

  const fetchSummary = useCallback(async (deviceId) => {
    const q = new URLSearchParams({ deviceId, ...resolvedRange });
    try {
      const res = await fetch(`/api/reports/summary?${q}`);
      const data = await res.json();
      if (data?.[0]) {
        const s = data[0];
        return {
          distance: `${(s.distance / 1000).toFixed(1)} km`,
          fuel: `${(s.spentFuel ?? 0).toFixed(1)} L`,
          avgSpeed: `${((s.averageSpeed ?? 0) * 1.852).toFixed(1)} km/h`,
          duration: `${Math.floor((s.engineHours ?? 0) / 3600000)}h`,
        };
      }
    } catch (e) { console.error(e); }
    return null;
  }, [resolvedRange]);

  const fetchRoute = useCallback(async (deviceId) => {
    const q = new URLSearchParams({ deviceId, ...resolvedRange });
    try {
      const res = await fetch(`/api/reports/route?${q}`, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) { console.error(e); return []; }
  }, [resolvedRange]);

  const loadData = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    const [summary, route] = await Promise.all([fetchSummary(selectedDevice), fetchRoute(selectedDevice)]);
    if (summary) setPrimaryMetrics(summary);
    setPrimaryPositions(route);

    if (showComparison && compareDevice) {
      const [cmpSummary, cmpRoute] = await Promise.all([fetchSummary(compareDevice), fetchRoute(compareDevice)]);
      if (cmpSummary) setCompareMetrics(cmpSummary);
      setComparePositions(cmpRoute);
    } else {
      setCompareMetrics(null);
      setComparePositions([]);
    }
    setLoading(false);
  }, [selectedDevice, compareDevice, showComparison, fetchSummary, fetchRoute]);

  useEffect(() => {
    fetch('/api/devices')
      .then((r) => r.json())
      .then((data) => {
        setDevices(data);
        if (data.length > 0) setSelectedDevice(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (selectedDevice) loadData();
  }, [selectedDevice, loadData]);

  const m = CHART_METRICS.find((x) => x.key === activeMetric) || CHART_METRICS[0];
  const gradId = `grad_${activeMetric}`;

  const renderChart = () => {
    if (loading) {
      return <Skeleton variant="rectangular" height={320} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} />;
    }
    if (!mergedData.length) {
      return (
        <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <BarChartIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.06)' }} />
          <Typography sx={{ color: '#334155', fontSize: '0.85rem' }}>Aucune donnée — sélectionnez un véhicule et appuyez sur Actualiser</Typography>
        </Box>
      );
    }

    const sharedProps = { data: mergedData, margin: { top: 10, right: 20, left: 0, bottom: 0 } };
    const xAxis = <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />;
    const yAxis = <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `${v}`} />;
    const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />;
    const tooltip = <RTooltip content={(p) => <ChartTooltip {...p} unit={m.unit} />} />;
    const legend = hasCmp ? <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '0.76rem', paddingTop: '8px' }} /> : null;

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart {...sharedProps}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            <Bar dataKey={activeMetric} name={m.label} fill={m.color} radius={[3, 3, 0, 0]} opacity={0.85} />
            {hasCmp && <Bar dataKey="cmp" name="Comparaison" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.7} />}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart {...sharedProps}>
            {grid}{xAxis}{yAxis}{tooltip}{legend}
            <Line type="monotone" dataKey={activeMetric} name={m.label} stroke={m.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            {hasCmp && <Line type="monotone" dataKey="cmp" name="Comparaison" stroke="#f97316" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart {...sharedProps}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={m.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={m.color} stopOpacity={0.03} />
            </linearGradient>
            {hasCmp && (
              <linearGradient id="grad_cmp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            )}
          </defs>
          {grid}{xAxis}{yAxis}{tooltip}{legend}
          <Area type="monotone" dataKey={activeMetric} name={m.label} stroke={m.color} strokeWidth={2.5} fill={`url(#${gradId})`} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          {hasCmp && (
            <Area type="monotone" dataKey="cmp" name="Comparaison" stroke="#f97316" strokeWidth={2} strokeDasharray="5 3" fill="url(#grad_cmp)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9' }}>Graphiques</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#475569', mt: 0.4 }}>
              Visualisations des données de performance du véhicule
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.8} flexWrap="wrap" alignItems="center">
            {PERIODS.map((p) => (
              <Chip
                key={p.value}
                label={p.label}
                variant="outlined"
                onClick={() => setPeriod(p.value)}
                sx={{
                  height: 30,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: period === p.value ? '#a5b4fc' : '#64748b',
                  borderColor: period === p.value ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.1)',
                  background: period === p.value ? 'rgba(99,102,241,0.18)' : 'transparent',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.25)' },
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* ── Filter Bar ── */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className={classes.glassSelect}
            IconComponent={KeyboardArrowDown}
            size="small"
            MenuProps={DARK_MENU_PROPS}
            startAdornment={<DirectionsCar sx={{ fontSize: 17, color: '#6366f1', ml: 1, mr: -0.5 }} />}
          >
            {devices.map((dev) => (
              <MenuItem key={dev.id} value={dev.id}>{dev.name}</MenuItem>
            ))}
          </Select>

          <Button
            disableElevation
            startIcon={<CompareArrows sx={{ fontSize: '16px !important' }} />}
            onClick={() => setShowComparison(!showComparison)}
            sx={{
              bgcolor: showComparison ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.05)',
              color: showComparison ? '#fb923c' : '#64748b',
              borderRadius: '12px',
              textTransform: 'none',
              border: `1px solid ${showComparison ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.08)'}`,
              fontSize: '0.82rem',
              fontWeight: 600,
              px: 2,
              height: 36,
            }}
          >
            {showComparison ? 'Masquer' : 'Comparer'}
          </Button>

          {showComparison && (
            <Select
              value={compareDevice}
              displayEmpty
              onChange={(e) => setCompareDevice(e.target.value)}
              className={classes.glassSelect}
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(249,115,22,0.3) !important' } }}
              IconComponent={KeyboardArrowDown}
              size="small"
              MenuProps={DARK_MENU_PROPS}
              renderValue={(v) => v ? devices.find((d) => d.id === v)?.name : <em style={{ color: '#64748b' }}>Comparer avec...</em>}
            >
              <MenuItem disabled value=""><em>Sélectionnez un véhicule</em></MenuItem>
              {devices.filter((d) => d.id !== selectedDevice).map((dev) => (
                <MenuItem key={dev.id} value={dev.id}>{dev.name}</MenuItem>
              ))}
            </Select>
          )}

          {period === 'custom' && (
            <>
              <TextField
                type="datetime-local"
                size="small"
                className={classes.glassDate}
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                sx={{ minWidth: 200 }}
                slotProps={{
                  input: { startAdornment: <CalendarToday sx={{ fontSize: 15, color: '#475569', mr: 1 }} /> },
                }}
              />
              <TextField
                type="datetime-local"
                size="small"
                className={classes.glassDate}
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                sx={{ minWidth: 200 }}
              />
            </>
          )}

          <IconButton
            onClick={loadData}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#818cf8',
              borderRadius: '12px',
              width: 36, height: 36,
              '&:hover': { bgcolor: 'rgba(99,102,241,0.2)' },
            }}
          >
            {loading
              ? <CircularProgress size={16} sx={{ color: '#818cf8' }} />
              : <RefreshIcon sx={{ fontSize: 17 }} />
            }
          </IconButton>
        </Box>

        {/* ── Summary Metric Cards ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {SUMMARY_CONFIG.map(({ label, key, Icon, color }) => (
            <Box key={key} className={classes.metricCard}>
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mt: 0.5, mb: 0.3 }}>
                  {loading
                    ? <Skeleton width={70} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                    : <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>{primaryMetrics[key]}</Typography>
                  }
                  {compareMetrics && !loading && (
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316' }}>
                      vs {compareMetrics[key]}
                    </Typography>
                  )}
                </Stack>
                <Typography sx={{ fontSize: '0.7rem', color: '#334155' }}>{PERIOD_LABEL[period]}</Typography>
              </Box>
              <Avatar sx={{ bgcolor: `${color}1a`, color, borderRadius: '14px', width: 44, height: 44 }}>
                <Icon sx={{ fontSize: 20 }} />
              </Avatar>
            </Box>
          ))}
        </Box>

        {/* ── Main Chart ── */}
        <Box className={classes.glassCard}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem' }}>
                Analyse temporelle
              </Typography>
              <Typography sx={{ fontSize: '0.73rem', color: '#475569', mt: 0.3 }}>
                {devices.find((d) => d.id === selectedDevice)?.name || '—'}
                {primaryPositions.length > 0 && ` · ${primaryPositions.length} points · ${mergedData.length} affichés`}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <ToggleButtonGroup
                value={activeMetric}
                exclusive
                onChange={(_, v) => v && setActiveMetric(v)}
                size="small"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: '10px !important',
                    border: '1px solid rgba(255,255,255,0.08) !important',
                    margin: 0,
                  },
                }}
              >
                {CHART_METRICS.map(({ key, label, Icon: MetricIcon }) => (
                  <ToggleButton key={key} value={key} className={classes.metricTabBtn}>
                    <MetricIcon sx={{ fontSize: 13, mr: 0.6 }} />
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Box sx={{ width: '1px', height: 22, bgcolor: 'rgba(255,255,255,0.1)', mx: 0.5 }} />

              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(_, v) => v && setChartType(v)}
                size="small"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: '8px !important',
                    border: '1px solid rgba(255,255,255,0.08) !important',
                    margin: 0,
                  },
                }}
              >
                <ToggleButton value="area" className={classes.toggleBtn}>Aire</ToggleButton>
                <ToggleButton value="line" className={classes.toggleBtn}>Ligne</ToggleButton>
                <ToggleButton value="bar" className={classes.toggleBtn}>Barre</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {renderChart()}
        </Box>

        {/* ── Bottom Row: Histogram + Key Stats ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>

          {/* Speed Histogram */}
          <Box className={classes.glassCard}>
            <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>Distribution des vitesses</Typography>
            <Typography sx={{ fontSize: '0.73rem', color: '#475569', mt: 0.3, mb: 2 }}>
              Répartition du temps passé à chaque plage de vitesse (km/h)
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={190} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
            ) : speedHistogram.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={speedHistogram} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <RTooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <Box sx={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', p: '8px 12px' }}>
                          <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8' }}>{label} km/h</Typography>
                          <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: '#818cf8' }}>{payload[0].value} pts</Typography>
                        </Box>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {speedHistogram.map((_, idx) => (
                      <Cell key={idx} fill={`rgba(99,102,241,${0.35 + (idx / Math.max(speedHistogram.length - 1, 1)) * 0.65})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#334155', fontSize: '0.83rem' }}>Aucune donnée disponible</Typography>
              </Box>
            )}
          </Box>

          {/* Key Stats */}
          <Box className={classes.glassCard} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem', mb: 0.5 }}>Statistiques clés</Typography>
            {KEY_STATS.map(({ label, key, color, Icon: StatIcon }) => (
              <Box key={key} className={classes.statItem}>
                <Typography sx={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatIcon sx={{ fontSize: 15, color }} />
                  {loading
                    ? <Skeleton width={70} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                    : <Typography sx={{ fontSize: '1rem', fontWeight: 800, color }}>{derivedStats[key]}</Typography>
                  }
                </Box>
              </Box>
            ))}
          </Box>

        </Box>
      </Box>
    </PageLayout>
  );
};

export default GraphPage;
