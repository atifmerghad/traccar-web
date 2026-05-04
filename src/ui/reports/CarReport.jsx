import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Stack, Skeleton,
} from '@mui/material';
import {
  DirectionsCar, LocalGasStation, Speed, LocalParking,
  TrendingUp, Timer, Warning,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import { formatDistance, formatSpeed, formatVolume, formatNumericHours } from '../../common/util/formatter';
import dayjs from 'dayjs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

const GLASS = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
};

const StatCard = ({ icon, title, value, color, loading }) => (
  <Box sx={{
    ...GLASS, flex: 1, minWidth: 0, p: 3,
    display: 'flex', flexDirection: 'column', gap: 1.5,
    position: 'relative', overflow: 'hidden',
    '&::before': {
      content: '""', position: 'absolute', top: -20, right: -20,
      width: 80, height: 80, borderRadius: '50%',
      background: `${color}22`,
    },
  }}>
    <Box sx={{
      width: 40, height: 40, borderRadius: '12px',
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon && <Box sx={{ color, fontSize: 20 }}>{icon}</Box>}
    </Box>
    {loading ? (
      <>
        <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} height={40} />
        <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
      </>
    ) : (
      <>
        <Typography sx={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1.1 }}>{value}</Typography>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Typography>
      </>
    )}
  </Box>
);

const DetailRow = ({ label, value, color = '#f1f5f9' }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center"
    sx={{ py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.05)', '&:last-child': { borderBottom: 'none' } }}>
    <Typography sx={{ fontSize: '0.83rem', color: '#94a3b8' }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.83rem', fontWeight: 700, color }}>{value}</Typography>
  </Stack>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', p: 1.5,
    }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#6366f1' }}>
        {payload[0]?.value?.toFixed(1)} km
      </Typography>
    </Box>
  );
};

const CarReport = ({ deviceId: propDeviceId, period, customFrom, customTo }) => {
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const storeDeviceId = useSelector((state) => state.devices.selectedId);
  const deviceId = propDeviceId || storeDeviceId;

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [summaryData, setSummaryData] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDateRange = () => {
    let selectedFrom, selectedTo;
    switch (period) {
      case 'today': selectedFrom = dayjs().startOf('day'); selectedTo = dayjs().endOf('day'); break;
      case 'yesterday': selectedFrom = dayjs().subtract(1, 'day').startOf('day'); selectedTo = dayjs().subtract(1, 'day').endOf('day'); break;
      case 'thisWeek': selectedFrom = dayjs().startOf('week'); selectedTo = dayjs().endOf('week'); break;
      case 'previousWeek': selectedFrom = dayjs().subtract(1, 'week').startOf('week'); selectedTo = dayjs().subtract(1, 'week').endOf('week'); break;
      case 'thisMonth': selectedFrom = dayjs().startOf('month'); selectedTo = dayjs().endOf('month'); break;
      case 'previousMonth': selectedFrom = dayjs().subtract(1, 'month').startOf('month'); selectedTo = dayjs().subtract(1, 'month').endOf('month'); break;
      default:
        selectedFrom = dayjs(customFrom);
        selectedTo = dayjs(customTo);
        break;
    }
    if (!selectedFrom?.isValid() || !selectedTo?.isValid()) {
      return { from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() };
    }
    return { from: selectedFrom.toISOString(), to: selectedTo.toISOString() };
  };

  const fetchReportData = useCatch(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const { from: fromDate, to: toDate } = getDateRange();
      const query = new URLSearchParams({ deviceId, from: fromDate, to: toDate });
      const [summaryRes, tripsRes, stopsRes] = await Promise.all([
        fetch(`/api/reports/summary?${query.toString()}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/reports/trips?${query.toString()}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/reports/stops?${query.toString()}`, { headers: { Accept: 'application/json' } }),
      ]);
      if (!summaryRes.ok || !tripsRes.ok || !stopsRes.ok) throw new Error('Erreur lors du chargement');
      setSummaryData(await summaryRes.json());
      setTrips(await tripsRes.json());
      setStops(await stopsRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  });

  useEffectAsync(async () => {
    if (deviceId) fetchReportData();
  }, [deviceId, period, customFrom, customTo]);

  const stats = useMemo(() => {
    if (summaryData.length === 0) return {
      totalDistance: 0, totalMovementTime: 0, totalParkingTime: 0,
      totalFuel: 0, maxSpeed: 0, totalStops: 0, totalMovements: 0,
      averageSpeed: 0, averageConsumption: 0,
    };
    const summary = summaryData[0];
    const totalDistance = summary.distance || 0;
    const totalMovementTime = trips.reduce((s, tr) => s + (tr.duration || 0), 0);
    const totalParkingTime = stops.reduce((s, st) => s + (st.duration || 0), 0);
    const totalFuel = summary.spentFuel || 0;
    const maxSpeed = summary.maxSpeed || 0;
    const averageSpeed = summary.averageSpeed || 0;
    const averageConsumption = totalDistance > 0 && totalFuel > 0 ? (totalFuel / totalDistance) * 100 : 0;
    return {
      totalDistance, totalMovementTime, totalParkingTime, totalFuel,
      maxSpeed, totalStops: stops.length, totalMovements: trips.length,
      averageSpeed, averageConsumption,
    };
  }, [summaryData, trips, stops]);

  const chartData = useMemo(() => trips.map((trip, i) => ({
    name: `Trajet ${i + 1}`,
    distance: (trip.distance || 0) / 1000,
  })), [trips]);

  const selectedDevice = deviceId ? devices[deviceId] : null;
  const dateRange = getDateRange();

  if (!deviceId) {
    return (
      <Box sx={{ ...GLASS, p: 6, textAlign: 'center' }}>
        <DirectionsCar sx={{ fontSize: 56, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>Aucun véhicule sélectionné</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Sélectionnez un véhicule dans le filtre ci-dessus pour voir son rapport.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...GLASS, p: 6, textAlign: 'center' }}>
        <Warning sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>Erreur de chargement</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header strip */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>
            {selectedDevice?.name || 'Véhicule'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {dayjs(dateRange.from).format('DD/MM/YYYY')} — {dayjs(dateRange.to).format('DD/MM/YYYY')}
          </Typography>
        </Box>
      </Box>

      {/* Stat cards row 1 */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard loading={loading} icon={<DirectionsCar fontSize="inherit" />} title="Distance Totale" value={formatDistance(stats.totalDistance, distanceUnit, t)} color="#0ea5e9" />
        <StatCard loading={loading} icon={<Timer fontSize="inherit" />} title="Temps en Mouvement" value={formatNumericHours(stats.totalMovementTime, t)} color="#a855f7" />
        <StatCard loading={loading} icon={<LocalParking fontSize="inherit" />} title="Temps de Stationnement" value={formatNumericHours(stats.totalParkingTime, t)} color="#f97316" />
      </Box>

      {/* Stat cards row 2 */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard loading={loading} icon={<LocalGasStation fontSize="inherit" />} title="Consommation Totale" value={stats.totalFuel > 0 ? formatVolume(stats.totalFuel, volumeUnit, t) : '0.0 L'} color="#22c55e" />
        <StatCard loading={loading} icon={<Speed fontSize="inherit" />} title="Vitesse Max" value={stats.maxSpeed > 0 ? formatSpeed(stats.maxSpeed, speedUnit, t) : '0 km/h'} color="#ef4444" />
        <StatCard loading={loading} icon={<TrendingUp fontSize="inherit" />} title="Trajets Totaux" value={loading ? '—' : stats.totalMovements.toString()} color="#f59e0b" />
      </Box>

      {/* Chart + Details side by side */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Distance chart */}
        <Box sx={{ ...GLASS, flex: 2, minWidth: 280, p: 3 }}>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9', mb: 0.5 }}>
            Distance par Trajet
          </Typography>
          <Typography sx={{ fontSize: '0.77rem', color: '#94a3b8', mb: 2.5 }}>Kilomètres parcourus</Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)' }} />
          ) : chartData.length === 0 ? (
            <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>Aucun trajet sur cette période</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="distance" stroke="#6366f1" strokeWidth={2.5} fill="url(#distGrad)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#818cf8' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Details panels */}
        <Box sx={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ ...GLASS, p: 3, flex: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', mb: 1.5 }}>
              Mouvement
            </Typography>
            <DetailRow label="Trajets totaux" value={stats.totalMovements.toString()} />
            <DetailRow label="Durée totale" value={formatNumericHours(stats.totalMovementTime + stats.totalParkingTime, t)} />
            <DetailRow
              label="Conso. moy."
              value={stats.averageConsumption > 0 ? `${stats.averageConsumption.toFixed(1)} L/100km` : '0.0 L/100km'}
              color="#22c55e"
            />
          </Box>
          <Box sx={{ ...GLASS, p: 3, flex: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', mb: 1.5 }}>
              Efficacité
            </Typography>
            <DetailRow
              label="Vitesse moyenne"
              value={stats.averageSpeed > 0 ? formatSpeed(stats.averageSpeed, speedUnit, t) : '0 km/h'}
            />
            <DetailRow
              label="Efficacité carburant"
              value={stats.averageConsumption > 0 && stats.averageConsumption < 10 ? 'Efficace' : 'Normale'}
              color={stats.averageConsumption > 0 && stats.averageConsumption < 10 ? '#22c55e' : '#94a3b8'}
            />
            <DetailRow label="Arrêts totaux" value={stats.totalStops.toString()} color="#f59e0b" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CarReport;
