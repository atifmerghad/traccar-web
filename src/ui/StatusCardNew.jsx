import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BatteryFull, BatteryChargingFull, BatteryAlert,
  ExpandLess, ExpandMore, SignalCellularAlt, Sensors, Visibility,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { makeStyles } from 'tss-react/mui';
import EngineIcon from '../resources/images/data/engine.svg?react';

const MAX_SPEED = 280;

const CX = 80;
const CY = 82;
const R = 66;
const CIRCUMFERENCE = Math.PI * R;
const TRACK = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

const pulseGlow = keyframes`
  0%   { box-shadow: 0 0 0 0px rgba(34,197,94,0.55); }
  65%  { box-shadow: 0 0 0 9px rgba(34,197,94,0);    }
  100% { box-shadow: 0 0 0 0px rgba(34,197,94,0);    }
`;

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    card: {
      position: 'fixed',
      bottom: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '95%',
      maxWidth: 500,
      borderRadius: 24,
      background: isDark ? 'rgba(10, 15, 30, 0.88)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : theme.palette.divider}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
      padding: '10px 14px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      zIndex: 1000,
      overflow: 'hidden',
    },
    cardCollapsed: {
      padding: '6px 14px',
      maxWidth: 400,
      width: 'auto',
      gap: 0,
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.action.hover,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
      borderRadius: 10,
      padding: '3px 10px',
    },
    collapseBtn: {
      width: 36,
      height: 36,
      color: theme.palette.text.secondary,
      background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
      borderRadius: 10,
      padding: 0,
      flexShrink: 0,
      '&:hover': { background: isDark ? 'rgba(255,255,255,0.12)' : theme.palette.action.selected },
    },
  };
});

const getBattery = (v) => {
  const n = parseFloat(v);
  if (n >= 12.0) return { color: '#22c55e', Icon: BatteryChargingFull };
  if (n >= 11.0) return { color: '#f59e0b', Icon: BatteryFull };
  return { color: '#ef4444', Icon: BatteryAlert };
};

const speedColor = (s) => (s < 80 ? '#10b981' : s < 160 ? '#f59e0b' : '#ef4444');

// ─────────────────────────────────────────────────────────────────────────────

const StatusCardNew = ({ vehicle, batteryVoltage = 12.0, temperature = 0, signalStrength = 3 }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!vehicle) return null;

  const safeVoltage = Number(batteryVoltage || 0).toFixed(1);
  const battery = getBattery(batteryVoltage);
  const currentSpeed = vehicle?.speed || 0;
  const sColor = speedColor(currentSpeed);
  const ignitionActive = Boolean(vehicle?.position?.attributes?.ignition);
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(currentSpeed / MAX_SPEED, 1));

  const ignitionRingStyle = {
    width: 46,
    height: 46,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: ignitionActive ? 'rgba(34,197,94,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
    border: `1.5px solid ${ignitionActive ? 'rgba(34,197,94,0.35)' : theme.palette.divider}`,
    animation: ignitionActive ? `${pulseGlow} 2s ease-in-out infinite` : 'none',
    transition: 'background 0.4s ease, border-color 0.4s ease',
  };

  const engineIconStyle = {
    width: 22,
    color: ignitionActive ? '#22c55e' : theme.palette.text.disabled,
    filter: ignitionActive ? 'drop-shadow(0 0 4px rgba(34,197,94,0.8))' : 'none',
    transition: 'all 0.4s ease',
  };

  return (
    <Box className={`${classes.card} ${isCollapsed ? classes.cardCollapsed : ''}`}>

      {/* ── Collapsed pill ──────────────────────────────────────────────── */}
      {isCollapsed ? (
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box className={classes.badge}>
              <battery.Icon sx={{ color: battery.color, fontSize: 15, transform: 'rotate(90deg)' }} />
              <Typography variant="caption" fontWeight={900} sx={{ color: battery.color, fontSize: '0.68rem' }}>
                {safeVoltage}V
              </Typography>
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: theme.palette.text.disabled, fontSize: '0.7rem' }}>
              {temperature}°C
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <SignalCellularAlt sx={{ color: '#f59e0b', fontSize: 17 }} />
            <Sensors sx={{ color: theme.palette.text.disabled, fontSize: 17 }} />
            <Stack direction="row" alignItems="center" spacing="3px">
              <Box sx={{
                width: 6, height: 6, borderRadius: '50%',
                background: ignitionActive ? '#22c55e' : theme.palette.text.disabled,
                animation: ignitionActive ? `${pulseGlow} 2s ease-in-out infinite` : 'none',
              }} />
              <EngineIcon style={engineIconStyle} />
            </Stack>
            <Box sx={{
              background: isDark ? 'rgba(255,255,255,0.07)' : theme.palette.action.hover,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
              borderRadius: 10,
              px: 1.5, py: '3px',
              display: 'flex', alignItems: 'baseline', gap: '3px',
            }}>
              <Typography fontWeight={900} sx={{ color: sColor, fontSize: '1rem', lineHeight: 1 }}>
                {currentSpeed}
              </Typography>
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.52rem', fontWeight: 700 }}>km/h</Typography>
            </Box>
            <IconButton className={classes.collapseBtn} size="small" onClick={() => setIsCollapsed(false)}>
              <ExpandLess fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

      ) : (
        /* ── Expanded ──────────────────────────────────────────────────── */
        <>
          {/* Row 1 — Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box className={classes.badge}>
              <battery.Icon sx={{ color: battery.color, fontSize: 14, transform: 'rotate(90deg)' }} />
              <Typography variant="caption" fontWeight={900} sx={{ color: battery.color, fontSize: '0.66rem' }}>
                {safeVoltage}V
              </Typography>
            </Box>

            <Typography fontWeight={900} sx={{ color: theme.palette.text.primary, fontSize: '0.78rem', letterSpacing: '1.5px' }}>
              {time}
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <Sensors sx={{ color: theme.palette.text.disabled, fontSize: 15 }} />
              <Visibility sx={{ color: theme.palette.text.disabled, fontSize: 15 }} />
              <SignalCellularAlt sx={{ color: '#f59e0b', fontSize: 15 }} />
              <Typography variant="caption" fontWeight={800} sx={{ color: theme.palette.text.disabled, fontSize: '0.62rem' }}>
                {signalStrength}
              </Typography>
              <IconButton className={classes.collapseBtn} size="small" onClick={() => setIsCollapsed(true)}>
                <ExpandMore fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Row 2 — Ignition | Speed Arc | Odometer */}
          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ px: 0.5 }}>

            {/* Ignition widget */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', pb: '6px' }}>
              <Box sx={ignitionRingStyle}>
                <EngineIcon style={engineIconStyle} />
              </Box>
              <Typography sx={{
                color: ignitionActive ? '#22c55e' : theme.palette.text.disabled,
                fontSize: '0.58rem', fontWeight: 800,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                transition: 'color 0.3s',
              }}>
                {ignitionActive ? 'ON' : 'OFF'}
              </Typography>
            </Box>

            {/* Speed arc */}
            <Box sx={{ position: 'relative', width: 160, flexShrink: 0 }}>
              <svg viewBox="0 0 160 90" width={160} height={90}>
                <path d={TRACK} fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider} strokeWidth={8} strokeLinecap="round" />
                <path
                  d={TRACK}
                  fill="none"
                  stroke={sColor}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{
                    filter: `drop-shadow(0 0 5px ${sColor}88)`,
                    transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                  }}
                />
                <circle cx={CX - R} cy={CY} r={3} fill={isDark ? 'rgba(255,255,255,0.18)' : theme.palette.divider} />
                <circle cx={CX + R} cy={CY} r={3} fill={isDark ? 'rgba(255,255,255,0.18)' : theme.palette.divider} />
              </svg>

              <Box sx={{
                position: 'absolute', bottom: 2, left: 0, right: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <Typography fontWeight={900} sx={{
                  color: sColor, fontSize: '1.75rem', lineHeight: 1,
                  transition: 'color 0.5s ease',
                  textShadow: `0 0 18px ${sColor}55`,
                }}>
                  {currentSpeed}
                </Typography>
                <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  KM/H
                </Typography>
              </Box>
            </Box>

            {/* Odometer */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', pb: '6px' }}>
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.57rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ODO
              </Typography>
              <Typography fontWeight={900} sx={{ color: theme.palette.text.primary, fontSize: '0.8rem' }}>
                {(vehicle.odometer || 0).toLocaleString()}
              </Typography>
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.54rem', fontWeight: 700 }}>
                KM
              </Typography>
            </Box>
          </Stack>

          {/* Row 3 — Metric tiles */}
          <Box sx={{ display: 'flex', gap: '6px' }}>
            <MetricTile
              label="Temp" value={temperature} unit="°C"
              color="#3b82f6" fraction={(temperature + 20) / 80}
            />
            <MetricTile
              label="Consom." value={parseFloat(vehicle.consumption || 0).toFixed(1)} unit="L/h"
              color="#f59e0b" fraction={Math.min(parseFloat(vehicle.consumption || 0) / 20, 1)}
            />
            <MetricTile
              label="Distance" value={parseFloat(vehicle.distance || 0).toFixed(0)} unit="km"
              color="#8b5cf6" fraction={Math.min(parseFloat(vehicle.distance || 0) / 500, 1)}
            />
            <MetricTile
              label="Capacité" value={parseFloat(vehicle.fuel || 0).toFixed(0)} unit="L"
              color="#10b981" fraction={Math.min(parseFloat(vehicle.fuel || 0) / 60, 1)}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

// ── MetricTile ────────────────────────────────────────────────────────────────
const MetricTile = ({ label, value, unit, color, fraction }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const pct = `${Math.min(Math.max(Number(fraction) || 0, 0), 1) * 100}%`;
  return (
    <Box sx={{
      flex: 1, minWidth: 0,
      background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider}`,
      borderRadius: '12px',
      pt: '7px', px: '5px', pb: '11px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      position: 'relative', overflow: 'hidden',
    }}>
      <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.54rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography fontWeight={900} sx={{ color: theme.palette.text.primary, fontSize: '0.82rem', lineHeight: 1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      <Typography sx={{ color: theme.palette.text.disabled, fontSize: '0.52rem', fontWeight: 700 }}>
        {unit}
      </Typography>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover }}>
        <Box sx={{
          width: pct, height: '100%',
          background: color,
          borderRadius: '0 3px 0 0',
          boxShadow: `0 0 6px ${color}99`,
          transition: 'width 0.6s ease',
        }} />
      </Box>
    </Box>
  );
};

export default StatusCardNew;
