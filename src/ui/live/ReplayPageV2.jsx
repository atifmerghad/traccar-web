import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  Slider,
  Stack,
  Divider,
  CircularProgress,
  TextField,
  Chip,
  Alert,
  Fade,
  useMediaQuery,
  Backdrop,
  Fab,
  Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import {
  PlayArrow,
  Pause,
  FastRewind,
  FastForward,
  FirstPage,
  LastPage,
  FileDownload,
  Close,
  CalendarToday,
  DirectionsCar,
  LocalParking,
  KeyboardArrowDown,
  Refresh,
  Route,
  ChevronRight,
  ChevronLeft,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import MapView from '../../map/core/MapView';
import MapRoutePath from '../../map/MapRoutePath';
import MapRoutePoints from '../../map/MapRoutePoints';
import MapPositions from '../../map/MapPositions';
import MapCamera from '../../map/MapCamera';
import MapGeofence from '../../map/MapGeofence';
import StatusCard from '../../common/components/StatusCard';
import MapScale from '../../map/MapScale';
import MapOverlay from '../../map/overlay/MapOverlay';
import { formatTime } from '../../common/util/formatter';
import { useTranslation } from '../../common/components/LocalizationProvider';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDuration = (ms) => {
  if (!ms || ms <= 0) return '0m';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDist = (m) => {
  if (!m) return '0 km';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

const PERIOD_PRESETS = [
  { label: 'Auj.', value: 'today' },
  { label: 'Hier', value: 'yesterday' },
  { label: '7j', value: '7d' },
  { label: '30j', value: '30d' },
];

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.default,
    },

    mapShell: {
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      [theme.breakpoints.up('md')]: {
        inset: theme.spacing(0.75),
        borderRadius: theme.spacing(1),
      },
      [theme.breakpoints.down('md')]: {
        inset: theme.spacing(0.5),
        borderRadius: theme.spacing(0.75),
      },
    },

    sidebar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 380,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.97)
        : alpha(theme.palette.background.paper, 0.97),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
      zIndex: 1002,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: `${theme.spacing(0.5)} 0 ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.4)}`,
      transition: theme.transitions.create(['transform', 'box-shadow', 'visibility'], {
        duration: theme.transitions.duration.enteringScreen,
        easing: theme.transitions.easing.easeOut,
      }),
      [theme.breakpoints.down('lg')]: { width: 340 },
      [theme.breakpoints.down('md')]: {
        top: theme.spacing(0.5),
        left: theme.spacing(0.5),
        bottom: theme.spacing(0.5),
        height: 'auto',
        width: `min(360px, calc(100% - ${theme.spacing(1)}))`,
        maxWidth: '100%',
        borderRadius: theme.spacing(1.25),
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
      },
    },

    /** Compact layout only: panel dismissed, map fully usable */
    sidebarHiddenCompact: {
      transform: `translateX(calc(-100% - ${theme.spacing(2)}))`,
      visibility: 'hidden',
      pointerEvents: 'none',
      boxShadow: 'none',
    },

    panelBackdrop: {
      zIndex: 1001,
      backgroundColor: alpha(theme.palette.common.black, 0.38),
    },

    compactMapActions: {
      position: 'absolute',
      top: theme.spacing(1),
      left: theme.spacing(1),
      zIndex: 1200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
    },

    compactRoundBtn: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      minHeight: 'unset',
      padding: 0,
      borderRadius: '50%',
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.88)
        : alpha(theme.palette.common.white, 0.92),
      color: theme.palette.text.secondary,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.12) : theme.palette.divider}`,
      boxShadow: isDark
        ? `0 ${theme.spacing(1)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.5)}`
        : `0 ${theme.spacing(1)} ${theme.spacing(2.75)} ${alpha(theme.palette.common.black, 0.18)}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
        duration: 180,
        easing: theme.transitions.easing.easeInOut,
      }),
      '&:hover': {
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.94)
          : alpha(theme.palette.common.white, 0.98),
        color: theme.palette.text.primary,
      },
      [theme.breakpoints.down('md')]: {
        width: theme.spacing(5),
        height: theme.spacing(5),
      },
    },

    expandFab: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      minHeight: 'unset',
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.88)
        : alpha(theme.palette.common.white, 0.92),
      color: theme.palette.primary.main,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.12) : theme.palette.divider}`,
      boxShadow: isDark
        ? `0 ${theme.spacing(1)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.5)}`
        : `0 ${theme.spacing(1)} ${theme.spacing(2.75)} ${alpha(theme.palette.common.black, 0.18)}`,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
        duration: 180,
        easing: theme.transitions.easing.easeInOut,
      }),
      '&:hover': {
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.94)
          : alpha(theme.palette.common.white, 0.98),
      },
      [theme.breakpoints.down('md')]: {
        width: theme.spacing(5),
        height: theme.spacing(5),
      },
    },

    sidebarHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      padding: `${theme.spacing(1.75)} ${theme.spacing(2.25)}`,
      borderBottom: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
      flexShrink: 0,
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
    },

    scrollArea: {
      flex: 1,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: `${isDark ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.1)} transparent`,
      '&::-webkit-scrollbar': { width: 4 },
      '&::-webkit-scrollbar-track': { background: 'transparent' },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.1)
          : alpha(theme.palette.common.black, 0.1),
        borderRadius: 4,
      },
    },

    glassSelect: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : theme.palette.action.hover,
      borderRadius: theme.spacing(1.25),
      color: theme.palette.text.primary,
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
      },
      '& .MuiSelect-select': { fontWeight: 600, fontSize: '0.84rem' },
      '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
      },
    },

    dateInput: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.05)
          : theme.palette.action.hover,
        borderRadius: theme.spacing(1.25),
        color: theme.palette.text.primary,
        fontSize: '0.82rem',
        '& fieldset': {
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
        },
        '&:hover fieldset': {
          borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
        },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
      },
      '& input': { color: theme.palette.text.primary, fontSize: '0.82rem' },
      '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.55)', cursor: 'pointer' },
    },

    slider: {
      color: theme.palette.primary.main,
      '& .MuiSlider-thumb': {
        width: 14,
        height: 14,
        boxShadow: `0 0 0 ${theme.spacing(0.5)} ${alpha(theme.palette.primary.main, 0.2)}`,
      },
      '& .MuiSlider-track': { height: 4 },
      '& .MuiSlider-rail': { height: 4, opacity: 0.2 },
    },

    ctrlBtn: {
      color: theme.palette.text.secondary,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
      borderRadius: `${theme.spacing(1.25)} !important`,
      width: 36,
      height: 36,
      '&:hover': { backgroundColor: theme.palette.action.hover, color: theme.palette.text.primary },
      '&.Mui-disabled': { opacity: 0.3 },
      [theme.breakpoints.down('sm')]: { width: 32, height: 32 },
    },

    playBtn: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: '50%',
      width: 44,
      height: 44,
      '&:hover': { backgroundColor: theme.palette.primary.dark },
      '&.Mui-disabled': {
        backgroundColor: alpha(theme.palette.primary.main, 0.25),
        color: alpha(theme.palette.primary.contrastText, 0.3),
      },
      [theme.breakpoints.down('sm')]: { width: 40, height: 40 },
    },

    activityItem: {
      borderRadius: theme.spacing(1.5),
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.03)
        : theme.palette.action.hover,
      padding: `${theme.spacing(1.5)} ${theme.spacing(1.75)}`,
      marginBottom: theme.spacing(1),
      transition: theme.transitions.create('border-color', {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.12) : theme.palette.divider,
      },
      cursor: 'default',
    },

    bottomPlayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1100,
      padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)} max(${theme.spacing(1.5)}, env(safe-area-inset-bottom, 0px))`,
      pointerEvents: 'none',
      [theme.breakpoints.down('sm')]: {
        padding: `${theme.spacing(1)} ${theme.spacing(1)} max(${theme.spacing(1.25)}, env(safe-area-inset-bottom, 0px))`,
      },
    },

    bottomPlayerInner: {
      pointerEvents: 'auto',
      marginLeft: `calc(380px + ${theme.spacing(1.5)})`,
      marginRight: theme.spacing(0.5),
      borderRadius: theme.spacing(1.75),
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.12) : alpha(theme.palette.common.black, 0.14)}`,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.5)
        : alpha(theme.palette.background.paper, 0.58),
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: isDark
        ? `0 ${theme.spacing(-0.75)} ${theme.spacing(3.5)} ${alpha(theme.palette.common.black, 0.45)}`
        : `0 ${theme.spacing(-0.75)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.14)}`,
      padding: `${theme.spacing(1.25)} ${theme.spacing(1.5)}`,
      [theme.breakpoints.between('md', 'lg')]: {
        marginLeft: `calc(340px + ${theme.spacing(1.5)})`,
      },
      [theme.breakpoints.down('md')]: {
        marginLeft: theme.spacing(0.5),
        marginRight: theme.spacing(0.5),
      },
      [theme.breakpoints.down('sm')]: {
        borderRadius: theme.spacing(1.5),
        padding: `${theme.spacing(1)} ${theme.spacing(1.25)}`,
      },
    },

    sliderTouch: {
      '& .MuiSlider-thumb': { width: 18, height: 18 },
      '& .MuiSlider-track': { height: 5 },
      '& .MuiSlider-rail': { height: 5 },
    },
  };
});

// ─── ReplayPageV2 ─────────────────────────────────────────────────────────────

const ReplayPageV2 = () => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const t = useTranslation();
  const navigate = useNavigate();
  const timerRef = useRef();
  const [searchParams] = useSearchParams();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [panelOpen, setPanelOpen] = useState(true);

  const darkMenu = {
    PaperProps: {
      sx: {
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.98)
          : theme.palette.background.paper,
        borderRadius: theme.spacing(1.5),
        '& .MuiMenuItem-root': {
          color: theme.palette.text.secondary,
          fontSize: '0.86rem',
          py: 0.9,
        },
        '& .MuiMenuItem-root:hover': { backgroundColor: theme.palette.action.hover },
        '& .MuiMenuItem-root.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.light,
        },
      },
    },
  };

  // Redux
  const reduxDefaultId = useSelector((state) => state.devices.selectedId);
  const reduxDevices = useSelector((state) => Object.values(state.devices.items));

  // URL param takes priority over redux selected device
  const urlDeviceId = searchParams.get('deviceId');
  const initialDeviceId = urlDeviceId || reduxDefaultId || '';

  // Filter state
  const [filterDeviceId, setFilterDeviceId] = useState(initialDeviceId);
  const [filterFrom, setFilterFrom] = useState(dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'));
  const [filterTo, setFilterTo] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [activePeriod, setActivePeriod] = useState('today');

  // Data state
  const [positions, setPositions] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Playback state
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // UI state
  const [activityFilter, setActivityFilter] = useState('all');
  const [showCard, setShowCard] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');

  const loaded = !loading && positions.length > 0;

  // Sync if redux devices load after first render and no URL param was given
  useEffect(() => {
    if (!urlDeviceId && reduxDefaultId && !filterDeviceId) {
      setFilterDeviceId(reduxDefaultId);
    }
  }, [reduxDefaultId]);

  // Sync period presets to date inputs
  const applyPeriod = (period) => {
    setActivePeriod(period);
    const range = getPeriodRange(period);
    if (range) {
      setFilterFrom(range[0].format('YYYY-MM-DDTHH:mm'));
      setFilterTo(range[1].format('YYYY-MM-DDTHH:mm'));
    }
  };

  // Playback interval
  useEffect(() => {
    if (playing && positions.length > 0) {
      const ms = Math.max(50, Math.round(500 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setIndex((i) => {
          if (i >= positions.length - 1) {
            clearInterval(timerRef.current);
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, ms);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, positions, playbackSpeed]);

  // Load handler
  const handleLoad = async () => {
    if (!filterDeviceId) return;
    setLoading(true);
    setLoadMessage('');
    setPlaying(false);
    setIndex(0);
    const from = new Date(filterFrom).toISOString();
    const to = new Date(filterTo).toISOString();
    const q = new URLSearchParams({ deviceId: filterDeviceId, from, to });
    try {
      const [posRes, tripsRes, stopsRes] = await Promise.all([
        fetch(`/api/positions?${q}`),
        fetch(`/api/reports/trips?${q}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/reports/stops?${q}`, { headers: { Accept: 'application/json' } }),
      ]);
      const [posData, tripsData, stopsData] = await Promise.all([
        posRes.json(),
        tripsRes.json(),
        stopsRes.json(),
      ]);
      setPositions(Array.isArray(posData) ? posData : []);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setStops(Array.isArray(stopsData) ? stopsData : []);
      setSelectedDeviceId(filterDeviceId);
      if (!Array.isArray(posData) || posData.length === 0) {
        setLoadMessage(t('sharedNoData'));
      }
    } catch {
      setLoadMessage(t('sharedNoData'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlaying(false);
    setPositions([]);
    setTrips([]);
    setStops([]);
    setIndex(0);
    setLoadMessage('');
  };

  const handleDownload = () => {
    if (!selectedDeviceId) return;
    const from = new Date(filterFrom).toISOString();
    const to = new Date(filterTo).toISOString();
    const q = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${q}`);
  };

  const onPointClick = useCallback((_, i) => setIndex(i), []);
  const onMarkerClick = useCallback((id) => setShowCard(!!id), []);

  // Activity list
  const activityItems = useMemo(() => {
    const t = trips.map((r) => ({ ...r, type: 'trip' }));
    const s = stops.map((r) => ({ ...r, type: 'stop' }));
    return [...t, ...s].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [trips, stops]);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'trip') return activityItems.filter((i) => i.type === 'trip');
    if (activityFilter === 'stop') return activityItems.filter((i) => i.type === 'stop');
    return activityItems;
  }, [activityItems, activityFilter]);

  // Summary stats
  const stats = useMemo(
    () => ({
      distance: fmtDist(trips.reduce((s, t) => s + (t.distance || 0), 0)),
      fuel: `${trips.reduce((s, t) => s + (t.spentFuel || 0), 0).toFixed(1)} L`,
      driving: fmtDuration(trips.reduce((s, t) => s + (t.duration || 0), 0)),
      stopped: fmtDuration(stops.reduce((s, t) => s + (t.duration || 0), 0)),
      stops: stops.length,
    }),
    [trips, stops],
  );

  const currentPos = positions[index];
  const currentSpeed = currentPos ? Math.round(currentPos.speed * 1.852) : 0;
  const deviceName = reduxDevices.find((d) => d.id === selectedDeviceId)?.name || '';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box className={classes.root}>
      <Box className={classes.mapShell}>
        <MapView>
          <MapOverlay />
          <MapGeofence />
          <MapRoutePath positions={positions} />
          <MapRoutePoints positions={positions} onClick={onPointClick} showSpeedControl />
          {index < positions.length && (
            <MapPositions
              positions={[positions[index]]}
              onMarkerClick={onMarkerClick}
              titleField="fixTime"
            />
          )}
        </MapView>
        <MapScale />
        <MapCamera positions={positions} />
      </Box>

      <Backdrop
        className={classes.panelBackdrop}
        open={isCompact && panelOpen}
        onClick={() => setPanelOpen(false)}
      />

      <Box className={cx(classes.sidebar, isCompact && !panelOpen && classes.sidebarHiddenCompact)}>
        {/* Header */}
        <Box className={classes.sidebarHeader}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                fontSize: '0.95rem',
                lineHeight: 1.2,
              }}
            >
              {t('reportEvents')}
            </Typography>
            {loaded && deviceName && (
              <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled, mt: 0.3 }}>
                {deviceName}
              </Typography>
            )}
          </Box>
          {loaded && (
            <IconButton
              onClick={handleDownload}
              size="small"
              sx={{
                color: theme.palette.text.disabled,
                '&:hover': { color: theme.palette.primary.light },
              }}
            >
              <FileDownload sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {loaded && (
            <IconButton
              onClick={handleReset}
              size="small"
              sx={{
                color: theme.palette.text.disabled,
                '&:hover': { color: theme.palette.warning.main },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <IconButton
            onClick={() => {
              if (isCompact) setPanelOpen(false);
              else navigate(-1);
            }}
            size="small"
            aria-label={isCompact ? t('sharedHide') : t('sharedBack')}
            sx={{
              color: theme.palette.text.disabled,
              touchAction: 'manipulation',
              ...(isCompact
                ? { '&:hover': { color: theme.palette.primary.light } }
                : { '&:hover': { color: theme.palette.error.main } }),
            }}
          >
            {isCompact ? <ChevronLeft sx={{ fontSize: 22 }} /> : <Close sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>

        {/* ── Filter Form ── */}
        <Fade in={!loaded} timeout={220} mountOnEnter unmountOnExit>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            <Box
              sx={{
                borderRadius: theme.spacing(1.75),
                border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
                backgroundColor: isDark
                  ? alpha(theme.palette.common.white, 0.02)
                  : theme.palette.action.hover,
                p: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                  mb: 1.2,
                }}
              >
                {t('sharedPreferences')}
              </Typography>

              {/* Period presets */}
              <Stack direction="row" spacing={0.8} mb={1.8} flexWrap="wrap">
                {PERIOD_PRESETS.map((p) => (
                  <Chip
                    key={p.value}
                    label={p.label}
                    size="small"
                    onClick={() => applyPeriod(p.value)}
                    sx={{
                      height: 28,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color:
                        activePeriod === p.value
                          ? theme.palette.primary.light
                          : theme.palette.text.disabled,
                      borderColor:
                        activePeriod === p.value
                          ? alpha(theme.palette.primary.main, 0.45)
                          : theme.palette.divider,
                      backgroundColor:
                        activePeriod === p.value
                          ? alpha(theme.palette.primary.main, 0.15)
                          : 'transparent',
                      border: '1px solid',
                      '&:hover': {
                        borderColor: isDark
                          ? alpha(theme.palette.common.white, 0.25)
                          : theme.palette.divider,
                      },
                    }}
                  />
                ))}
              </Stack>

              {/* Device selector */}
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: theme.palette.text.disabled,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  mb: 0.8,
                }}
              >
                {t('sharedDevice')}
              </Typography>
              <Select
                value={filterDeviceId}
                onChange={(e) => setFilterDeviceId(e.target.value)}
                className={classes.glassSelect}
                IconComponent={KeyboardArrowDown}
                size="small"
                fullWidth
                displayEmpty
                MenuProps={darkMenu}
                startAdornment={
                  <DirectionsCar
                    sx={{ fontSize: 16, color: theme.palette.primary.main, ml: 0.5, mr: -0.5 }}
                  />
                }
                sx={{ mb: 1.6 }}
              >
                <MenuItem disabled value="">
                  <Box
                    component="em"
                    sx={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}
                  >
                    {t('sharedNoData')}
                  </Box>
                </MenuItem>
                {reduxDevices.map((dev) => (
                  <MenuItem key={dev.id} value={dev.id}>
                    {dev.name}
                  </MenuItem>
                ))}
              </Select>

              {/* Date range */}
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: theme.palette.text.disabled,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  mb: 0.8,
                }}
              >
                {t('maintenancePeriod')}
              </Typography>
              <Stack spacing={1} mb={2}>
                <TextField
                  type="datetime-local"
                  size="small"
                  label={t('maintenanceStart')}
                  className={classes.dateInput}
                  value={filterFrom}
                  onChange={(e) => {
                    setFilterFrom(e.target.value);
                    setActivePeriod('');
                  }}
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <CalendarToday
                          sx={{ fontSize: 14, color: theme.palette.text.disabled, mr: 1 }}
                        />
                      ),
                    },
                  }}
                />
                <TextField
                  type="datetime-local"
                  size="small"
                  label={t('maintenancePeriod')}
                  className={classes.dateInput}
                  value={filterTo}
                  onChange={(e) => {
                    setFilterTo(e.target.value);
                    setActivePeriod('');
                  }}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>

              {/* Launch button */}
              <Box
                component="button"
                onClick={handleLoad}
                disabled={loading || !filterDeviceId}
                sx={{
                  width: '100%',
                  height: 44,
                  borderRadius: theme.spacing(1.5),
                  backgroundColor:
                    loading || !filterDeviceId
                      ? alpha(theme.palette.primary.main, 0.35)
                      : 'transparent',
                  backgroundImage:
                    loading || !filterDeviceId
                      ? 'none'
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  border: 'none',
                  color: theme.palette.primary.contrastText,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: loading || !filterDeviceId ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing(1),
                  transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.shorter,
                  }),
                  '&:hover:not(:disabled)': { opacity: 0.9 },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={16}
                      sx={{ color: theme.palette.primary.contrastText, mr: 1 }}
                    />
                    {`${t('sharedSearch')}...`}
                  </>
                ) : (
                  <>
                    <PlayArrow sx={{ fontSize: 20 }} />
                    {t('sharedSave')}
                  </>
                )}
              </Box>

              <Fade in={Boolean(loadMessage)} timeout={220}>
                <Box sx={{ mt: loadMessage ? 1.2 : 0 }}>
                  {loadMessage && (
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: theme.spacing(1.25),
                        fontSize: '0.78rem',
                        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.12) : theme.palette.divider}`,
                        backgroundColor: isDark
                          ? alpha(theme.palette.background.paper, 0.72)
                          : alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      {loadMessage}
                    </Alert>
                  )}
                </Box>
              </Fade>
            </Box>
          </Box>
        </Fade>

        {/* ── Replay Details ── */}
        <Fade in={loaded} timeout={260} mountOnEnter unmountOnExit>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Rapport d'activité ── */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem',
                  mb: 1.5,
                }}
              >
                {t('reportEvents')}
              </Typography>

              {/* Filter chips */}
              <Stack direction="row" spacing={0.8} mb={1.5} flexWrap="wrap">
                {[
                  { key: 'all', label: t('eventAll'), color: theme.palette.primary.main },
                  {
                    key: 'trip',
                    label: 'Trajets',
                    color: theme.palette.success.main,
                    icon: <Route sx={{ fontSize: 12 }} />,
                  },
                  {
                    key: 'stop',
                    label: t('eventDeviceStopped'),
                    color: theme.palette.info.main,
                    icon: <LocalParking sx={{ fontSize: 12 }} />,
                  },
                ].map((f) => (
                  <Chip
                    key={f.key}
                    label={f.label}
                    icon={f.icon}
                    size="small"
                    onClick={() => setActivityFilter(f.key)}
                    sx={{
                      height: 26,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: activityFilter === f.key ? f.color : theme.palette.text.disabled,
                      borderColor:
                        activityFilter === f.key ? alpha(f.color, 0.38) : theme.palette.divider,
                      backgroundColor:
                        activityFilter === f.key ? alpha(f.color, 0.1) : 'transparent',
                      border: '1px solid',
                      '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                    }}
                  />
                ))}
              </Stack>

              {/* Stats row */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {[
                  { value: stats.stops, label: 'arrêts', color: theme.palette.info.main },
                  { value: stats.distance, label: 'dist.', color: theme.palette.success.main },
                  { value: stats.fuel, label: 'fuel', color: theme.palette.warning.main },
                  { value: stats.driving, label: 'conduite', color: theme.palette.secondary.main },
                  { value: stats.stopped, label: 'arrêté', color: theme.palette.text.secondary },
                ].map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: s.color }}>
                      {s.value}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.disabled }}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider
              sx={{
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.07)
                  : theme.palette.divider,
                mx: 2,
              }}
            />

            {/* Activity list */}
            <Box className={classes.scrollArea} sx={{ px: 2, py: 1.5, flex: 1, minHeight: 0 }}>
              {filteredActivity.length === 0 ? (
                <Typography
                  sx={{
                    color: theme.palette.text.disabled,
                    fontSize: '0.82rem',
                    textAlign: 'center',
                    py: 3,
                  }}
                >
                  {t('sharedNoData')}
                </Typography>
              ) : (
                filteredActivity.map((item, i) => {
                  const isTrip = item.type === 'trip';
                  const accentColor = isTrip ? theme.palette.success.main : theme.palette.info.main;
                  const duration = fmtDuration(item.duration);
                  const startTime = item.startTime ? dayjs(item.startTime).format('HH:mm') : '—';
                  const endTime = item.endTime ? dayjs(item.endTime).format('HH:mm') : '—';
                  return (
                    <Box key={i} className={classes.activityItem}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.8,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: theme.spacing(1),
                              backgroundColor: alpha(accentColor, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isTrip ? (
                              <Route sx={{ fontSize: 14, color: accentColor }} />
                            ) : (
                              <LocalParking sx={{ fontSize: 14, color: accentColor }} />
                            )}
                          </Box>
                          <Typography
                            sx={{ fontSize: '0.82rem', fontWeight: 700, color: accentColor }}
                          >
                            {isTrip ? 'Mouvement' : 'Stationnement'}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            color: theme.palette.text.disabled,
                            fontWeight: 600,
                          }}
                        >
                          {duration}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, mb: 0.6 }}>
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            color: theme.palette.text.disabled,
                            fontFamily: 'monospace',
                          }}
                        >
                          {startTime}
                        </Typography>
                        <Typography
                          sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}
                        >
                          →
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            color: theme.palette.text.disabled,
                            fontFamily: 'monospace',
                          }}
                        >
                          {endTime}
                        </Typography>
                        {isTrip && item.distance > 0 && (
                          <>
                            <Typography
                              sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}
                            >
                              ·
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.72rem',
                                color: theme.palette.text.secondary,
                                fontWeight: 600,
                              }}
                            >
                              {fmtDist(item.distance)}
                            </Typography>
                          </>
                        )}
                        {isTrip && item.maxSpeed > 0 && (
                          <>
                            <Typography
                              sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}
                            >
                              ·
                            </Typography>
                            <Typography
                              sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary }}
                            >
                              {Math.round(item.maxSpeed * 1.852)} km/h max
                            </Typography>
                          </>
                        )}
                      </Box>

                      {(item.startAddress || item.address) && (
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            color: theme.palette.text.disabled,
                            lineHeight: 1.4,
                          }}
                          noWrap
                        >
                          {item.startAddress || item.address}
                        </Typography>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Fade>
      </Box>

      {isCompact && !panelOpen && (
        <Box className={classes.compactMapActions}>
          <Tooltip title={t('sharedBack')} placement="right">
            <IconButton
              className={classes.compactRoundBtn}
              onClick={() => navigate(-1)}
              aria-label={t('sharedBack')}
              disableRipple
              sx={{ touchAction: 'manipulation' }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('reportReplay')} placement="right">
            <Fab
              className={classes.expandFab}
              onClick={() => setPanelOpen(true)}
              aria-label={t('reportReplay')}
              disableRipple
              sx={{ touchAction: 'manipulation' }}
            >
              <ChevronRight fontSize="small" />
            </Fab>
          </Tooltip>
        </Box>
      )}

      <Fade in={loaded} timeout={260} mountOnEnter unmountOnExit>
        <Box className={classes.bottomPlayer}>
          <Box className={classes.bottomPlayerInner}>
            {/* Timeline */}
            <Box sx={{ px: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: theme.palette.text.secondary,
                    fontFamily: 'monospace',
                  }}
                >
                  {currentPos ? formatTime(currentPos.fixTime, 'seconds') : '—'}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}>
                  {index + 1} / {positions.length}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: theme.palette.text.secondary,
                    fontFamily: 'monospace',
                  }}
                >
                  {positions.length > 0
                    ? formatTime(positions[positions.length - 1].fixTime, 'seconds')
                    : '—'}
                </Typography>
              </Box>
              <Slider
                className={cx(classes.slider, isCompact && classes.sliderTouch)}
                min={0}
                max={positions.length - 1}
                step={1}
                value={index}
                onChange={(_, v) => setIndex(v)}
                sx={{ py: '6px' }}
              />
            </Box>

            {/* Controls row */}
            <Box
              sx={{
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              <Select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(e.target.value)}
                size="small"
                className={classes.glassSelect}
                MenuProps={darkMenu}
                IconComponent={KeyboardArrowDown}
                sx={{ minWidth: 72 }}
              >
                {[1, 2, 4, 8].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}x
                  </MenuItem>
                ))}
              </Select>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                }}
              >
                <IconButton
                  className={classes.ctrlBtn}
                  onClick={() => {
                    setPlaying(false);
                    setIndex(0);
                  }}
                  disabled={playing}
                >
                  <FirstPage sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  className={classes.ctrlBtn}
                  onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                  disabled={playing || index <= 0}
                >
                  <FastRewind sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  className={classes.playBtn}
                  onClick={() => setPlaying(!playing)}
                  disabled={index >= positions.length - 1}
                >
                  {playing ? <Pause sx={{ fontSize: 22 }} /> : <PlayArrow sx={{ fontSize: 22 }} />}
                </IconButton>
                <IconButton
                  className={classes.ctrlBtn}
                  onClick={() => setIndex((i) => Math.min(i + 1, positions.length - 1))}
                  disabled={playing || index >= positions.length - 1}
                >
                  <FastForward sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  className={classes.ctrlBtn}
                  onClick={() => {
                    setPlaying(false);
                    setIndex(positions.length - 1);
                  }}
                  disabled={playing}
                >
                  <LastPage sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 0.8,
                  color: theme.palette.text.secondary,
                  px: 1,
                }}
              >
                <CalendarToday sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                <Typography sx={{ fontSize: '0.73rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {dayjs(positions[0]?.fixTime).format('DD MMM YYYY HH:mm')}
                  {' — '}
                  {dayjs(positions[positions.length - 1]?.fixTime).format('DD MMM YYYY HH:mm')}
                </Typography>
              </Box>

              <Box
                sx={{
                  backgroundColor:
                    currentSpeed > 0
                      ? alpha(theme.palette.warning.main, 0.12)
                      : theme.palette.action.hover,
                  border: `1px solid ${currentSpeed > 0 ? alpha(theme.palette.warning.main, 0.3) : theme.palette.divider}`,
                  borderRadius: theme.spacing(1.25),
                  minWidth: 64,
                  px: 1,
                  py: 0.5,
                  textAlign: 'center',
                  marginLeft: { xs: 'auto', sm: 0 },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color:
                      currentSpeed > 0 ? theme.palette.warning.main : theme.palette.text.disabled,
                  }}
                >
                  {currentSpeed}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.58rem',
                    color: theme.palette.text.disabled,
                    letterSpacing: '0.04em',
                  }}
                >
                  km/h
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Status card */}
      {showCard && index < positions.length && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={positions[index]}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </Box>
  );
};

export default ReplayPageV2;
