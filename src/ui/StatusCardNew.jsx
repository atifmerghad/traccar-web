import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, IconButton, useTheme, useMediaQuery, Stack
} from '@mui/material';
import {
  BatteryFull, BatteryChargingFull, BatteryAlert, KeyboardArrowDown,
  KeyboardArrowUp, Sensors, Visibility, SignalCellularAlt
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import EngineIcon from '../resources/images/data/engine.svg?react';

const MAX_SPEED = 280; // Updated to match screenshot gauge labels

const useStyles = makeStyles()((theme) => ({
  modal: {
    position: 'fixed',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '95%',
    maxWidth: 500,
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 14px',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    zIndex: 1000,
  },
  modalCollapsed: {
    maxWidth: 450,
    width: 'auto',
    padding: '8px 16px',
  },
  collapsedRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  speedSquare: {
    backgroundColor: '#1a2233', // Darker navy from screenshot
    borderRadius: '10px',
    width: '52px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f8fafc',
    padding: '4px 12px',
    borderRadius: '12px',
    border: '1px solid #f1f5f9',
  },
  odometerPill: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '6px 14px',
  },
  speedometerWrapper: {
    width: 160,
    height: 90,
    position: 'relative',
    margin: '0 auto',
  },
  speedValueBox: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1a2233',
    color: '#bef264',
    padding: '2px 14px',
    borderRadius: '8px',
    minWidth: '45px',
    textAlign: 'center',
    zIndex: 10,
  }
}));

const StatusCardNew = ({ vehicle, batteryVoltage = 12.0, temperature = 0, signalStrength = 3 }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isCollapsed, setIsCollapsed] = useState(false); // Expanded by default
  const [time, setTime] = useState('');

  const safeVoltage = Number(batteryVoltage || 0).toFixed(1);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBatteryInfo = (voltage) => {
    const v = parseFloat(voltage);
    if (v >= 12.0) return { color: '#22c55e', icon: BatteryChargingFull };
    if (v >= 11.0) return { color: '#f59e0b', icon: BatteryFull };
    return { color: '#ef4444', icon: BatteryAlert };
  };
  const battery = getBatteryInfo(batteryVoltage);

  const currentSpeed = vehicle?.speed || 0;
  const activeColor = currentSpeed < 80 ? '#10b981' : currentSpeed < 160 ? '#f59e0b' : '#ef4444';
  const ignitionActive = vehicle?.position?.attributes?.ignition;

  if (!vehicle) return null;

  return (
    <Paper className={`${classes.modal} ${isCollapsed ? classes.modalCollapsed : ''}`} elevation={0}>
      {isCollapsed ? (
        <Box className={classes.collapsedRow}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box className={classes.statusBadge}>
              <battery.icon sx={{ color: battery.color, fontSize: 20, transform: 'rotate(90deg)' }} />
              <Typography variant="caption" fontWeight={900} sx={{ color: battery.color }}>{safeVoltage}V</Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} color="#64748b">{temperature} °C</Typography>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <SignalCellularAlt sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Sensors sx={{ color: '#cbd5e1', fontSize: 20 }} />
            <EngineIcon style={{ width: 22, color: ignitionActive ? '#22c55e' : '#cbd5e1' }} />
            <Box className={classes.speedSquare}>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#bef264' }}>{currentSpeed}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setIsCollapsed(false)}><KeyboardArrowUp /></IconButton>
          </Stack>
        </Box>
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Box className={classes.statusBadge}>
              <battery.icon sx={{ color: battery.color, fontSize: 16, transform: 'rotate(90deg)' }} />
              <Typography variant="caption" fontWeight={900} sx={{ fontSize: '0.7rem' }}>{safeVoltage} V</Typography>
            </Box>
            <Typography variant="body2" fontWeight={900} sx={{ fontSize: '0.75rem' }}>{time}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton size="small" onClick={() => setIsCollapsed(true)} sx={{ padding: '4px' }}><KeyboardArrowDown fontSize="small" /></IconButton>
              <SignalCellularAlt sx={{ color: '#f59e0b', fontSize: 18 }} />
              <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ fontSize: '0.7rem' }}>{signalStrength}</Typography>
            </Stack>
          </Stack>

          <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mb: 1.5, position: 'relative' }}>
            <Box className={classes.odometerPill} sx={{ position: 'absolute', left: 0 }}>
              <Typography variant="subtitle2" fontWeight={900} sx={{ fontSize: '0.8rem' }}>
                {vehicle.odometer?.toLocaleString()} <span style={{ color: '#94a3b8', fontSize: '0.6rem' }}>KM</span>
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Sensors sx={{ color: '#cbd5e1', fontSize: 18 }} />
              <Visibility sx={{ color: '#cbd5e1', fontSize: 18 }} />
              <EngineIcon style={{ width: 20, color: ignitionActive ? '#22c55e' : '#cbd5e1' }} />
            </Stack>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 0.5 }}>
            <GaugeItem label="Temp" value={temperature} unit="°C" />
            <GaugeItem label="Consom." value={vehicle.consumption || '0.0'} unit="L" />

            <Box className={classes.speedometerWrapper}>
              <Box
                sx={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  border: `6px solid ${activeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mt: 0.5,
                }}
              >
                <Typography variant="caption" fontWeight={900} sx={{ color: '#64748b' }}>
                  km/h
                </Typography>
              </Box>
              <Box className={classes.speedValueBox}>
                <Typography variant="body1" fontWeight={900} sx={{ fontSize: '0.9rem' }}>{currentSpeed}</Typography>
              </Box>
            </Box>

            <GaugeItem label="Distance" value={parseFloat(vehicle.distance || 0).toFixed(1)} unit="km" />
            <GaugeItem label="Capacité" value={vehicle.fuel || '0.0'} unit="L" />
          </Box>
        </>
      )}
    </Paper>
  );
};

const GaugeItem = ({ label, value, unit }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
    <Box sx={{
      width: 48, height: 48, borderRadius: '50%', border: '2px solid #3b82f6',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Typography variant="body2" fontWeight={900} sx={{ fontSize: '0.75rem' }}>{value}</Typography>
      <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>{unit}</Typography>
    </Box>
    <Typography variant="caption" fontWeight={800} sx={{ color: '#3b82f6', fontSize: '0.6rem' }}>{label}</Typography>
  </Box>
);

export default StatusCardNew;