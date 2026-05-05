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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import MapOverlay from '../map/overlay/MapOverlay';
import { formatTime } from '../common/util/formatter';

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
    root: { height: '100%', position: 'relative', overflow: 'hidden', background: theme.palette.background.default },

    sidebar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 380,
      background: isDark ? 'rgba(8,13,26,0.97)' : 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      [theme.breakpoints.down('lg')]: { width: 340 },
      [theme.breakpoints.down('md')]: { width: 'min(320px, 100%)' },
      [theme.breakpoints.down('sm')]: { width: '100%' },
    },

    sidebarHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '14px 18px',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider}`,
      flexShrink: 0,
      [theme.breakpoints.down('sm')]: { padding: '12px 12px' },
    },

    scrollArea: {
      flex: 1,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: `${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} transparent`,
      '&::-webkit-scrollbar': { width: 4 },
      '&::-webkit-scrollbar-track': { background: 'transparent' },
      '&::-webkit-scrollbar-thumb': { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 },
    },

    glassSelect: {
      background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.action.hover,
      borderRadius: '10px',
      color: theme.palette.text.primary,
      '& .MuiOutlinedInput-notchedOutline': { border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}` },
      '& .MuiSelect-select': { fontWeight: 600, fontSize: '0.84rem' },
      '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider },
    },

    dateInput: {
      '& .MuiOutlinedInput-root': {
        background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.action.hover,
        borderRadius: '10px',
        color: theme.palette.text.primary,
        fontSize: '0.82rem',
        '& fieldset': { border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}` },
        '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider },
        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
      },
      '& input': { color: theme.palette.text.primary, fontSize: '0.82rem' },
      '& input::-webkit-calendar-picker-indicator': { filter: 'invert(0.55)', cursor: 'pointer' },
    },

    slider: {
      color: '#6366f1',
      '& .MuiSlider-thumb': {
        width: 14,
        height: 14,
        boxShadow: '0 0 0 4px rgba(99,102,241,0.2)',
      },
      '& .MuiSlider-track': { height: 4 },
      '& .MuiSlider-rail': { height: 4, opacity: 0.2 },
    },

    ctrlBtn: {
      color: theme.palette.text.secondary,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
      borderRadius: '10px !important',
      width: 36,
      height: 36,
      '&:hover': { background: theme.palette.action.hover, color: theme.palette.text.primary },
      '&.Mui-disabled': { opacity: 0.3 },
      [theme.breakpoints.down('sm')]: { width: 32, height: 32 },
    },

    playBtn: {
      background: '#6366f1',
      color: '#fff',
      borderRadius: '50%',
      width: 44,
      height: 44,
      '&:hover': { background: '#4f46e5' },
      '&.Mui-disabled': { background: 'rgba(99,102,241,0.25)', color: 'rgba(255,255,255,0.3)' },
      [theme.breakpoints.down('sm')]: { width: 40, height: 40 },
    },

    activityItem: {
      borderRadius: '12px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : theme.palette.divider}`,
      background: isDark ? 'rgba(255,255,255,0.03)' : theme.palette.action.hover,
      padding: '12px 14px',
      marginBottom: '8px',
      transition: 'border-color 0.15s',
      '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.12)' : theme.palette.divider },
      cursor: 'default',
    },
  };
});

// ─── ReplayPageNew ────────────────────────────────────────────────────────────

const ReplayPageNew = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const timerRef = useRef();
  const [searchParams] = useSearchParams();

  const darkMenu = {
    PaperProps: {
      sx: {
        background: isDark ? '#0f172a' : theme.palette.background.paper,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
        borderRadius: '12px',
        mt: 0.5,
        '& .MuiMenuItem-root': { color: theme.palette.text.secondary, fontSize: '0.86rem', py: 0.9 },
        '& .MuiMenuItem-root:hover': { background: theme.palette.action.hover },
        '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
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
    } catch (e) {
      console.error(e);
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
      {/* ── Map ── */}
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

      {/* ── Sidebar ── */}
      <Box className={classes.sidebar}>
        {/* Header */}
        <Box className={classes.sidebarHeader}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{ fontWeight: 800, color: theme.palette.text.primary, fontSize: '0.95rem', lineHeight: 1.2 }}
            >
              Historique du véhicule
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
              sx={{ color: theme.palette.text.disabled, '&:hover': { color: '#a5b4fc' } }}
            >
              <FileDownload sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          {loaded && (
            <IconButton
              onClick={handleReset}
              size="small"
              sx={{ color: theme.palette.text.disabled, '&:hover': { color: '#f97316' } }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{ color: theme.palette.text.disabled, '&:hover': { color: '#ef4444' } }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* ── Filter Form ── */}
        {!loaded && (
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {/* Period presets */}
            <Stack direction="row" spacing={0.8} mb={2} flexWrap="wrap">
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
                    color: activePeriod === p.value ? '#a5b4fc' : theme.palette.text.disabled,
                    borderColor:
                      activePeriod === p.value ? 'rgba(99,102,241,0.45)' : theme.palette.divider,
                    background: activePeriod === p.value ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: '1px solid',
                    '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.25)' : theme.palette.divider },
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
              Véhicule
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
                <DirectionsCar sx={{ fontSize: 16, color: '#6366f1', ml: 0.5, mr: -0.5 }} />
              }
              sx={{ mb: 2 }}
            >
              <MenuItem disabled value="">
                <em style={{ color: theme.palette.text.disabled }}>Sélectionnez un véhicule...</em>
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
              Période
            </Typography>
            <Stack spacing={1} mb={2.5}>
              <TextField
                type="datetime-local"
                size="small"
                className={classes.dateInput}
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value);
                  setActivePeriod('');
                }}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <CalendarToday sx={{ fontSize: 14, color: theme.palette.text.disabled, mr: 1 }} />
                    ),
                  },
                }}
              />
              <TextField
                type="datetime-local"
                size="small"
                className={classes.dateInput}
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value);
                  setActivePeriod('');
                }}
                fullWidth
              />
            </Stack>

            {/* Launch button */}
            <Box
              component="button"
              onClick={handleLoad}
              disabled={loading || !filterDeviceId}
              sx={{
                width: '100%',
                height: 42,
                borderRadius: '12px',
                background:
                  loading || !filterDeviceId
                    ? 'rgba(99,102,241,0.2)'
                    : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: loading || !filterDeviceId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.15s',
                '&:hover:not(:disabled)': { opacity: 0.9 },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
                  Chargement...
                </>
              ) : (
                <>
                  <PlayArrow sx={{ fontSize: 20 }} />
                  Lancer le replay
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ── Replay Controls ── */}
        {loaded && (
          <>
            {/* Date range banner */}
            <Box
              sx={{
                mx: 2,
                mt: 1.5,
                mb: 1,
                px: 2,
                py: 1,
                background: isDark ? 'rgba(255,255,255,0.03)' : theme.palette.action.hover,
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CalendarToday sx={{ fontSize: 14, color: '#6366f1' }} />
              <Typography sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary, fontWeight: 500 }}>
                {dayjs(positions[0]?.fixTime).format('DD MMM YYYY HH:mm')}
                {' — '}
                {dayjs(positions[positions.length - 1]?.fixTime).format('DD MMM YYYY HH:mm')}
              </Typography>
            </Box>

            {/* Timeline */}
            <Box sx={{ px: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
                  {currentPos ? formatTime(currentPos.fixTime, 'seconds') : '—'}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.disabled }}>
                  {index + 1} / {positions.length}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
                  {positions.length > 0
                    ? formatTime(positions[positions.length - 1].fixTime, 'seconds')
                    : '—'}
                </Typography>
              </Box>
              <Slider
                className={classes.slider}
                min={0}
                max={positions.length - 1}
                step={1}
                value={index}
                onChange={(_, v) => setIndex(v)}
                sx={{ py: '6px' }}
              />
            </Box>

            {/* Controls row */}
            <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              {/* Speed selector */}
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

              {/* Playback buttons */}
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

              {/* Speed badge */}
              <Box
                sx={{
                  background: currentSpeed > 0 ? 'rgba(245,158,11,0.12)' : theme.palette.action.hover,
                  border: `1px solid ${currentSpeed > 0 ? 'rgba(245,158,11,0.3)' : theme.palette.divider}`,
                  borderRadius: '10px',
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
                    color: currentSpeed > 0 ? '#f59e0b' : theme.palette.text.disabled,
                  }}
                >
                  {currentSpeed}
                </Typography>
                <Typography sx={{ fontSize: '0.58rem', color: theme.palette.text.disabled, letterSpacing: '0.04em' }}>
                  km/h
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider, mx: 2 }} />

            {/* ── Rapport d'activité ── */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.9rem', mb: 1.5 }}>
                Rapport d'activité
              </Typography>

              {/* Filter chips */}
              <Stack direction="row" spacing={0.8} mb={1.5} flexWrap="wrap">
                {[
                  { key: 'all', label: 'Tous', color: '#6366f1' },
                  {
                    key: 'trip',
                    label: 'Trajets',
                    color: '#22c55e',
                    icon: <Route sx={{ fontSize: 12 }} />,
                  },
                  {
                    key: 'stop',
                    label: 'Arrêts',
                    color: '#3b82f6',
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
                        activityFilter === f.key ? `${f.color}60` : theme.palette.divider,
                      background: activityFilter === f.key ? `${f.color}18` : 'transparent',
                      border: '1px solid',
                      '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                    }}
                  />
                ))}
              </Stack>

              {/* Stats row */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {[
                  { value: stats.stops, label: 'arrêts', color: '#3b82f6' },
                  { value: stats.distance, label: 'dist.', color: '#22c55e' },
                  { value: stats.fuel, label: 'fuel', color: '#f59e0b' },
                  { value: stats.driving, label: 'conduite', color: '#a855f7' },
                  { value: stats.stopped, label: 'arrêté', color: '#94a3b8' },
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

            <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider, mx: 2 }} />

            {/* Activity list */}
            <Box className={classes.scrollArea} sx={{ px: 2, py: 1.5 }}>
              {filteredActivity.length === 0 ? (
                <Typography
                  sx={{ color: theme.palette.text.disabled, fontSize: '0.82rem', textAlign: 'center', py: 3 }}
                >
                  Aucune activité disponible
                </Typography>
              ) : (
                filteredActivity.map((item, i) => {
                  const isTrip = item.type === 'trip';
                  const accentColor = isTrip ? '#22c55e' : '#3b82f6';
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
                              borderRadius: '8px',
                              background: `${accentColor}18`,
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
                        <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled, fontWeight: 600 }}>
                          {duration}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, mb: 0.6 }}>
                        <Typography
                          sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled, fontFamily: 'monospace' }}
                        >
                          {startTime}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}>→</Typography>
                        <Typography
                          sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled, fontFamily: 'monospace' }}
                        >
                          {endTime}
                        </Typography>
                        {isTrip && item.distance > 0 && (
                          <>
                            <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}>
                              ·
                            </Typography>
                            <Typography
                              sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary, fontWeight: 600 }}
                            >
                              {fmtDist(item.distance)}
                            </Typography>
                          </>
                        )}
                        {isTrip && item.maxSpeed > 0 && (
                          <>
                            <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}>
                              ·
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary }}>
                              {Math.round(item.maxSpeed * 1.852)} km/h max
                            </Typography>
                          </>
                        )}
                      </Box>

                      {(item.startAddress || item.address) && (
                        <Typography
                          sx={{ fontSize: '0.7rem', color: theme.palette.text.disabled, lineHeight: 1.4 }}
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
          </>
        )}
      </Box>

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

export default ReplayPageNew;
