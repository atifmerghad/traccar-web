import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Divider,
  Chip,
  TextField,
} from '@mui/material';
import MapView from '../map/core/MapView';
import MapPositions from '../map/MapPositions';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import {
  PlayArrow,
  Pause,
  FastForward,
  FastRewind,
  LocalParking,
  DirectionsCar,
  LocalGasStation,
  Stop,
  LocationOn,
  Close,
  ArrowBack,
  Info,
  Fullscreen,
  CalendarToday,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { formatTime } from '../common/util/formatter';
import { speedFromKnots } from '../common/util/converter';
import { useAttributePreference } from '../common/util/preferences';
import PageLayout from './PageLayout';
import { useSelector } from 'react-redux';
import { useCatch } from '../reactHelper';
import ReportFilter from '../reports/components/ReportFilter';

dayjs.locale('fr');

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  sidebar: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 400,
    height: 'calc(100vh - 16px)',
    maxHeight: 'calc(100vh - 16px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    zIndex: 1001,
    boxShadow: theme.shadows[8],
  },
  header: {
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  headerIcons: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  dateRangeBar: {
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  mapContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    borderBottom: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  dateRangeInput: {
    flex: 1,
    '& .MuiInputBase-root': {
      fontSize: '0.875rem',
      height: 'auto',
      padding: theme.spacing(0.5, 1),
      backgroundColor: 'transparent',
    },
    '& .MuiInputBase-input': {
      padding: 0,
      fontSize: '0.875rem',
      color: theme.palette.text.primary,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette.divider}`,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette.primary.main}`,
      borderWidth: '1px',
    },
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
  },
  reportTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.text.primary,
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1.5),
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 70,
  },
  summaryValue: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    lineHeight: 1.2,
  },
  summaryLabel: {
    fontSize: '0.7rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.25),
  },
  filterButtons: {
    display: 'flex',
    gap: theme.spacing(0.75),
    marginBottom: theme.spacing(1.5),
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterButton: {
    minWidth: 36,
    height: 36,
    padding: 0,
    borderRadius: theme.spacing(0.5),
    '&.parking': {
      backgroundColor: theme.palette.info.light,
      color: theme.palette.info.contrastText || theme.palette.common.white,
    },
    '&.route': {
      backgroundColor: theme.palette.info.light,
      color: theme.palette.info.contrastText || theme.palette.common.white,
    },
    '&.fuel': {
      backgroundColor: theme.palette.warning.light,
      color: theme.palette.warning.contrastText || theme.palette.common.white,
    },
    '&.stop': {
      backgroundColor: theme.palette.error.light,
      color: theme.palette.error.contrastText || theme.palette.common.white,
    },
    '&.location': {
      backgroundColor: theme.palette.success.light,
      color: theme.palette.success.contrastText || theme.palette.common.white,
    },
  },
  placesChip: {
    fontSize: '0.75rem',
    height: 24,
  },
  eventSection: {
    marginBottom: theme.spacing(2),
  },
  eventSectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  eventItem: {
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    borderRadius: theme.spacing(0.5),
    backgroundColor: theme.palette.grey[50],
    border: `1px solid ${theme.palette.divider}`,
    position: 'relative',
  },
  eventItemMovement: {
    borderLeft: `3px solid ${theme.palette.success.main}`,
  },
  eventItemParking: {
    borderLeft: `3px solid ${theme.palette.info.main}`,
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(0.75),
  },
  eventDuration: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  eventTime: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  eventDetails: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  eventLocation: {
    fontSize: '0.7rem',
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    marginTop: theme.spacing(0.75),
    wordBreak: 'break-word',
    lineHeight: 1.4,
  },
  locationHighlight: {
    backgroundColor: theme.palette.success.light,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.25),
    marginBottom: theme.spacing(1),
  },
  controls: {
    padding: theme.spacing(1.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.grey[50],
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
  playbackButtons: {
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
  },
  dateRange: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  speedDisplay: {
    fontSize: '0.875rem',
    fontWeight: 600,
    backgroundColor: theme.palette.grey[900],
    color: '#ffeb3b',
    padding: theme.spacing(0.25, 1),
    borderRadius: theme.spacing(0.25),
  },
  progressInfo: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
  mainMap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    zIndex: 1000,
  },
  bottomBarControls: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  bottomBarInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flex: 1,
    justifyContent: 'space-between',
  },
}));

const ReplayPageNew = () => {
  const { classes } = useStyles();
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);
  
  const [positions, setPositions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [playing, setPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [dateRange, setDateRange] = useState(null);
  const [showFilter, setShowFilter] = useState(true);
  const timerRef = useRef();

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  const currentPosition = positions[currentIndex];

  // Calculate statistics from positions
  const statistics = useMemo(() => {
    if (!positions || positions.length === 0) {
      return {
        totalDistance: 0,
        totalFuel: 0,
        parkingDuration: 0,
        movementDuration: 0,
        places: 0,
      };
    }

    let totalDistance = 0;
    let totalFuel = 0;
    let parkingTime = 0;
    let movementTime = 0;
    let places = 0;
    let lastStopTime = null;
    let isParked = false;

    positions.forEach((pos, index) => {
      const speed = pos.speed != null ? speedFromKnots(pos.speed, speedUnit) : 0;
      const isMoving = speed > 5; // Consider moving if speed > 5 km/h
      
      if (pos.distance) {
        totalDistance += pos.distance;
      }
      if (pos.attributes?.fuel) {
        totalFuel += pos.attributes.fuel;
      }

      if (index > 0) {
        const prevPos = positions[index - 1];
        const timeDiff = new Date(pos.fixTime) - new Date(prevPos.fixTime);
        
        if (isMoving) {
          if (!isParked) {
            movementTime += timeDiff;
          }
          if (lastStopTime) {
            parkingTime += new Date(pos.fixTime) - lastStopTime;
            places++;
            lastStopTime = null;
          }
          isParked = false;
        } else {
          if (!isParked) {
            lastStopTime = new Date(pos.fixTime);
            isParked = true;
          }
        }
      }
    });

    return {
      totalDistance: totalDistance / 1000, // Convert to km
      totalFuel: totalFuel,
      parkingDuration: parkingTime / (1000 * 60), // Convert to minutes
      movementDuration: movementTime / (1000 * 60), // Convert to minutes
      places,
    };
  }, [positions, speedUnit]);

  // Calculate events (movements and parking)
  const events = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    const eventList = [];
    let currentEvent = null;
    let isMoving = false;

    positions.forEach((pos, index) => {
      const speed = pos.speed != null ? speedFromKnots(pos.speed, speedUnit) : 0;
      const moving = speed > 5;

      if (index === 0) {
        isMoving = moving;
        currentEvent = {
          type: moving ? 'movement' : 'parking',
          start: pos,
          end: pos,
          positions: [pos],
        };
      } else {
        if (moving !== isMoving) {
          // Event type changed
          if (currentEvent) {
            currentEvent.end = positions[index - 1];
            eventList.push(currentEvent);
          }
          currentEvent = {
            type: moving ? 'movement' : 'parking',
            start: pos,
            end: pos,
            positions: [pos],
          };
          isMoving = moving;
        } else {
          currentEvent.end = pos;
          currentEvent.positions.push(pos);
        }
      }
    });

    if (currentEvent) {
      eventList.push(currentEvent);
    }

    return eventList.map((event) => {
      const duration = (new Date(event.end.fixTime) - new Date(event.start.fixTime)) / (1000 * 60); // minutes
      let distance = 0;
      let maxSpeed = 0;

      if (event.type === 'movement') {
        event.positions.forEach((pos, idx) => {
          if (idx > 0) {
            distance += pos.distance || 0;
          }
          const speed = pos.speed != null ? speedFromKnots(pos.speed, speedUnit) : 0;
          maxSpeed = Math.max(maxSpeed, speed);
        });
      }

      return {
        ...event,
        duration,
        distance: distance / 1000, // Convert to km
        maxSpeed: Math.round(maxSpeed),
      };
    });
  }, [positions, speedUnit]);

  // Playback control
  useEffect(() => {
    if (playing && positions.length > 0) {
      const interval = 500 / speedMultiplier;
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= positions.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, positions.length, speedMultiplier]);

  // Stop playing when reaching the end
  useEffect(() => {
    if (currentIndex >= positions.length - 1 && playing) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [currentIndex, positions.length, playing]);

  // Handle point click on route
  const onPointClick = useCallback((_, index) => {
    setCurrentIndex(index);
  }, []);

  const handleSubmit = useCatch(async ({ deviceId, from: fromDate, to: toDate }) => {
    setSelectedDeviceId(deviceId);
    setDateRange({ from: fromDate, to: toDate });
    const query = new URLSearchParams({ deviceId, from: fromDate, to: toDate });
    const response = await fetch(`/api/positions?${query.toString()}`);
    if (response.ok) {
      setCurrentIndex(0);
      const fetchedPositions = await response.json();
      setPositions(fetchedPositions);
      setShowFilter(false);
      if (fetchedPositions.length === 0) {
        throw Error('No data available');
      }
    } else {
      throw Error(await response.text());
    }
  });

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY, HH:mm:ss');
  };

  const formatDateRange = (from, to) => {
    if (!from || !to) return '';
    const fromDate = dayjs(from);
    const toDate = dayjs(to);
    return `${fromDate.format('MMM DD, YYYY HH:mm').toLowerCase()} - ${toDate.format('MMM DD, YYYY HH:mm').toLowerCase()}`;
  };

  // Local state for date inputs (in datetime-local format)
  const [localFrom, setLocalFrom] = useState(() => {
    if (dateRange?.from) {
      return dayjs(dateRange.from).format('YYYY-MM-DDTHH:mm');
    }
    return positions.length > 0 
      ? dayjs(positions[0]?.fixTime).format('YYYY-MM-DDTHH:mm')
      : dayjs().subtract(7, 'days').format('YYYY-MM-DDTHH:mm');
  });

  const [localTo, setLocalTo] = useState(() => {
    if (dateRange?.to) {
      return dayjs(dateRange.to).format('YYYY-MM-DDTHH:mm');
    }
    return positions.length > 0 
      ? dayjs(positions[positions.length - 1]?.fixTime).format('YYYY-MM-DDTHH:mm')
      : dayjs().format('YYYY-MM-DDTHH:mm');
  });

  const handleFromChange = (event) => {
    const newFrom = event.target.value;
    setLocalFrom(newFrom);
    if (newFrom) {
      setDateRange(prev => ({
        from: dayjs(newFrom).toISOString(),
        to: prev?.to || dayjs(localTo).toISOString(),
      }));
    }
  };

  const handleToChange = (event) => {
    const newTo = event.target.value;
    setLocalTo(newTo);
    if (newTo) {
      setDateRange(prev => ({
        from: prev?.from || dayjs(localFrom).toISOString(),
        to: dayjs(newTo).toISOString(),
      }));
    }
  };

  // Update local state when dateRange prop changes
  useEffect(() => {
    if (dateRange?.from) {
      setLocalFrom(dayjs(dateRange.from).format('YYYY-MM-DDTHH:mm'));
    }
    if (dateRange?.to) {
      setLocalTo(dayjs(dateRange.to).format('YYYY-MM-DDTHH:mm'));
    }
  }, [dateRange]);

  const movements = events.filter(e => e.type === 'movement');
  const parkings = events.filter(e => e.type === 'parking');

  const displayDateRange = dateRange 
    ? formatDateRange(dateRange.from, dateRange.to)
    : positions.length > 0 
      ? formatDateRange(positions[0]?.fixTime, positions[positions.length - 1]?.fixTime)
      : '';

  const currentSpeed = currentPosition?.speed != null ? speedFromKnots(currentPosition.speed, speedUnit) : 0;

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* Main Map */}
        <Box className={classes.mainMap}>
          <MapView>
            <MapGeofence />
            <MapRoutePath positions={positions} />
            <MapRoutePoints positions={positions} onClick={onPointClick} />
            {currentIndex < positions.length && (
              <MapPositions
                positions={[positions[currentIndex]]}
                selectedPosition={positions[currentIndex]}
                showStatus
              />
            )}
            <MapCamera positions={positions} />
          </MapView>
        </Box>

        {/* Sidebar */}
        <Paper className={classes.sidebar} elevation={8}>
          {/* Header */}
          <Box className={classes.header}>
            <Box className={classes.headerLeft}>
              <Typography className={classes.title}>Historique du véhicule</Typography>
            </Box>
            <Box className={classes.headerIcons}>
              <IconButton size="small" sx={{ padding: 0.5 }}>
                <Info fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ padding: 0.5 }}>
                <Fullscreen fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Date Range Bar */}
          <Box className={classes.dateRangeBar}>
            <CalendarToday fontSize="small" color="action" />
            <TextField
              type="datetime-local"
              value={localFrom}
              onChange={handleFromChange}
              className={classes.dateRangeInput}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: false,
              }}
              sx={{ 
                mr: 1,
                '& .MuiInputBase-input': {
                  cursor: 'pointer',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', mx: 0.5 }}>-</Typography>
            <TextField
              type="datetime-local"
              value={localTo}
              onChange={handleToChange}
              className={classes.dateRangeInput}
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: false,
              }}
              sx={{ 
                ml: 1,
                '& .MuiInputBase-input': {
                  cursor: 'pointer',
                },
              }}
            />
          </Box>

          {/* Map Section */}
          {positions.length > 0 && (
            <Box className={classes.mapContainer}>
              <MapView className={classes.mapView}>
                <MapGeofence />
                <MapRoutePath positions={positions} />
                <MapRoutePoints positions={positions} onClick={onPointClick} />
                {currentIndex < positions.length && (
                  <MapPositions
                    positions={[positions[currentIndex]]}
                    selectedPosition={positions[currentIndex]}
                    showStatus
                  />
                )}
                <MapCamera positions={positions} />
              </MapView>
            </Box>
          )}

          {/* Playback Controls */}
          {positions.length > 0 && (
            <Box className={classes.controls}>
              <Box className={classes.controlsRow}>
                <Box className={classes.playbackButtons}>
                  <IconButton
                    size="small"
                    onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                    disabled={playing || currentIndex <= 0}
                  >
                    <FastRewind fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPlaying(!playing)}
                    disabled={currentIndex >= positions.length - 1}
                  >
                    {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setCurrentIndex((idx) => Math.min(positions.length - 1, idx + 1))}
                    disabled={playing || currentIndex >= positions.length - 1}
                  >
                    <FastForward fontSize="small" />
                  </IconButton>
                </Box>
                <Typography className={classes.progressInfo}>
                  {currentIndex + 1} / {positions.length}
                </Typography>
              </Box>

              <Slider
                value={currentIndex}
                min={0}
                max={Math.max(0, positions.length - 1)}
                step={null}
                marks={positions.map((_, idx) => ({ value: idx }))}
                onChange={(_, value) => setCurrentIndex(value)}
                disabled={playing}
                sx={{ mb: 1 }}
              />

              <Box className={classes.controlsRow}>
                <Typography className={classes.dateRange}>
                  {positions[0] && formatTime(positions[0].fixTime, 'time')} - {positions[positions.length - 1] && formatTime(positions[positions.length - 1].fixTime, 'time')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    {speedMultiplier}x
                  </Typography>
                  <Typography className={classes.speedDisplay}>
                    {Math.round(currentSpeed)} km/h
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Box className={classes.content}>
            {/* Show filter if no data, otherwise show activity report */}
            {showFilter ? (
              <ReportFilter handleSubmit={handleSubmit} showOnly />
            ) : (
              <>
                {/* Activity Report Title */}
                <Typography className={classes.reportTitle}>Rapport d'activité</Typography>

                {/* Summary Statistics */}
                <Box className={classes.summary}>
                  <Box className={classes.summaryItem}>
                    <Typography className={classes.summaryValue}>
                      {statistics.places}
                    </Typography>
                    <Typography className={classes.summaryLabel}>places</Typography>
                  </Box>
                  <Box className={classes.summaryItem}>
                    <Typography className={classes.summaryValue}>
                      {statistics.totalDistance.toFixed(1)} km
                    </Typography>
                    <Typography className={classes.summaryLabel}>Distance</Typography>
                  </Box>
                  <Box className={classes.summaryItem}>
                    <Typography className={classes.summaryValue}>
                      {statistics.totalFuel.toFixed(1)} L
                    </Typography>
                    <Typography className={classes.summaryLabel}>Fuel</Typography>
                  </Box>
                  <Box className={classes.summaryItem}>
                    <Typography className={classes.summaryValue}>
                      {formatDuration(statistics.movementDuration)}
                    </Typography>
                    <Typography className={classes.summaryLabel}>Mouvement</Typography>
                  </Box>
                  <Box className={classes.summaryItem}>
                    <Typography className={classes.summaryValue}>
                      P {formatDuration(statistics.parkingDuration)}
                    </Typography>
                    <Typography className={classes.summaryLabel}>Parking</Typography>
                  </Box>
                </Box>

                {/* Filter Buttons */}
                <Box className={classes.filterButtons}>
                  <IconButton size="small" className={`${classes.filterButton} parking`}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>P</Typography>
                  </IconButton>
                  <IconButton size="small" className={`${classes.filterButton} route`}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>R</Typography>
                  </IconButton>
                  <IconButton size="small" className={`${classes.filterButton} fuel`}>
                    <LocalGasStation fontSize="small" />
                  </IconButton>
                  <IconButton size="small" className={`${classes.filterButton} stop`}>
                    <Stop fontSize="small" />
                  </IconButton>
                  <IconButton size="small" className={`${classes.filterButton} location`}>
                    <LocationOn fontSize="small" />
                  </IconButton>
                </Box>

                {/* Location Highlight (if available) */}
                {positions.length > 0 && positions[0]?.address && (
                  <Box className={classes.locationHighlight}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                      {positions[0].address.split(',').slice(-2).join(',').trim()}
                    </Typography>
                    {positions[positions.length - 1]?.address && positions[positions.length - 1].address !== positions[0].address && (
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                        À: {positions[positions.length - 1].address.split(',').slice(-2).join(',').trim()}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Movement Events */}
                {movements.length > 0 && (
                  <Box className={classes.eventSection}>
                    <Typography className={classes.eventSectionTitle}>
                      <DirectionsCar fontSize="small" />
                      Mouvement
                    </Typography>
                    {movements.slice(0, 10).map((event, index) => (
                      <Box key={index} className={`${classes.eventItem} ${classes.eventItemMovement}`}>
                        <Box className={classes.eventHeader}>
                          <Box sx={{ flex: 1 }}>
                            <Typography className={classes.eventTime}>
                              De: {formatDate(event.start.fixTime)}
                            </Typography>
                            <Typography className={classes.eventTime}>
                              À: {formatDate(event.end.fixTime)}
                            </Typography>
                            <Typography className={classes.eventDetails}>
                              Distance: {event.distance.toFixed(2)} km
                            </Typography>
                            <Typography className={classes.eventDetails}>
                              Vitesse max: {event.maxSpeed} km/h
                            </Typography>
                          </Box>
                          <Typography className={classes.eventDuration}>
                            {formatDuration(event.duration)}
                          </Typography>
                        </Box>
                        {event.start.address && (
                          <Typography className={classes.eventLocation}>
                            De: {event.start.address}
                          </Typography>
                        )}
                        {event.end.address && event.end.address !== event.start.address && (
                          <Typography className={classes.eventLocation}>
                            À: {event.end.address}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Parking Events */}
                {parkings.length > 0 && (
                  <Box className={classes.eventSection}>
                    <Typography className={classes.eventSectionTitle}>
                      <LocalParking fontSize="small" />
                      Stationnement
                    </Typography>
                    {parkings.slice(0, 10).map((event, index) => (
                      <Box key={index} className={`${classes.eventItem} ${classes.eventItemParking}`}>
                        <Box className={classes.eventHeader}>
                          <Box sx={{ flex: 1 }}>
                            <Typography className={classes.eventTime}>
                              De: {formatDate(event.start.fixTime)}
                            </Typography>
                            <Typography className={classes.eventTime}>
                              À: {formatDate(event.end.fixTime)}
                            </Typography>
                          </Box>
                          <Typography className={classes.eventDuration}>
                            {formatDuration(event.duration)}
                          </Typography>
                        </Box>
                        {event.start.address && (
                          <Typography className={classes.eventLocation}>
                            De: {event.start.address}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>

        {/* Bottom Control Bar */}
        {positions.length > 0 && (
          <Box className={classes.bottomBar}>
            <Box className={classes.bottomBarControls}>
              <IconButton
                size="small"
                onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 10))}
                disabled={playing}
                sx={{ color: 'white' }}
              >
                <FastRewind />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setPlaying(!playing)}
                disabled={currentIndex >= positions.length - 1}
                sx={{ color: 'white' }}
              >
                {playing ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setCurrentIndex((idx) => Math.min(positions.length - 1, idx + 10))}
                disabled={playing}
                sx={{ color: 'white' }}
              >
                <FastForward />
              </IconButton>
              <Typography variant="body2" sx={{ ml: 1, color: 'white' }}>
                {currentPosition && formatTime(currentPosition.fixTime, 'seconds')}
              </Typography>
            </Box>

            <Box className={classes.bottomBarInfo}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {currentIndex + 1} / {positions.length}
              </Typography>
              <Box className={classes.dateRange}>
                <CalendarToday fontSize="small" sx={{ color: 'white' }} />
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {displayDateRange}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {speedMultiplier}x
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    backgroundColor: theme.palette.success.main,
                    padding: theme.spacing(0.5, 1),
                    borderRadius: theme.spacing(0.5),
                    fontWeight: 600,
                    color: 'white',
                  }}
                >
                  {Math.round(currentSpeed)} km/h
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default ReplayPageNew;
