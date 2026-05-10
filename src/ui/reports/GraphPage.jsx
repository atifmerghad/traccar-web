import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  Stack,
  Avatar,
  CircularProgress,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Skeleton,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  CalendarToday,
  DirectionsCar,
  KeyboardArrowDown,
  LocalGasStation,
  Speed,
  AccessTime,
  Domain,
  Refresh as RefreshIcon,
  ShowChart,
  BarChart as BarChartIcon,
  Landscape,
  CompareArrows,
  TrendingUp,
  FlashOn,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from '../layout/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      padding: theme.spacing(3),
      [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2.5),
    },
    glassCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
      borderRadius: theme.spacing(2.25),
      padding: `${theme.spacing(2.5)} ${theme.spacing(3)}`,
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.75) },
    },
    glassSelect: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : theme.palette.action.hover,
      borderRadius: theme.spacing(1.5),
      color: theme.palette.text.primary,
      minWidth: 200,
      [theme.breakpoints.down('sm')]: { minWidth: '100%' },
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
      },
      '& .MuiSelect-select': {
        paddingLeft: theme.spacing(1.75),
        fontWeight: 600,
        fontSize: '0.87rem',
      },
      '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
      },
    },
    glassDate: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.05)
          : theme.palette.action.hover,
        borderRadius: theme.spacing(1.5),
        color: theme.palette.text.primary,
        fontSize: '0.84rem',
        '& fieldset': {
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
        },
        '&:hover fieldset': {
          borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
        },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
      },
      '& input': { color: theme.palette.text.primary, fontSize: '0.84rem' },
      '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)', cursor: 'pointer' },
    },
    metricCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
      borderRadius: theme.spacing(2.25),
      padding: `${theme.spacing(2.25)} ${theme.spacing(2.5)}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: theme.transitions.create(['border-color', 'transform'], {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.15) : theme.palette.divider,
        transform: 'translateY(-1px)',
      },
    },
    toggleBtn: {
      color: `${theme.palette.text.secondary} !important`,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider} !important`,
      padding: `0 ${theme.spacing(1.75)} !important`,
      height: `${theme.spacing(4)} !important`,
      fontSize: '0.78rem !important',
      textTransform: 'none !important',
      lineHeight: '1 !important',
      '&.Mui-selected': {
        backgroundColor: `${alpha(theme.palette.primary.main, 0.15)} !important`,
        color: `${theme.palette.primary.light} !important`,
        borderColor: `${alpha(theme.palette.primary.main, 0.35)} !important`,
      },
    },
    metricTabBtn: {
      color: `${theme.palette.text.secondary} !important`,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider} !important`,
      padding: `0 ${theme.spacing(1.75)} !important`,
      height: `${theme.spacing(4)} !important`,
      fontSize: '0.8rem !important',
      textTransform: 'none !important',
      lineHeight: '1 !important',
      borderRadius: `${theme.spacing(1.25)} !important`,
      '&.Mui-selected': {
        backgroundColor: `${alpha(theme.palette.primary.main, 0.18)} !important`,
        color: `${theme.palette.primary.light} !important`,
        borderColor: `${alpha(theme.palette.primary.main, 0.4)} !important`,
      },
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      padding: `${theme.spacing(1.5)} ${theme.spacing(1.75)}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.03)
        : theme.palette.action.hover,
      borderRadius: theme.spacing(1.5),
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.divider}`,
    },
  };
});

const getPeriodRange = (period) => {
  const now = dayjs();
  switch (period) {
    case 'today':
      return [now.startOf('day'), now];
    case 'yesterday':
      return [now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')];
    case '7d':
      return [now.subtract(7, 'day').startOf('day'), now];
    case '30d':
      return [now.subtract(30, 'day').startOf('day'), now];
    default:
      return null;
  }
};

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

const computeDerivedStats = (positions, t) => {
  if (!positions.length) {
    return { maxSpeed: '—', maxAlt: '—', movingPct: '—', pointCount: '0' };
  }
  const maxSpeed = Math.max(...positions.map((p) => p.speed * 1.852)).toFixed(1);
  const maxAlt = Math.max(...positions.map((p) => p.altitude ?? 0)).toFixed(0);
  const moving = positions.filter((p) => p.speed * 1.852 > 2).length;
  const movingPct = ((moving / positions.length) * 100).toFixed(0);
  return {
    maxSpeed: `${maxSpeed} ${t('graphMetricUnitKmh')}`,
    maxAlt: `${maxAlt} ${t('graphMetricUnitM')}`,
    movingPct: `${movingPct}%`,
    pointCount: `${positions.length}`,
  };
};

const ChartTooltip = ({ active, payload, label, unit }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.98)
          : theme.palette.background.paper,
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.12) : theme.palette.divider}`,
        borderRadius: theme.spacing(1.25),
        padding: `${theme.spacing(1.25)} ${theme.spacing(1.75)}`,
      }}
    >
      <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled, mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((e, i) => (
        <Typography key={i} sx={{ fontSize: '0.86rem', fontWeight: 700, color: e.color }}>
          {e.name}: {e.value} {unit}
        </Typography>
      ))}
    </Box>
  );
};

const GraphPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const comparisonColor = theme.palette.warning.main;

  const periods = useMemo(
    () => [
      { label: t('graphPeriodToday'), value: 'today' },
      { label: t('graphPeriodYesterday'), value: 'yesterday' },
      { label: t('graphPeriod7Days'), value: '7d' },
      { label: t('graphPeriod30Days'), value: '30d' },
      { label: t('graphPeriodCustom'), value: 'custom' },
    ],
    [t],
  );

  const periodLabelMap = useMemo(
    () => ({
      today: t('graphPeriodToday'),
      yesterday: t('graphPeriodYesterday'),
      '7d': t('graphPeriodSummary7d'),
      '30d': t('graphPeriodSummary30d'),
      custom: t('graphPeriodCustom'),
    }),
    [t],
  );

  const chartMetrics = useMemo(
    () => [
      {
        key: 'speed',
        label: t('positionSpeed'),
        unit: t('graphMetricUnitKmh'),
        color: theme.palette.primary.main,
        Icon: Speed,
      },
      {
        key: 'altitude',
        label: t('positionAltitude'),
        unit: t('graphMetricUnitM'),
        color: theme.palette.success.main,
        Icon: Landscape,
      },
    ],
    [t, theme],
  );

  const summaryConfig = useMemo(
    () => [
      {
        label: t('graphSummaryDistance'),
        key: 'distance',
        Icon: Domain,
        color: theme.palette.info.main,
      },
      {
        label: t('graphSummaryFuel'),
        key: 'fuel',
        Icon: LocalGasStation,
        color: theme.palette.warning.main,
      },
      {
        label: t('graphSummaryAvgSpeed'),
        key: 'avgSpeed',
        Icon: Speed,
        color: theme.palette.success.main,
      },
      {
        label: t('graphSummaryDuration'),
        key: 'duration',
        Icon: AccessTime,
        color: theme.palette.secondary.main,
      },
    ],
    [t, theme],
  );

  const keyStats = useMemo(
    () => [
      {
        label: t('graphStatMaxSpeed'),
        key: 'maxSpeed',
        color: theme.palette.error.main,
        Icon: TrendingUp,
      },
      {
        label: t('graphStatMaxAltitude'),
        key: 'maxAlt',
        color: theme.palette.success.main,
        Icon: Landscape,
      },
      {
        label: t('graphStatMovingPercent'),
        key: 'movingPct',
        color: theme.palette.primary.main,
        Icon: FlashOn,
      },
      {
        label: t('graphStatPointsCollected'),
        key: 'pointCount',
        color: theme.palette.text.secondary,
        Icon: ShowChart,
      },
    ],
    [t, theme],
  );

  const darkMenuProps = {
    PaperProps: {
      sx: {
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.98)
          : theme.palette.background.paper,
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
        borderRadius: theme.spacing(1.5),
        mt: 0.5,
        '& .MuiMenuItem-root': { color: theme.palette.text.secondary, fontSize: '0.87rem', py: 1 },
        '& .MuiMenuItem-root:hover': { backgroundColor: theme.palette.action.hover },
        '& .MuiMenuItem-root.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.light,
        },
        '& .MuiMenuItem-root.Mui-selected:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.22),
        },
      },
    },
  };

  const tickColor = theme.palette.text.disabled;
  const gridColor = isDark ? alpha(theme.palette.common.white, 0.04) : theme.palette.divider;

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
  const [primaryMetrics, setPrimaryMetrics] = useState({
    distance: '—',
    fuel: '—',
    avgSpeed: '—',
    duration: '—',
  });
  const [compareMetrics, setCompareMetrics] = useState(null);

  const [chartType, setChartType] = useState('area');
  const [activeMetric, setActiveMetric] = useState('speed');

  const primaryChartData = useMemo(() => toChartData(primaryPositions), [primaryPositions]);
  const compareChartData = useMemo(() => toChartData(comparePositions), [comparePositions]);
  const hasCmp = showComparison && compareChartData.length > 0;

  const mergedData = useMemo(
    () =>
      hasCmp ? mergeChartData(primaryChartData, compareChartData, activeMetric) : primaryChartData,
    [primaryChartData, compareChartData, hasCmp, activeMetric],
  );

  const speedHistogram = useMemo(() => buildSpeedHistogram(primaryPositions), [primaryPositions]);
  const derivedStats = useMemo(
    () => computeDerivedStats(primaryPositions, t),
    [primaryPositions, t],
  );

  const resolvedRange = useMemo(() => {
    if (period === 'custom') {
      return { from: new Date(fromTime).toISOString(), to: new Date(toTime).toISOString() };
    }
    const range = getPeriodRange(period);
    return { from: range[0].toISOString(), to: range[1].toISOString() };
  }, [period, fromTime, toTime]);

  const fetchSummary = useCallback(
    async (deviceId) => {
      const q = new URLSearchParams({ deviceId, ...resolvedRange });
      try {
        const res = await fetch(`/api/reports/summary?${q}`);
        const data = await res.json();
        if (data?.[0]) {
          const s = data[0];
          return {
            distance: `${(s.distance / 1000).toFixed(1)}${t('dashboardDistanceUnit')}`,
            fuel: `${(s.spentFuel ?? 0).toFixed(1)}${t('dashboardFuelUnit')}`,
            avgSpeed: `${((s.averageSpeed ?? 0) * 1.852).toFixed(1)}${t('dashboardSpeedUnit')}`,
            duration: `${Math.floor((s.engineHours ?? 0) / 3600000)}${t('graphDurationHours')}`,
          };
        }
      } catch {
        // ignore fetch errors; caller handles null return
      }
      return null;
    },
    [resolvedRange, t],
  );

  const fetchRoute = useCallback(
    async (deviceId) => {
      const q = new URLSearchParams({ deviceId, ...resolvedRange });
      try {
        const res = await fetch(`/api/reports/route?${q}`, {
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    [resolvedRange],
  );

  const loadData = useCallback(async () => {
    if (!selectedDevice) return;
    setLoading(true);
    const [summary, route] = await Promise.all([
      fetchSummary(selectedDevice),
      fetchRoute(selectedDevice),
    ]);
    if (summary) setPrimaryMetrics(summary);
    setPrimaryPositions(route);

    if (showComparison && compareDevice) {
      const [cmpSummary, cmpRoute] = await Promise.all([
        fetchSummary(compareDevice),
        fetchRoute(compareDevice),
      ]);
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

  const m = chartMetrics.find((x) => x.key === activeMetric) || chartMetrics[0];
  const gradId = `grad_${activeMetric}`;
  const comparisonName = t('graphSeriesComparison');

  const renderChart = () => {
    if (loading) {
      return (
        <Skeleton
          variant="rectangular"
          height={320}
          sx={{
            bgcolor: isDark ? alpha(theme.palette.common.white, 0.04) : theme.palette.action.hover,
            borderRadius: theme.spacing(1.25),
          }}
        />
      );
    }
    if (!mergedData.length) {
      return (
        <Box
          sx={{
            height: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <BarChartIcon sx={{ fontSize: 56, color: theme.palette.action.disabledBackground }} />
          <Typography
            sx={{
              color: theme.palette.text.disabled,
              fontSize: '0.85rem',
              textAlign: 'center',
              px: 2,
            }}
          >
            {t('graphEmptyState')}
          </Typography>
        </Box>
      );
    }

    const sharedProps = { data: mergedData, margin: { top: 10, right: 20, left: 0, bottom: 0 } };
    const xAxis = (
      <XAxis
        dataKey="time"
        tick={{ fill: tickColor, fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        interval="preserveStartEnd"
      />
    );
    const yAxis = (
      <YAxis
        tick={{ fill: tickColor, fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={50}
        tickFormatter={(v) => `${v}`}
      />
    );
    const grid = <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />;
    const tooltip = <RTooltip content={(p) => <ChartTooltip {...p} unit={m.unit} />} />;
    const legend = hasCmp ? (
      <Legend
        wrapperStyle={{
          color: theme.palette.text.secondary,
          fontSize: '0.76rem',
          paddingTop: theme.spacing(1),
        }}
      />
    ) : null;

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart {...sharedProps}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {legend}
            <Bar
              dataKey={activeMetric}
              name={m.label}
              fill={m.color}
              radius={[3, 3, 0, 0]}
              opacity={0.85}
            />
            {hasCmp && (
              <Bar
                dataKey="cmp"
                name={comparisonName}
                fill={comparisonColor}
                radius={[3, 3, 0, 0]}
                opacity={0.7}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart {...sharedProps}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            {legend}
            <Line
              type="monotone"
              dataKey={activeMetric}
              name={m.label}
              stroke={m.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            {hasCmp && (
              <Line
                type="monotone"
                dataKey="cmp"
                name={comparisonName}
                stroke={comparisonColor}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}
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
                <stop offset="5%" stopColor={comparisonColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={comparisonColor} stopOpacity={0.02} />
              </linearGradient>
            )}
          </defs>
          {grid}
          {xAxis}
          {yAxis}
          {tooltip}
          {legend}
          <Area
            type="monotone"
            dataKey={activeMetric}
            name={m.label}
            stroke={m.color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          {hasCmp && (
            <Area
              type="monotone"
              dataKey="cmp"
              name={comparisonName}
              stroke={comparisonColor}
              strokeWidth={2}
              strokeDasharray="5 3"
              fill="url(#grad_cmp)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: '1.35rem', fontWeight: 800, color: theme.palette.text.primary }}
            >
              {t('graphPageTitle')}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.disabled, mt: 0.4 }}>
              {t('graphPageSubtitle')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.8} flexWrap="wrap" alignItems="center">
            {periods.map((p) => (
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
                  color:
                    period === p.value ? theme.palette.primary.light : theme.palette.text.disabled,
                  borderColor:
                    period === p.value
                      ? alpha(theme.palette.primary.main, 0.45)
                      : theme.palette.divider,
                  backgroundColor:
                    period === p.value ? alpha(theme.palette.primary.main, 0.18) : 'transparent',
                  '&:hover': {
                    borderColor: isDark
                      ? alpha(theme.palette.common.white, 0.25)
                      : theme.palette.divider,
                  },
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
            MenuProps={darkMenuProps}
            startAdornment={
              <DirectionsCar
                sx={{ fontSize: 17, color: theme.palette.primary.main, ml: 1, mr: -0.5 }}
              />
            }
          >
            {devices.map((dev) => (
              <MenuItem key={dev.id} value={dev.id}>
                {dev.name}
              </MenuItem>
            ))}
          </Select>

          <Button
            disableElevation
            startIcon={<CompareArrows sx={{ fontSize: '16px !important' }} />}
            onClick={() => setShowComparison(!showComparison)}
            sx={{
              bgcolor: showComparison ? alpha(comparisonColor, 0.12) : theme.palette.action.hover,
              color: showComparison ? theme.palette.warning.light : theme.palette.text.disabled,
              borderRadius: theme.spacing(1.5),
              textTransform: 'none',
              border: `1px solid ${showComparison ? alpha(comparisonColor, 0.3) : theme.palette.divider}`,
              fontSize: '0.82rem',
              fontWeight: 600,
              px: 2,
              height: 36,
            }}
          >
            {showComparison ? t('graphCompareHide') : t('graphCompare')}
          </Button>

          {showComparison && (
            <Select
              value={compareDevice}
              displayEmpty
              onChange={(e) => setCompareDevice(e.target.value)}
              className={classes.glassSelect}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${alpha(comparisonColor, 0.3)} !important`,
                },
              }}
              IconComponent={KeyboardArrowDown}
              size="small"
              MenuProps={darkMenuProps}
              renderValue={(v) =>
                v ? (
                  devices.find((d) => d.id === v)?.name
                ) : (
                  <Box
                    component="em"
                    sx={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}
                  >
                    {t('graphCompareWith')}
                  </Box>
                )
              }
            >
              <MenuItem disabled value="">
                <em>{t('graphCompareSelectDevice')}</em>
              </MenuItem>
              {devices
                .filter((d) => d.id !== selectedDevice)
                .map((dev) => (
                  <MenuItem key={dev.id} value={dev.id}>
                    {dev.name}
                  </MenuItem>
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
                sx={{ minWidth: { xs: '100%', sm: 200 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <CalendarToday
                        sx={{ fontSize: 15, color: theme.palette.text.disabled, mr: 1 }}
                      />
                    ),
                  },
                }}
              />
              <TextField
                type="datetime-local"
                size="small"
                className={classes.glassDate}
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 200 } }}
              />
            </>
          )}

          <IconButton
            onClick={loadData}
            disabled={loading}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              color: theme.palette.primary.light,
              borderRadius: theme.spacing(1.5),
              width: 36,
              height: 36,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            {loading ? (
              <CircularProgress size={16} sx={{ color: theme.palette.primary.light }} />
            ) : (
              <RefreshIcon sx={{ fontSize: 17 }} />
            )}
          </IconButton>
        </Box>

        {/* ── Summary Metric Cards ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {summaryConfig.map(({ label, key, Icon, color }) => (
            <Box key={key} className={classes.metricCard}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: theme.palette.text.disabled,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="baseline"
                  sx={{ mt: 0.5, mb: 0.3 }}
                >
                  {loading ? (
                    <Skeleton
                      width={70}
                      height={28}
                      sx={{
                        bgcolor: isDark
                          ? alpha(theme.palette.common.white, 0.07)
                          : alpha(theme.palette.common.black, 0.07),
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        color: theme.palette.text.primary,
                        lineHeight: 1,
                      }}
                    >
                      {primaryMetrics[key]}
                    </Typography>
                  )}
                  {compareMetrics && !loading && (
                    <Typography
                      sx={{ fontSize: '0.8rem', fontWeight: 700, color: comparisonColor }}
                    >
                      vs {compareMetrics[key]}
                    </Typography>
                  )}
                </Stack>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.disabled }}>
                  {periodLabelMap[period]}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: alpha(color, 0.1),
                  color,
                  borderRadius: theme.spacing(1.75),
                  width: 44,
                  height: 44,
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Avatar>
            </Box>
          ))}
        </Box>

        {/* ── Main Chart ── */}
        <Box className={classes.glassCard}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 800, color: theme.palette.text.primary, fontSize: '1rem' }}
              >
                {t('graphSectionTemporal')}
              </Typography>
              <Typography sx={{ fontSize: '0.73rem', color: theme.palette.text.disabled, mt: 0.3 }}>
                {devices.find((d) => d.id === selectedDevice)?.name || '—'}
                {primaryPositions.length > 0 &&
                  ` · ${primaryPositions.length} ${t('graphPoints')} · ${mergedData.length} ${t('graphShown')}`}
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
                    borderRadius: `${theme.spacing(1.25)} !important`,
                    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider} !important`,
                    margin: 0,
                  },
                }}
              >
                {chartMetrics.map(({ key, label, Icon: MetricIcon }) => (
                  <ToggleButton key={key} value={key} className={classes.metricTabBtn}>
                    <MetricIcon sx={{ fontSize: 13, marginInlineEnd: 0.6 }} />
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Box sx={{ width: '1px', height: 22, bgcolor: theme.palette.divider, mx: 0.5 }} />

              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(_, v) => v && setChartType(v)}
                size="small"
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    borderRadius: `${theme.spacing(1)} !important`,
                    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider} !important`,
                    margin: 0,
                  },
                }}
              >
                <ToggleButton value="area" className={classes.toggleBtn}>
                  {t('graphChartArea')}
                </ToggleButton>
                <ToggleButton value="line" className={classes.toggleBtn}>
                  {t('graphChartLine')}
                </ToggleButton>
                <ToggleButton value="bar" className={classes.toggleBtn}>
                  {t('graphChartBar')}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {renderChart()}
        </Box>

        {/* ── Bottom Row: Histogram + Key Stats ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          {/* Speed Histogram */}
          <Box className={classes.glassCard}>
            <Typography
              sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.95rem' }}
            >
              {t('graphSpeedDistribution')}
            </Typography>
            <Typography
              sx={{ fontSize: '0.73rem', color: theme.palette.text.disabled, mt: 0.3, mb: 2 }}
            >
              {t('graphSpeedDistributionHint')}
            </Typography>
            {loading ? (
              <Skeleton
                variant="rectangular"
                height={190}
                sx={{
                  bgcolor: isDark
                    ? alpha(theme.palette.common.white, 0.04)
                    : theme.palette.action.hover,
                  borderRadius: theme.spacing(1),
                }}
              />
            ) : speedHistogram.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart
                  data={speedHistogram}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: tickColor, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: tickColor, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RTooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <Box
                          sx={{
                            backgroundColor: isDark
                              ? alpha(theme.palette.background.paper, 0.98)
                              : theme.palette.background.paper,
                            border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
                            borderRadius: theme.spacing(1),
                            p: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
                          }}
                        >
                          <Typography
                            sx={{ fontSize: '0.76rem', color: theme.palette.text.secondary }}
                          >
                            {label} {t('graphMetricUnitKmh')}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.86rem',
                              fontWeight: 700,
                              color: theme.palette.primary.light,
                            }}
                          >
                            {payload[0].value} {t('graphHistogramPoints')}
                          </Typography>
                        </Box>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {speedHistogram.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={alpha(
                          theme.palette.primary.main,
                          0.35 + (idx / Math.max(speedHistogram.length - 1, 1)) * 0.65,
                        )}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 190,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.83rem' }}>
                  {t('graphNoData')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Key Stats */}
          <Box
            className={classes.glassCard}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '0.95rem',
                mb: 0.5,
              }}
            >
              {t('graphKeyStats')}
            </Typography>
            {keyStats.map(({ label, key, color, Icon: StatIcon }) => (
              <Box key={key} className={classes.statItem}>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    color: theme.palette.text.disabled,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatIcon sx={{ fontSize: 15, color }} />
                  {loading ? (
                    <Skeleton
                      width={70}
                      height={22}
                      sx={{
                        bgcolor: isDark
                          ? alpha(theme.palette.common.white, 0.07)
                          : alpha(theme.palette.common.black, 0.07),
                      }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color }}>
                      {derivedStats[key]}
                    </Typography>
                  )}
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
