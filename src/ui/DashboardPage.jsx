import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Stack, Avatar,
  Skeleton, Tooltip, Chip,
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    flex: 1,
    boxSizing: 'border-box',
    padding: theme.spacing(3),
    background: '#080d1a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  title: { fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9' },
  subtitle: { color: '#94a3b8', fontSize: '0.85rem' },

  cardBase: {
    borderRadius: '16px',
    width: '100%',
    height: '100%',
    border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
  },
  totalVehiclesCard: {
    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    color: '#fff',
  },
  summaryNumber: { fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, color: '#f1f5f9' },
  summaryLabel: { fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' },
  summaryDesc: { fontSize: '0.75rem', color: '#475569' },

  sectionCard: {
    padding: theme.spacing(3),
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing(2),
  },

  totalBox: {
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    flex: 1,
  },
  totalVal: { fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 },
  totalLab: { fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' },

  perfItem: {
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    '&:last-child': { borderBottom: 'none' },
  },

  podiumRow: {
    display: 'flex',
    gap: 8,
    marginTop: theme.spacing(2),
  },
  podiumBox: {
    flex: 1,
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    textAlign: 'center',
  },
  podiumRank: { fontSize: '1rem', fontWeight: 800 },
  podiumId: { fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 },
  podiumVal: { fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginTop: 2 },
}));

// ─── Colour palette for chart bars ───────────────────────────────────────────

const BAR_COLORS = [
  '#eab308', '#94a3b8', '#f97316', '#a855f7',
  '#8b5cf6', '#ec4899', '#f472b6', '#f9a8d4',
];
const SPEED_COLORS = [
  '#ef4444', '#f97316', '#fb923c', '#fbbf24',
  '#f59e0b', '#d97706', '#b45309', '#92400e',
];
const FUEL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
];
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

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, type }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const cfg = {
    distance: { key: 'Distance', unit: ' km', color: '#818cf8' },
    speed: { key: 'Vitesse max.', unit: ' km/h', color: '#ef4444' },
    fuel: { key: 'Carburant', unit: ' L', color: '#f59e0b' },
  }[type];

  return (
    <Box sx={{
      background: 'rgba(10,15,30,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      p: '12px 16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      minWidth: 200,
    }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5, color: '#f1f5f9' }}>
        Rang #{d.payload.rank}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
        <strong>Véhicule:</strong> {d.payload.id}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: cfg.color, mt: 0.5 }}>
        {cfg.key}: {d.value}{cfg.unit}
      </Typography>
    </Box>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PodiumRow = ({ data, unit, classes }) => (
  <Box className={classes.podiumRow}>
    {data.slice(0, 3).map((item, i) => (
      <Box key={i} className={classes.podiumBox}>
        <Typography className={classes.podiumRank} sx={{ color: RANK_COLORS[i] }}>
          #{i + 1}
        </Typography>
        <Typography className={classes.podiumId}>{item.id}</Typography>
        <Typography className={classes.podiumVal}>{item.value}{unit}</Typography>
      </Box>
    ))}
  </Box>
);

const HorizontalBarChart = ({ data, unit, type, colors }) => (
  <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
      <XAxis
        type="number"
        tick={{ fontSize: 11, fill: '#475569' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        dataKey="id"
        type="category"
        width={100}
        tick={{ fontSize: 11, fill: '#94a3b8' }}
        axisLine={false}
        tickLine={false}
      />
      <RechartsTooltip content={<CustomTooltip type={type} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

const ChartSkeleton = () => (
  <Box sx={{ p: 1 }}>
    {[...Array(5)].map((_, i) => (
      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Skeleton variant="text" width={90} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Skeleton variant="rectangular" height={14} sx={{ flex: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />
      </Box>
    ))}
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { classes } = useStyles();

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);

  const [devices, setDevices] = useState([]);
  const [positions, setPositions] = useState([]);
  const [summaries, setSummaries] = useState([]);

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
      const posData = await posRes.json();
      setPositions(posData);

      const from = dayjs().startOf('day').toISOString();
      const to = dayjs().toISOString();
      const deviceIds = devData.map((d) => d.id);
      if (deviceIds.length > 0) {
        const query = new URLSearchParams({ from, to, daily: false });
        deviceIds.forEach((id) => query.append('deviceId', id));
        const sumRes = await fetch(`/api/reports/summary?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
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

  const positionMap = useMemo(() => {
    const map = {};
    positions.forEach((p) => { map[p.deviceId] = p; });
    return map;
  }, [positions]);

  const deviceMap = useMemo(() => {
    const map = {};
    devices.forEach((d) => { map[d.id] = d; });
    return map;
  }, [devices]);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const offlineDevices = totalDevices - onlineDevices;
  const movingDevices = devices.filter((d) => {
    const pos = positionMap[d.id];
    return pos && pos.speed > 0;
  }).length;
  const parkedOnline = onlineDevices - movingDevices;
  const alertDevices = positions.filter((p) => p.attributes?.alarm).length;

  const distanceData = useMemo(() => summaries
    .filter((s) => s.distance > 0)
    .map((s) => ({ id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`, value: parseFloat(metersToKm(s.distance)), rank: 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 8).map((item, i) => ({ ...item, rank: i + 1 })),
    [summaries, deviceMap]);

  const speedData = useMemo(() => summaries
    .filter((s) => s.maxSpeed > 0)
    .map((s) => ({ id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`, value: knotsToKmh(s.maxSpeed), rank: 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 8).map((item, i) => ({ ...item, rank: i + 1 })),
    [summaries, deviceMap]);

  const fuelData = useMemo(() => summaries
    .filter((s) => s.spentFuel > 0)
    .map((s) => ({ id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`, value: parseFloat(s.spentFuel.toFixed(1)), rank: 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 8).map((item, i) => ({ ...item, rank: i + 1 })),
    [summaries, deviceMap]);

  const totalDistance = useMemo(() => summaries.reduce((acc, s) => acc + (s.distance || 0), 0), [summaries]);
  const totalFuel = useMemo(() => summaries.reduce((acc, s) => acc + (s.spentFuel || 0), 0), [summaries]);
  const totalEngineHours = useMemo(() => summaries.reduce((acc, s) => acc + (s.engineHours || 0), 0), [summaries]);

  const topSpeed = speedData[0];
  const topDistance = distanceData[0];

  const topHoursEntry = useMemo(() => {
    if (!summaries.length) return null;
    const best = summaries.filter((s) => s.engineHours > 0).sort((a, b) => b.engineHours - a.engineHours)[0];
    if (!best) return null;
    return { name: deviceMap[best.deviceId]?.name || `#${best.deviceId}`, hours: msToHours(best.engineHours) };
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

  const summaryCards = [
    { label: 'Véhicules en mouvement', val: movingDevices, desc: 'Actuellement sur la route', icon: <TrendingUp />, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Véhicules garés', val: parkedOnline, desc: 'En ligne mais sans mouvement', icon: <LocalParking />, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Hors ligne', val: offlineDevices, desc: 'Aucun signal reçu', icon: <WifiOff />, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
    { label: 'Alertes actives', val: alertDevices, desc: 'Appareils avec alarmes', icon: <NotificationsIcon />, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box className={classes.headerRow}>
          <Box>
            <Typography className={classes.title}>Tableau de bord de la flotte</Typography>
            <Typography className={classes.subtitle}>
              Surveillance et analyse en temps réel · Aujourd'hui {dayjs().format('DD/MM/YYYY')}
              {lastRefresh && (
                <Chip
                  icon={<Schedule sx={{ fontSize: '12px !important' }} />}
                  label={`Mis à jour ${dayjs(lastRefresh).format('HH:mm:ss')}`}
                  size="small"
                  sx={{ ml: 1, fontSize: '0.7rem', height: 20, bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                  variant="outlined"
                />
              )}
            </Typography>
          </Box>
          <Tooltip title="Actualiser les données">
            <IconButton
              onClick={fetchAll}
              disabled={loading}
              sx={{ bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              <Refresh sx={{ color: loading ? '#475569' : '#10b981' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Error banner ───────────────────────────────────────────────── */}
        {error && (
          <Box sx={{ bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 2, p: 2, mb: 3 }}>
            <Typography sx={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>⚠ {error}</Typography>
          </Box>
        )}

        {/* ── Top Summary Row ─────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', mb: 3, flexWrap: 'wrap' }}>
          {/* Total vehicles — gradient card */}
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Card className={`${classes.cardBase} ${classes.totalVehiclesCard}`}>
              <CardContent sx={{ flex: 1, p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 500 }}>Total véhicules</Typography>
                    {loading
                      ? <Skeleton variant="text" width={60} height={56} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                      : <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, my: 1 }}>{totalDevices}</Typography>
                    }
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.8 }}>{onlineDevices} en ligne</Typography>
                  </Box>
                  <DirectionsCar sx={{ fontSize: 28, opacity: 0.5 }} />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Dynamic status cards */}
          {summaryCards.map((item, i) => (
            <Box key={i} sx={{ flex: 1, minWidth: 140 }}>
              <Card className={classes.cardBase} sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography className={classes.summaryLabel}>{item.label}</Typography>
                      {loading
                        ? <Skeleton variant="text" width={50} height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                        : <Typography className={classes.summaryNumber} sx={{ my: 0.5 }}>{item.val}</Typography>
                      }
                      <Typography className={classes.summaryDesc}>{item.desc}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: item.bg, color: item.color, borderRadius: '8px', width: 36, height: 36 }}>
                      {item.icon}
                    </Avatar>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {/* ── Charts Row — Distance & Speed ───────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <ShowChart sx={{ fontSize: 18 }} /> Classement des distances (aujourd'hui)
              </Typography>
              {loading ? <ChartSkeleton /> : distanceData.length > 0 ? (
                <>
                  <HorizontalBarChart data={distanceData} unit=" km" type="distance" colors={BAR_COLORS} />
                  <PodiumRow data={distanceData} unit=" km" classes={classes} />
                </>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#475569' }}>Aucune donnée de distance aujourd'hui</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <Speed sx={{ fontSize: 18 }} /> Classement de vitesse maximale (aujourd'hui)
              </Typography>
              {loading ? <ChartSkeleton /> : speedData.length > 0 ? (
                <>
                  <HorizontalBarChart data={speedData} unit=" km/h" type="speed" colors={SPEED_COLORS} />
                  <PodiumRow data={speedData} unit=" km/h" classes={classes} />
                </>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#475569' }}>Aucune donnée de vitesse aujourd'hui</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Bottom Row — Fuel + Performance / Totals ────────────────────── */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <LocalGasStation sx={{ fontSize: 18 }} /> Consommation de carburant (aujourd'hui)
              </Typography>
              {loading ? <ChartSkeleton /> : fuelData.length > 0 ? (
                <>
                  <HorizontalBarChart data={fuelData} unit=" L" type="fuel" colors={FUEL_COLORS} />
                  <PodiumRow data={fuelData} unit=" L" classes={classes} />
                </>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#475569' }}>Aucune donnée de carburant aujourd'hui</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              {/* Performance Table */}
              <Box className={classes.sectionCard}>
                <Typography className={classes.sectionTitle}>
                  <AssignmentLate sx={{ fontSize: 18 }} /> Meilleures performances (aujourd'hui)
                </Typography>
                {loading ? (
                  <Box sx={{ p: 1 }}>
                    {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />)}
                  </Box>
                ) : (
                  [
                    { label: 'Vitesse maximale', val: topSpeed ? `${topSpeed.value} km/h` : '—', sub: topSpeed?.id || 'Aucune donnée', dot: '#ef4444' },
                    { label: 'Distance maximale', val: topDistance ? `${topDistance.value} km` : '—', sub: topDistance?.id || 'Aucune donnée', dot: '#3b82f6' },
                    { label: "Temps d'activité maximal", val: topHoursEntry?.hours || '—', sub: topHoursEntry?.name || 'Aucune donnée', dot: '#10b981' },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" className={classes.perfItem}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.dot, flexShrink: 0 }} />
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{item.label}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.sub}</Typography>
                        </Box>
                      </Stack>
                      <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap', pl: 1, color: '#f1f5f9' }}>{item.val}</Typography>
                    </Stack>
                  ))
                )}
              </Box>

              {/* Fleet Totals */}
              <Box className={classes.sectionCard}>
                <Typography className={classes.sectionTitle}>
                  <Update sx={{ fontSize: 18 }} /> Totaux de la flotte (aujourd'hui)
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Box className={classes.totalBox} sx={{ bgcolor: 'rgba(124,58,237,0.15)', borderRadius: '12px' }}>
                    {loading
                      ? <Skeleton variant="text" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                      : <Typography className={classes.totalVal} sx={{ color: '#a78bfa' }}>{metersToKm(totalDistance)} km</Typography>
                    }
                    <Typography className={classes.totalLab}>Distance totale</Typography>
                  </Box>
                  <Box className={classes.totalBox} sx={{ bgcolor: 'rgba(217,119,6,0.15)', borderRadius: '12px' }}>
                    {loading
                      ? <Skeleton variant="text" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                      : <Typography className={classes.totalVal} sx={{ color: '#fbbf24' }}>{totalFuel.toFixed(1)} L</Typography>
                    }
                    <Typography className={classes.totalLab}>Carburant total</Typography>
                  </Box>
                  <Box className={classes.totalBox} sx={{ bgcolor: 'rgba(22,163,74,0.15)', borderRadius: '12px' }}>
                    {loading
                      ? <Skeleton variant="text" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                      : <Typography className={classes.totalVal} sx={{ color: '#4ade80' }}>{msToHours(totalEngineHours)}</Typography>
                    }
                    <Typography className={classes.totalLab}>Heures moteur</Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* ── Footer Row — Summary + Recent Activity ───────────────────────── */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', mt: 1, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>Résumé de la flotte</Typography>
              <Stack direction="row" spacing={2}>
                <Box className={classes.totalBox} sx={{ bgcolor: 'rgba(37,99,235,0.15)', borderRadius: '12px' }}>
                  {loading
                    ? <Skeleton variant="text" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                    : <Typography className={classes.totalVal} sx={{ color: '#60a5fa' }}>{onlineDevices}</Typography>
                  }
                  <Typography className={classes.totalLab}>Appareils en ligne</Typography>
                </Box>
                <Box className={classes.totalBox} sx={{ bgcolor: 'rgba(220,38,38,0.15)', borderRadius: '12px' }}>
                  {loading
                    ? <Skeleton variant="text" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                    : <Typography className={classes.totalVal} sx={{ color: '#f87171' }}>{alertDevices}</Typography>
                  }
                  <Typography className={classes.totalLab}>Avec alertes</Typography>
                </Box>
                <Box className={classes.totalBox} sx={{ bgcolor: 'rgba(100,116,139,0.15)', borderRadius: '12px' }}>
                  {loading
                    ? <Skeleton variant="text" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                    : <Typography className={classes.totalVal} sx={{ color: '#94a3b8' }}>{offlineDevices}</Typography>
                  }
                  <Typography className={classes.totalLab}>Hors ligne</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>Activité récente</Typography>
              {loading ? (
                <Box sx={{ p: 1 }}>
                  {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />)}
                </Box>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" className={classes.perfItem}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: item.status === 'online' ? '#10b981' : '#94a3b8' }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#e2e8f0' }}>{item.name}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.time}</Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={`${item.speed} km/h`}
                      size="small"
                      sx={{
                        fontSize: '0.72rem', fontWeight: 700, height: 22,
                        bgcolor: item.speed > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
                        color: item.speed > 0 ? '#4ade80' : '#94a3b8',
                        border: `1px solid ${item.speed > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(148,163,184,0.15)'}`,
                      }}
                    />
                  </Stack>
                ))
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#475569' }}>Aucune activité récente</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

      </Box>
    </PageLayout>
  );
};

export default DashboardPage;
