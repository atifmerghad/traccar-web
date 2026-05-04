import { useState } from 'react';
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

const useStyles = makeStyles()(() => ({
  root: {
    display: 'flex',
    height: '100vh',
    background: '#080d1a',
    overflow: 'hidden',
  },
  sidebar: {
    width: 64,
    background: 'rgba(8, 13, 26, 0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 10,
    flexShrink: 0,
  },
  logo: {
    width: 40,
    height: 40,
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 12,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'transform 0.2s ease, background 0.2s ease',
  },
  navStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
    width: '100%',
    padding: '0 10px',
    flex: 1,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    padding: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: '#080d1a',
  },
  spacer: { flexGrow: 1 },
  bottomStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
    width: '100%',
    padding: '0 10px',
  },
}));

const NavItem = ({ icon, label, active, onClick }) => {
  const { classes } = useStyles();
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? 'rgba(99,102,241,0.18)'
    : hovered
      ? 'rgba(255,255,255,0.07)'
      : 'transparent';

  const iconColor = active ? '#818cf8' : hovered ? '#94a3b8' : '#475569';

  return (
    <Tooltip title={label} placement="right">
      <IconButton
        className={classes.navBtn}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ backgroundColor: bg, transition: 'background 0.2s ease' }}
      >
        {icon({ style: { fontSize: 22, color: iconColor, transition: 'color 0.2s ease' } })}
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
  const [logoHovered, setLogoHovered] = useState(false);

  const menuItems = [
    { icon: (s) => <HomeOutlined {...s} />, path: '/dashboard', label: 'Dashboard' },
    { icon: (s) => <MapOutlined {...s} />, path: '/map', label: 'Carte' },
    { icon: (s) => <AssessmentOutlined {...s} />, path: '/graph-page', label: 'Statistiques' },
    { icon: (s) => <BarChartOutlined {...s} />, path: '/reports-page', label: 'Rapports' },
    { icon: (s) => <BuildOutlined {...s} />, path: '/maintenances-page', label: 'Maintenance' },
    { icon: (s) => <PersonOutlined {...s} />, path: '/users-new', label: 'Utilisateurs' },
    { icon: (s) => <SettingsOutlined {...s} />, path: '/settings-page', label: 'Paramètres' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
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
      <Box
        className={classes.logo}
        onClick={() => navigate('/dashboard')}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
        style={{ transform: logoHovered ? 'scale(1.08)' : 'scale(1)' }}
        onMouseOver={() => setLogoHovered(true)}
        onMouseOut={() => setLogoHovered(false)}
      >
        <Typography style={{ color: '#818cf8', fontSize: 22, fontWeight: 900, lineHeight: 1 }}>T</Typography>
      </Box>

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

      <Box className={classes.bottomStack}>
        <NavItem
          icon={(s) => <NotificationsNoneOutlined {...s} />}
          label="Notifications"
          active={isActive('/notifications')}
          onClick={() => navigate('/notifications')}
        />
        <NavItem
          icon={(s) => <LogoutOutlined {...s} />}
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
