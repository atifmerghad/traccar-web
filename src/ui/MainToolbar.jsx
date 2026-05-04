import React from 'react';
import { Box, Typography, TextField, IconButton, InputAdornment, Tooltip } from '@mui/material';
import {
  Search, LocalParkingOutlined, NotificationsNoneOutlined,
  Layers, ChevronLeft, ExploreOutlined, StopCircleOutlined,
  DescriptionOutlined, AccessTimeOutlined,
} from '@mui/icons-material';

const FILTERS = [
  { id: 'all', Icon: Layers, color: '#6366f1', title: 'Tous' },
  { id: 'moving', Icon: ExploreOutlined, color: '#10b981', title: 'En mouvement' },
  { id: 'parked', Icon: LocalParkingOutlined, color: '#3b82f6', title: 'Garés' },
  { id: 'stopped', Icon: StopCircleOutlined, color: '#f59e0b', title: 'Arrêtés' },
  { id: 'alert', Icon: NotificationsNoneOutlined, color: '#ef4444', title: 'Alertes' },
  { id: 'time', Icon: AccessTimeOutlined, color: '#8b5cf6', title: 'Temps réel' },
  { id: 'report', Icon: DescriptionOutlined, color: '#ec4899', title: 'Rapport' },
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
  <Box sx={{
    padding: '12px 14px',
    background: 'rgba(8,13,26,0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  }}>
    {/* Top row */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Typography sx={{
          fontWeight: 800,
          fontSize: '1.3rem',
          color: '#f1f5f9',
          letterSpacing: '-0.3px',
          lineHeight: 1,
        }}>
          {fleetName}
        </Typography>
        <Box sx={{
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '2px 12px',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#94a3b8',
          background: 'rgba(255,255,255,0.06)',
          lineHeight: 1.6,
        }}>
          {deviceCount}
        </Box>
      </Box>
      <Tooltip title="Réduire">
        <IconButton
          size="small"
          onClick={onToggleCollapse}
          sx={{
            color: '#475569',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '8px',
            width: 30,
            height: 30,
          }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>

    {/* Search */}
    <TextField
      fullWidth
      placeholder="Rechercher véhicules..."
      value={searchValue || ''}
      onChange={(e) => onSearchChange?.(e.target.value)}
      variant="outlined"
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search sx={{ color: '#475569', fontSize: '1rem' }} />
          </InputAdornment>
        ),
        sx: {
          borderRadius: '12px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          height: 38,
          fontSize: '0.86rem',
          color: '#e2e8f0',
          '& fieldset': { border: 'none' }, // Correct way to remove border in MUI
        },
      }}
    />

    {/* Filter buttons */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {FILTERS.map(({ id, Icon, color, title }) => {
        const isActiveFilter = activeFilter === id;
        const safeColor = color || '#6366f1'; // Fallback to prevent undefined crash

        return (
          <Tooltip key={id} title={title || ''} placement="bottom">
            <Box
              onClick={() => onFilterClick?.(id)}
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s ease',
                border: '1.5px solid',
                borderColor: isActiveFilter ? safeColor : 'rgba(255,255,255,0.1)',
                backgroundColor: isActiveFilter ? safeColor : 'rgba(255,255,255,0.04)',
                // sx prop handles template literals safely
                boxShadow: isActiveFilter ? `0 0 10px ${safeColor}88` : 'none',
                '&:hover': {
                  backgroundColor: isActiveFilter ? safeColor : 'rgba(255,255,255,0.08)',
                }
              }}
            >
              <Icon sx={{ color: isActiveFilter ? '#fff' : safeColor, fontSize: 17 }} />
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  </Box>
);

export default MainToolbar;