import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Fab,
  Switch,
  TextField,
  Select,
  MenuItem,
  Slider,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ChevronRight,
  Close,
  Share,
  NotificationsOutlined,
  FmdGoodOutlined,
  MapOutlined,
  SettingsRemoteOutlined,
  Speed as SpeedIcon,
  DirectionsCar,
  BatteryAlertOutlined,
  PowerOffOutlined,
  LocalShipping,
  SportsMotorsports,
  MyLocation,
  Stop,
  RestartAlt,
  LockOpen,
  VolumeUp,
  Sms,
  PlayArrow,
  Refresh,
  ZoomIn,
  ZoomOut,
  MyLocationOutlined,
  HistoryOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import DeviceRow from './DeviceRow';
import MainToolbar from './MainToolbar';
import StatusCardV2 from './StatusCardV2';
import PageLayout from '../layout/PageLayout';
import MainMap from '../../main/MainMap';
import { map } from '../../map/core/MapView';
import useMapStyles from '../../map/core/useMapStyles';
import useFilter from '../../main/useFilter';
import usePersistedState, { savePersistedState } from '../../common/util/usePersistedState';
import { devicesActions, sessionActions } from '../../store';
import { useTranslation } from '../../common/components/LocalizationProvider';
import {
  distanceFromMeters,
  distanceUnitString,
  speedFromKnots,
  speedUnitString,
} from '../../common/util/converter';
import { useAttributePreference } from '../../common/util/preferences';
import { useEffectAsync } from '../../reactHelper';
import { prefixString } from '../../common/util/stringUtils';

dayjs.extend(relativeTime);

const buildAlertMeta = (theme) => ({
  overspeed: {
    icon: <SpeedIcon />,
    bg: alpha(theme.palette.info.main, 0.15),
    color: theme.palette.info.main,
  },
  ignitionOn: {
    icon: <DirectionsCar />,
    bg: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
  },
  ignitionOff: {
    icon: <DirectionsCar />,
    bg: alpha(theme.palette.text.secondary, 0.18),
    color: theme.palette.text.secondary,
  },
  lowBattery: {
    icon: <BatteryAlertOutlined />,
    bg: alpha(theme.palette.warning.main, 0.15),
    color: theme.palette.warning.main,
  },
  deviceOffline: {
    icon: <PowerOffOutlined />,
    bg: alpha(theme.palette.primary.light, 0.15),
    color: theme.palette.primary.light,
  },
  deviceOnline: {
    icon: <PowerOffOutlined />,
    bg: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
  },
  alarm: {
    icon: <LocalShipping />,
    bg: alpha(theme.palette.warning.main, 0.15),
    color: theme.palette.warning.main,
  },
  sos: {
    icon: <SportsMotorsports />,
    bg: alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.main,
  },
  hardBraking: {
    icon: <Stop />,
    bg: alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.main,
  },
  geofenceEnter: {
    icon: <FmdGoodOutlined />,
    bg: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
  },
  geofenceExit: {
    icon: <FmdGoodOutlined />,
    bg: alpha(theme.palette.error.main, 0.15),
    color: theme.palette.error.main,
  },
  maintenance: {
    icon: <RestartAlt />,
    bg: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main,
  },
  driverChanged: {
    icon: <DirectionsCar />,
    bg: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main,
  },
  commandResult: {
    icon: <SettingsRemoteOutlined />,
    bg: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main,
  },
  deviceMoving: {
    icon: <PlayArrow />,
    bg: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
  },
  deviceStopped: {
    icon: <Stop />,
    bg: alpha(theme.palette.text.secondary, 0.18),
    color: theme.palette.text.secondary,
  },
  deviceFuelDrop: {
    icon: <BatteryAlertOutlined />,
    bg: alpha(theme.palette.warning.main, 0.15),
    color: theme.palette.warning.main,
  },
  deviceFuelIncrease: {
    icon: <BatteryAlertOutlined />,
    bg: alpha(theme.palette.success.main, 0.15),
    color: theme.palette.success.main,
  },
  media: {
    icon: <NotificationsOutlined />,
    bg: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main,
  },
});

const defaultAlertMeta = (theme) => ({
  icon: <NotificationsOutlined />,
  bg: alpha(theme.palette.text.secondary, 0.18),
  color: theme.palette.text.secondary,
});

const cmdIconSx = (theme) => ({ fontSize: theme.typography.pxToRem(24) });

const buildCommandMeta = (theme) => ({
  engineResume: {
    icon: <PlayArrow sx={cmdIconSx(theme)} />,
    label: 'Start',
    bg: alpha(theme.palette.success.main, 0.2),
    color: theme.palette.success.light,
  },
  engineStop: {
    icon: <Stop sx={cmdIconSx(theme)} />,
    label: 'Stop',
    bg: alpha(theme.palette.error.main, 0.2),
    color: theme.palette.error.light,
  },
  deviceReboot: {
    icon: <RestartAlt sx={cmdIconSx(theme)} />,
    label: 'Reboot',
    bg: alpha(theme.palette.primary.dark, 0.2),
    color: theme.palette.primary.light,
  },
  doorUnlock: {
    icon: <LockOpen sx={cmdIconSx(theme)} />,
    label: 'Unlock',
    bg: alpha(theme.palette.warning.main, 0.2),
    color: theme.palette.warning.light,
  },
  outputControl: {
    icon: <VolumeUp sx={cmdIconSx(theme)} />,
    label: 'Output',
    bg: alpha(theme.palette.info.main, 0.2),
    color: theme.palette.info.light,
  },
  getLocation: {
    icon: <Sms sx={cmdIconSx(theme)} />,
    label: 'SMS Location',
    bg: alpha(theme.palette.text.secondary, 0.2),
    color: theme.palette.text.secondary,
  },
  positionPeriodic: {
    icon: <Refresh sx={cmdIconSx(theme)} />,
    label: 'Periodic Position',
    bg: alpha(theme.palette.primary.main, 0.2),
    color: theme.palette.primary.light,
  },
  positionStop: {
    icon: <Stop sx={cmdIconSx(theme)} />,
    label: 'Stop Reporting',
    bg: alpha(theme.palette.text.secondary, 0.2),
    color: theme.palette.text.secondary,
  },
  custom: {
    icon: <SettingsRemoteOutlined sx={cmdIconSx(theme)} />,
    label: 'Custom Command',
    bg: alpha(theme.palette.primary.main, 0.2),
    color: theme.palette.primary.light,
  },
});

const defaultCommandMeta = (theme) => ({
  icon: <SettingsRemoteOutlined sx={cmdIconSx(theme)} />,
  bg: alpha(theme.palette.text.secondary, 0.2),
  color: theme.palette.text.secondary,
});

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    mainContainer: {
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.default,
    },
    mapContainer: {
      position: 'absolute',
      inset: theme.spacing(0.75),
      borderRadius: theme.spacing(1),
      overflow: 'hidden',
      boxShadow: `0 ${theme.spacing(0.25)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.4)}`,
      [theme.breakpoints.down('md')]: {
        inset: theme.spacing(0.5),
        borderRadius: theme.spacing(0.75),
      },
    },
    sidebar: {
      position: 'absolute',
      top: theme.spacing(0.75),
      left: theme.spacing(0.75),
      width: 390,
      height: `calc(100% - ${theme.spacing(1.5)})`,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: theme.spacing(1),
      overflow: 'hidden',
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.97)
        : alpha(theme.palette.background.paper, 0.97),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${theme.palette.divider}`,
      zIndex: 1000,
      boxShadow: `0 ${theme.spacing(1)} ${theme.spacing(4)} ${alpha(theme.palette.common.black, 0.5)}`,
      [theme.breakpoints.down('lg')]: {
        width: 340,
      },
      [theme.breakpoints.down('md')]: {
        top: theme.spacing(0.5),
        left: theme.spacing(0.5),
        width: 'min(320px, calc(100% - 8px))',
        height: 'calc(100% - 8px)',
        borderRadius: theme.spacing(0.75),
      },
      [theme.breakpoints.down('sm')]: {
        width: 'calc(100% - 8px)',
        maxWidth: '100%',
      },
    },
    vehicleList: {
      flex: 1,
      overflowY: 'auto',
      padding: theme.spacing(1.5),
      scrollbarWidth: 'thin',
      scrollbarColor: `${theme.palette.action.selected} transparent`,
      '&::-webkit-scrollbar': { width: theme.spacing(0.5) },
      '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.action.selected,
        borderRadius: theme.spacing(0.5),
      },
    },
    expandFab: {
      position: 'absolute',
      top: theme.spacing(2),
      left: theme.spacing(2),
      zIndex: 1002,
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
        transform: 'translateX(2px)',
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.94)
          : alpha(theme.palette.common.white, 0.98),
        boxShadow: isDark
          ? `0 ${theme.spacing(1.25)} ${theme.spacing(3.5)} ${alpha(theme.palette.common.black, 0.58)}`
          : `0 ${theme.spacing(1.25)} ${theme.spacing(3.25)} ${alpha(theme.palette.common.black, 0.22)}`,
      },
      [theme.breakpoints.down('md')]: {
        top: theme.spacing(1),
        left: theme.spacing(1),
        width: theme.spacing(4.25),
        height: theme.spacing(4.25),
      },
    },
    rightToolbar: {
      position: 'absolute',
      top: '50%',
      right: theme.spacing(1.75),
      transform: 'translateY(-50%)',
      zIndex: 1002,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.75),
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.95)
        : alpha(theme.palette.background.paper, 0.95),
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.75),
      padding: theme.spacing(1.25, 0.875),
      boxShadow: `0 ${theme.spacing(1)} ${theme.spacing(4)} ${alpha(theme.palette.common.black, 0.4)}`,
      [theme.breakpoints.down('md')]: {
        right: theme.spacing(1),
        padding: theme.spacing(0.75, 0.5),
        gap: theme.spacing(0.375),
        borderRadius: theme.spacing(1.25),
      },
      [theme.breakpoints.down('sm')]: {
        right: theme.spacing(0.75),
        padding: theme.spacing(0.5),
        gap: theme.spacing(0.25),
        borderRadius: theme.spacing(1),
      },
    },
    mobileSearchDock: {
      position: 'absolute',
      top: theme.spacing(1.25),
      left: theme.spacing(1.25),
      right: theme.spacing(1.25),
      zIndex: 1003,
    },
    mobileSearchResults: {
      marginTop: theme.spacing(0.75),
      maxHeight: 260,
      overflowY: 'auto',
      borderRadius: theme.spacing(1.25),
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.94)
        : alpha(theme.palette.background.paper, 0.96),
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: `0 ${theme.spacing(1)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.35)}`,
    },
    mobileSearchItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(1.25),
      padding: theme.spacing(1.25, 1.5),
      borderBottom: `1px solid ${theme.palette.divider}`,
      cursor: 'pointer',
      '&:last-child': { borderBottom: 'none' },
      '&:hover': { backgroundColor: theme.palette.action.hover },
    },
    toolbarDivider: {
      height: 1,
      backgroundColor: theme.palette.divider,
      margin: theme.spacing(0.5, 0),
      [theme.breakpoints.down('md')]: {
        margin: theme.spacing(0.25, 0),
      },
    },
    toolbarBtn: {
      width: theme.spacing(4.75),
      height: theme.spacing(4.75),
      borderRadius: `${theme.spacing(1.25)} !important`,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down('md')]: {
        width: theme.spacing(3.75),
        height: theme.spacing(3.75),
        borderRadius: `${theme.spacing(0.875)} !important`,
      },
      [theme.breakpoints.down('sm')]: {
        width: theme.spacing(3.5),
        height: theme.spacing(3.5),
        borderRadius: `${theme.spacing(0.75)} !important`,
      },
    },
    toolbarBtnBlocked: {
      backgroundColor: `${alpha(theme.palette.error.main, 0.18)} !important`,
      border: `1px solid ${alpha(theme.palette.error.main, 0.45)} !important`,
      color: `${theme.palette.error.main} !important`,
    },
    toolbarBtnActive: {
      backgroundColor: `${theme.palette.primary.main} !important`,
      color: `${theme.palette.primary.contrastText} !important`,
    },
    panel: {
      position: 'absolute',
      top: theme.spacing(0.75),
      right: theme.spacing(0.75),
      width: 360,
      height: `calc(100% - ${theme.spacing(1.5)})`,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.97)
        : alpha(theme.palette.background.paper, 0.97),
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.5),
      zIndex: 1003,
      boxShadow: `0 ${theme.spacing(1)} ${theme.spacing(5)} ${alpha(theme.palette.common.black, 0.6)}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      [theme.breakpoints.down('lg')]: {
        width: 330,
      },
      [theme.breakpoints.down('md')]: {
        top: theme.spacing(0.5),
        right: theme.spacing(0.5),
        width: 'min(320px, calc(100% - 8px))',
        height: 'calc(100% - 8px)',
        borderRadius: theme.spacing(1.25),
      },
      [theme.breakpoints.down('sm')]: {
        width: 'calc(100% - 8px)',
        maxWidth: '100%',
        borderRadius: theme.spacing(1),
      },
    },
    panelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(2.5, 2.5, 2),
      borderBottom: `1px solid ${theme.palette.divider}`,
      flexShrink: 0,
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.75, 1.75, 1.5),
      },
    },
    panelTitle: {
      fontWeight: 800,
      fontSize: theme.typography.body1.fontSize,
      color: theme.palette.text.primary,
    },
    panelSubtitle: {
      fontSize: theme.typography.body2.fontSize,
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
    panelBody: {
      flex: 1,
      overflowY: 'auto',
      padding: theme.spacing(1.5, 2.5),
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.25, 1.75),
      },
    },
    panelRow: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.75),
      padding: theme.spacing(1.75, 0),
      borderBottom: `1px solid ${theme.palette.divider}`,
      cursor: 'pointer',
    },
    panelRowIcon: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      borderRadius: theme.spacing(1.25),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    panelRowTitle: {
      fontWeight: 600,
      fontSize: theme.typography.body2.fontSize,
      color: theme.palette.text.primary,
    },
    panelRowSub: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.text.secondary,
    },
    commandGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing(1.25),
      [theme.breakpoints.down('sm')]: {
        gap: 1,
      },
    },
    commandBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      padding: theme.spacing(2.25, 1.25),
      borderRadius: theme.spacing(1.5),
      border: `1.5px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.03)
        : theme.palette.action.hover,
      cursor: 'pointer',
      transition: theme.transitions.create('all', { duration: theme.transitions.duration.shorter }),
    },
    commandIcon: {
      width: theme.spacing(6.25),
      height: theme.spacing(6.25),
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapTypeGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing(1.25),
      marginBottom: theme.spacing(2.5),
      [theme.breakpoints.down('sm')]: {
        gap: 1,
        marginBottom: theme.spacing(1.75),
      },
    },
    mapTypeBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(0.75),
      padding: theme.spacing(1.5, 1),
      borderRadius: theme.spacing(1.25),
      cursor: 'pointer',
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 600,
      border: `1.5px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      color: theme.palette.text.secondary,
    },
  };
});

const humanizeType = (type) =>
  (type || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

// ─── Panel: Share ─────────────────────────────────────────────────────────────

const SharePanel = ({ vehicle, classes, onClose }) => {
  const theme = useTheme();
  const t = useTranslation();
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const lat = vehicle?.position?.latitude;
  const lng = vehicle?.position?.longitude;
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const openGoogleMaps = () => {
    if (lat && lng) window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };
  const openWaze = () => {
    if (lat && lng) window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  const shareText = async (text) => {
    const fallbackCopy = () => {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.focus();
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        return ok;
      } catch {
        return false;
      }
    };

    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: vehicle?.name || tt('deviceTitle', 'Vehicle'),
            text,
          });
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return;
        }
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setSnack({
          open: true,
          msg: tt('sharedCopiedToClipboard', 'Copied to clipboard'),
          severity: 'success',
        });
        return;
      }

      if (fallbackCopy()) {
        setSnack({
          open: true,
          msg: tt('sharedCopiedToClipboard', 'Copied to clipboard'),
          severity: 'success',
        });
      } else {
        setSnack({
          open: true,
          msg: tt('sharedNotSupported', 'Share is not supported on this browser'),
          severity: 'warning',
        });
      }
    } catch {
      if (fallbackCopy()) {
        setSnack({
          open: true,
          msg: tt('sharedCopiedToClipboard', 'Copied to clipboard'),
          severity: 'success',
        });
      } else {
        setSnack({
          open: true,
          msg: tt('sharedNotSupported', 'Share is not supported on this browser'),
          severity: 'warning',
        });
      }
    }
  };

  const handleBasicShare = () => {
    const text = [
      `${tt('deviceTitle', 'Vehicle')}: ${vehicle?.name || '—'}`,
      `${tt('deviceStatus', 'Status')}: ${vehicle?.status || '—'}`,
      lat != null && lng != null
        ? `${tt('positionTitle', 'Position')}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : `${tt('positionTitle', 'Position')}: ${tt('sharedUnavailable', 'unavailable')}`,
    ].join('\n');
    shareText(text);
  };

  const handleCompleteShare = () => {
    const attrs = vehicle?.position?.attributes || {};
    const knots = vehicle?.position?.speed;
    const odoM = attrs.odometer ?? attrs.totalDistance;
    const speedLine =
      knots != null
        ? `${tt('sharedSpeed', 'Speed')}: ${speedFromKnots(knots, speedUnit).toFixed(1)} ${speedUnitString(speedUnit, t)}`
        : `${tt('sharedSpeed', 'Speed')}: —`;
    const odoLine =
      odoM != null && Number.isFinite(Number(odoM))
        ? `${tt('sharedOdometer', 'Odometer')}: ${distanceFromMeters(Number(odoM), distanceUnit).toFixed(2)} ${distanceUnitString(distanceUnit, t)}`
        : `${tt('sharedOdometer', 'Odometer')}: —`;
    const text = [
      `${tt('deviceTitle', 'Vehicle')}: ${vehicle?.name || '—'}`,
      `ID: ${vehicle?.id || '—'}`,
      `${tt('deviceStatus', 'Status')}: ${vehicle?.status || '—'}`,
      speedLine,
      lat != null && lng != null
        ? `${tt('positionTitle', 'Position')}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : `${tt('positionTitle', 'Position')}: ${tt('sharedUnavailable', 'unavailable')}`,
      `${tt('sharedBattery', 'Battery')}: ${attrs.battery || attrs.power || '—'}`,
      odoLine,
    ].join('\n');
    shareText(text);
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>
            {tt('deviceShare', 'Share Device')}
          </Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {[
          {
            icon: <MapOutlined />,
            bg: alpha(theme.palette.info.main, 0.15),
            color: theme.palette.info.main,
            title: tt('sharedBasicData', 'Basic Data'),
            sub: tt('sharedBasicDataDesc', 'Name, position and status'),
            onClick: handleBasicShare,
          },
          {
            icon: <DirectionsCar />,
            bg: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
            title: tt('sharedCompleteData', 'Complete Data'),
            sub: tt('sharedCompleteDataDesc', 'All available vehicle information'),
            onClick: handleCompleteShare,
          },
        ].map((item, i) => (
          <Box key={i} className={classes.panelRow} onClick={item.onClick}>
            <Box className={classes.panelRowIcon} sx={{ bgcolor: item.bg }}>
              <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography className={classes.panelRowTitle}>{item.title}</Typography>
              <Typography className={classes.panelRowSub}>{item.sub}</Typography>
            </Box>
            <Box sx={{ color: 'text.disabled', fontSize: 20 }}>›</Box>
          </Box>
        ))}
        <Typography
          sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, mt: 2, mb: 1 }}
        >
          {tt('positionTitle', 'Position')}
        </Typography>
        <Box className={classes.panelRow} onClick={openGoogleMaps}>
          <Box
            className={classes.panelRowIcon}
            sx={{ bgcolor: alpha(theme.palette.warning.main, 0.15) }}
          >
            <MyLocation sx={{ color: theme.palette.warning.main }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography className={classes.panelRowTitle}>
              {tt('linkGoogleMaps', 'Google Maps')}
            </Typography>
            <Typography className={classes.panelRowSub}>
              {lat
                ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}`
                : tt('sharedUnavailable', 'Unavailable')}
            </Typography>
          </Box>
          <Box sx={{ color: 'text.disabled', fontSize: 20 }}>›</Box>
        </Box>
        <Box className={classes.panelRow} onClick={openWaze}>
          <Box
            className={classes.panelRowIcon}
            sx={{ bgcolor: alpha(theme.palette.success.main, 0.15) }}
          >
            <FmdGoodOutlined sx={{ color: theme.palette.success.main }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography className={classes.panelRowTitle}>Waze</Typography>
            <Typography className={classes.panelRowSub}>
              {tt('sharedNavigateWith', 'Navigate with Waze')}
            </Typography>
          </Box>
          <Box sx={{ color: 'text.disabled', fontSize: 20 }}>›</Box>
        </Box>
      </Box>
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          sx={{
            borderRadius: 2,
            minWidth: theme.spacing(40),
            maxWidth: theme.spacing(40),
            '& .MuiAlert-message': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Panel: Alerts ────────────────────────────────────────────────────────────

const AlertsPanel = ({ vehicle, classes, onClose }) => {
  const theme = useTheme();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const [notifications, setNotifications] = useState([]);
  const [linkedIds, setLinkedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!vehicle?.id) {
      setNotifications([]);
      setLinkedIds(new Set());
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch('/api/notifications')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch(`/api/notifications?deviceId=${vehicle.id}`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ])
      .then(([all, linked]) => {
        if (cancelled) return;
        setNotifications(Array.isArray(all) ? all : []);
        setLinkedIds(new Set((Array.isArray(linked) ? linked : []).map((n) => n.id)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle?.id]);

  const alertMetaMap = useMemo(() => buildAlertMeta(theme), [theme]);

  const alerts = useMemo(
    () =>
      notifications.map((n) => {
        const meta = alertMetaMap[n.type] || defaultAlertMeta(theme);
        const key = prefixString('event', n.type);
        let label;
        try {
          const translated = t(key);
          label = translated && translated !== key ? translated : humanizeType(n.type);
        } catch {
          label = humanizeType(n.type);
        }
        return { id: n.id, type: n.type, always: n.always, label, ...meta };
      }),
    [notifications, t, alertMetaMap, theme],
  );

  const toggle = async (notif) => {
    if (busyId || !vehicle?.id || notif.always) return;
    const isLinked = linkedIds.has(notif.id);
    setBusyId(notif.id);
    try {
      const res = await fetch('/api/permissions', {
        method: isLinked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: vehicle.id, notificationId: notif.id }),
      });
      if (res.ok) {
        setLinkedIds((prev) => {
          const next = new Set(prev);
          if (isLinked) next.delete(notif.id);
          else next.add(notif.id);
          return next;
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>
            {tt('notificationTitle', 'Notifications')}
          </Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
              {tt('sharedNoData', 'No data')}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.5 }}>
              {tt('notificationTitle', 'Notifications')}
            </Typography>
          </Box>
        ) : (
          alerts.map((item) => {
            const checked = item.always || linkedIds.has(item.id);
            return (
              <Box key={item.id} className={classes.panelRow} sx={{ cursor: 'default' }}>
                <Box className={classes.panelRowIcon} sx={{ bgcolor: item.bg }}>
                  <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography className={classes.panelRowTitle}>{item.label}</Typography>
                  {item.always && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                      {tt('groupAllDevices', 'All devices')}
                    </Typography>
                  )}
                </Box>
                <Switch
                  size="small"
                  checked={checked}
                  disabled={busyId === item.id || item.always}
                  onChange={() => toggle(item)}
                  sx={{
                    '& .Mui-checked': { color: theme.palette.primary.main },
                    '& .Mui-checked + .MuiSwitch-track': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.4),
                    },
                  }}
                />
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

// ─── Panel: Geofence ─────────────────────────────────────────────────────────

const GeofencePanel = ({ vehicle, classes, onClose, onSaved }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const [radius, setRadius] = useState(0.5);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const lat = vehicle?.position?.latitude ?? 32.2356;
  const lng = vehicle?.position?.longitude ?? -7.9563;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const wkt = `CIRCLE (${lng.toFixed(6)} ${lat.toFixed(6)}, ${Math.round(radius * 1000)})`;
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, area: wkt, calendarId: 0 }),
      });
      if (res.ok) {
        onSaved?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const darkInput = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
      '& fieldset': { borderColor: theme.palette.divider },
      '&:hover fieldset': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
      },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& input::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>{tt('geofenceTitle', 'Geofences')}</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Box
          sx={{
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            borderRadius: 2,
            p: 1.5,
            mb: 2.5,
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'info.main', mb: 0.5 }}>
            {tt('sharedCreate', 'Create')} {tt('geofenceTitle', 'Geofence')}
          </Typography>
          <Typography sx={{ fontSize: '0.77rem', color: 'info.light', lineHeight: 1.6 }}>
            {tt('mapCurrentLocation', 'Current Location')}
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
          component="div"
        >
          {tt('sharedName', 'Name')}{' '}
          <Typography component="span" sx={{ color: 'error.main' }}>
            *
          </Typography>
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder={tt('sharedName', 'Name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2.5, ...darkInput }}
        />
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
        >
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary' }}>
            {tt('sharedRadius', 'Radius')}
          </Typography>
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: 1,
              px: 1.5,
              py: 0.25,
              fontSize: '0.77rem',
              fontWeight: 700,
            }}
          >
            {Math.round(radius * 1000)} m
          </Box>
        </Box>
        <Slider
          value={radius}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(_, v) => setRadius(v)}
          sx={{ color: 'primary.main', mb: 2.5 }}
        />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', mb: 1 }}>
          📍 {tt('mapCurrentLocation', 'Current Location')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>Lat:</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>
            {lat.toFixed(5)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>Lng:</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>
            {lng.toFixed(5)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            disabled={!name.trim() || saving}
            onClick={handleSave}
            sx={{
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {saving ? '...' : `✓ ${tt('sharedSave', 'Save')}`}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: theme.palette.divider,
              color: 'text.secondary',
              '&:hover': {
                borderColor: theme.palette.divider,
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            {tt('sharedCancel', 'Cancel')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Panel: Map Settings ──────────────────────────────────────────────────────

const MapSettingsPanel = ({ classes, onClose }) => {
  const theme = useTheme();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const mapStyles = useMapStyles();
  const [mapType, setMapType] = usePersistedState('mapType', 'hybrid');
  const [autoRefresh, setAutoRefresh] = usePersistedState('autoRefresh', true);
  const [lockCamera, setLockCamera] = usePersistedState('lockCamera', false);
  const [smoothMovement, setSmoothMovement] = usePersistedState('smoothMovement', false);
  const [interval_, setInterval_] = usePersistedState('refreshInterval', '10');

  const MAP_TYPES = [
    { key: 'hybrid', label: tt('mapGoogleHybrid', 'Hybrid'), emoji: '🌍' },
    { key: 'satellite', label: tt('mapGoogleSatellite', 'Satellite'), emoji: '🛰️' },
    { key: 'roadmap', label: tt('mapGoogleRoad', 'Road Map'), emoji: '🗺️' },
    { key: 'terrain', label: tt('mapOpenTopoMap', 'Terrain'), emoji: '⛰️' },
  ];

  const selectStyleForType = (type) => {
    const available = mapStyles.filter((s) => s.available);
    const pick = (ids) => ids.find((id) => available.some((s) => s.id === id));
    switch (type) {
      case 'roadmap':
        return pick([
          'googleRoad',
          'locationIqStreets',
          'openFreeMap',
          'osm',
          'carto',
          'mapboxStreets',
        ]);
      case 'satellite':
        return pick(['googleSatellite', 'bingAerial', 'hereSatellite', 'mapboxSatellite']);
      case 'terrain':
        return pick(['openTopoMap', 'mapboxOutdoors', 'terrain']);
      case 'hybrid':
      default:
        return pick([
          'googleHybrid',
          'mapTilerHybrid',
          'bingHybrid',
          'hereHybrid',
          'mapboxSatellite',
        ]);
    }
  };

  const applyMapType = (type) => {
    setMapType(type);
    const styleId = selectStyleForType(type);
    if (!styleId) return;
    const style = mapStyles.find((s) => s.id === styleId)?.style;
    savePersistedState('selectedMapStyle', styleId);
    if (style) {
      map.setStyle(style, { diff: false });
    }
  };

  const Setting = ({ label, sub, checked, onChange }) => (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}
      >
        <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: 'text.primary' }}>
          {label}
        </Typography>
        <Switch
          size="small"
          checked={checked}
          onChange={onChange}
          sx={{
            '& .Mui-checked': { color: theme.palette.primary.main },
            '& .Mui-checked + .MuiSwitch-track': {
              backgroundColor: alpha(theme.palette.primary.main, 0.4),
            },
          }}
        />
      </Box>
      {sub && (
        <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary', pb: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Typography className={classes.panelTitle}>{tt('sharedSettings', 'Settings')}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1.5 }}>
          {tt('mapLayer', 'Map Layer')}
        </Typography>
        <Box className={classes.mapTypeGrid}>
          {MAP_TYPES.map((t) => (
            <Box
              key={t.key}
              className={classes.mapTypeBtn}
              onClick={() => applyMapType(t.key)}
              sx={
                mapType === t.key
                  ? {
                      border: `1.5px solid ${theme.palette.primary.main} !important`,
                      backgroundColor: `${alpha(theme.palette.primary.main, 0.15)} !important`,
                      color: `${theme.palette.primary.light} !important`,
                    }
                  : {}
              }
            >
              <Box component="span" sx={{ fontSize: theme.typography.h6.fontSize, lineHeight: 1 }}>
                {t.emoji}
              </Box>
              {t.label}
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2, borderColor: 'divider' }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>
          {tt('sharedRefresh', 'Refresh')}
        </Typography>
        <Setting
          label={tt('sharedEnable', 'Enable')}
          checked={autoRefresh}
          onChange={() => setAutoRefresh(!autoRefresh)}
        />
        {autoRefresh && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', mb: 1 }}>
              {tt('sharedInterval', 'Interval')} ({tt('sharedSecond', 'seconds')})
            </Typography>
            <Select
              fullWidth
              size="small"
              value={interval_}
              onChange={(e) => setInterval_(e.target.value)}
              sx={{
                borderRadius: 2,
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
              }}
            >
              {['5', '10', '30', '60'].map((v) => (
                <MenuItem key={v} value={v}>
                  {v} {tt('sharedSecond', 'seconds')}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}
        <Divider sx={{ my: 2, borderColor: 'divider' }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>
          {tt('deviceFollow', 'Follow')}
        </Typography>
        <Setting
          label={tt('mapDirection', 'Show Direction')}
          checked={lockCamera}
          onChange={() => setLockCamera(!lockCamera)}
        />
        <Divider sx={{ my: 2, borderColor: 'divider' }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>
          {tt('positionTitle', 'Position')}
        </Typography>
        <Setting
          label={tt('sharedSmooth', 'Smooth transitions')}
          checked={smoothMovement}
          onChange={() => setSmoothMovement(!smoothMovement)}
        />
      </Box>
    </Box>
  );
};

// ─── Panel: Commands ─────────────────────────────────────────────────────────

const CommandsPanel = ({ vehicle, classes, onClose }) => {
  const theme = useTheme();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicle?.id) {
      setSaved([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setSelected(null);
    fetch(`/api/commands?deviceId=${vehicle.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setSaved(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle?.id]);

  const commandMetaMap = useMemo(() => buildCommandMeta(theme), [theme]);

  const COMMANDS = useMemo(
    () =>
      saved.map((it) => {
        const meta = commandMetaMap[it.type] || defaultCommandMeta(theme);
        let label = it.description;
        if (!label) {
          const key = prefixString('command', it.type);
          try {
            const translated = t(key);
            label =
              translated && translated !== key ? translated : meta.label || humanizeType(it.type);
          } catch {
            label = meta.label || humanizeType(it.type);
          }
        }
        return { id: it.id, type: it.type, label, icon: meta.icon, bg: meta.bg, color: meta.color };
      }),
    [saved, t, commandMetaMap, theme],
  );

  const sendCommand = async () => {
    if (!selected || !vehicle?.id) return;
    setSending(true);
    try {
      const cmdRes = await fetch(`/api/commands/${selected}`);
      if (!cmdRes.ok) throw new Error('fetch');
      const command = await cmdRes.json();
      command.deviceId = vehicle.id;
      const res = await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      if (res.ok) {
        setSnack({ open: true, msg: tt('commandSent', 'Command sent'), severity: 'success' });
        setSelected(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setSnack({
          open: true,
          msg: err.message || tt('sharedError', 'Failed to send command'),
          severity: 'error',
        });
      }
    } catch {
      setSnack({ open: true, msg: tt('serverError', 'Network error'), severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>{tt('commandTitle', 'Command')}</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={24} sx={{ color: 'primary.main' }} />
          </Box>
        ) : COMMANDS.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
              {tt('sharedNoData', 'No data')}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.5 }}>
              {tt('commandTitle', 'Command')}
            </Typography>
          </Box>
        ) : (
          <Box className={classes.commandGrid}>
            {COMMANDS.map((cmd) => (
              <Box
                key={cmd.id}
                className={classes.commandBtn}
                onClick={() => setSelected(cmd.id)}
                sx={
                  selected === cmd.id
                    ? {
                        borderColor: `${theme.palette.primary.main} !important`,
                        backgroundColor: `${alpha(theme.palette.primary.main, 0.15)} !important`,
                      }
                    : {}
                }
              >
                <Box className={classes.commandIcon} sx={{ bgcolor: cmd.bg }}>
                  <Box sx={{ color: cmd.color, display: 'flex' }}>{cmd.icon}</Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    textAlign: 'center',
                  }}
                >
                  {cmd.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          disabled={!selected || sending}
          onClick={sendCommand}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          {sending ? `${tt('sharedSending', 'Sending')}...` : tt('commandSend', 'Send')}
        </Button>
      </Box>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MainPageV2 = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const isDark = theme.palette.mode === 'dark';
  const mobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchValue, setSearchValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(mobile);
  const [activePanel, setActivePanel] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [followDeviceId, setFollowDeviceId] = useState(null);
  const [mobileSearchValue, setMobileSearchValue] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // eslint-disable-next-line no-unused-vars -- persisted filter for cross-view compatibility
  const [_persistedFilter] = usePersistedState('filter', { statuses: [], groups: [] });
  const [filterSort] = usePersistedState('filterSort', '');
  const [filterMap] = usePersistedState('filterMap', false);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const devices = useSelector((state) => state.devices.items);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const distanceUnit = useAttributePreference('distanceUnit', 'km');

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingData(true);
      try {
        const [devRes, posRes] = await Promise.all([
          fetch('/api/devices'),
          fetch('/api/positions'),
        ]);
        if (devRes.ok) dispatch(devicesActions.refresh(await devRes.json()));
        if (posRes.ok) {
          const posData = await posRes.json();
          if (posData?.length > 0) dispatch(sessionActions.updatePositions(posData));
        }
      } catch {
        // silently swallow fetch errors; UI retains stale data
      } finally {
        setLoadingData(false);
      }
    },
    [dispatch],
  );

  useEffectAsync(async () => {
    await fetchData();
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, []);

  const derivedFilter = useMemo(() => {
    if (activeFilter === 'moving') return { statuses: ['online'], groups: [] };
    if (activeFilter === 'parked') return { statuses: ['offline'], groups: [] };
    return { statuses: [], groups: [] };
  }, [activeFilter]);

  useFilter(
    searchValue,
    derivedFilter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions,
  );

  const vehicles = useMemo(
    () =>
      filteredDevices.map((device) => {
        const position = positions[device.id];
        const speed =
          position?.speed != null ? Math.round(speedFromKnots(position.speed, speedUnit)) : 0;
        const isMoving = speed > 0;
        const status =
          device.status === 'online'
            ? isMoving
              ? tt('positionMoving', 'Moving')
              : tt('reportParking', 'Parked')
            : tt('deviceStatusOffline', 'Offline');
        const statusColor =
          device.status === 'online'
            ? isMoving
              ? theme.palette.success.main
              : theme.palette.info.main
            : theme.palette.text.secondary;
        const timeAgo = device.lastUpdate ? dayjs(device.lastUpdate).fromNow(true) : '—';
        const odometerMeters =
          position?.attributes?.odometer ?? position?.attributes?.totalDistance ?? 0;
        const distanceMeters = position?.attributes?.totalDistance ?? 0;
        const odometer = distanceFromMeters(odometerMeters, distanceUnit);
        const fuel = position?.attributes?.fuel ?? position?.attributes?.volume ?? null;
        const rawFuelLevel = position?.attributes?.fuelLevel;
        const fuelLevel = Number.isFinite(Number(rawFuelLevel)) ? Number(rawFuelLevel) : null;
        const rawFuelCapacity = device.attributes?.fuelCapacity;
        const fuelCapacity = Number.isFinite(Number(rawFuelCapacity))
          ? Number(rawFuelCapacity)
          : null;
        const fuelPercentage =
          fuelLevel != null
            ? Math.min(100, Math.max(0, Math.round(fuelLevel)))
            : fuel != null && fuelCapacity != null && fuelCapacity > 0
              ? Math.min(100, Math.max(0, Math.round((fuel / fuelCapacity) * 100)))
              : null;
        const distance = parseFloat(distanceFromMeters(distanceMeters, distanceUnit).toFixed(1));
        // Some devices do not report live fuel consumption; avoid forcing 0.
        const consumption =
          position?.attributes?.fuelConsumption ?? position?.attributes?.fuelUsed ?? null;
        return {
          id: device.id.toString(),
          name: device.name || device.uniqueId || `${tt('deviceTitle', 'Device')} ${device.id}`,
          status,
          statusColor,
          timeAgo,
          speed,
          odometer,
          odometerMeters,
          distanceMeters,
          consumption,
          distance,
          fuel: fuel != null ? parseFloat(fuel.toFixed(1)) : null,
          fuelPercentage,
          type: device.category || 'Vehicle',
          device,
          position,
        };
      }),
    [filteredDevices, positions, speedUnit, distanceUnit, theme, tt],
  );

  const displayedVehicles = useMemo(() => {
    let v = vehicles;
    if (activeFilter === 'moving') v = v.filter((x) => x.speed > 0);
    if (activeFilter === 'parked')
      v = v.filter((x) => x.speed === 0 && x.device.status === 'online');
    if (activeFilter === 'stopped') v = v.filter((x) => x.device.status === 'offline');
    if (activeFilter === 'alert') v = v.filter((x) => x.position?.attributes?.alarm);
    return v;
  }, [vehicles, activeFilter]);

  const totalCount = Object.keys(devices).length;
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedDeviceId?.toString()) || null,
    [vehicles, selectedDeviceId],
  );
  const togglePanel = (key) => setActivePanel((p) => (p === key ? null : key));
  const focusVehicleOnMap = useCallback(
    (v) => {
      dispatch(devicesActions.selectId(parseInt(v.id, 10)));
      if (v?.position?.latitude != null && v?.position?.longitude != null) {
        map?.easeTo?.({
          center: [v.position.longitude, v.position.latitude],
          duration: 260,
        });
      }
      if (mobile) setSidebarCollapsed(true);
    },
    [dispatch, mobile],
  );
  const startFollowVehicle = useCallback(
    (v) => {
      setFollowDeviceId(v.id);
      focusVehicleOnMap(v);
    },
    [focusVehicleOnMap],
  );

  useEffect(() => {
    if (!followDeviceId) return;
    const followed = vehicles.find((v) => v.id === followDeviceId);
    if (!followed?.position?.latitude || !followed?.position?.longitude) return;
    map?.easeTo?.({
      center: [followed.position.longitude, followed.position.latitude],
      duration: 450,
    });
  }, [followDeviceId, vehicles]);

  const zoomMap = useCallback((delta) => {
    if (!map?.getZoom) return;
    const nextZoom = map.getZoom() + delta;
    map.easeTo({ zoom: nextZoom, duration: 180 });
  }, []);

  const centerOnCurrentLocation = useCallback(() => {
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state === 'denied') setLocationBlocked(true);
        })
        .catch(() => {});
    }

    const geolocateBtn = map?.getContainer?.()?.querySelector?.('.maplibregl-ctrl-geolocate');
    if (geolocateBtn && !geolocateBtn.disabled) {
      geolocateBtn.click();
      return;
    }

    if (
      selectedVehicle?.position?.latitude != null &&
      selectedVehicle?.position?.longitude != null
    ) {
      map?.easeTo?.({
        center: [selectedVehicle.position.longitude, selectedVehicle.position.latitude],
        duration: 260,
      });
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationBlocked(false);
        map?.easeTo?.({
          center: [pos.coords.longitude, pos.coords.latitude],
          duration: 260,
        });
      },
      (error) => {
        if (error?.code === 1) {
          setLocationBlocked(true);
        }
      },
    );
  }, [selectedVehicle]);

  const rightToolbarItems = useMemo(
    () => [
      {
        key: 'refresh',
        Icon: Refresh,
        title: tt('sharedRefresh', 'Refresh'),
        onClick: () => fetchData(),
      },
      null,
      {
        key: 'share',
        Icon: Share,
        title: tt('deviceShare', 'Share Device'),
        onClick: () => togglePanel('share'),
        disabled: !selectedVehicle,
      },
      {
        key: 'geofence',
        Icon: FmdGoodOutlined,
        title: tt('geofenceTitle', 'Geofence'),
        onClick: () => togglePanel('geofence'),
        disabled: !selectedVehicle,
      },
      {
        key: 'settings',
        Icon: MapOutlined,
        title: tt('mapTitle', 'Map'),
        onClick: () => togglePanel('settings'),
      },
      {
        key: 'commands',
        Icon: SettingsRemoteOutlined,
        title: tt('commandTitle', 'Command'),
        onClick: () => togglePanel('commands'),
        disabled: !selectedVehicle,
      },
      {
        key: 'alerts',
        Icon: NotificationsOutlined,
        title: tt('notificationTitle', 'Notifications'),
        onClick: () => togglePanel('alerts'),
        disabled: !selectedVehicle,
      },
      null,
      { key: 'zoomIn', Icon: ZoomIn, title: 'Zoom +', onClick: () => zoomMap(1) },
      { key: 'zoomOut', Icon: ZoomOut, title: 'Zoom −', onClick: () => zoomMap(-1) },
      {
        key: 'locate',
        Icon: MyLocationOutlined,
        title: 'Ma position',
        onClick: centerOnCurrentLocation,
      },
      {
        key: 'history',
        Icon: HistoryOutlined,
        title: tt('reportTitle', 'Reports'),
        onClick: () => selectedVehicle && navigate(`/replay-new?deviceId=${selectedVehicle.id}`),
        disabled: !selectedVehicle,
      },
    ],
    [fetchData, selectedVehicle, navigate, centerOnCurrentLocation, zoomMap],
  );

  const handleToolbarClick = (item) => {
    if (item.disabled) return;
    item.onClick?.();
  };
  const selectedPosition = filteredPositions.find(
    (p) => selectedDeviceId && p.deviceId === selectedDeviceId,
  );
  const onEventsClick = useCallback(() => {}, []);
  const mobileSearchResults = useMemo(() => {
    const q = mobileSearchValue.trim().toLowerCase();
    const base = q ? vehicles.filter((v) => v.name.toLowerCase().includes(q)) : vehicles;
    return base.slice(0, 8);
  }, [mobileSearchValue, vehicles]);

  useEffect(() => {
    if (mobile) {
      // On mobile, prioritize map visibility by default.
      setSidebarCollapsed(true);
    }
  }, [mobile]);

  return (
    <PageLayout>
      <Box className={classes.mainContainer}>
        <Box className={classes.mapContainer}>
          <MainMap
            filteredPositions={filteredPositions}
            selectedPosition={selectedPosition}
            onEventsClick={onEventsClick}
          />
          {selectedVehicle && (
            <StatusCardV2
              vehicle={selectedVehicle}
              batteryVoltage={
                selectedVehicle.position?.attributes?.battery ||
                selectedVehicle.position?.attributes?.power ||
                '12.0'
              }
              currentTime={selectedVehicle.position?.fixTime || new Date().toISOString()}
              signalStrength={selectedVehicle.position?.attributes?.rssi || 3}
              temperature={selectedVehicle.position?.attributes?.coolantTemp || 0}
              onClose={() => dispatch(devicesActions.selectId(null))}
              onOdometerClick={() => {}}
              onIconClick={(iconType) => {
                if (iconType === 'share') togglePanel('share');
                else if (iconType === 'alerts') togglePanel('alerts');
                else if (iconType === 'commands') togglePanel('commands');
              }}
            />
          )}
        </Box>

        {!sidebarCollapsed && (
          <Box className={classes.sidebar}>
            <MainToolbar
              fleetName={tt('groupTitle', 'Fleet')}
              deviceCount={totalCount}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              activeFilter={activeFilter}
              onFilterClick={setActiveFilter}
              onToggleCollapse={() => setSidebarCollapsed(true)}
            />
            <Box className={classes.vehicleList}>
              {loadingData && displayedVehicles.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                  <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                </Box>
              ) : displayedVehicles.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 6 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                    {tt('sharedNoData', 'No data')}
                  </Typography>
                </Box>
              ) : (
                displayedVehicles.map((vehicle) => (
                  <DeviceRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedDeviceId?.toString() === vehicle.id}
                    isFollowing={followDeviceId === vehicle.id}
                    onSelect={() => {
                      setFollowDeviceId(null);
                      dispatch(devicesActions.selectId(parseInt(vehicle.id, 10)));
                    }}
                    onCenter={(v) => {
                      setFollowDeviceId(null);
                      focusVehicleOnMap(v);
                    }}
                    onHistory={(v) => {
                      window.location.href = `/replay-new?deviceId=${v.id}`;
                    }}
                    onFollow={(v) => {
                      if (followDeviceId === v.id) {
                        setFollowDeviceId(null);
                      } else {
                        startFollowVehicle(v);
                      }
                    }}
                  />
                ))
              )}
            </Box>
          </Box>
        )}

        {sidebarCollapsed && !mobile && (
          <Tooltip title={tt('deviceTitle', 'Devices')} placement="right">
            <Fab
              className={classes.expandFab}
              onClick={() => setSidebarCollapsed(false)}
              disableRipple
            >
              <ChevronRight fontSize="small" />
            </Fab>
          </Tooltip>
        )}
        {sidebarCollapsed && mobile && (
          <Box className={classes.mobileSearchDock}>
            <TextField
              fullWidth
              size="small"
              placeholder={tt('sharedSearch', 'Search')}
              value={mobileSearchValue}
              onFocus={() => setMobileSearchOpen(true)}
              onBlur={() => setTimeout(() => setMobileSearchOpen(false), 120)}
              onChange={(e) => {
                setMobileSearchValue(e.target.value);
                setMobileSearchOpen(true);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <DirectionsCar sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: theme.spacing(1.375),
                    backgroundColor: isDark
                      ? alpha(theme.palette.background.default, 0.88)
                      : alpha(theme.palette.common.white, 0.9),
                    border: `1px solid ${theme.palette.divider}`,
                  },
                },
              }}
            />
            {mobileSearchOpen && (
              <Box className={classes.mobileSearchResults}>
                {mobileSearchResults.length === 0 ? (
                  <Typography
                    sx={{ px: 1.5, py: 1.2, fontSize: '0.8rem', color: 'text.secondary' }}
                  >
                    {tt('sharedNoData', 'No data')}
                  </Typography>
                ) : (
                  mobileSearchResults.map((v) => (
                    <Box
                      key={v.id}
                      className={classes.mobileSearchItem}
                      onMouseDown={() => {
                        focusVehicleOnMap(v);
                        setMobileSearchValue(v.name);
                        setMobileSearchOpen(false);
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: '0.84rem', fontWeight: 700, color: 'text.primary' }}
                          noWrap
                        >
                          {v.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }} noWrap>
                          {v.status} · {v.speed || 0} {speedUnitString(speedUnit, t)}
                        </Typography>
                      </Box>
                      <ChevronRight sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                    </Box>
                  ))
                )}
              </Box>
            )}
          </Box>
        )}

        {!activePanel && (
          <Box className={classes.rightToolbar}>
            {rightToolbarItems.map((item, i) => {
              if (item === null) return <Box key={`div-${i}`} className={classes.toolbarDivider} />;
              const { key, Icon, title, disabled } = item;
              const isActive = activePanel === key;
              const isLocateBlocked = key === 'locate' && locationBlocked;
              return (
                <Tooltip key={key} title={title} placement="left">
                  <span>
                    <IconButton
                      size="small"
                      disabled={disabled}
                      className={`${classes.toolbarBtn} ${isActive ? classes.toolbarBtnActive : ''} ${isLocateBlocked ? classes.toolbarBtnBlocked : ''}`}
                      onClick={() => handleToolbarClick(item)}
                    >
                      <Icon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              );
            })}
          </Box>
        )}

        {activePanel === 'share' && (
          <SharePanel
            vehicle={selectedVehicle}
            classes={classes}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === 'alerts' && (
          <AlertsPanel
            vehicle={selectedVehicle}
            classes={classes}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === 'geofence' && (
          <GeofencePanel
            vehicle={selectedVehicle}
            classes={classes}
            onClose={() => setActivePanel(null)}
            onSaved={() => {}}
          />
        )}
        {activePanel === 'settings' && (
          <MapSettingsPanel classes={classes} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'commands' && (
          <CommandsPanel
            vehicle={selectedVehicle}
            classes={classes}
            onClose={() => setActivePanel(null)}
          />
        )}
      </Box>
    </PageLayout>
  );
};

export default MainPageV2;
