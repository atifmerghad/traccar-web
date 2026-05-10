import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Drawer, Box, Typography, IconButton, Divider, Stack, Chip } from '@mui/material';
import {
  DeleteOutline,
  NotificationsActiveOutlined,
  WarningAmberOutlined,
  Close,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { formatTime } from '../../common/util/formatter';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { eventsActions } from '../../store';

const useStyles = makeStyles({ name: 'EventsDrawerV2' })((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    paper: {
      width: theme.spacing(45),
      maxWidth: '92vw',
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.98)
        : theme.palette.background.paper,
      borderLeft: `1px solid ${theme.palette.divider}`,
      // On mobile the bottom nav is fixed at ~72px + safe-area-inset-bottom.
      // Clip the drawer so its content never slides behind the nav bar.
      [theme.breakpoints.down('md')]: {
        height: `calc(100% - ${theme.spacing(9)} - env(safe-area-inset-bottom, 0px))`,
      },
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing(1.75, 1.75, 1.25),
      position: 'sticky',
      top: 0,
      zIndex: 2,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.98)
        : theme.palette.background.paper,
    },
    titleWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      minWidth: 0,
    },
    title: {
      fontWeight: 700,
      fontSize: theme.typography.pxToRem(15.4),
      color: theme.palette.text.primary,
    },
    content: {
      padding: theme.spacing(1.25),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      overflowY: 'auto',
      height: `calc(100% - ${theme.spacing(7)})`,
      paddingBottom: theme.spacing(2),
    },
    item: {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.25),
      padding: theme.spacing(1.5),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.03)
        : theme.palette.action.hover,
      cursor: 'pointer',
      transition: theme.transitions.create(['border-color', 'background-color'], { duration: 150 }),
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: isDark
          ? alpha(theme.palette.primary.main, 0.12)
          : alpha(theme.palette.primary.main, 0.08),
      },
    },
    topRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(1),
    },
    deviceName: {
      fontSize: theme.typography.pxToRem(13.4),
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    eventType: {
      marginTop: theme.spacing(0.5),
      fontSize: theme.typography.pxToRem(12.8),
      color: theme.palette.text.secondary,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    eventTime: {
      marginTop: theme.spacing(0.75),
      fontSize: theme.typography.pxToRem(11.5),
      color: theme.palette.text.disabled,
    },
    emptyWrap: {
      marginTop: theme.spacing(2.5),
      border: `1px dashed ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.5),
      padding: theme.spacing(2.75, 1.5),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  };
});

const labelFromEvent = (event, t) => {
  if (event?.type === 'alarm') {
    const alarm = event?.attributes?.alarm;
    if (alarm) return `${t('eventAlarm')}: ${alarm}`;
    return t('eventAlarm');
  }
  if (!event?.type) return t('sharedNoData');
  const key = `event${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`;
  const translated = t(key);
  return translated && translated !== key ? translated : event.type;
};

const EventsDrawerV2 = ({ open, onClose }) => {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const events = useSelector((state) => state.events.items);
  const devices = useSelector((state) => state.devices.items);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.eventTime || 0) - new Date(a.eventTime || 0)),
    [events],
  );

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ className: classes.paper }}>
      <Box className={classes.header}>
        <Box className={classes.titleWrap}>
          <NotificationsActiveOutlined fontSize="small" />
          <Typography className={classes.title}>{t('reportEvents')}</Typography>
          <Chip size="small" label={sortedEvents.length} />
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => dispatch(eventsActions.deleteAll())}>
            <DeleteOutline fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Divider />
      <Box className={classes.content}>
        {sortedEvents.length === 0 ? (
          <Box className={classes.emptyWrap}>
            <WarningAmberOutlined sx={{ fontSize: (th) => th.typography.pxToRem(18), mb: 0.5 }} />
            <Typography sx={{ fontSize: (th) => th.typography.pxToRem(13.4) }}>
              {t('sharedNoData')}
            </Typography>
          </Box>
        ) : (
          sortedEvents.map((event) => {
            const deviceName =
              devices[event.deviceId]?.name ||
              devices[event.deviceId]?.uniqueId ||
              `#${event.deviceId || '—'}`;
            const eventLabel = labelFromEvent(event, t);
            return (
              <Box
                key={event.id || `${event.deviceId}-${event.eventTime}`}
                className={classes.item}
                onClick={() => {
                  if (event.id) navigate(`/event/${event.id}`);
                }}
              >
                <Box className={classes.topRow}>
                  <Typography className={classes.deviceName}>{deviceName}</Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(
                        eventsActions.delete({
                          id: event.id ?? null,
                          deviceId: event.deviceId,
                          type: event.type,
                          eventTime: event.eventTime,
                        }),
                      );
                    }}
                  >
                    <DeleteOutline fontSize="inherit" />
                  </IconButton>
                </Box>
                <Typography className={classes.eventType}>{eventLabel}</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography className={classes.eventTime}>
                    {formatTime(event.eventTime, 'seconds') || t('sharedNoData')}
                  </Typography>
                </Stack>
              </Box>
            );
          })
        )}
      </Box>
    </Drawer>
  );
};

export default EventsDrawerV2;
