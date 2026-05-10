import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, LinearProgress, Chip, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  DirectionsCar,
  TwoWheeler,
  LocalShipping,
  LocalGasStation,
  CenterFocusStrong,
  History,
  Navigation,
  ReportProblem,
  Build,
  StopCircle,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { formatDeviceListLines } from '../../common/util/deviceListField';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAttributePreference } from '../../common/util/preferences';
import {
  distanceFromMeters,
  distanceUnitString,
  speedUnitString,
} from '../../common/util/converter';

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    card: {
      padding: theme.spacing(1.25, 1.5, 1),
      marginBottom: theme.spacing(0.75),
      borderRadius: theme.spacing(1.75),
      cursor: 'pointer',
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      overflow: 'hidden',
      position: 'relative',
      transition: theme.transitions.create(['box-shadow', 'transform', 'border-color'], {
        duration: theme.transitions.duration.shortest,
      }),
    },
    cardSelected: {
      border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
      backgroundColor: alpha(theme.palette.primary.main, 0.07),
    },
    accent: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 3,
      bottom: 0,
      borderRadius: `${theme.spacing(1.75)} 0 0 ${theme.spacing(1.75)}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(0.875),
    },
    iconCircle: {
      width: theme.spacing(3.5),
      height: theme.spacing(3.5),
      borderRadius: theme.spacing(0.875),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    name: {
      fontWeight: 700,
      fontSize: theme.typography.body2.fontSize,
      color: theme.palette.text.primary,
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      lineHeight: 1.2,
    },
    uid: {
      fontSize: theme.typography.pxToRem(10.56),
      color: theme.palette.text.disabled,
      lineHeight: 1,
      marginTop: theme.spacing(0.125),
    },
    timeTxt: {
      fontSize: theme.typography.pxToRem(10.56),
      color: theme.palette.text.disabled,
      whiteSpace: 'nowrap',
    },
    statusChip: {
      height: theme.spacing(2.125),
      fontSize: theme.typography.pxToRem(9.92),
      fontWeight: 700,
      color: theme.palette.common.white,
      borderRadius: theme.spacing(0.625),
      letterSpacing: '0.01em',
    },
    stats: {
      display: 'flex',
      gap: 0,
      marginBottom: theme.spacing(0.875),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.action.hover,
      borderRadius: 1,
      padding: theme.spacing(0.625, 0),
      border: `1px solid ${theme.palette.divider}`,
    },
    statCol: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRight: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(0, 0.5),
    },
    statColLast: { borderRight: 'none' },
    statLbl: {
      fontSize: theme.typography.pxToRem(9.28),
      color: theme.palette.text.disabled,
      fontWeight: 500,
      lineHeight: 1.2,
      textAlign: 'center',
    },
    statVal: {
      fontSize: theme.typography.pxToRem(11.68),
      fontWeight: 700,
      color: theme.palette.text.primary,
      lineHeight: 1.3,
      textAlign: 'center',
    },
    fuelRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.625),
      marginBottom: theme.spacing(0.375),
    },
    fuelLbl: {
      fontSize: theme.typography.pxToRem(10.4),
      color: theme.palette.text.disabled,
      fontWeight: 500,
    },
    fuelVal: {
      fontSize: theme.typography.pxToRem(10.4),
      fontWeight: 700,
      color: theme.palette.text.secondary,
    },
    fuelPct: { fontSize: theme.typography.pxToRem(10.4), fontWeight: 700, marginLeft: 'auto' },
    bar: {
      height: theme.spacing(0.375),
      borderRadius: 2,
      backgroundColor: theme.palette.action.hover,
      marginBottom: theme.spacing(0.875),
    },
    actions: {
      display: 'flex',
      gap: 0,
      marginTop: theme.spacing(0.25),
      borderTop: `1px solid ${theme.palette.divider}`,
      paddingTop: theme.spacing(0.75),
      marginLeft: theme.spacing(-0.25),
      marginRight: theme.spacing(-0.25),
    },
    actionBtn: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(0.375),
      padding: theme.spacing(0.25, 0.5),
      borderRadius: theme.spacing(0.75),
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
      outline: 'none',
    },
    actionTxt: {
      fontSize: theme.typography.pxToRem(10.56),
      fontWeight: 600,
      color: theme.palette.text.disabled,
      whiteSpace: 'nowrap',
    },
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────────

const resolveStatus = (theme, v) => {
  const neutral = {
    color: theme.palette.text.secondary,
    bg: alpha(theme.palette.text.secondary, 0.2),
    key: null,
    fallback: v.status || '—',
  };
  if (v.speed > 0) {
    return {
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, 0.15),
      key: 'eventDeviceMoving',
      fallback: 'Moving',
    };
  }
  const k = (v.status || '').toLowerCase();
  const map = {
    mouvement: {
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, 0.15),
      key: 'eventDeviceMoving',
      fallback: 'Moving',
    },
    moving: {
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, 0.15),
      key: 'eventDeviceMoving',
      fallback: 'Moving',
    },
    garé: {
      color: theme.palette.info.main,
      bg: alpha(theme.palette.info.main, 0.15),
      key: 'reportStops',
      fallback: 'Parked',
    },
    parked: {
      color: theme.palette.info.main,
      bg: alpha(theme.palette.info.main, 0.15),
      key: 'reportStops',
      fallback: 'Parked',
    },
    offline: {
      color: theme.palette.text.secondary,
      bg: alpha(theme.palette.text.secondary, 0.2),
      key: 'deviceStatusOffline',
      fallback: 'Offline',
    },
    online: {
      color: theme.palette.success.main,
      bg: alpha(theme.palette.success.main, 0.15),
      key: 'deviceStatusOnline',
      fallback: 'Online',
    },
  };
  return map[k] || neutral;
};

const fuelLevelColor = (theme, p) =>
  p < 20
    ? theme.palette.error.main
    : p < 50
      ? theme.palette.warning.main
      : theme.palette.success.main;

const VehicleIcon = ({ vehicle, color }) => {
  const cat = (vehicle.type || vehicle.device?.category || '').toLowerCase();
  const sx = { fontSize: 14, color };
  if (cat === 'truck' || cat === 'van') return <LocalShipping sx={sx} />;
  if (cat === 'motorcycle' || cat === 'bicycle') return <TwoWheeler sx={sx} />;
  return <DirectionsCar sx={sx} />;
};

const fmt = (n, d = 1) =>
  n == null ? '—' : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d });

// ── Component ──────────────────────────────────────────────────────────────────

const DeviceRow = ({
  vehicle,
  isSelected,
  isFollowing = false,
  onSelect,
  onCenter,
  onHistory,
  onFollow,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const [hovered, setHovered] = useState(false);

  const userAttrs = useSelector((state) => state.session?.user?.attributes) || {};
  const primaryKey =
    userAttrs.devicePrimary && String(userAttrs.devicePrimary).trim()
      ? userAttrs.devicePrimary
      : 'name';
  const secondaryKey =
    userAttrs.deviceSecondary != null && String(userAttrs.deviceSecondary).trim()
      ? String(userAttrs.deviceSecondary)
      : '';
  const { primary: titleLine, secondary: subLine } = formatDeviceListLines(
    vehicle,
    primaryKey,
    secondaryKey,
  );

  const st = resolveStatus(theme, vehicle);
  const fuel =
    vehicle.fuelPercentage != null ? Math.min(100, Math.max(0, vehicle.fuelPercentage)) : null;
  const fc = fuelLevelColor(theme, fuel ?? 0);
  const followOnLabel = tt('deviceFollowEnabled', 'Follow ON');
  const alarmType = vehicle.position?.attributes?.alarm;
  const hasAlarm = Boolean(alarmType);
  const maintenanceAlarm = alarmType === 'maintenance';
  const isStopped =
    vehicle.status === 'online' &&
    (vehicle.speed ?? 0) === 0 &&
    vehicle.position?.attributes?.motion !== true;

  const stats = [
    {
      lbl: tt('positionSpeed', 'Speed'),
      val: `${vehicle.speed ?? 0} ${speedUnitString(speedUnit, t)}`,
      color: vehicle.speed > 0 ? theme.palette.success.main : null,
    },
    {
      lbl: tt('sharedOdometer', 'Odometer'),
      val: `${fmt(distanceFromMeters(vehicle.odometerMeters ?? 0, distanceUnit), 0)} ${distanceUnitString(distanceUnit, t)}`,
    },
    {
      lbl: tt('positionFuelConsumption', 'Consumption'),
      val: vehicle.consumption != null ? `${fmt(vehicle.consumption)} L` : '—',
      color: vehicle.consumption > 0 ? theme.palette.warning.main : null,
    },
    {
      lbl: tt('sharedDistance', 'Distance'),
      val: `${fmt(distanceFromMeters(vehicle.distanceMeters ?? 0, distanceUnit))} ${distanceUnitString(distanceUnit, t)}`,
      color: theme.palette.info.main,
    },
  ];

  const actions = [
    { Icon: CenterFocusStrong, lbl: tt('mapOnSelect', 'Center'), cb: () => onCenter?.(vehicle) },
    { Icon: History, lbl: tt('reportReplay', 'History'), cb: () => onHistory?.(vehicle) },
    {
      Icon: Navigation,
      lbl: isFollowing ? followOnLabel : tt('deviceFollow', 'Follow'),
      cb: () => onFollow?.(vehicle),
    },
  ];

  return (
    <Box
      className={`${classes.card} ${isSelected ? classes.cardSelected : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        boxShadow:
          hovered || isSelected
            ? `0 ${theme.spacing(0.5)} ${theme.spacing(2.5)} ${alpha(theme.palette.common.black, 0.3)}`
            : `0 ${theme.spacing(0.125)} ${theme.spacing(0.5)} ${alpha(theme.palette.common.black, 0.2)}`,
        transform: hovered && !isSelected ? 'translateY(-1px)' : 'none',
      }}
    >
      <Box
        className={classes.accent}
        sx={{ backgroundColor: isSelected ? theme.palette.primary.main : st.color }}
      />

      {/* Header */}
      <Box className={classes.header} sx={{ pl: theme.spacing(0.75) }}>
        <Box className={classes.iconCircle} sx={{ backgroundColor: st.bg }}>
          <VehicleIcon vehicle={vehicle} color={st.color} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography className={classes.name}>{titleLine}</Typography>
          {subLine ? <Typography className={classes.uid}>{subLine}</Typography> : null}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: theme.spacing(0.375),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(0.625) }}>
            <Typography className={classes.timeTxt}>{vehicle.timeAgo}</Typography>
            <Chip
              label={st.key ? tt(st.key, st.fallback) : st.fallback}
              size="small"
              className={classes.statusChip}
              sx={{ backgroundColor: st.color }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {hasAlarm && !maintenanceAlarm && (
              <Tooltip title={`${tt('eventAlarm', 'Alarm')}: ${alarmType}`}>
                <ReportProblem sx={{ fontSize: 12, color: theme.palette.error.main }} />
              </Tooltip>
            )}
            {maintenanceAlarm && (
              <Tooltip title={t('eventMaintenance')}>
                <Build sx={{ fontSize: 12, color: theme.palette.warning.main }} />
              </Tooltip>
            )}
            {isStopped && (
              <Tooltip title={t('eventDeviceStopped')}>
                <StopCircle sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats strip */}
      <Box className={classes.stats} sx={{ ml: theme.spacing(0.75) }}>
        {stats.map((s, i) => (
          <Box
            key={s.lbl}
            className={`${classes.statCol} ${i === stats.length - 1 ? classes.statColLast : ''}`}
          >
            <Typography className={classes.statLbl}>{s.lbl}</Typography>
            <Typography className={classes.statVal} sx={s.color ? { color: s.color } : undefined}>
              {s.val}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Fuel */}
      <Box sx={{ pl: theme.spacing(0.75) }}>
        <Box className={classes.fuelRow}>
          <LocalGasStation sx={{ fontSize: 11, color: fc, flexShrink: 0 }} />
          <Typography className={classes.fuelLbl}>{tt('sharedFuel', 'Fuel')}</Typography>
          <Typography className={classes.fuelVal}>
            {vehicle.fuel != null ? `${fmt(vehicle.fuel)} L` : '—'}
          </Typography>
          <Typography className={classes.fuelPct} sx={{ color: fc }}>
            {fuel != null ? `${fuel}%` : '—'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={fuel ?? 0}
          className={classes.bar}
          sx={{
            opacity: fuel == null ? 0.35 : 1,
            '& .MuiLinearProgress-bar': { backgroundColor: fc, borderRadius: 2 },
          }}
        />
      </Box>

      {/* Actions */}
      <Box className={classes.actions} sx={{ pl: theme.spacing(0.75) }}>
        {actions.map(({ Icon, lbl, cb }) => (
          <Box
            key={lbl}
            component="button"
            className={classes.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              cb();
            }}
          >
            <Icon
              sx={{
                fontSize: 12,
                color:
                  lbl === followOnLabel ? theme.palette.success.main : theme.palette.primary.main,
              }}
            />
            <Typography className={classes.actionTxt}>{lbl}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DeviceRow;
