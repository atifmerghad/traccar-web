import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Tooltip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
import { useTranslation } from '../../common/components/LocalizationProvider';

const MainToolbar = ({
  fleetName = 'Fleet',
  deviceCount = 0,
  searchValue = '',
  onSearchChange,
  onFilterClick,
  activeFilter = 'all',
  onToggleCollapse,
}) => {
  const theme = useTheme();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const isDark = theme.palette.mode === 'dark';
  const FILTERS = [
    { id: 'all', Icon: Layers, color: null, title: tt('eventAll', 'All') },
    {
      id: 'moving',
      Icon: ExploreOutlined,
      color: theme.palette.success.main,
      title: tt('eventDeviceMoving', 'Moving'),
    },
    {
      id: 'parked',
      Icon: LocalParkingOutlined,
      color: theme.palette.info.main,
      title: tt('reportStops', 'Parked'),
    },
    {
      id: 'stopped',
      Icon: StopCircleOutlined,
      color: theme.palette.warning.main,
      title: tt('eventDeviceStopped', 'Stopped'),
    },
    {
      id: 'alert',
      Icon: NotificationsNoneOutlined,
      color: theme.palette.error.main,
      title: tt('eventAlarm', 'Alerts'),
    },
    {
      id: 'time',
      Icon: AccessTimeOutlined,
      color: theme.palette.primary.main,
      title: tt('sharedLoading', 'Realtime'),
    },
    {
      id: 'report',
      Icon: DescriptionOutlined,
      color: theme.palette.geometry.main,
      title: tt('reportEvents', 'Report'),
    },
  ];

  return (
    <Box
      sx={{
        padding: theme.spacing(1.5, 1.75),
        backgroundColor: isDark
          ? alpha(theme.palette.background.default, 0.97)
          : alpha(theme.palette.background.paper, 0.97),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
      }}
    >
      {/* Top row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: theme.typography.h5.fontSize,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {fleetName}
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.spacing(2.5),
              padding: theme.spacing(0.25, 1.5),
              fontSize: theme.typography.body2.fontSize,
              fontWeight: 700,
              color: 'text.secondary',
              backgroundColor: theme.palette.action.hover,
              lineHeight: 1.6,
            }}
          >
            {deviceCount}
          </Box>
        </Box>
        <Tooltip title={tt('sharedHide', 'Collapse')}>
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            sx={{
              color: 'text.disabled',
              backgroundColor: theme.palette.action.hover,
              borderRadius: 1,
              width: theme.spacing(3.75),
              height: theme.spacing(3.75),
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder={tt('sharedSearchDevices', 'Search devices...')}
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
              borderRadius: 1.5,
              backgroundColor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
              height: theme.spacing(4.75),
              fontSize: theme.typography.body2.fontSize,
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
          const safeColor = color || theme.palette.primary.main;

          return (
            <Tooltip key={id} title={title || ''} placement="bottom">
              <Box
                onClick={() => onFilterClick?.(id)}
                sx={{
                  width: theme.spacing(4.25),
                  height: theme.spacing(4.25),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: theme.transitions.create(
                    ['background-color', 'border-color', 'box-shadow'],
                    {
                      duration: theme.transitions.duration.shorter,
                    },
                  ),
                  border: '1.5px solid',
                  borderColor: isActiveFilter ? safeColor : theme.palette.divider,
                  backgroundColor: isActiveFilter ? safeColor : theme.palette.action.hover,
                  boxShadow: isActiveFilter
                    ? `0 0 ${theme.spacing(1.25)} ${alpha(safeColor, 0.53)}`
                    : 'none',
                  '&:hover': {
                    backgroundColor: isActiveFilter ? safeColor : theme.palette.action.selected,
                  },
                }}
              >
                <Icon
                  sx={{
                    color: isActiveFilter ? theme.palette.common.white : safeColor,
                    fontSize: 17,
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default MainToolbar;
