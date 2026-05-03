import React from 'react';
import { Box, Typography, IconButton, LinearProgress, Chip } from '@mui/material';
import {
  DirectionsCar, TwoWheeler, LocalShipping, LocationOn,
  LocalGasStation, CenterFocusStrong, History, Navigation,
  ReportProblem, Build,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';

// ── Pure static styles — zero & pseudo-selectors ─────────────────────────────
const useStyles = makeStyles()(() => ({
  card: {
    padding: '10px 12px 8px',
    marginBottom: 8,
    borderRadius: 12,
    cursor: 'pointer',
    border: '1.5px solid #f1f5f9',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
  },
  cardSelected: {
    border: '1.5px solid #6366f1',
    backgroundColor: '#fafaff',
  },

  // thin left accent border
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    bottom: 0,
    borderRadius: '12px 0 0 12px',
  },

  // header row
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#1e293b',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  },
  uid: {
    fontSize: '0.68rem',
    color: '#94a3b8',
    lineHeight: 1,
    marginTop: 1,
  },
  timeTxt: {
    fontSize: '0.68rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  statusChip: {
    height: 18,
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#fff',
    borderRadius: 5,
    letterSpacing: '0.01em',
  },

  // stats row — 4 items inline
  stats: {
    display: 'flex',
    gap: 0,
    marginBottom: 7,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: '5px 0',
  },
  statCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid #f1f5f9',
    padding: '0 4px',
  },
  statColLast: {
    borderRight: 'none',
  },
  statLbl: {
    fontSize: '0.6rem',
    color: '#94a3b8',
    fontWeight: 500,
    lineHeight: 1.2,
    textAlign: 'center',
  },
  statVal: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.3,
    textAlign: 'center',
  },

  // fuel row
  fuelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  fuelLbl: {
    fontSize: '0.67rem',
    color: '#94a3b8',
    fontWeight: 500,
  },
  fuelVal: {
    fontSize: '0.67rem',
    fontWeight: 700,
    color: '#475569',
  },
  fuelPct: {
    fontSize: '0.67rem',
    fontWeight: 700,
    marginLeft: 'auto',
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f1f5f9',
    marginBottom: 7,
  },

  // action buttons row
  actions: {
    display: 'flex',
    gap: 0,
    marginTop: 2,
    borderTop: '1px solid #f8fafc',
    paddingTop: 6,
    marginLeft: -2,
    marginRight: -2,
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: '2px 4px',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
  },
  actionTxt: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS = {
  mouvement: { color: '#10b981', bg: '#dcfce7', lbl: 'Mouvement' },
  moving: { color: '#10b981', bg: '#dcfce7', lbl: 'Mouvement' },
  garé: { color: '#3b82f6', bg: '#dbeafe', lbl: 'Garé' },
  parked: { color: '#3b82f6', bg: '#dbeafe', lbl: 'Garé' },
  offline: { color: '#94a3b8', bg: '#f1f5f9', lbl: 'Hors ligne' },
  online: { color: '#10b981', bg: '#dcfce7', lbl: 'En ligne' },
};

const resolveStatus = (v) => {
  if (v.speed > 0) return STATUS.moving;
  const k = (v.status || '').toLowerCase();
  return STATUS[k] || { color: '#94a3b8', bg: '#f1f5f9', lbl: v.status || '—' };
};

const fuelColor = (p) => p < 20 ? '#ef4444' : p < 50 ? '#f59e0b' : '#10b981';

const VehicleIcon = ({ vehicle, color }) => {
  const cat = (vehicle.type || vehicle.device?.category || '').toLowerCase();
  const s = { fontSize: 15, color };
  if (cat === 'truck' || cat === 'van') return <LocalShipping style={s} />;
  if (cat === 'motorcycle' || cat === 'bicycle') return <TwoWheeler style={s} />;
  if (cat === 'car') return <DirectionsCar style={s} />;
  return <DirectionsCar style={s} />;
};

const fmt = (n, d = 1) =>
  n == null ? '—' : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d });

// ── Component ──────────────────────────────────────────────────────────────────

const DeviceRow = ({ vehicle, isSelected, onSelect, onCenter, onHistory, onFollow }) => {
  const { classes } = useStyles();
  const [hovered, setHovered] = React.useState(false);
  const st = resolveStatus(vehicle);
  const fuel = Math.min(100, Math.max(0, vehicle.fuelPercentage || 0));
  const fc = fuelColor(fuel);

  const stats = [
    { lbl: 'Vitesse', val: `${vehicle.speed ?? 0} km/h`, color: vehicle.speed > 0 ? '#10b981' : '#1e293b' },
    { lbl: 'Kilomé.', val: `${fmt(vehicle.odometer, 0)} km` },
    { lbl: 'Consom.', val: `${fmt(vehicle.consumption)} L`, color: vehicle.consumption > 0 ? '#f59e0b' : '#1e293b' },
    { lbl: 'Distance', val: `${fmt(vehicle.distance)} km`, color: '#3b82f6' },
  ];

  const actions = [
    { Icon: CenterFocusStrong, lbl: 'Centrer', cb: () => onCenter?.(vehicle) },
    { Icon: History, lbl: 'Historique', cb: () => onHistory?.(vehicle) },
    { Icon: Navigation, lbl: 'Suivre', cb: () => onFollow?.(vehicle) },
  ];

  return (
    <Box
      className={`${classes.card} ${isSelected ? classes.cardSelected : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        boxShadow: hovered || isSelected
          ? '0 4px 16px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered && !isSelected ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
    >
      {/* Left accent bar */}
      <Box className={classes.accent} style={{ backgroundColor: isSelected ? '#6366f1' : st.color }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box className={classes.header} style={{ paddingLeft: 6 }}>
        <Box className={classes.iconCircle} style={{ backgroundColor: st.bg }}>
          <VehicleIcon vehicle={vehicle} color={st.color} />
        </Box>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Typography className={classes.name}>{vehicle.name}</Typography>
          <Typography className={classes.uid}>
            {vehicle.device?.uniqueId || vehicle.id}
          </Typography>
        </Box>

        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Typography className={classes.timeTxt}>{vehicle.timeAgo}</Typography>
            <Chip
              label={st.lbl}
              size="small"
              className={classes.statusChip}
              style={{ backgroundColor: st.color }}
            />
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {vehicle.position?.attributes?.alarm && (
              <ReportProblem style={{ fontSize: 12, color: '#ef4444' }} />
            )}
            <IconButton
              size="small"
              style={{ padding: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Build style={{ fontSize: 12, color: '#f59e0b' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <Box className={classes.stats} style={{ marginLeft: 6 }}>
        {stats.map((s, i) => (
          <Box
            key={s.lbl}
            className={`${classes.statCol} ${i === stats.length - 1 ? classes.statColLast : ''}`}
          >
            <Typography className={classes.statLbl}>{s.lbl}</Typography>
            <Typography className={classes.statVal} style={s.color ? { color: s.color } : {}}>
              {s.val}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Fuel ───────────────────────────────────────────────────────────── */}
      <Box style={{ paddingLeft: 6 }}>
        <Box className={classes.fuelRow}>
          <LocalGasStation style={{ fontSize: 11, color: fc, flexShrink: 0 }} />
          <Typography className={classes.fuelLbl}>carburant</Typography>
          <Typography className={classes.fuelVal}>
            {fmt(vehicle.fuel)} L
          </Typography>
          <Typography className={classes.fuelPct} style={{ color: fc }}>
            {fuel}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={fuel}
          className={classes.bar}
          sx={{ '& .MuiLinearProgress-bar': { backgroundColor: fc, borderRadius: 2 } }}
        />
      </Box>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <Box className={classes.actions} style={{ paddingLeft: 6 }}>
        {actions.map(({ Icon, lbl, cb }) => (
          <Box
            key={lbl}
            component="button"
            className={classes.actionBtn}
            onClick={(e) => { e.stopPropagation(); cb(); }}
          >
            <Icon style={{ fontSize: 13, color: '#94a3b8' }} />
            <Typography className={classes.actionTxt}>{lbl}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DeviceRow;
