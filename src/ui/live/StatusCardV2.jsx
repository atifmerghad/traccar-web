import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Menu,
  MenuItem,
  Drawer,
  Divider,
  Tabs,
  Tab,
  Dialog,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  BatteryFull,
  BatteryChargingFull,
  BatteryAlert,
  ExpandLess,
  ExpandMore,
  SignalCellularAlt,
  Sensors,
  Visibility,
  MoreHoriz,
  Close,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { makeStyles } from 'tss-react/mui';
import EngineIcon from '../../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../../common/util/preferences';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { formatDistance, formatTime } from '../../common/util/formatter';
import {
  distanceFromMeters,
  distanceUnitString,
  speedUnitString,
} from '../../common/util/converter';

const maxDialSpeed = (unit) => {
  switch (unit) {
    case 'mph':
      return 175;
    case 'kn':
      return 150;
    case 'kmh':
    default:
      return 280;
  }
};

const CX = 80;
const CY = 82;
const R = 66;
const CIRCUMFERENCE = Math.PI * R;
const TRACK = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  const pulseGlow = keyframes`
    0% { box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0.55)}; }
    65% { box-shadow: 0 0 0 ${theme.spacing(1.125)} ${alpha(theme.palette.success.main, 0)}; }
    100% { box-shadow: 0 0 0 0 ${alpha(theme.palette.success.main, 0)}; }
  `;
  return {
    ignitionRing: {
      width: 46,
      height: 46,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: theme.transitions.create(['background-color', 'border-color'], { duration: 400 }),
    },
    ignitionRingActive: {
      animation: `${pulseGlow} 2s ease-in-out infinite`,
    },
    pulseDot: {
      animation: `${pulseGlow} 2s ease-in-out infinite`,
    },
    card: {
      position: 'fixed',
      bottom: theme.spacing(1.5),
      left: '50%',
      transform: 'translateX(-50%)',
      width: '95%',
      maxWidth: 500,
      borderRadius: theme.spacing(3),
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.88)
        : alpha(theme.palette.background.paper, 0.92),
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.09) : theme.palette.divider}`,
      boxShadow: `0 ${theme.spacing(1)} ${theme.spacing(4)} ${alpha(theme.palette.common.black, 0.5)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.06)}`,
      padding: theme.spacing(1.25, 1.75, 1.5),
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      transition: theme.transitions.create(['bottom', 'all'], {
        duration: 300,
        easing: theme.transitions.easing.easeInOut,
      }),
      zIndex: 1000,
      overflow: 'hidden',
      // On mobile the bottom nav bar is fixed at the viewport bottom with height theme.spacing(9).
      // Push the card above the nav so it is never obscured.
      [theme.breakpoints.down('md')]: {
        bottom: `calc(${theme.spacing(9)} + ${theme.spacing(1.5)})`,
        width: 'calc(100% - 16px)',
        borderRadius: theme.spacing(2),
      },
    },
    cardCollapsed: {
      padding: theme.spacing(0.75, 1.75),
      maxWidth: 400,
      width: 'auto',
      gap: 0,
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.07)
        : theme.palette.action.hover,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
      borderRadius: theme.spacing(1.25),
      padding: theme.spacing(0.375, 1.25),
    },
    collapseBtn: {
      width: theme.spacing(4.5),
      height: theme.spacing(4.5),
      color: theme.palette.text.secondary,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.06)
        : theme.palette.action.hover,
      borderRadius: theme.spacing(1.25),
      padding: 0,
      flexShrink: 0,
      '&:hover': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.12)
          : theme.palette.action.selected,
      },
    },
  };
});

const getBattery = (theme, v) => {
  const n = parseFloat(v);
  if (n >= 12.0) return { color: theme.palette.success.main, Icon: BatteryChargingFull };
  if (n >= 11.0) return { color: theme.palette.warning.main, Icon: BatteryFull };
  return { color: theme.palette.error.main, Icon: BatteryAlert };
};

const speedColorFor = (theme, s) =>
  s < 80
    ? theme.palette.success.main
    : s < 160
      ? theme.palette.warning.main
      : theme.palette.error.main;

// ─────────────────────────────────────────────────────────────────────────────

const StatusCardNew = ({ vehicle, batteryVoltage = 12.0, temperature = 0, signalStrength = 3 }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const maxSpeedDial = maxDialSpeed(speedUnit);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [time, setTime] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [resolvedAddressKey, setResolvedAddressKey] = useState('');
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!vehicle) return null;

  const safeVoltage = Number(batteryVoltage || 0).toFixed(1);
  const battery = getBattery(theme, batteryVoltage);
  const currentSpeed = vehicle?.speed || 0;
  const sColor = speedColorFor(theme, currentSpeed);
  const ignitionActive = Boolean(vehicle?.position?.attributes?.ignition);
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(currentSpeed / maxSpeedDial, 1));
  const lat = vehicle?.position?.latitude;
  const lng = vehicle?.position?.longitude;
  const course = vehicle?.position?.course;
  const hasPosition = lat != null && lng != null;
  const coordsKey = hasPosition ? `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}` : '';
  const deviceImage = vehicle?.device?.attributes?.deviceImage;
  const deviceUniqueId = vehicle?.device?.uniqueId;

  useEffect(() => {
    if (!detailsOpen || !hasPosition) return;
    if (resolvedAddressKey === coordsKey && resolvedAddress) return;
    let cancelled = false;
    const loadAddress = async () => {
      setResolvingAddress(true);
      try {
        const query = new URLSearchParams({ latitude: lat, longitude: lng });
        const response = await fetch(`/api/server/geocode?${query.toString()}`);
        const text = response.ok ? await response.text() : '';
        if (!cancelled) {
          setResolvedAddress(text || '');
          setResolvedAddressKey(coordsKey);
        }
      } catch {
        if (!cancelled) {
          setResolvedAddress('');
          setResolvedAddressKey(coordsKey);
        }
      } finally {
        if (!cancelled) setResolvingAddress(false);
      }
    };
    loadAddress();
    return () => {
      cancelled = true;
    };
  }, [detailsOpen, hasPosition, lat, lng, coordsKey, resolvedAddress, resolvedAddressKey]);

  const displayAddress = hasPosition
    ? resolvedAddress ||
      vehicle?.position?.address ||
      (resolvingAddress
        ? tt('sharedLoading', 'Loading...')
        : `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`)
    : '—';

  const detailsRows = [
    { key: 'name', label: tt('sharedName', 'Name'), value: vehicle?.name || '—' },
    { key: 'uniqueId', label: 'Unique ID', value: deviceUniqueId || '—' },
    { key: 'status', label: tt('deviceStatus', 'Status'), value: vehicle?.status || '—' },
    {
      key: 'speed',
      label: tt('sharedSpeed', 'Speed'),
      value: `${vehicle?.speed || 0} ${speedUnitString(speedUnit, t)}`,
    },
    {
      key: 'fixTime',
      label: tt('positionFixTime', 'Fix Time'),
      value: vehicle?.position?.fixTime ? formatTime(vehicle.position.fixTime, 'seconds') : '—',
    },
    {
      key: 'address',
      label: tt('sharedAddress', 'Address'),
      value: displayAddress,
    },
    {
      key: 'coords',
      label: tt('positionTitle', 'Position'),
      value: hasPosition ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : '—',
    },
    {
      key: 'distance',
      label: tt('sharedDistance', 'Distance'),
      value: formatDistance(vehicle?.distanceMeters ?? 0, distanceUnit, t),
    },
    {
      key: 'odometer',
      label: tt('sharedOdometer', 'Odometer'),
      value: formatDistance(vehicle?.odometerMeters ?? 0, distanceUnit, t),
    },
    {
      key: 'fuel',
      label: tt('sharedFuel', 'Fuel'),
      value: vehicle?.fuel != null ? `${parseFloat(vehicle.fuel).toFixed(1)} L` : '—',
    },
  ];

  const glowShadow = `drop-shadow(0 0 4px ${alpha(theme.palette.success.main, 0.8)})`;

  const ignitionRingSx = {
    backgroundColor: ignitionActive
      ? alpha(theme.palette.success.main, 0.1)
      : isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.action.hover,
    border: `1.5px solid ${ignitionActive ? alpha(theme.palette.success.main, 0.35) : theme.palette.divider}`,
  };

  return (
    <Box className={`${classes.card} ${isCollapsed ? classes.cardCollapsed : ''}`}>
      {/* ── Collapsed pill ──────────────────────────────────────────────── */}
      {isCollapsed ? (
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box className={classes.badge}>
              <battery.Icon
                sx={{ color: battery.color, fontSize: 15, transform: 'rotate(90deg)' }}
              />
              <Typography
                variant="caption"
                fontWeight={900}
                sx={{ color: battery.color, fontSize: '0.68rem' }}
              >
                {safeVoltage}V
              </Typography>
            </Box>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: theme.palette.text.disabled, fontSize: '0.7rem' }}
            >
              {temperature}°C
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <SignalCellularAlt sx={{ color: theme.palette.warning.main, fontSize: 17 }} />
            <Sensors sx={{ color: theme.palette.text.disabled, fontSize: 17 }} />
            <Stack direction="row" alignItems="center" spacing="3px">
              <Box
                className={ignitionActive ? classes.pulseDot : undefined}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: ignitionActive
                    ? theme.palette.success.main
                    : theme.palette.text.disabled,
                }}
              />
              <Box
                sx={{
                  width: 22,
                  color: ignitionActive ? theme.palette.success.main : theme.palette.text.disabled,
                  filter: ignitionActive ? glowShadow : 'none',
                  transition: theme.transitions.create(['color', 'filter'], { duration: 400 }),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& svg': { width: 22, height: 'auto' },
                }}
              >
                <EngineIcon />
              </Box>
            </Stack>
            <Box
              sx={{
                backgroundColor: isDark
                  ? alpha(theme.palette.common.white, 0.07)
                  : theme.palette.action.hover,
                border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
                borderRadius: theme.spacing(1.25),
                px: 1.5,
                py: 0.375,
                display: 'flex',
                alignItems: 'baseline',
                gap: 0.375,
              }}
            >
              <Typography fontWeight={900} sx={{ color: sColor, fontSize: '1rem', lineHeight: 1 }}>
                {currentSpeed}
              </Typography>
              <Typography
                sx={{ color: theme.palette.text.disabled, fontSize: '0.52rem', fontWeight: 700 }}
              >
                {speedUnitString(speedUnit, t)}
              </Typography>
            </Box>
            <IconButton
              className={classes.collapseBtn}
              size="small"
              onClick={() => setIsCollapsed(false)}
            >
              <ExpandLess fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        /* ── Expanded ──────────────────────────────────────────────────── */
        <>
          {/* Row 1 — Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              {deviceImage && deviceUniqueId && (
                <Box
                  sx={{
                    width: 44,
                    height: 30,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src={`/api/media/${deviceUniqueId}/${deviceImage}`}
                    alt="vehicle"
                    onClick={() => setImagePreviewOpen(true)}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      cursor: 'zoom-in',
                      backgroundColor: isDark
                        ? alpha(theme.palette.common.white, 0.04)
                        : theme.palette.grey[100],
                    }}
                  />
                </Box>
              )}
              <Box className={classes.badge}>
                <battery.Icon
                  sx={{ color: battery.color, fontSize: 14, transform: 'rotate(90deg)' }}
                />
                <Typography
                  variant="caption"
                  fontWeight={900}
                  sx={{ color: battery.color, fontSize: '0.66rem' }}
                >
                  {safeVoltage}V
                </Typography>
              </Box>
            </Stack>

            <Typography
              fontWeight={900}
              sx={{
                color: theme.palette.text.primary,
                fontSize: '0.78rem',
                letterSpacing: '1.5px',
              }}
            >
              {time}
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <Sensors sx={{ color: theme.palette.text.disabled, fontSize: 15 }} />
              <Visibility sx={{ color: theme.palette.text.disabled, fontSize: 15 }} />
              <SignalCellularAlt sx={{ color: theme.palette.warning.main, fontSize: 15 }} />
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{ color: theme.palette.text.disabled, fontSize: '0.62rem' }}
              >
                {signalStrength}
              </Typography>
              <IconButton
                className={classes.collapseBtn}
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={!hasPosition}
              >
                <MoreHoriz fontSize="small" />
              </IconButton>
              <IconButton
                className={classes.collapseBtn}
                size="small"
                onClick={() => setIsCollapsed(true)}
              >
                <ExpandMore fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Row 2 — Ignition | Speed Arc | Odometer */}
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            sx={{ px: 0.5 }}
          >
            {/* Ignition widget */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: theme.spacing(0.75),
                pb: theme.spacing(0.75),
              }}
            >
              <Box
                className={`${classes.ignitionRing} ${ignitionActive ? classes.ignitionRingActive : ''}`}
                sx={ignitionRingSx}
              >
                <Box
                  sx={{
                    width: 22,
                    color: ignitionActive
                      ? theme.palette.success.main
                      : theme.palette.text.disabled,
                    filter: ignitionActive ? glowShadow : 'none',
                    transition: theme.transitions.create(['color', 'filter'], { duration: 400 }),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& svg': { width: 22, height: 'auto' },
                  }}
                >
                  <EngineIcon />
                </Box>
              </Box>
              <Typography
                sx={{
                  color: ignitionActive ? theme.palette.success.main : theme.palette.text.disabled,
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  transition: theme.transitions.create('color', { duration: 300 }),
                }}
              >
                {ignitionActive ? 'ON' : 'OFF'}
              </Typography>
            </Box>

            {/* Speed arc */}
            <Box sx={{ position: 'relative', width: 160, flexShrink: 0 }}>
              <svg viewBox="0 0 160 90" width={160} height={90}>
                <path
                  d={TRACK}
                  fill="none"
                  stroke={isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}
                  strokeWidth={8}
                  strokeLinecap="round"
                />
                <path
                  d={TRACK}
                  fill="none"
                  stroke={sColor}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{
                    filter: `drop-shadow(0 0 5px ${alpha(sColor, 0.53)})`,
                    transition:
                      'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                  }}
                />
                <circle
                  cx={CX - R}
                  cy={CY}
                  r={3}
                  fill={isDark ? alpha(theme.palette.common.white, 0.18) : theme.palette.divider}
                />
                <circle
                  cx={CX + R}
                  cy={CY}
                  r={3}
                  fill={isDark ? alpha(theme.palette.common.white, 0.18) : theme.palette.divider}
                />
              </svg>

              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Typography
                  fontWeight={900}
                  sx={{
                    color: sColor,
                    fontSize: '1.75rem',
                    lineHeight: 1,
                    transition: 'color 0.5s ease',
                    textShadow: `0 0 ${theme.spacing(2.25)} ${alpha(sColor, 0.33)}`,
                  }}
                >
                  {currentSpeed}
                </Typography>
                <Typography
                  sx={{
                    color: theme.palette.text.disabled,
                    fontSize: '0.57rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                  }}
                >
                  {speedUnitString(speedUnit, t).toUpperCase()}
                </Typography>
              </Box>
            </Box>

            {/* Odometer */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                pb: '6px',
              }}
            >
              <Typography
                sx={{
                  color: theme.palette.text.disabled,
                  fontSize: '0.57rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                ODO
              </Typography>
              <Typography
                fontWeight={900}
                sx={{ color: theme.palette.text.primary, fontSize: '0.8rem' }}
              >
                {distanceFromMeters(vehicle.odometerMeters ?? 0, distanceUnit).toLocaleString()}
              </Typography>
              <Typography
                sx={{ color: theme.palette.text.disabled, fontSize: '0.54rem', fontWeight: 700 }}
              >
                {distanceUnitString(distanceUnit, t).toUpperCase()}
              </Typography>
            </Box>
          </Stack>

          {/* Row 3 — Metric tiles */}
          <Box sx={{ display: 'flex', gap: theme.spacing(0.75) }}>
            <MetricTile
              label="Temp"
              value={temperature}
              unit="°C"
              color={theme.palette.info.main}
              fraction={(temperature + 20) / 80}
            />
            <MetricTile
              label="Consom."
              value={parseFloat(vehicle.consumption || 0).toFixed(1)}
              unit="L/h"
              color={theme.palette.warning.main}
              fraction={Math.min(parseFloat(vehicle.consumption || 0) / 20, 1)}
            />
            <MetricTile
              label="Distance"
              value={parseFloat(
                distanceFromMeters(vehicle.distanceMeters ?? 0, distanceUnit),
              ).toFixed(0)}
              unit={distanceUnitString(distanceUnit, t)}
              color={theme.palette.geometry.main}
              fraction={Math.min((vehicle.distanceMeters ?? 0) / 500000, 1)}
            />
            <MetricTile
              label="Capacité"
              value={parseFloat(vehicle.fuel || 0).toFixed(0)}
              unit="L"
              color={theme.palette.success.main}
              fraction={Math.min(parseFloat(vehicle.fuel || 0) / 60, 1)}
            />
          </Box>
        </>
      )}
      {hasPosition && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setDetailsOpen(true);
            }}
          >
            {t('sharedShowDetails')}
          </MenuItem>
          <Divider />
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem component="a" target="_blank" href={`http://maps.apple.com/?ll=${lat},${lng}`}>
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat}%2C${lng}&heading=${course || 0}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && typeof navigationAppLink === 'string' && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink.replace('{latitude}', lat).replace('{longitude}', lng)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
        </Menu>
      )}
      <Drawer
        anchor="bottom"
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsTab(0);
        }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            maxHeight: { xs: '84vh', sm: '76vh' },
            backgroundColor: isDark
              ? alpha(theme.palette.background.default, 0.96)
              : alpha(theme.palette.background.paper, 0.98),
            backdropFilter: 'blur(12px)',
          },
        }}
      >
        <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 0.8 }}
          >
            <Tabs
              value={detailsTab}
              onChange={(_, v) => setDetailsTab(v)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{
                minHeight: 34,
                maxWidth: 'calc(100% - 40px)',
                '& .MuiTab-root': {
                  minHeight: 34,
                  textTransform: 'none',
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  px: { xs: 0.8, sm: 1.2 },
                  minWidth: { xs: 64, sm: 72 },
                },
              }}
            >
              <Tab label="Data" />
              <Tab label="Graph" />
              <Tab label={tt('sharedMessages', 'Messages')} />
            </Tabs>
            <IconButton size="small" onClick={() => setDetailsOpen(false)}>
              <ExpandMore fontSize="small" />
            </IconButton>
          </Stack>
          {detailsTab === 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr 1fr' },
                gap: 1,
              }}
            >
              <Box
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 1.2,
                  backgroundColor: isDark
                    ? alpha(theme.palette.common.white, 0.03)
                    : theme.palette.action.hover,
                }}
              >
                <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, mb: 0.8 }}>
                  {tt('sharedData', 'Data')}
                </Typography>
                {detailsRows.map((row) => (
                  <Box
                    key={row.key}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '95px 1fr', sm: '120px 1fr' },
                      gap: 1,
                      py: 0.45,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-of-type': { borderBottom: 'none' },
                    }}
                  >
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                      {row.label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.78rem', color: 'text.primary', wordBreak: 'break-word' }}
                    >
                      {row.value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateRows: '1fr 1fr',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 1,
                    backgroundColor: isDark
                      ? alpha(theme.palette.common.white, 0.03)
                      : theme.palette.action.hover,
                  }}
                >
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                    {tt('eventRecent', 'Recent events')}
                  </Typography>
                  <Typography sx={{ mt: 0.8, fontSize: '0.8rem' }}>
                    {vehicle?.position?.attributes?.alarm
                      ? `Alarm: ${vehicle.position.attributes.alarm}`
                      : tt('eventNoEvents', 'No recent events')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 1,
                    backgroundColor: isDark
                      ? alpha(theme.palette.common.white, 0.03)
                      : theme.palette.action.hover,
                  }}
                >
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                    {tt('sharedTasks', 'Recent tasks')}
                  </Typography>
                  <Typography sx={{ mt: 0.8, fontSize: '0.8rem', color: 'text.secondary' }}>
                    {tt('sharedNoData', 'No data')}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: isDark
                    ? alpha(theme.palette.common.white, 0.03)
                    : theme.palette.action.hover,
                }}
              >
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 0.7 }}>
                  {tt('sharedPhoto', 'Photo')}
                </Typography>
                {deviceImage && deviceUniqueId ? (
                  <Box
                    component="img"
                    src={`/api/media/${deviceUniqueId}/${deviceImage}`}
                    alt="vehicle"
                    onClick={() => setImagePreviewOpen(true)}
                    sx={{
                      width: '100%',
                      maxHeight: { xs: 200, sm: 240 },
                      objectFit: 'contain',
                      borderRadius: 1.5,
                      backgroundColor: isDark
                        ? alpha(theme.palette.common.white, 0.04)
                        : theme.palette.grey[100],
                      cursor: 'zoom-in',
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {tt('sharedNoData', 'No data')}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          {detailsTab === 1 && (
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 2,
                minHeight: 180,
                backgroundColor: isDark
                  ? alpha(theme.palette.common.white, 0.03)
                  : theme.palette.action.hover,
              }}
            >
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                {tt('reportTitle', 'Reports')}
              </Typography>
            </Box>
          )}
          {detailsTab === 2 && (
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 2,
                minHeight: 180,
                backgroundColor: isDark
                  ? alpha(theme.palette.common.white, 0.03)
                  : theme.palette.action.hover,
              }}
            >
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                {tt('sharedNoData', 'No data')}
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>
      <Dialog
        open={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDark
              ? alpha(theme.palette.background.default, 0.96)
              : alpha(theme.palette.background.paper, 0.98),
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton size="small" onClick={() => setImagePreviewOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        {deviceImage && deviceUniqueId && (
          <Box
            component="img"
            src={`/api/media/${deviceUniqueId}/${deviceImage}`}
            alt="vehicle-full"
            sx={{
              width: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              px: { xs: 1, sm: 2 },
              pb: 2,
            }}
          />
        )}
      </Dialog>
    </Box>
  );
};

// ── MetricTile ────────────────────────────────────────────────────────────────
const MetricTile = ({ label, value, unit, color, fraction }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pct = `${Math.min(Math.max(Number(fraction) || 0, 0), 1) * 100}%`;
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.04)
          : theme.palette.action.hover,
        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
        borderRadius: theme.spacing(1.5),
        pt: theme.spacing(0.875),
        px: theme.spacing(0.625),
        pb: theme.spacing(1.375),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(0.25),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Typography
        sx={{
          color: theme.palette.text.disabled,
          fontSize: '0.54rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </Typography>
      <Typography
        fontWeight={900}
        sx={{
          color: theme.palette.text.primary,
          fontSize: '0.82rem',
          lineHeight: 1,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.52rem', fontWeight: 700 }}>
        {unit}
      </Typography>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: theme.spacing(0.375),
          backgroundColor: isDark
            ? alpha(theme.palette.common.white, 0.04)
            : theme.palette.action.hover,
        }}
      >
        <Box
          sx={{
            width: pct,
            height: '100%',
            backgroundColor: color,
            borderRadius: `0 ${theme.spacing(0.375)} 0 0`,
            boxShadow: `0 0 ${theme.spacing(0.75)} ${alpha(color, 0.6)}`,
            transition: 'width 0.6s ease',
          }}
        />
      </Box>
    </Box>
  );
};

export default StatusCardNew;
