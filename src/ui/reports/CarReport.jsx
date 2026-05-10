import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Stack, Skeleton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  DirectionsCar,
  LocalGasStation,
  Speed,
  LocalParking,
  TrendingUp,
  Timer,
  Warning,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import {
  formatDistance,
  formatSpeed,
  formatVolume,
  formatNumericHours,
} from '../../common/util/formatter';
import dayjs from 'dayjs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const StatCard = ({ icon, title, value, color, loading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const glass = {
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.05)
      : theme.palette.background.paper,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
    borderRadius: '20px',
  };
  return (
    <Box
      sx={{
        ...glass,
        flex: 1,
        minWidth: 0,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: alpha(color, 0.13),
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          backgroundColor: alpha(color, 0.13),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon && <Box sx={{ color, fontSize: 20 }}>{icon}</Box>}
      </Box>
      {loading ? (
        <>
          <Skeleton
            variant="text"
            width="60%"
            sx={{
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.08)
                : alpha(theme.palette.common.black, 0.08),
            }}
            height={40}
          />
          <Skeleton
            variant="text"
            width="80%"
            sx={{
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.06)
                : alpha(theme.palette.common.black, 0.06),
            }}
          />
        </>
      ) : (
        <>
          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {title}
          </Typography>
        </>
      )}
    </Box>
  );
};

const DetailRow = ({ label, value, color }) => {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        py: 1.25,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography sx={{ fontSize: '0.83rem', color: theme.palette.text.secondary }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: '0.83rem', fontWeight: 700, color: color || theme.palette.text.primary }}
      >
        {value}
      </Typography>
    </Stack>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: isDark
          ? alpha(theme.palette.background.default, 0.95)
          : theme.palette.background.paper,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
        borderRadius: '10px',
        p: 1.5,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: theme.palette.primary.main }}>
        {payload[0]?.value?.toFixed(1)} km
      </Typography>
    </Box>
  );
};

const CarReport = ({
  deviceIds: propDeviceIds,
  deviceId: legacyDeviceId,
  period,
  customFrom,
  customTo,
}) => {
  const t = useTranslation();
  const tt = (key, fallback) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const devices = useSelector((state) => state.devices.items);
  const storeDeviceId = useSelector((state) => state.devices.selectedId);

  const effectiveIds = useMemo(() => {
    if (Array.isArray(propDeviceIds) && propDeviceIds.length) {
      return propDeviceIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    }
    const one = legacyDeviceId ?? storeDeviceId;
    return one != null && one !== '' ? [Number(one)] : [];
  }, [propDeviceIds, legacyDeviceId, storeDeviceId]);

  const multiDevice = effectiveIds.length > 1;

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [summaryData, setSummaryData] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const glass = {
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.05)
      : theme.palette.background.paper,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
    borderRadius: '20px',
  };

  const getDateRange = () => {
    let selectedFrom, selectedTo;
    switch (period) {
      case 'today':
        selectedFrom = dayjs().startOf('day');
        selectedTo = dayjs().endOf('day');
        break;
      case 'yesterday':
        selectedFrom = dayjs().subtract(1, 'day').startOf('day');
        selectedTo = dayjs().subtract(1, 'day').endOf('day');
        break;
      case 'thisWeek':
        selectedFrom = dayjs().startOf('week');
        selectedTo = dayjs().endOf('week');
        break;
      case 'previousWeek':
        selectedFrom = dayjs().subtract(1, 'week').startOf('week');
        selectedTo = dayjs().subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        selectedFrom = dayjs().startOf('month');
        selectedTo = dayjs().endOf('month');
        break;
      case 'previousMonth':
        selectedFrom = dayjs().subtract(1, 'month').startOf('month');
        selectedTo = dayjs().subtract(1, 'month').endOf('month');
        break;
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
    if (!effectiveIds.length) return;
    setLoading(true);
    setError(null);
    try {
      const { from: fromDate, to: toDate } = getDateRange();
      const query = new URLSearchParams({ from: fromDate, to: toDate });
      effectiveIds.forEach((id) => query.append('deviceId', id));
      const [summaryRes, tripsRes, stopsRes] = await Promise.all([
        fetch(`/api/reports/summary?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        }),
        fetch(`/api/reports/trips?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        }),
        fetch(`/api/reports/stops?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        }),
      ]);
      if (!summaryRes.ok || !tripsRes.ok || !stopsRes.ok)
        throw new Error('Erreur lors du chargement');
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
    if (effectiveIds.length) fetchReportData();
  }, [effectiveIds.join(','), period, customFrom, customTo]);

  const stats = useMemo(() => {
    if (summaryData.length === 0) {
      return {
        totalDistance: 0,
        totalMovementTime: 0,
        totalParkingTime: 0,
        totalFuel: 0,
        maxSpeed: 0,
        totalStops: 0,
        totalMovements: 0,
        averageSpeed: 0,
        averageConsumption: 0,
      };
    }
    const totalDistance = summaryData.reduce((s, row) => s + (row.distance || 0), 0);
    const totalFuel = summaryData.reduce((s, row) => s + (row.spentFuel || 0), 0);
    const maxSpeed = summaryData.reduce((s, row) => Math.max(s, row.maxSpeed || 0), 0);
    const weightedAvgSpeed =
      totalDistance > 0
        ? summaryData.reduce((s, r) => s + (r.averageSpeed || 0) * (r.distance || 0), 0) /
          totalDistance
        : 0;
    const totalMovementTime = trips.reduce((s, tr) => s + (tr.duration || 0), 0);
    const totalParkingTime = stops.reduce((s, st) => s + (st.duration || 0), 0);
    const averageConsumption =
      totalDistance > 0 && totalFuel > 0 ? (totalFuel / totalDistance) * 100 : 0;
    return {
      totalDistance,
      totalMovementTime,
      totalParkingTime,
      totalFuel,
      maxSpeed,
      totalStops: stops.length,
      totalMovements: trips.length,
      averageSpeed: weightedAvgSpeed,
      averageConsumption,
    };
  }, [summaryData, trips, stops]);

  const chartData = useMemo(
    () =>
      trips.map((trip, i) => ({
        name: multiDevice
          ? `${(devices[trip.deviceId]?.name || '').slice(0, 10) || '?'} · ${i + 1}`
          : `Trajet ${i + 1}`,
        distance: (trip.distance || 0) / 1000,
      })),
    [trips, multiDevice, devices],
  );

  const deviceTitle = useMemo(() => {
    if (!effectiveIds.length) return '';
    if (effectiveIds.length === 1) return devices[effectiveIds[0]]?.name || '—';
    return `${effectiveIds.length} ${t('deviceTitle')}`;
  }, [effectiveIds, devices, t]);
  const dateRange = getDateRange();

  const tickColor = theme.palette.text.disabled;
  const gridColor = isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.divider;

  if (!effectiveIds.length) {
    return (
      <Box sx={{ ...glass, p: 6, textAlign: 'center' }}>
        <DirectionsCar
          sx={{ fontSize: 56, color: theme.palette.action.disabledBackground, mb: 2 }}
        />
        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
          {t('reportNoVehicleSelected')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
          {t('reportNoVehicleHint')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...glass, p: 6, textAlign: 'center' }}>
        <Warning sx={{ fontSize: 48, color: theme.palette.error.main, mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
          {t('reportLoadError')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Typography
            sx={{ fontSize: '1.1rem', fontWeight: 800, color: theme.palette.text.primary }}
          >
            {deviceTitle}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
            {dayjs(dateRange.from).format('DD/MM/YYYY')} —{' '}
            {dayjs(dateRange.to).format('DD/MM/YYYY')}
          </Typography>
        </Box>
      </Box>

      {/* Stat cards row 1 */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard
          loading={loading}
          icon={<DirectionsCar fontSize="inherit" />}
          title={t('sharedDistance')}
          value={formatDistance(stats.totalDistance, distanceUnit, t)}
          color={theme.palette.info.main}
        />
        <StatCard
          loading={loading}
          icon={<Timer fontSize="inherit" />}
          title={t('reportMovementTime')}
          value={formatNumericHours(stats.totalMovementTime, t)}
          color={theme.palette.secondary.main}
        />
        <StatCard
          loading={loading}
          icon={<LocalParking fontSize="inherit" />}
          title={t('reportParkingTime')}
          value={formatNumericHours(stats.totalParkingTime, t)}
          color={theme.palette.warning.main}
        />
      </Box>

      {/* Stat cards row 2 */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard
          loading={loading}
          icon={<LocalGasStation fontSize="inherit" />}
          title={t('reportSpentFuel')}
          value={stats.totalFuel > 0 ? formatVolume(stats.totalFuel, volumeUnit, t) : '0.0 L'}
          color={theme.palette.success.main}
        />
        <StatCard
          loading={loading}
          icon={<Speed fontSize="inherit" />}
          title={t('reportMaximumSpeed')}
          value={stats.maxSpeed > 0 ? formatSpeed(stats.maxSpeed, speedUnit, t) : '—'}
          color={theme.palette.error.main}
        />
        <StatCard
          loading={loading}
          icon={<TrendingUp fontSize="inherit" />}
          title={t('reportTrips')}
          value={loading ? '—' : stats.totalMovements.toString()}
          color={theme.palette.warning.main}
        />
      </Box>

      {/* Chart + Details side by side */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Distance chart */}
        <Box sx={{ ...glass, flex: 2, minWidth: 280, p: 3 }}>
          <Typography
            sx={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            {tt('reportDistancePerTrip', 'Distance per Trip')}
          </Typography>
          <Typography sx={{ fontSize: '0.77rem', color: theme.palette.text.secondary, mb: 2.5 }}>
            {tt('reportKmTraveled', 'Kilometers traveled')}
          </Typography>
          {loading ? (
            <Skeleton
              variant="rectangular"
              height={180}
              sx={{
                borderRadius: 2,
                bgcolor: isDark
                  ? alpha(theme.palette.common.white, 0.06)
                  : alpha(theme.palette.common.black, 0.06),
              }}
            />
          ) : chartData.length === 0 ? (
            <Box
              sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.85rem' }}>
                {t('sharedNoData')}
              </Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2.5}
                  fill="url(#distGrad)"
                  dot={{ fill: theme.palette.primary.main, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: theme.palette.primary.light }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Details panels */}
        <Box sx={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ ...glass, p: 3, flex: 1 }}>
            <Typography
              sx={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: theme.palette.text.primary,
                mb: 1.5,
              }}
            >
              {t('positionMoving')}
            </Typography>
            <DetailRow label={t('reportTrips')} value={stats.totalMovements.toString()} />
            <DetailRow
              label={t('reportDuration')}
              value={formatNumericHours(stats.totalMovementTime + stats.totalParkingTime, t)}
            />
            <DetailRow
              label={t('reportAvgConsumption')}
              value={
                stats.averageConsumption > 0
                  ? `${stats.averageConsumption.toFixed(1)} L/100km`
                  : '—'
              }
              color={theme.palette.success.main}
            />
          </Box>
          <Box sx={{ ...glass, p: 3, flex: 1 }}>
            <Typography
              sx={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: theme.palette.text.primary,
                mb: 1.5,
              }}
            >
              {t('reportEfficiency')}
            </Typography>
            <DetailRow
              label={t('reportAverageSpeed')}
              value={stats.averageSpeed > 0 ? formatSpeed(stats.averageSpeed, speedUnit, t) : '—'}
            />
            <DetailRow
              label={t('reportFuelEfficiency')}
              value={
                stats.averageConsumption > 0 && stats.averageConsumption < 10
                  ? tt('reportEfficientLabel', 'Efficient')
                  : tt('reportNormalLabel', 'Normal')
              }
              color={
                stats.averageConsumption > 0 && stats.averageConsumption < 10
                  ? theme.palette.success.main
                  : theme.palette.text.secondary
              }
            />
            <DetailRow
              label={t('reportStops')}
              value={stats.totalStops.toString()}
              color={theme.palette.warning.main}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CarReport;
