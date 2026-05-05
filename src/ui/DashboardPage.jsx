import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Stack, Avatar,
  Skeleton, Tooltip, Chip, useTheme, useMediaQuery,
} from '@mui/material';
import {
  DirectionsCar, LocalParking, Notifications as NotificationsIcon,
  Refresh, Speed, ShowChart, LocalGasStation, Update, TrendingUp,
  AssignmentLate, WifiOff, Schedule,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Cell, ResponsiveContainer,
} from 'recharts';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from './PageLayout';

// ─── Styles — zero &:pseudo selectors ────────────────────────────────────────

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      width: '100%',
      flex: 1,
      boxSizing: 'border-box',
      padding: theme.spacing(3),
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      [theme.breakpoints.between('sm', 'md')]: { padding: theme.spacing(2) },
      background: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
    },

    // Summary cards row
    summaryRow: {
      display: 'grid',
      gap: theme.spacing(2),
      gridTemplateColumns: 'repeat(5, 1fr)',
      [theme.breakpoints.down('lg')]: { gridTemplateColumns: 'repeat(3, 1fr)' },
      [theme.breakpoints.down('md')]: { gridTemplateColumns: 'repeat(2, 1fr)' },
      [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr 1fr' },
    },

    // Two-column chart rows
    twoCol: {
      display: 'grid',
      gap: theme.spacing(3),
      gridTemplateColumns: '1fr 1fr',
      [theme.breakpoints.down('md')]: { gridTemplateColumns: '1fr' },
    },

    // Right column stacked panels
    rightStack: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
    },

    // Totals boxes inside a panel
    totalsRow: {
      display: 'flex',
      gap: theme.spacing(1.5),
      flexWrap: 'wrap',
    },

    cardBase: {
      borderRadius: '16px',
      width: '100%',
      height: '100%',
      border: 'none',
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : theme.shadows[2],
      display: 'flex',
      flexDirection: 'column',
    },
    totalVehiclesCard: {
      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      color: '#fff',
    },
    summaryNumber: {
      fontSize: '2.25rem',
      fontWeight: 800,
      lineHeight: 1,
      color: theme.palette.text.primary,
      [theme.breakpoints.down('sm')]: { fontSize: '1.75rem' },
    },
    summaryLabel: {
      fontSize: '0.9rem',
      fontWeight: 600,
      color: theme.palette.text.primary,
      [theme.breakpoints.down('sm')]: { fontSize: '0.78rem' },
    },
    summaryDesc: {
      fontSize: '0.75rem',
      color: theme.palette.text.secondary,
      [theme.breakpoints.down('sm')]: { display: 'none' },
    },

    sectionCard: {
      padding: theme.spacing(3),
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      borderRadius: '16px',
      background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
      backdropFilter: isDark ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
      border: `1px solid ${theme.palette.divider}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: 700,
      color: theme.palette.text.primary,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing(2),
      [theme.breakpoints.down('sm')]: { fontSize: '0.88rem', marginBottom: theme.spacing(1) },
    },

    totalBox: {
      borderRadius: '12px',
      padding: theme.spacing(2),
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      textAlign: 'center',
      flex: 1,
      minWidth: 80,
    },
    totalVal: {
      fontSize: '1.6rem',
      fontWeight: 800,
      marginBottom: 4,
      [theme.breakpoints.down('sm')]: { fontSize: '1.2rem' },
    },
    totalLab: {
      fontSize: '0.72rem',
      fontWeight: 600,
      color: theme.palette.text.secondary,
    },

    // perfItem — NO &:last-child (crashes stylis) — handled inline
    perfItem: {
      padding: '10px 0',
      borderBottom: `1px solid ${theme.palette.divider}`,
    },

    podiumRow: {
      display: 'flex',
      gap: 8,
      marginTop: theme.spacing(1.5),
      [theme.breakpoints.down('sm')]: { gap: 4 },
    },
    podiumBox: {
      flex: 1,
      borderRadius: '12px',
      padding: '10px 8px',
      border: `1px solid ${theme.palette.divider}`,
      background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
      textAlign: 'center',
    },
    podiumRank: { fontSize: '0.95rem', fontWeight: 800 },
    podiumId: {
      fontSize: '0.68rem',
      color: theme.palette.text.secondary,
      marginTop: 2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    podiumVal: { fontSize: '0.82rem', fontWeight: 700, color: theme.palette.text.primary, marginTop: 2 },

    title: {
      fontSize: '1.25rem',
      fontWeight: 800,
      color: theme.palette.text.primary,
      [theme.breakpoints.down('sm')]: { fontSize: '1rem' },
    },
    subtitle: {
      color: theme.palette.text.secondary,
      fontSize: '0.85rem',
      [theme.breakpoints.down('sm')]: { fontSize: '0.75rem' },
    },
  };
});

// ─── Palette ──────────────────────────────────────────────────────────────────

const BAR_COLORS = ['#eab308', '#94a3b8', '#f97316', '#a855f7', '#8b5cf6', '#ec4899', '#f472b6', '#f9a8d4'];
const SPEED_COLORS = ['#ef4444', '#f97316', '#fb923c', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];
const FUEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4'];
const RANK_COLORS = ['#f59e0b', '#64748b', '#f97316'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const metersToKm = (m) => (m / 1000).toFixed(2);
const knotsToKmh = (kn) => Math.round(kn * 1.852);
const msToHours = (ms) => {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, type }) => {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const cfg = {
    distance: { key: 'Distance', unit: ' km', color: '#818cf8' },
    speed: { key: 'Vitesse max.', unit: ' km/h', color: '#ef4444' },
    fuel: { key: 'Carburant', unit: ' L', color: '#f59e0b' },
  }[type];
  return (
    <Box style={{
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: theme.shadows[4],
      minWidth: 180,
    }}>
      <Typography style={{ fontWeight: 700, fontSize: '0.83rem', marginBottom: 4, color: theme.palette.text.primary }}>
        Rang #{d.payload.rank}
      </Typography>
      <Typography style={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>
        <strong>Véhicule:</strong> {d.payload.id}
      </Typography>
      <Typography style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color, marginTop: 4 }}>
        {cfg.key}: {d.value}{cfg.unit}
      </Typography>
    </Box>
  );
};

// ─── Chart ────────────────────────────────────────────────────────────────────

const HorizontalBarChart = ({ data, type, colors }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * (isMobile ? 26 : 32))}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: isMobile ? 4 : 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
        <XAxis type="number" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <YAxis dataKey="id" type="category" width={isMobile ? 70 : 100}
          tick={{ fontSize: 10, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
        <RechartsTooltip content={<CustomTooltip type={type} />} cursor={{ fill: theme.palette.action.hover }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={isMobile ? 10 : 14}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─── Podium ───────────────────────────────────────────────────────────────────

const PodiumRow = ({ data, unit, classes }) => (
  <Box className={classes.podiumRow}>
    {data.slice(0, 3).map((item, i) => (
      <Box key={i} className={classes.podiumBox}>
        <Typography className={classes.podiumRank} style={{ color: RANK_COLORS[i] }}>#{i + 1}</Typography>
        <Typography className={classes.podiumId}>{item.id}</Typography>
        <Typography className={classes.podiumVal}>{item.value}{unit}</Typography>
      </Box>
    ))}
  </Box>
);

// ─── Skeletons ────────────────────────────────────────────────────────────────

const ChartSkeleton = () => (
  <Box sx={{ p: 1 }}>
    {[...Array(5)].map((_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="rectangular" height={14} sx={{ flex: 1, borderRadius: 1 }} />
      </Box>
    ))}
  </Box>
);

const NumSkeleton = () => <Skeleton variant="text" height={44} />;

// ─── Chart Section ────────────────────────────────────────────────────────────

const ChartSection = ({ title, icon, data, unit, type, colors, classes, loading, emptyMsg }) => (
  <Box className={classes.sectionCard}>
    <Typography className={classes.sectionTitle}>{icon} {title}</Typography>
    {loading ? <ChartSkeleton /> : data.length > 0 ? (
      <>
        <HorizontalBarChart data={data} unit={unit} type={type} colors={colors} />
        <PodiumRow data={data} unit={unit} classes={classes} />
      </>
    ) : (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{emptyMsg}</Typography>
      </Box>
    )}
  </Box>
);

// ─── Perf Row ────────────────────────────────────────────────────────────────

const PerfRow = ({ label, val, sub, dot, classes, isLast }) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    className={classes.perfItem}
    style={{ borderBottom: isLast ? 'none' : undefined }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{sub}</Typography>
      </Box>
    </Stack>
    <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap', pl: 1, color: 'text.primary', fontSize: '0.9rem' }}>
      {val}
    </Typography>
  </Stack>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [summaries, setSummaries] = useState([]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const devRes = await fetch('/api/devices');
      if (!devRes.ok) throw new Error('Erreur lors de la récupération des appareils');
      const devData = await devRes.json();
      setDevices(devData);

      const posRes = await fetch('/api/positions');
      if (!posRes.ok) throw new Error('Erreur lors de la récupération des positions');
      setPositions(await posRes.json());

      const from = dayjs().startOf('day').toISOString();
      const to = dayjs().toISOString();
      if (devData.length > 0) {
        const q = new URLSearchParams({ from, to, daily: false });
        devData.forEach((d) => q.append('deviceId', d.id));
        const sumRes = await fetch(`/api/reports/summary?${q}`, { headers: { Accept: 'application/json' } });
        if (sumRes.ok) setSummaries(await sumRes.json());
      }
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived maps ──────────────────────────────────────────────────────────
  const positionMap = useMemo(() => {
    const m = {};
    positions.forEach((p) => { m[p.deviceId] = p; });
    return m;
  }, [positions]);

  const deviceMap = useMemo(() => {
    const m = {};
    devices.forEach((d) => { m[d.id] = d; });
    return m;
  }, [devices]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const offlineDevices = totalDevices - onlineDevices;
  const movingDevices = devices.filter((d) => { const p = positionMap[d.id]; return p && p.speed > 0; }).length;
  const parkedOnline = onlineDevices - movingDevices;
  const alertDevices = positions.filter((p) => p.attributes?.alarm).length;

  // ── Chart data ────────────────────────────────────────────────────────────
  const mkRanked = (arr) => arr.sort((a, b) => b.value - a.value).slice(0, 8).map((x, i) => ({ ...x, rank: i + 1 }));

  const distanceData = useMemo(() => mkRanked(
    summaries.filter((s) => s.distance > 0)
      .map((s) => ({ id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`, value: parseFloat(metersToKm(s.distance)) })),
  ), [summaries, deviceMap]);

  const speedData = useMemo(() => mkRanked(
    summaries.filter((s) => s.maxSpeed > 0)
      .map((s) => ({ id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`, value: knotsToKmh(s.maxSpeed) })),
  ), [summaries, deviceMap]);

  const fuelData = useMemo(() => mkRanked(
    summaries.filter((s) => s.spentFuel > 0)
      .map((s) => ({ id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`, value: parseFloat(s.spentFuel.toFixed(1)) })),
  ), [summaries, deviceMap]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalDistance = useMemo(() => summaries.reduce((a, s) => a + (s.distance || 0), 0), [summaries]);
  const totalFuel = useMemo(() => summaries.reduce((a, s) => a + (s.spentFuel || 0), 0), [summaries]);
  const totalEngineHours = useMemo(() => summaries.reduce((a, s) => a + (s.engineHours || 0), 0), [summaries]);
  const topSpeed = speedData[0];
  const topDistance = distanceData[0];

  const topHoursEntry = useMemo(() => {
    const best = summaries.filter((s) => s.engineHours > 0).sort((a, b) => b.engineHours - a.engineHours)[0];
    return best ? { name: deviceMap[best.deviceId]?.name || `#${best.deviceId}`, hours: msToHours(best.engineHours) } : null;
  }, [summaries, deviceMap]);

  const recentActivity = useMemo(() => positions
    .filter((p) => p.fixTime)
    .sort((a, b) => new Date(b.fixTime) - new Date(a.fixTime))
    .slice(0, 5)
    .map((p) => ({
      name: deviceMap[p.deviceId]?.name || `#${p.deviceId}`,
      time: dayjs(p.fixTime).fromNow(),
      speed: knotsToKmh(p.speed || 0),
      status: deviceMap[p.deviceId]?.status,
    })),
    [positions, deviceMap]);

  // ── Summary cards config ──────────────────────────────────────────────────
  const summaryCards = [
    { label: 'En mouvement', val: movingDevices, desc: 'Sur la route', icon: <TrendingUp />, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Garés', val: parkedOnline, desc: 'En ligne, immobiles', icon: <LocalParking />, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Hors ligne', val: offlineDevices, desc: 'Aucun signal', icon: <WifiOff />, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
    { label: 'Alertes', val: alertDevices, desc: 'Appareils avec alarmes', icon: <NotificationsIcon />, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  const perfRows = [
    { label: 'Vitesse maximale', val: topSpeed ? `${topSpeed.value} km/h` : '—', sub: topSpeed?.id || 'Aucune donnée', dot: '#ef4444' },
    { label: 'Distance maximale', val: topDistance ? `${topDistance.value} km` : '—', sub: topDistance?.id || 'Aucune donnée', dot: '#3b82f6' },
    { label: "Temps d'activité max.", val: topHoursEntry?.hours || '—', sub: topHoursEntry?.name || 'Aucune donnée', dot: '#10b981' },
  ];

  const totalBoxes = [
    { val: `${metersToKm(totalDistance)} km`, lbl: 'Distance totale', color: '#a78bfa', bg: 'rgba(124,58,237,0.15)' },
    { val: `${totalFuel.toFixed(1)} L`, lbl: 'Carburant total', color: '#fbbf24', bg: 'rgba(217,119,6,0.15)' },
    { val: msToHours(totalEngineHours), lbl: 'Heures moteur', color: '#4ade80', bg: 'rgba(22,163,74,0.15)' },
  ];

  const summaryBoxes = [
    { val: onlineDevices, lbl: 'En ligne', color: '#60a5fa', bg: 'rgba(37,99,235,0.15)' },
    { val: alertDevices, lbl: 'Avec alertes', color: '#f87171', bg: 'rgba(220,38,38,0.15)' },
    { val: offlineDevices, lbl: 'Hors ligne', color: '#94a3b8', bg: 'rgba(100,116,139,0.15)' },
  ];

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box className={classes.headerRow}>
          <Box>
            <Typography className={classes.title}>Tableau de bord de la flotte</Typography>
            <Typography className={classes.subtitle}>
              Surveillance en temps réel · {dayjs().format('DD/MM/YYYY')}
              {lastRefresh && (
                <Chip
                  icon={<Schedule style={{ fontSize: 12 }} />}
                  label={`${dayjs(lastRefresh).format('HH:mm:ss')}`}
                  size="small"
                  variant="outlined"
                  style={{
                    marginLeft: 8, fontSize: '0.68rem', height: 20,
                    color: theme.palette.text.secondary,
                    borderColor: theme.palette.divider,
                  }}
                />
              )}
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <span>
              <IconButton
                onClick={fetchAll}
                disabled={loading}
                style={{
                  backgroundColor: theme.palette.action.hover,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Refresh style={{ color: loading ? theme.palette.text.disabled : '#10b981' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <Box style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '12px 16px' }}>
            <Typography style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>⚠ {error}</Typography>
          </Box>
        )}

        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <Box className={classes.summaryRow}>
          {/* Total vehicle card */}
          <Card className={`${classes.cardBase} ${classes.totalVehiclesCard}`}>
            <CardContent style={{ flex: 1, padding: 20 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography style={{ fontSize: '0.82rem', opacity: 0.9, fontWeight: 500 }}>Total véhicules</Typography>
                  {loading
                    ? <Skeleton variant="text" width={60} height={52} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    : <Typography style={{ fontSize: '2.25rem', fontWeight: 900, margin: '6px 0' }}>{totalDevices}</Typography>
                  }
                  <Typography style={{ fontSize: '0.72rem', opacity: 0.8 }}>{onlineDevices} en ligne</Typography>
                </Box>
                <DirectionsCar style={{ fontSize: 26, opacity: 0.5 }} />
              </Stack>
            </CardContent>
          </Card>

          {/* Status cards */}
          {summaryCards.map((item, i) => (
            <Card
              key={i}
              className={classes.cardBase}
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent style={{ padding: 20 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography className={classes.summaryLabel}>{item.label}</Typography>
                    {loading
                      ? <Skeleton variant="text" width={50} height={44} />
                      : <Typography className={classes.summaryNumber} style={{ margin: '4px 0' }}>{item.val}</Typography>
                    }
                    <Typography className={classes.summaryDesc}>{item.desc}</Typography>
                  </Box>
                  <Avatar style={{ backgroundColor: item.bg, color: item.color, borderRadius: 8, width: 34, height: 34 }}>
                    {item.icon}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ── Distance & Speed charts ─────────────────────────────────────── */}
        <Box className={classes.twoCol}>
          <ChartSection title="Classement des distances" icon={<ShowChart style={{ fontSize: 17 }} />}
            data={distanceData} unit=" km" type="distance" colors={BAR_COLORS}
            classes={classes} loading={loading} emptyMsg="Aucune donnée de distance aujourd'hui" />
          <ChartSection title="Vitesse maximale" icon={<Speed style={{ fontSize: 17 }} />}
            data={speedData} unit=" km/h" type="speed" colors={SPEED_COLORS}
            classes={classes} loading={loading} emptyMsg="Aucune donnée de vitesse aujourd'hui" />
        </Box>

        {/* ── Fuel + Performance / Totals ─────────────────────────────────── */}
        <Box className={classes.twoCol}>
          <ChartSection title="Consommation carburant" icon={<LocalGasStation style={{ fontSize: 17 }} />}
            data={fuelData} unit=" L" type="fuel" colors={FUEL_COLORS}
            classes={classes} loading={loading} emptyMsg="Aucune donnée de carburant aujourd'hui" />

          <Box className={classes.rightStack}>
            {/* Performance table */}
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <AssignmentLate style={{ fontSize: 17 }} /> Meilleures performances
              </Typography>
              {loading
                ? [...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={46} style={{ marginBottom: 8, borderRadius: 8 }} />)
                : perfRows.map((row, i) => (
                  <PerfRow key={i} {...row} classes={classes} isLast={i === perfRows.length - 1} />
                ))
              }
            </Box>

            {/* Fleet totals */}
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <Update style={{ fontSize: 17 }} /> Totaux de la flotte
              </Typography>
              <Box className={classes.totalsRow}>
                {totalBoxes.map((b, i) => (
                  <Box key={i} className={classes.totalBox} style={{ backgroundColor: b.bg }}>
                    {loading
                      ? <Skeleton variant="text" height={42} />
                      : <Typography className={classes.totalVal} style={{ color: b.color }}>{b.val}</Typography>
                    }
                    <Typography className={classes.totalLab}>{b.lbl}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── Summary + Recent activity ───────────────────────────────────── */}
        <Box className={classes.twoCol}>
          {/* Fleet summary */}
          <Box className={classes.sectionCard}>
            <Typography className={classes.sectionTitle}>Résumé de la flotte</Typography>
            <Box className={classes.totalsRow}>
              {summaryBoxes.map((b, i) => (
                <Box key={i} className={classes.totalBox} style={{ backgroundColor: b.bg }}>
                  {loading
                    ? <Skeleton variant="text" height={42} />
                    : <Typography className={classes.totalVal} style={{ color: b.color }}>{b.val}</Typography>
                  }
                  <Typography className={classes.totalLab}>{b.lbl}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Recent activity */}
          <Box className={classes.sectionCard}>
            <Typography className={classes.sectionTitle}>Activité récente</Typography>
            {loading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" height={34} style={{ marginBottom: 8, borderRadius: 8 }} />)
              : recentActivity.length > 0
                ? recentActivity.map((item, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    className={classes.perfItem}
                    style={{ borderBottom: i === recentActivity.length - 1 ? 'none' : undefined }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: item.status === 'online' ? '#10b981' : '#94a3b8' }} />
                      <Box>
                        <Typography style={{ fontWeight: 600, fontSize: '0.86rem', color: theme.palette.text.primary }}>{item.name}</Typography>
                        <Typography style={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>{item.time}</Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={`${item.speed} km/h`}
                      size="small"
                      style={{
                        fontSize: '0.7rem', fontWeight: 700, height: 20,
                        backgroundColor: item.speed > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
                        color: item.speed > 0 ? '#4ade80' : '#94a3b8',
                        border: `1px solid ${item.speed > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.2)'}`,
                      }}
                    />
                  </Stack>
                ))
                : (
                  <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
                    <Typography style={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>Aucune activité récente</Typography>
                  </Box>
                )
            }
          </Box>
        </Box>

      </Box>
    </PageLayout>
  );
};

export default DashboardPage;
