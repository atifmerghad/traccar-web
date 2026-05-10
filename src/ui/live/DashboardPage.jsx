import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Stack,
  Avatar,
  Skeleton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DirectionsCar,
  LocalParking,
  Notifications as NotificationsIcon,
  Refresh,
  Speed,
  ShowChart,
  LocalGasStation,
  Update,
  TrendingUp,
  AssignmentLate,
  WifiOff,
  Schedule,
  Wifi,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from '../layout/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      width: '100%',
      flex: 1,
      boxSizing: 'border-box',
      padding: theme.spacing(3),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
        gap: theme.spacing(1.5),
      },
      [theme.breakpoints.between('sm', 'md')]: { padding: theme.spacing(2) },
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
    },

    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing(1),
    },
    title: {
      fontSize: theme.typography.h6.fontSize,
      fontWeight: 800,
      color: theme.palette.text.primary,
      [theme.breakpoints.down('sm')]: { fontSize: theme.typography.body1.fontSize },
    },
    subtitle: {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.body2.fontSize,
      [theme.breakpoints.down('sm')]: { display: 'none' },
    },

    summaryRow: {
      display: 'grid',
      gap: theme.spacing(2),
      gridTemplateColumns: 'repeat(5, 1fr)',
      [theme.breakpoints.down('lg')]: { gridTemplateColumns: 'repeat(3, 1fr)' },
      [theme.breakpoints.down('md')]: { gridTemplateColumns: 'repeat(2, 1fr)' },
      [theme.breakpoints.down('sm')]: { display: 'none' },
    },

    mobileStatGrid: {
      display: 'none',
      [theme.breakpoints.down('sm')]: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: theme.spacing(1),
      },
    },
    mobileStatCard: {
      borderRadius: theme.spacing(1.75),
      padding: theme.spacing(1.25, 1),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      minHeight: theme.spacing(10),
      justifyContent: 'center',
    },
    mobileStatNum: {
      fontSize: theme.typography.pxToRem(23.2),
      fontWeight: 900,
      lineHeight: 1,
    },
    mobileStatLabel: {
      fontSize: theme.typography.pxToRem(10),
      fontWeight: 600,
      color: theme.palette.text.secondary,
      textAlign: 'center',
      lineHeight: 1.2,
    },

    cardBase: {
      borderRadius: theme.spacing(2),
      width: '100%',
      height: '100%',
      border: 'none',
      boxShadow: isDark
        ? `0 ${theme.spacing(0.5)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.4)}`
        : theme.shadows[2],
      display: 'flex',
      flexDirection: 'column',
    },
    totalVehiclesCard: {
      backgroundColor: theme.palette.primary.main,
      backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      color: theme.palette.primary.contrastText,
    },
    summaryNumber: {
      fontSize: theme.typography.pxToRem(36),
      fontWeight: 800,
      lineHeight: 1,
      color: theme.palette.text.primary,
    },
    summaryLabel: {
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 600,
      color: theme.palette.text.primary,
    },
    summaryDesc: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down('sm')]: { display: 'none' },
    },

    sectionCard: {
      padding: theme.spacing(3),
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      borderRadius: theme.spacing(2),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : theme.palette.background.paper,
      backdropFilter: isDark ? `blur(${theme.spacing(1.5)})` : 'none',
      WebkitBackdropFilter: isDark ? `blur(${theme.spacing(1.5)})` : 'none',
      border: `1px solid ${theme.palette.divider}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    sectionTitle: {
      fontSize: theme.typography.body1.fontSize,
      fontWeight: 700,
      color: theme.palette.text.primary,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(2),
      [theme.breakpoints.down('sm')]: {
        fontSize: theme.typography.body2.fontSize,
        marginBottom: theme.spacing(1),
      },
    },

    twoCol: {
      display: 'grid',
      gap: theme.spacing(3),
      gridTemplateColumns: '1fr 1fr',
      [theme.breakpoints.down('md')]: { gridTemplateColumns: '1fr', gap: theme.spacing(1.5) },
    },
    rightStack: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
      [theme.breakpoints.down('sm')]: { gap: theme.spacing(1.5) },
    },

    totalsRow: {
      display: 'flex',
      gap: theme.spacing(1.5),
      [theme.breakpoints.down('sm')]: { gap: theme.spacing(1) },
      flexWrap: 'wrap',
    },
    totalBox: {
      borderRadius: theme.spacing(1.5),
      padding: theme.spacing(2),
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1) },
      textAlign: 'center',
      flex: 1,
      minWidth: theme.spacing(9),
    },
    totalVal: {
      fontSize: theme.typography.pxToRem(25.6),
      fontWeight: 800,
      marginBottom: theme.spacing(0.5),
      [theme.breakpoints.down('sm')]: {
        fontSize: theme.typography.h6.fontSize,
        marginBottom: theme.spacing(0.25),
      },
    },
    totalLab: {
      fontSize: theme.typography.pxToRem(11.5),
      fontWeight: 600,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down('sm')]: { fontSize: theme.typography.pxToRem(10.4) },
    },

    perfItem: {
      padding: `${theme.spacing(1.25)} 0`,
      borderBottom: `1px solid ${theme.palette.divider}`,
      [theme.breakpoints.down('sm')]: { padding: `${theme.spacing(0.875)} 0` },
    },

    podiumRow: {
      display: 'flex',
      gap: theme.spacing(1),
      marginTop: theme.spacing(1.5),
      [theme.breakpoints.down('sm')]: { display: 'none' },
    },
    podiumBox: {
      flex: 1,
      borderRadius: theme.spacing(1.5),
      padding: theme.spacing(1.25, 1),
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.action.hover,
      textAlign: 'center',
    },
    podiumRank: { fontSize: theme.typography.body2.fontSize, fontWeight: 800 },
    podiumId: {
      fontSize: theme.typography.pxToRem(10.9),
      color: theme.palette.text.secondary,
      marginTop: theme.spacing(0.25),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    podiumVal: {
      fontSize: theme.typography.pxToRem(13.1),
      fontWeight: 700,
      color: theme.palette.text.primary,
      marginTop: theme.spacing(0.25),
    },

    hideOnMobile: {
      [theme.breakpoints.down('sm')]: { display: 'none' },
    },
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const metersToKm = (m) => (m / 1000).toFixed(2);
const knotsToKmh = (kn) => Math.round(kn * 1.852);
const msToHours = (ms) => {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function useDashboardChartColors() {
  const theme = useTheme();
  return useMemo(
    () => ({
      bar: [
        theme.palette.warning.main,
        theme.palette.grey[500],
        theme.palette.warning.dark,
        theme.palette.secondary.dark,
        theme.palette.secondary.main,
        theme.palette.error.light,
        theme.palette.error.main,
        theme.palette.error.dark,
      ],
      speed: [
        theme.palette.error.main,
        theme.palette.warning.dark,
        theme.palette.warning.main,
        theme.palette.warning.light,
        theme.palette.warning.light,
        theme.palette.warning.dark,
        theme.palette.error.dark,
        theme.palette.error.dark,
      ],
      fuel: [
        theme.palette.error.main,
        theme.palette.warning.dark,
        theme.palette.warning.main,
        theme.palette.success.light,
        theme.palette.success.main,
        theme.palette.success.dark,
        theme.palette.info?.main ?? theme.palette.primary.light,
        theme.palette.info?.dark ?? theme.palette.primary.dark,
      ],
      rank: [theme.palette.warning.main, theme.palette.grey[500], theme.palette.warning.dark],
    }),
    [theme],
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, type }) => {
  const theme = useTheme();
  const t = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const cfg = {
    distance: {
      key: t('dashboardSeriesDistance'),
      unit: t('dashboardDistanceUnit'),
      color: theme.palette.primary.light,
    },
    speed: {
      key: t('dashboardSeriesSpeed'),
      unit: t('dashboardSpeedUnit'),
      color: theme.palette.error.main,
    },
    fuel: {
      key: t('dashboardSeriesFuel'),
      unit: t('dashboardFuelUnit'),
      color: theme.palette.warning.main,
    },
  }[type];
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.spacing(1),
        p: theme.spacing(1.25, 1.75),
        boxShadow: theme.shadows[4],
        minWidth: theme.spacing(20),
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: theme.typography.pxToRem(13.3),
          mb: 0.5,
          color: 'text.primary',
        }}
      >
        {t('dashboardRank')} #{d.payload.rank}
      </Typography>
      <Typography sx={{ fontSize: theme.typography.pxToRem(12.5), color: 'text.secondary' }}>
        {d.payload.id}
      </Typography>
      <Typography
        sx={{
          fontSize: theme.typography.pxToRem(12.5),
          fontWeight: 700,
          color: cfg.color,
          mt: 0.5,
        }}
      >
        {cfg.key}: {d.value}
        {cfg.unit}
      </Typography>
    </Box>
  );
};

// ─── Chart ────────────────────────────────────────────────────────────────────

const HorizontalBarChart = ({ data, type, colors }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const rowH = isMobile ? theme.spacing(2.75) : theme.spacing(3.75);
  const tickXs = theme.typography.pxToRem(9);
  const tickSm = theme.typography.pxToRem(10);
  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(isMobile ? theme.spacing(12.5) : theme.spacing(18.75), data.length * rowH)}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 0,
          right: theme.spacing(4.5),
          left: isMobile ? theme.spacing(0.25) : theme.spacing(1),
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
        <XAxis
          type="number"
          tick={{ fontSize: tickXs, fill: theme.palette.text.secondary }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="id"
          type="category"
          width={isMobile ? theme.spacing(7.75) : theme.spacing(12)}
          tick={{ fontSize: isMobile ? tickXs : tickSm, fill: theme.palette.text.secondary }}
          axisLine={false}
          tickLine={false}
        />
        <RechartsTooltip
          content={<CustomTooltip type={type} />}
          cursor={{ fill: theme.palette.action.hover }}
        />
        <Bar
          dataKey="value"
          radius={[0, Number(theme.shape.borderRadius), Number(theme.shape.borderRadius), 0]}
          barSize={isMobile ? theme.spacing(1) : theme.spacing(1.625)}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─── Podium ───────────────────────────────────────────────────────────────────

const PodiumRow = ({ data, unit, classes, rankColors }) => (
  <Box className={classes.podiumRow}>
    {data.slice(0, 3).map((item, i) => (
      <Box key={i} className={classes.podiumBox}>
        <Typography className={classes.podiumRank} sx={{ color: rankColors[i] }}>
          #{i + 1}
        </Typography>
        <Typography className={classes.podiumId}>{item.id}</Typography>
        <Typography className={classes.podiumVal}>
          {item.value}
          {unit}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ─── Skeletons ────────────────────────────────────────────────────────────────

const ChartSkeleton = () => {
  const theme = useTheme();
  return (
    <Box sx={{ p: 1 }}>
      {[...Array(4)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Skeleton variant="text" width={theme.spacing(8)} height={theme.spacing(1.75)} />
          <Skeleton
            variant="rectangular"
            height={theme.spacing(1.5)}
            sx={{ flex: 1, borderRadius: 1 }}
          />
        </Box>
      ))}
    </Box>
  );
};

// ─── Chart Section ────────────────────────────────────────────────────────────

const ChartSection = ({
  title,
  icon,
  data,
  unit,
  type,
  colors,
  classes,
  loading,
  emptyMsg,
  rankColors,
}) => (
  <Box className={classes.sectionCard}>
    <Typography className={classes.sectionTitle}>
      {icon} {title}
    </Typography>
    {loading ? (
      <ChartSkeleton />
    ) : data.length > 0 ? (
      <>
        <HorizontalBarChart data={data} unit={unit} type={type} colors={colors} />
        <PodiumRow data={data} unit={unit} classes={classes} rankColors={rankColors} />
      </>
    ) : (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
        <Typography sx={{ fontSize: (t) => t.typography.pxToRem(13.1), color: 'text.secondary' }}>
          {emptyMsg}
        </Typography>
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
    sx={{ borderBottom: isLast ? 'none' : undefined }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: (t) => t.spacing(0.875),
          height: (t) => t.spacing(0.875),
          borderRadius: '50%',
          bgcolor: dot,
          flexShrink: 0,
        }}
      />
      <Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: (t) => t.typography.body2.fontSize,
            color: 'text.primary',
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontSize: (t) => t.typography.pxToRem(11.2), color: 'text.secondary' }}>
          {sub}
        </Typography>
      </Box>
    </Stack>
    <Typography
      sx={{
        fontWeight: 800,
        whiteSpace: 'nowrap',
        paddingInlineStart: 1,
        color: 'text.primary',
        fontSize: (t) => t.typography.pxToRem(14.1),
      }}
    >
      {val}
    </Typography>
  </Stack>
);

// ─── Mobile Stat Card ─────────────────────────────────────────────────────────

const MobileStatCard = ({ label, val, icon, color, bg, loading, classes }) => {
  const theme = useTheme();
  return (
    <Box className={classes.mobileStatCard}>
      <Box
        sx={{
          width: theme.spacing(3.75),
          height: theme.spacing(3.75),
          borderRadius: '50%',
          bgcolor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      {loading ? (
        <Skeleton variant="text" width={theme.spacing(4.5)} height={theme.spacing(3.5)} />
      ) : (
        <Typography className={classes.mobileStatNum} sx={{ color }}>
          {val}
        </Typography>
      )}
      <Typography className={classes.mobileStatLabel}>{label}</Typography>
    </Box>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const t = useTranslation();
  const chartColors = useDashboardChartColors();

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
      if (!devRes.ok) throw new Error(t('dashboardFetchDevicesError'));
      const devData = await devRes.json();
      setDevices(devData);

      const posRes = await fetch('/api/positions');
      if (!posRes.ok) throw new Error(t('dashboardFetchPositionsError'));
      setPositions(await posRes.json());

      const from = dayjs().startOf('day').toISOString();
      const to = dayjs().toISOString();
      if (devData.length > 0) {
        const q = new URLSearchParams({ from, to, daily: false });
        devData.forEach((d) => q.append('deviceId', d.id));
        const sumRes = await fetch(`/api/reports/summary?${q}`, {
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
  }, [t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const positionMap = useMemo(() => {
    const m = {};
    positions.forEach((p) => {
      m[p.deviceId] = p;
    });
    return m;
  }, [positions]);

  const deviceMap = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      m[d.id] = d;
    });
    return m;
  }, [devices]);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const offlineDevices = totalDevices - onlineDevices;
  const movingDevices = devices.filter((d) => {
    const p = positionMap[d.id];
    return p && p.speed > 0;
  }).length;
  const parkedOnline = onlineDevices - movingDevices;
  const alertDevices = positions.filter((p) => p.attributes?.alarm).length;

  const mkRanked = (arr) =>
    arr
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((x, i) => ({ ...x, rank: i + 1 }));

  const distanceData = useMemo(
    () =>
      mkRanked(
        summaries
          .filter((s) => s.distance > 0)
          .map((s) => ({
            id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`,
            value: parseFloat(metersToKm(s.distance)),
          })),
      ),
    [summaries, deviceMap],
  );

  const speedData = useMemo(
    () =>
      mkRanked(
        summaries
          .filter((s) => s.maxSpeed > 0)
          .map((s) => ({
            id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`,
            value: knotsToKmh(s.maxSpeed),
          })),
      ),
    [summaries, deviceMap],
  );

  const fuelData = useMemo(
    () =>
      mkRanked(
        summaries
          .filter((s) => s.spentFuel > 0)
          .map((s) => ({
            id: deviceMap[s.deviceId]?.name || `#${s.deviceId}`,
            value: parseFloat(s.spentFuel.toFixed(1)),
          })),
      ),
    [summaries, deviceMap],
  );

  const totalDistance = useMemo(
    () => summaries.reduce((a, s) => a + (s.distance || 0), 0),
    [summaries],
  );
  const totalFuel = useMemo(
    () => summaries.reduce((a, s) => a + (s.spentFuel || 0), 0),
    [summaries],
  );
  const totalEngineHours = useMemo(
    () => summaries.reduce((a, s) => a + (s.engineHours || 0), 0),
    [summaries],
  );
  const topSpeed = speedData[0];
  const topDistance = distanceData[0];

  const topHoursEntry = useMemo(() => {
    const best = summaries
      .filter((s) => s.engineHours > 0)
      .sort((a, b) => b.engineHours - a.engineHours)[0];
    return best
      ? {
          name: deviceMap[best.deviceId]?.name || `#${best.deviceId}`,
          hours: msToHours(best.engineHours),
        }
      : null;
  }, [summaries, deviceMap]);

  const recentActivity = useMemo(
    () =>
      positions
        .filter((p) => p.fixTime)
        .sort((a, b) => new Date(b.fixTime) - new Date(a.fixTime))
        .slice(0, 5)
        .map((p) => ({
          name: deviceMap[p.deviceId]?.name || `#${p.deviceId}`,
          time: dayjs(p.fixTime).fromNow(),
          speed: knotsToKmh(p.speed || 0),
          status: deviceMap[p.deviceId]?.status,
        })),
    [positions, deviceMap],
  );

  const iconSm = <ShowChart sx={{ fontSize: (t) => t.typography.pxToRem(16) }} />;

  const summaryCards = useMemo(
    () => [
      {
        label: t('dashboardMoving'),
        val: movingDevices,
        desc: t('dashboardMovingDesc'),
        icon: <TrendingUp />,
        color: theme.palette.success.main,
        bg: alpha(theme.palette.success.main, 0.15),
      },
      {
        label: t('dashboardParked'),
        val: parkedOnline,
        desc: t('dashboardParkedDesc'),
        icon: <LocalParking />,
        color: theme.palette.info.main,
        bg: alpha(theme.palette.info.main, 0.15),
      },
      {
        label: t('dashboardOffline'),
        val: offlineDevices,
        desc: t('dashboardOfflineDesc'),
        icon: <WifiOff />,
        color: theme.palette.text.disabled,
        bg: alpha(theme.palette.text.disabled, 0.15),
      },
      {
        label: t('dashboardAlerts'),
        val: alertDevices,
        desc: t('dashboardAlertsDesc'),
        icon: <NotificationsIcon />,
        color: theme.palette.error.main,
        bg: alpha(theme.palette.error.main, 0.15),
      },
    ],
    [t, movingDevices, parkedOnline, offlineDevices, alertDevices, theme],
  );

  const mobileStats = useMemo(
    () => [
      {
        label: t('dashboardMobileTotal'),
        val: totalDevices,
        icon: <DirectionsCar sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />,
        color: theme.palette.primary.light,
        bg: alpha(theme.palette.primary.main, 0.18),
      },
      {
        label: t('dashboardMobileOnline'),
        val: onlineDevices,
        icon: <Wifi sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />,
        color: theme.palette.info.light,
        bg: alpha(theme.palette.info.main, 0.18),
      },
      {
        label: t('dashboardMoving'),
        val: movingDevices,
        icon: <TrendingUp sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />,
        color: theme.palette.success.main,
        bg: alpha(theme.palette.success.main, 0.18),
      },
      {
        label: t('dashboardParked'),
        val: parkedOnline,
        icon: <LocalParking sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />,
        color: theme.palette.info.main,
        bg: alpha(theme.palette.info.main, 0.16),
      },
      {
        label: t('dashboardOffline'),
        val: offlineDevices,
        icon: <WifiOff sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />,
        color: theme.palette.text.disabled,
        bg: alpha(theme.palette.text.disabled, 0.15),
      },
      {
        label: t('dashboardAlerts'),
        val: alertDevices,
        icon: <NotificationsIcon sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />,
        color: theme.palette.error.main,
        bg: alpha(theme.palette.error.main, 0.18),
      },
    ],
    [
      t,
      totalDevices,
      onlineDevices,
      movingDevices,
      parkedOnline,
      offlineDevices,
      alertDevices,
      theme,
    ],
  );

  const perfRows = useMemo(
    () => [
      {
        label: t('dashboardMaxSpeed'),
        val: topSpeed ? `${topSpeed.value}${t('dashboardSpeedUnit')}` : '—',
        sub: topSpeed?.id || t('dashboardNoDataShort'),
        dot: theme.palette.error.main,
      },
      {
        label: t('dashboardMaxDistance'),
        val: topDistance ? `${topDistance.value}${t('dashboardDistanceUnit')}` : '—',
        sub: topDistance?.id || t('dashboardNoDataShort'),
        dot: theme.palette.info.main,
      },
      {
        label: t('dashboardMaxEngineHours'),
        val: topHoursEntry?.hours || '—',
        sub: topHoursEntry?.name || t('dashboardNoDataShort'),
        dot: theme.palette.success.main,
      },
    ],
    [t, topSpeed, topDistance, topHoursEntry, theme],
  );

  const totalBoxes = useMemo(
    () => [
      {
        val: `${metersToKm(totalDistance)}${t('dashboardDistanceUnit')}`,
        lbl: t('dashboardLabelDistance'),
        color: theme.palette.secondary.light,
        bg: alpha(theme.palette.secondary.main, 0.15),
      },
      {
        val: `${totalFuel.toFixed(1)}${t('dashboardFuelUnit')}`,
        lbl: t('dashboardLabelFuel'),
        color: theme.palette.warning.light,
        bg: alpha(theme.palette.warning.main, 0.15),
      },
      {
        val: msToHours(totalEngineHours),
        lbl: t('dashboardEngineHoursShort'),
        color: theme.palette.success.light,
        bg: alpha(theme.palette.success.main, 0.15),
      },
    ],
    [t, totalDistance, totalFuel, totalEngineHours, theme],
  );

  const cardContentPadding = theme.spacing(2.5);

  return (
    <PageLayout>
      <Box className={classes.root}>
        <Box className={classes.headerRow}>
          <Box>
            <Typography className={classes.title}>{t('navDashboard')}</Typography>
            <Typography className={classes.subtitle} component="div">
              {t('dashboardRealtime')}
              {t('dashboardRealtimeSeparator')}
              {dayjs().format('DD/MM/YYYY')}
              {lastRefresh && (
                <Chip
                  icon={<Schedule sx={{ fontSize: theme.typography.pxToRem(11) }} />}
                  label={dayjs(lastRefresh).format('HH:mm:ss')}
                  size="small"
                  variant="outlined"
                  sx={{
                    marginInlineStart: theme.spacing(1),
                    fontSize: theme.typography.pxToRem(10.4),
                    height: theme.spacing(2.25),
                    color: 'text.secondary',
                    borderColor: 'divider',
                  }}
                />
              )}
            </Typography>
          </Box>
          <Tooltip title={t('sharedSearch')}>
            <span>
              <IconButton
                onClick={fetchAll}
                disabled={loading}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Refresh
                  fontSize="small"
                  sx={{ color: loading ? 'text.disabled' : 'success.main' }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {error && (
          <Box
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
              borderRadius: theme.spacing(1),
              py: theme.spacing(1.25),
              px: theme.spacing(1.75),
            }}
          >
            <Typography
              sx={{
                color: 'error.main',
                fontSize: theme.typography.pxToRem(13.1),
                fontWeight: 600,
              }}
            >
              ⚠ {error}
            </Typography>
          </Box>
        )}

        <Box className={classes.summaryRow}>
          <Card className={`${classes.cardBase} ${classes.totalVehiclesCard}`}>
            <CardContent sx={{ flex: 1, p: cardContentPadding }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography
                    sx={{ fontSize: theme.typography.pxToRem(13.1), opacity: 0.9, fontWeight: 500 }}
                  >
                    {t('sharedDevice')}
                  </Typography>
                  {loading ? (
                    <Skeleton
                      variant="text"
                      width={theme.spacing(7.5)}
                      height={theme.spacing(6.5)}
                      sx={{ bgcolor: alpha(theme.palette.common.white, 0.3) }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: theme.typography.pxToRem(36),
                        fontWeight: 900,
                        my: theme.spacing(0.75),
                      }}
                    >
                      {totalDevices}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: theme.typography.pxToRem(11.5), opacity: 0.8 }}>
                    {onlineDevices} {t('deviceStatusOnline')}
                  </Typography>
                </Box>
                <DirectionsCar sx={{ fontSize: theme.typography.h5.fontSize, opacity: 0.5 }} />
              </Stack>
            </CardContent>
          </Card>
          {summaryCards.map((item, i) => (
            <Card
              key={i}
              className={classes.cardBase}
              sx={{
                bgcolor: isDark ? alpha(theme.palette.common.white, 0.05) : 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: cardContentPadding }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography className={classes.summaryLabel}>{item.label}</Typography>
                    {loading ? (
                      <Skeleton
                        variant="text"
                        width={theme.spacing(6.25)}
                        height={theme.spacing(5.5)}
                      />
                    ) : (
                      <Typography className={classes.summaryNumber} sx={{ my: theme.spacing(0.5) }}>
                        {item.val}
                      </Typography>
                    )}
                    <Typography className={classes.summaryDesc}>{item.desc}</Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: item.bg,
                      color: item.color,
                      borderRadius: theme.spacing(1),
                      width: theme.spacing(4.25),
                      height: theme.spacing(4.25),
                    }}
                  >
                    {item.icon}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box className={classes.mobileStatGrid}>
          {mobileStats.map((stat) => (
            <MobileStatCard key={stat.label} {...stat} loading={loading} classes={classes} />
          ))}
        </Box>

        <Box className={classes.twoCol}>
          <ChartSection
            title={t('dashboardChartDistance')}
            icon={iconSm}
            data={distanceData}
            unit=" km"
            type="distance"
            colors={chartColors.bar}
            classes={classes}
            loading={loading}
            emptyMsg={t('sharedNoData')}
            rankColors={chartColors.rank}
          />
          <ChartSection
            title={t('dashboardChartSpeed')}
            icon={<Speed sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />}
            data={speedData}
            unit=" km/h"
            type="speed"
            colors={chartColors.speed}
            classes={classes}
            loading={loading}
            emptyMsg={t('sharedNoData')}
            rankColors={chartColors.rank}
          />
        </Box>

        <Box className={classes.twoCol}>
          <ChartSection
            title={t('dashboardChartFuel')}
            icon={<LocalGasStation sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />}
            data={fuelData}
            unit=" L"
            type="fuel"
            colors={chartColors.fuel}
            classes={classes}
            loading={loading}
            emptyMsg={t('sharedNoData')}
            rankColors={chartColors.rank}
          />
          <Box className={classes.rightStack}>
            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <AssignmentLate sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />{' '}
                {t('dashboardPerformanceTitle')}
              </Typography>
              {loading
                ? [...Array(3)].map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      height={theme.spacing(5.25)}
                      sx={{ mb: theme.spacing(0.75), borderRadius: theme.spacing(1) }}
                    />
                  ))
                : perfRows.map((row, i) => (
                    <PerfRow
                      key={i}
                      {...row}
                      classes={classes}
                      isLast={i === perfRows.length - 1}
                    />
                  ))}
            </Box>

            <Box className={classes.sectionCard}>
              <Typography className={classes.sectionTitle}>
                <Update sx={{ fontSize: (th) => th.typography.pxToRem(16) }} />{' '}
                {t('dashboardTotalsTitle')}
              </Typography>
              <Box className={classes.totalsRow}>
                {totalBoxes.map((b, i) => (
                  <Box key={i} className={classes.totalBox} sx={{ bgcolor: b.bg }}>
                    {loading ? (
                      <Skeleton variant="text" height={theme.spacing(4.5)} />
                    ) : (
                      <Typography className={classes.totalVal} sx={{ color: b.color }}>
                        {b.val}
                      </Typography>
                    )}
                    <Typography className={classes.totalLab}>{b.lbl}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className={classes.sectionCard}>
          <Typography className={classes.sectionTitle}>{t('dashboardRecentActivity')}</Typography>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={theme.spacing(4.75)}
                sx={{ mb: theme.spacing(0.75), borderRadius: theme.spacing(1) }}
              />
            ))
          ) : recentActivity.length > 0 ? (
            recentActivity.map((item, i) => (
              <Stack
                key={i}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                className={classes.perfItem}
                sx={{ borderBottom: i === recentActivity.length - 1 ? 'none' : undefined }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: (th) => th.spacing(0.875),
                      height: (th) => th.spacing(0.875),
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: item.status === 'online' ? 'success.main' : 'text.disabled',
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: theme.typography.body2.fontSize,
                        color: 'text.primary',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      sx={{ fontSize: theme.typography.pxToRem(10.9), color: 'text.secondary' }}
                    >
                      {item.time}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={`${item.speed}${t('dashboardSpeedChip')}`}
                  size="small"
                  sx={{
                    fontSize: theme.typography.pxToRem(10.9),
                    fontWeight: 700,
                    height: theme.spacing(2.5),
                    bgcolor:
                      item.speed > 0
                        ? alpha(theme.palette.success.main, 0.15)
                        : alpha(theme.palette.text.disabled, 0.1),
                    color: item.speed > 0 ? 'success.light' : 'text.disabled',
                    border: '1px solid',
                    borderColor:
                      item.speed > 0
                        ? alpha(theme.palette.success.main, 0.3)
                        : alpha(theme.palette.text.disabled, 0.2),
                  }}
                />
              </Stack>
            ))
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: theme.spacing(2.5),
              }}
            >
              <Typography
                sx={{ fontSize: theme.typography.pxToRem(13.1), color: 'text.secondary' }}
              >
                {t('sharedNoData')}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default DashboardPage;
