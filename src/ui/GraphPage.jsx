import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  Avatar
} from '@mui/material';
import {
  CalendarToday,
  DirectionsCar,
  CompareArrows,
  GridView,
  KeyboardArrowDown,
  LocalGasStation,
  Speed,
  AccessTime,
  Domain
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import PageLayout from './PageLayout';

const useStyles = makeStyles()(() => ({
  root: {
    padding: '24px',
    backgroundColor: '#f4f7fe',
    minHeight: '100vh',
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  trackySelect: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    minWidth: '220px',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
    '& .MuiSelect-select': {
      paddingLeft: '16px',
      fontWeight: 600,
    }
  },
  trackyDate: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    minWidth: '300px',
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
  },
  metricCard: {
    padding: '20px',
    borderRadius: '20px',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.02)',
    height: '100%',
  },
  chartPaper: {
    padding: '24px',
    borderRadius: '24px',
    backgroundColor: '#fff',
    height: '400px',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.02)',
  }
}));

const GraphPage = () => {
  const { classes } = useStyles();

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* 1. Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={900} color="#1e293b">Graphiques</Typography>
            <Typography variant="caption" color="textSecondary">Visualisations des données de performance du véhicule</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disableElevation startIcon={<CompareArrows />} sx={{ bgcolor: '#fff', color: '#64748b', borderRadius: '10px', textTransform: 'none' }}>Données de comparaison</Button>
            <Button variant="contained" disableElevation startIcon={<DirectionsCar />} sx={{ bgcolor: '#fff', color: '#f97316', borderRadius: '10px', textTransform: 'none' }}>vs Véhicule</Button>
            <Button variant="contained" disableElevation startIcon={<GridView />} sx={{ bgcolor: '#fff', color: '#64748b', borderRadius: '10px', textTransform: 'none' }}>Grille Cool</Button>
          </Stack>
        </Box>

        {/* 2. Filter Bar */}
        <Box className={classes.filterRow}>
          <Select value="jumper" size="small" className={classes.trackySelect} IconComponent={KeyboardArrowDown}>
            <MenuItem value="jumper">JUMPER Citreon</MenuItem>
          </Select>

          <Select displayEmpty size="small" className={classes.trackySelect} IconComponent={KeyboardArrowDown} renderValue={(s) => s || "Sélectionnez un véhicule à comparer..."}>
            <MenuItem value="vw">VW r</MenuItem>
            <MenuItem value="clio">RENAULT CLIO 5</MenuItem>
          </Select>

          <TextField
            size="small"
            className={classes.trackyDate}
            defaultValue="nov. 12, 2025 13:53 - nov. 13, 2025 13:53"
            InputProps={{
              startAdornment: <InputAdornment position="start"><CalendarToday fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>

        {/* 3. Summary Metrics */}
        <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 3 }}>
          {[
            { label: 'Distance Totale', value: '108 km', sub: 'Période sélectionnée', icon: <Domain />, color: '#eff6ff', iconColor: '#3b82f6' },
            { label: 'Efficacité Carburant', value: '0.0 L/100km', sub: 'Consommation moyenne', icon: <LocalGasStation />, color: '#fffbeb', iconColor: '#f59e0b' },
            { label: 'Vitesse Moy', value: '42 km/h', sub: 'Pendant les mouvements', icon: <Speed />, color: '#f0fdf4', iconColor: '#22c55e' },
            { label: 'Durée Totale', value: '23h 56min', sub: 'Toutes les activités', icon: <AccessTime />, color: '#faf5ff', iconColor: '#a855f7' },
          ].map((item, i) => (
            <Box key={i} sx={{ flex: 1, minWidth: 0 }}>
              <Paper className={classes.metricCard} elevation={0}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary">{item.label}</Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ my: 0.5 }}>{item.value}</Typography>
                  <Typography variant="caption" color="textSecondary">{item.sub}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: item.color, color: item.iconColor, borderRadius: '12px', width: 48, height: 48 }}>
                  {item.icon}
                </Avatar>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* 4. Main Charts */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', mb: 3 }}>
          {/* Distance Chart */}
          <Box sx={{ flex: 2, minWidth: 0 }}>
            <Paper className={classes.chartPaper} elevation={0}>
              <Typography variant="h6" fontWeight={800}>Distance Parcourue</Typography>
              <Typography variant="caption" color="textSecondary" mb={3} display="block">Suivi quotidien de la distance avec tendances</Typography>
              <Box sx={{ height: 280, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                <Typography variant="body2">Graphique temporairement desactive</Typography>
              </Box>
            </Paper>
          </Box>

          {/* Battery Status Chart */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper className={classes.chartPaper} elevation={0}>
              <Typography variant="h6" fontWeight={800}>État de la Batterie</Typography>
              <Typography variant="caption" color="textSecondary" mb={3} display="block">Niveaux de puissance et santé</Typography>
              <Box sx={{ height: 280, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                <Typography variant="body2">Graphique temporairement desactive</Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* Speed Analysis Chart — full width */}
        <Box sx={{ width: '100%' }}>
          <Paper className={classes.chartPaper} elevation={0}>
            <Typography variant="h6" fontWeight={800}>Analyse de Vitesse</Typography>
            <Typography variant="caption" color="textSecondary" mb={3} display="block">Modèles de vitesse et métriques d'efficacité</Typography>
            <Box sx={{ height: 280, display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
              <Typography variant="body2">Graphique temporairement desactive</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default GraphPage;
