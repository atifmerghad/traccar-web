import React from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Search,
  LocalParkingOutlined,
  NotificationsNoneOutlined,
  Layers,
  ChevronLeft,
  ExploreOutlined,
  StopCircleOutlined,
  DescriptionOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material';

const FILTERS = [
  { id: 'all', Icon: Layers, color: '#64748b', title: 'Tous' },
  { id: 'moving', Icon: ExploreOutlined, color: '#10b981', title: 'En mouvement' },
  { id: 'parked', Icon: LocalParkingOutlined, color: '#3b82f6', title: 'Garés' },
  { id: 'stopped', Icon: StopCircleOutlined, color: '#f59e0b', title: 'Arrêtés' },
  { id: 'alert', Icon: NotificationsNoneOutlined, color: '#f97316', title: 'Alertes' },
  { id: 'time', Icon: AccessTimeOutlined, color: '#6366f1', title: 'Temps réel' },
  { id: 'report', Icon: DescriptionOutlined, color: '#d946ef', title: 'Rapport' },
];

const MainToolbar = ({
  fleetName = 'Flotte',
  deviceCount = 0,
  searchValue = '',
  onSearchChange,
  onFilterClick,
  activeFilter = 'all',
  onToggleCollapse,
}) => (
  <Box style={{
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    borderBottom: '1px solid #f1f5f9',
    flexShrink: 0,
  }}>

    {/* Top row */}
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Typography style={{
          fontWeight: 800,
          fontSize: '1.35rem',
          color: '#1e293b',
          letterSpacing: '-0.3px',
          lineHeight: 1,
        }}>
          {fleetName}
        </Typography>
        <Box style={{
          border: '1.5px solid #e2e8f0',
          borderRadius: 20,
          padding: '2px 14px',
          fontSize: '0.88rem',
          fontWeight: 600,
          color: '#64748b',
          backgroundColor: '#ffffff',
          lineHeight: 1.6,
        }}>
          {deviceCount}
        </Box>
      </Box>
      <Tooltip title="Réduire">
        <IconButton size="small" onClick={onToggleCollapse} style={{ color: '#94a3b8' }}>
          <ChevronLeft fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>

    {/* Search */}
    <TextField
      fullWidth
      placeholder="Rechercher véhicules..."
      value={searchValue}
      onChange={(e) => onSearchChange?.(e.target.value)}
      variant="outlined"
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search style={{ color: '#94a3b8', fontSize: '1.1rem' }} />
          </InputAdornment>
        ),
        style: {
          borderRadius: 12,
          backgroundColor: '#f8fafc',
          height: 40,
          fontSize: '0.88rem',
        },
      }}
    />

    {/* Filter buttons */}
    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {FILTERS.map(({ id, Icon, color, title }) => {
        const isActive = activeFilter === id;
        return (
          <Tooltip key={id} title={title} placement="bottom">
            <Box
              onClick={() => onFilterClick?.(id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${color}`,
                cursor: 'pointer',
                flexShrink: 0,
                backgroundColor: isActive ? color : 'transparent',
                boxShadow: isActive ? `0 2px 8px ${color}55` : 'none',
                transition: 'background-color 0.18s, box-shadow 0.18s',
              }}
            >
              <Icon style={{ color: isActive ? '#fff' : color, fontSize: 18 }} />
            </Box>
          </Tooltip>
        );
      })}
    </Box>

  </Box>
);

export default MainToolbar;
