import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Select, MenuItem, TextField,
  InputAdornment, Stack, Avatar, CircularProgress, IconButton
} from '@mui/material';
import {
  CalendarToday, DirectionsCar, CompareArrows, GridView,
  KeyboardArrowDown, LocalGasStation, Speed, AccessTime, Domain,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import PageLayout from './PageLayout';

const useStyles = makeStyles()(() => ({
  root: { padding: '24px', background: '#080d1a', minHeight: '100vh' },
  glassSelect: {
    background: 'rgba(255,255,255,0.05)', borderRadius: '12px', minWidth: '220px', color: '#e2e8f0',
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.1)' },
    '& .MuiSelect-select': { paddingLeft: '14px', fontWeight: 600 },
    '& .MuiSvgIcon-root': { color: '#475569' },
  },
  glassDate: {
    background: 'rgba(255,255,255,0.05)', borderRadius: '12px', minWidth: '280px',
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.1)' },
    '& input': { color: '#e2e8f0', fontSize: '0.86rem' },
  },
  metricCard: {
    padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', height: '100%', backdropFilter: 'blur(12px)',
  },
  chartCard: {
    padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', height: '400px', backdropFilter: 'blur(12px)',
    marginBottom: '24px'
  },
}));

const GraphPage = () => {
  const { classes } = useStyles();

  // Fleet & UI State[cite: 2, 4]
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [compareDevice, setCompareDevice] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);

  // Metrics Data[cite: 3, 4]
  const [primaryMetrics, setPrimaryMetrics] = useState({ distance: '0 km', fuel: '0.0 L', avgSpeed: '0 km/h', duration: '0h' });
  const [compareMetrics, setCompareMetrics] = useState(null);

  // Time Range (Default last 24h)[cite: 2]
  const [fromTime, setFromTime] = useState(new Date(Date.now() - 86400000).toISOString().slice(0, 16));
  const [toTime, setToTime] = useState(new Date().toISOString().slice(0, 16));

  // Dynamic API Fetcher[cite: 2, 4]
  const fetchSingleReport = async (deviceId) => {
    if (!deviceId) return null;
    const query = new URLSearchParams({
      deviceId,
      from: new Date(fromTime).toISOString(),
      to: new Date(toTime).toISOString()
    });
    try {
      const response = await fetch(`/api/reports/summary?${query}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const stats = data[0];
        return {
          distance: `${(stats.distance / 1000).toFixed(1)} km`,
          fuel: `${stats.spentFuel.toFixed(1)} L`,
          avgSpeed: `${(stats.averageSpeed * 1.852).toFixed(1)} km/h`,
          duration: `${Math.floor(stats.engineHours / 3600000)}h`
        };
      }
    } catch (e) { console.error("Fetch error:", e); }
    return null;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const primary = await fetchSingleReport(selectedDevice);
    if (primary) setPrimaryMetrics(primary);

    if (showComparison && compareDevice) {
      const secondary = await fetchSingleReport(compareDevice);
      if (secondary) setCompareMetrics(secondary);
    } else {
      setCompareMetrics(null);
    }
    setLoading(false);
  }, [selectedDevice, compareDevice, fromTime, toTime, showComparison]);

  // Initial Device Load[cite: 2]
  useEffect(() => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        if (data.length > 0) setSelectedDevice(data[0].id);
      });
  }, []);

  // Auto-refresh on device/range change[cite: 4]
  useEffect(() => {
    if (selectedDevice) loadData();
  }, [selectedDevice, loadData]);

  const METRIC_CONFIG = [
    { label: 'Distance Totale', key: 'distance', icon: <Domain />, color: '#3b82f6' },
    { label: 'Efficacité Carburant', key: 'fuel', icon: <LocalGasStation />, color: '#f59e0b' },
    { label: 'Vitesse Moy', key: 'avgSpeed', icon: <Speed />, color: '#22c55e' },
    { label: 'Durée Totale', key: 'duration', icon: <AccessTime />, color: '#a855f7' },
  ];

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9' }}>Graphiques</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>Visualisations des données de performance du véhicule</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disableElevation startIcon={<CompareArrows />} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: '10px', textTransform: 'none' }}>Données de comparaison</Button>
            <Button
              variant="contained"
              startIcon={<DirectionsCar />}
              onClick={() => setShowComparison(!showComparison)}
              sx={{ bgcolor: showComparison ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.06)', color: '#f97316', borderRadius: '10px', textTransform: 'none' }}
            >
              {showComparison ? 'Cacher Comparaison' : 'vs Véhicule'}
            </Button>
            <Button variant="contained" disableElevation startIcon={<GridView />} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#94a3b8', borderRadius: '10px', textTransform: 'none' }}>Grille Cool</Button>
          </Stack>
        </Box>

        {/* Filter Bar[cite: 2, 4] */}
        <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <Select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className={classes.glassSelect}
            IconComponent={KeyboardArrowDown}
            size="small"
          >
            {devices.map(dev => <MenuItem key={dev.id} value={dev.id}>{dev.name}</MenuItem>)}
          </Select>

          {showComparison && (
            <Select
              value={compareDevice}
              displayEmpty
              onChange={(e) => setCompareDevice(e.target.value)}
              className={classes.glassSelect}
              sx={{ border: '1px solid rgba(249, 115, 22, 0.3)' }}
              IconComponent={KeyboardArrowDown}
              size="small"
              renderValue={(selected) => {
                if (!selected) return <em>Comparer avec...</em>;
                return devices.find(d => d.id === selected)?.name;
              }}
            >
              <MenuItem disabled value=""><em>Sélectionnez un véhicule...</em></MenuItem>
              {devices.filter(d => d.id !== selectedDevice).map(dev => (
                <MenuItem key={dev.id} value={dev.id}>{dev.name}</MenuItem>
              ))}
            </Select>
          )}

          <TextField
            type="datetime-local"
            size="small"
            className={classes.glassDate}
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarToday fontSize="small" sx={{ color: '#475569' }} /></InputAdornment>) }}
          />
          <TextField
            type="datetime-local"
            size="small"
            className={classes.glassDate}
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
          />

          <IconButton onClick={loadData} sx={{ color: '#6366f1' }}>
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        {/* Summary Metrics[cite: 4] */}
        <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 3, flexWrap: 'wrap' }}>
          {METRIC_CONFIG.map((item, i) => (
            <Box key={i} sx={{ flex: 1, minWidth: '240px' }}>
              <Box className={classes.metricCard}>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{item.label}</Typography>
                  <Stack direction="row" spacing={2} alignItems="baseline" sx={{ my: 0.5 }}>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9' }}>{loading ? '...' : primaryMetrics[item.key]}</Typography>
                    {compareMetrics && (
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#f97316' }}>vs {compareMetrics[item.key]}</Typography>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: '0.73rem', color: '#475569' }}>Période sélectionnée</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${item.color}26`, color: item.color, borderRadius: '12px', width: 48, height: 48 }}>{item.icon}</Avatar>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Restore Original Charts[cite: 3, 4] */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 2 }}>
            <Box className={classes.chartCard}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Distance Parcourue</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 3 }}>Suivi quotidien pour {devices.find(d => d.id === selectedDevice)?.name}</Typography>
              <Box sx={{ height: 280, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box>
                  <Typography sx={{ color: '#6366f1', fontSize: '1.2rem', fontWeight: 700 }}>{primaryMetrics.distance}</Typography>
                  {compareMetrics && <Typography sx={{ color: '#f97316', mt: 1 }}>vs {compareMetrics.distance}</Typography>}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box className={classes.chartCard}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>État de la Batterie</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 3 }}>Niveaux de puissance et santé</Typography>
              <Box sx={{ height: 280, display: 'grid', placeItems: 'center' }}>
                <Typography sx={{ color: '#475569' }}>Analyse en temps réel active</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className={classes.chartCard} sx={{ height: 'auto !important', pb: 3 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9' }}>Analyse de Vitesse</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 3 }}>Modèles de vitesse et métriques d'efficacité</Typography>
          <Box sx={{ height: 280, display: 'grid', placeItems: 'center' }}>
            <Typography sx={{ color: '#475569' }}>Moyenne: {primaryMetrics.avgSpeed} {compareMetrics ? `(vs ${compareMetrics.avgSpeed})` : ''}</Typography>
          </Box>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default GraphPage;