import { Box, Typography, TextField, IconButton, InputAdornment, Tooltip, useTheme } from '@mui/material';
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
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      padding: '12px 14px',
      background: isDark ? 'rgba(8,13,26,0.97)' : 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      flexShrink: 0,
    }}>
      {/* Top row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Typography sx={{
            fontWeight: 800,
            fontSize: '1.3rem',
            color: 'text.primary',
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}>
            {fleetName}
          </Typography>
          <Box sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '20px',
            padding: '2px 12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'text.secondary',
            background: theme.palette.action.hover,
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
              color: 'text.disabled',
              background: theme.palette.action.hover,
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
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.text.disabled, fontSize: '1rem' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: '12px',
              backgroundColor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
              height: 38,
              fontSize: '0.86rem',
              color: theme.palette.text.primary,
              '& fieldset': { border: 'none' },
            },
          },
        }}
      />

      {/* Filter buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {FILTERS.map(({ id, Icon, color, title }) => {
          const isActiveFilter = activeFilter === id;
          const safeColor = color || '#6366f1';

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
                  borderColor: isActiveFilter ? safeColor : theme.palette.divider,
                  backgroundColor: isActiveFilter ? safeColor : theme.palette.action.hover,
                  boxShadow: isActiveFilter ? `0 0 10px ${safeColor}88` : 'none',
                  '&:hover': {
                    backgroundColor: isActiveFilter ? safeColor : theme.palette.action.selected,
                  },
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
};

export default MainToolbar;
