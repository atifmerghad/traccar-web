import React from 'react';
import {
  Box, IconButton, Typography, useMediaQuery, useTheme, Tooltip,
} from '@mui/material';
import {
  HomeOutlined, MapOutlined, AssessmentOutlined, BarChartOutlined,
  BuildOutlined, PersonOutlined, SettingsOutlined,
  NotificationsNoneOutlined, LogoutOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions } from '../store';
import { nativePostMessage } from '../common/components/NativeInterface';

// Only static styles — NO pseudo-selectors (&:hover, & .Mui...) anywhere
const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: theme.palette.grey[100] || theme.palette.background.default,
    overflow: 'hidden',
  },
  sidebar: {
    width: 64,
    backgroundColor: theme.palette.primary.dark || theme.palette.grey[800],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    gap: theme.spacing(2),
    zIndex: 10,
    flexShrink: 0,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: theme.palette.primary.main || theme.palette.grey[700],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
  },
  logoText: {
    color: theme.palette.common.white,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 1,
  },
  navStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    alignItems: 'center',
    width: '100%',
  },
  iconButton: {
    borderRadius: '12px',
    padding: '12px',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  spacer: { flexGrow: 1 },
  bottomStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'center',
    width: '100%',
  },
}));

// Nav item — hover handled via React state, not CSS pseudo-selectors
const NavItem = ({ icon, label, active, onClick }) => {
  const { classes } = useStyles();
  const [hovered, setHovered] = React.useState(false);

  return (
    <Tooltip title={label} placement="right">
      <IconButton
        className={classes.iconButton}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          color: '#ffffff',
          backgroundColor: active
            ? '#334155'
            : hovered
              ? 'rgba(255,255,255,0.1)'
              : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        {React.cloneElement(icon, { style: { fontSize: 24, color: '#ffffff' } })}
      </IconButton>
    </Tooltip>
  );
};

const PageLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const [logoHovered, setLogoHovered] = React.useState(false);

  const menuItems = [
    { icon: <HomeOutlined />, path: '/dashboard', label: 'Dashboard' },
    { icon: <MapOutlined />, path: '/map', label: 'Carte' },
    { icon: <AssessmentOutlined />, path: '/graph-page', label: 'Statistiques' },
    { icon: <BarChartOutlined />, path: '/reports-page', label: 'Rapports' },
    { icon: <BuildOutlined />, path: '/maintenances-page', label: 'Maintenance' },
    { icon: <PersonOutlined />, path: '/users-new', label: 'Utilisateurs' },
    { icon: <SettingsOutlined />, path: '/settings-page', label: 'Paramètres' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user?.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes?.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens: tokens.length > 1
              ? tokens.filter((it) => it !== notificationToken).join(',')
              : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }
    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login-new');
    dispatch(sessionActions.updateUser(null));
  };

  const SidebarContent = (
    <Box className={classes.sidebar}>
      {/* Logo */}
      <Box
        className={classes.logo}
        onClick={() => navigate('/dashboard')}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        style={{
          transform: logoHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
      >
        <Typography className={classes.logoText}>T</Typography>
      </Box>

      {/* Main nav */}
      <Box className={classes.navStack}>
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </Box>

      <Box className={classes.spacer} />

      {/* Bottom actions */}
      <Box className={classes.bottomStack}>
        <NavItem
          icon={<NotificationsNoneOutlined />}
          label="Notifications"
          active={isActive('/notifications')}
          onClick={() => navigate('/notifications')}
        />
        <NavItem
          icon={<LogoutOutlined />}
          label="Déconnexion"
          active={false}
          onClick={handleLogout}
        />
      </Box>
    </Box>
  );

  return (
    <Box className={classes.root}>
      {desktop && SidebarContent}
      <Box className={classes.content}>
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
