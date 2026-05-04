import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  InfoOutlined,
  Fullscreen,
  ChevronLeft,
  CalendarToday,
  Route,
  LocalParking,
  LocalGasStation,
  HighlightOff,
  LocationOn,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import MapView from '../map/core/MapView';
import MapPositions from '../map/MapPositions';
import MapRoutePath from '../map/MapRoutePath';
import PageLayout from './PageLayout';
import { formatTime } from '../common/util/formatter';
import { speedFromKnots } from '../common/util/converter';
import { useAttributePreference } from '../common/util/preferences';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    backgroundColor: '#f5f5f7',
    position: 'relative',
  },
  sidebar: {
    width: 400,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  panelHeader: {
    padding: theme.spacing(1, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFilter: {
    margin: theme.spacing(1, 2),
    padding: theme.spacing(1),
    border: '1px solid #ddd',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.9rem',
  },
  miniMapPreview: {
    height: 200,
    margin: theme.spacing(0, 2),
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid #eee',
  },
  playbackControlsSidebar: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedDisplaySidebar: {
    backgroundColor: '#1a237e',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 80,
  },
  activityHeader: {
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  statsGrid: {
    padding: theme.spacing(0, 2, 2),
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  movementCard: {
    margin: theme.spacing(1, 2),
    padding: theme.spacing(2),
    borderRadius: 12,
    border: '1px solid #e8f5e9',
    backgroundColor: '#f9fff9',
  },
  // Floating Bottom Bar - Screenshot 2026-05-04 at 03.41.46_2.jpg
  floatingPlaybackBar: {
    position: 'absolute',
    bottom: 24,
    left: 424,
    right: 24,
    height: 64,
    backgroundColor: 'rgba(33, 33, 33, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    zIndex: 100,
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  speedBadgeFloating: {
    marginLeft: 'auto',
    padding: '6px 16px',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    border: '1px solid rgba(255, 152, 0, 0.4)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    color: '#ff9800',
  },
  playBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    margin: '0 10px',
    color: '#fff',
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  }
}));

const ReplayPageNew = () => {
  const { classes } = useStyles();
  const speedUnit = useAttributePreference('speedUnit', 'kn');
  const [positions, setPositions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const timerRef = useRef();

  const currentPosition = positions[currentIndex];

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev < positions.length - 1 ? prev + 1 : prev));
      }, 500 / speedMultiplier);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, speedMultiplier, positions.length]);

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* Full Sidebar from ReplayPageNew_4.jsx */}
        <Paper className={classes.sidebar} square>
          <Box className={classes.panelHeader}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Historique du véhicule
            </Typography>
            <Box>
              <IconButton size="small"><InfoOutlined fontSize="small" /></IconButton>
              <IconButton size="small"><Fullscreen fontSize="small" /></IconButton>
              <IconButton size="small"><ChevronLeft fontSize="small" /></IconButton>
            </Box>
          </Box>

          <Box className={classes.dateFilter}>
            <CalendarToday sx={{ fontSize: 18, color: '#666' }} />
            <Typography variant="body2">nov. 05, 2025 15:00 - nov. 12, 2025 15:00</Typography>
          </Box>

          <Box className={classes.miniMapPreview}>
            <MapView>
              <MapRoutePath positions={positions} />
              {currentPosition && <MapPositions positions={[currentPosition]} />}
            </MapView>
          </Box>

          <Box className={classes.playbackControlsSidebar}>
            <Slider
              size="small"
              value={currentIndex}
              max={positions.length > 0 ? positions.length - 1 : 0}
              onChange={(_, v) => setCurrentIndex(v)}
              sx={{ color: '#5c6bc0' }}
            />
            <Box className={classes.controlRow}>
              <Typography variant="caption" color="textSecondary">15:00:04</Typography>
              <Typography variant="caption" color="textSecondary">
                {currentIndex + 1} / {positions.length || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">14:59:35</Typography>
            </Box>

            <Box className={classes.controlRow} sx={{ mt: 1 }}>
              <Select
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(e.target.value)}
                size="small"
                sx={{ height: 32, fontSize: '0.8rem' }}
              >
                {[1, 2, 4, 8].map((s) => <MenuItem key={s} value={s}>{s}x</MenuItem>)}
              </Select>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small"><SkipPrevious /></IconButton>
                <IconButton
                  onClick={() => setPlaying(!playing)}
                  sx={{ backgroundColor: '#5c6bc0', color: '#fff', '&:hover': { backgroundColor: '#3f51b5' }, mx: 1 }}
                >
                  {playing ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton size="small"><SkipNext /></IconButton>
              </Box>

              <Box className={classes.speedDisplaySidebar}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {Math.round(speedFromKnots(currentPosition?.speed || 0, speedUnit))}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>km/h</Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            <Box className={classes.activityHeader}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Rapport d'activité</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <LocalParking sx={{ fontSize: 18, color: '#1976d2' }} />
                <Route sx={{ fontSize: 18, color: '#1976d2' }} />
                <LocalGasStation sx={{ fontSize: 18, color: '#fbc02d' }} />
                <HighlightOff sx={{ fontSize: 18, color: '#d32f2f' }} />
                <LocationOn sx={{ fontSize: 18, color: '#4caf50' }} />
              </Box>
            </Box>

            <Box className={classes.statsGrid}>
              <Typography variant="caption" color="primary">223 places</Typography>
              <Typography variant="caption">📏 928.0 km</Typography>
              <Typography variant="caption">⛽ 0.0 L</Typography>
              <Typography variant="caption">🅿️ 124h 23m</Typography>
              <Typography variant="caption">🏁 43h 13m</Typography>
            </Box>

            <Box className={classes.movementCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Route sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 700, flex: 1 }}>Mouvement</Typography>
                <Typography variant="caption" color="textSecondary">1m</Typography>
              </Box>
              <Typography variant="caption" display="block">De: <b>05/11/2025, 15:31:14</b></Typography>
              <Typography variant="caption" display="block">À: <b>05/11/2025, 15:32:18</b></Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>Distance: <b>0.00 km</b></Typography>
              <Typography variant="caption" display="block">Vitesse max: <b>17 km/h</b></Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                De: Les Princesses Arrondissement Maârif, Casablanca...
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Map and Floating Bar */}
        <Box className={classes.mapContainer}>
          <MapView>
            <MapRoutePath positions={positions} />
            {currentPosition && <MapPositions positions={[currentPosition]} showStatus />}
          </MapView>

          {/* Floating Playback Bar from Screenshot 2026-05-04 at 03.41.46_2.jpg */}
          {positions.length > 0 && (
            <Box className={classes.floatingPlaybackBar}>
              <IconButton size="small" sx={{ color: '#aaa' }}><InfoOutlined fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: '#aaa' }}><Fullscreen fontSize="small" /></IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <IconButton size="small" sx={{ color: '#fff' }}><SkipPrevious /></IconButton>
                <IconButton className={classes.playBtnDark} onClick={() => setPlaying(!playing)}>
                  {playing ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton size="small" sx={{ color: '#fff' }}><SkipNext /></IconButton>
              </Box>

              <Box sx={{ flex: 1, mx: 4, position: 'relative' }}>
                <Slider
                  size="small"
                  value={currentIndex}
                  max={positions.length - 1}
                  onChange={(_, v) => setCurrentIndex(v)}
                  sx={{
                    color: '#fff',
                    '& .MuiSlider-thumb': { width: 12, height: 12 },
                    '& .MuiSlider-rail': { opacity: 0.3 }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>15:02:31</Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>
                    {currentIndex + 1} / {positions.length}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>14:59:35</Typography>
                </Box>
              </Box>

              <Select
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(e.target.value)}
                variant="standard"
                disableUnderline
                sx={{ color: '#fff', fontSize: '0.8rem', bgcolor: 'rgba(255,255,255,0.1)', px: 1, borderRadius: 1, mr: 2 }}
              >
                {[1, 2, 4, 8].map((s) => <MenuItem key={s} value={s}>{s}x</MenuItem>)}
              </Select>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.05)', px: 1.5, py: 0.5, borderRadius: 1, mr: 2 }}>
                <CalendarToday sx={{ fontSize: 14 }} />
                <Typography variant="caption">nov. 05, 2025 15:00 - nov. 12, 2025 15:00</Typography>
              </Box>

              <Box className={classes.speedBadgeFloating}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {Math.round(speedFromKnots(currentPosition?.speed || 0, speedUnit))}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 400 }}>km/h</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </PageLayout>
  );
};

export default ReplayPageNew;