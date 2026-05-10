import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { GridViewOutlined, LogoutOutlined, CloseOutlined } from '@mui/icons-material';
import Sidebar from './Sidebar';
import {
  PINNED,
  SECTIONS,
  getActiveSectionKey,
  getActivePinnedKey,
  isItemActive,
  visibleItems,
} from './navConfig';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { sessionActions } from '../../store';
import { nativePostMessage } from '../../common/components/NativeInterface';

// First 4 pinned items appear directly in the mobile bottom nav
const MOBILE_DIRECT_KEYS = new Set(['dashboard', 'map', 'reports', 'replay']);
const mobileDirectPinned = PINNED.filter((p) => MOBILE_DIRECT_KEYS.has(p.key));
// Remaining pinned items (Statistics) go into the "More" drawer
const mobileMorePinned = PINNED.filter((p) => !MOBILE_DIRECT_KEYS.has(p.key));

const useStyles = makeStyles({ name: 'PageLayout' })((theme) => ({
  root: {
    display: 'flex',
    height: '100vh',
    backgroundColor: theme.palette.background.default,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: theme.palette.background.default,
  },
  contentMobile: {},
  // Explicit spacer rendered as a DOM element — more reliable than paddingBottom
  // on overflowY:auto containers (iOS Safari ignores padding-bottom in some cases).
  mobileBottomSpacer: {
    flexShrink: 0,
    width: '100%',
    height: `calc(${theme.spacing(10)} + env(safe-area-inset-bottom, 0px))`,
    pointerEvents: 'none',
  },
  mobileSubNav: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.78)
        : alpha(theme.palette.background.paper, 0.82),
    backdropFilter: `blur(${theme.spacing(1.5)})`,
    WebkitBackdropFilter: `blur(${theme.spacing(1.5)})`,
    padding: theme.spacing(1, 1.25),
  },
  mobileBottomNavWrap: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1300,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 0,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.88)
        : alpha(theme.palette.background.paper, 0.9),
    backdropFilter: `blur(${theme.spacing(2)})`,
    WebkitBackdropFilter: `blur(${theme.spacing(2)})`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 ${theme.spacing(1.25)} ${theme.spacing(3.75)} ${alpha(theme.palette.common.black, 0.45)}`
        : `0 ${theme.spacing(1)} ${theme.spacing(3)} ${alpha(theme.palette.common.black, 0.15)}`,
    // Push nav content above the iOS home indicator
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  mobileBottomNav: {
    height: theme.spacing(9),
    borderRadius: 0,
    backgroundColor: 'transparent',
    '& .MuiBottomNavigationAction-root': {
      minWidth: theme.spacing(7),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(0.75),
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: theme.typography.pxToRem(10.9),
      fontWeight: 600,
    },
  },
  // "More" drawer
  moreDrawerPaper: {
    borderTopLeftRadius: theme.spacing(2.5),
    borderTopRightRadius: theme.spacing(2.5),
    maxHeight: '82vh',
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.97)
        : theme.palette.background.paper,
  },
  moreDrawerHandle: {
    width: theme.spacing(5),
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.palette.divider,
    margin: theme.spacing(1.25, 'auto', 0),
  },
  moreDrawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1.5, 2, 0.5),
  },
  moreSectionLabel: {
    fontSize: theme.typography.pxToRem(11),
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: theme.palette.text.disabled,
    padding: theme.spacing(1.25, 2, 0.25),
  },
  moreItem: {
    borderRadius: theme.spacing(1.5),
    margin: theme.spacing(0.1, 1),
    padding: theme.spacing(1.1, 1.5),
  },
  moreItemActive: {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
    '& .MuiListItemText-primary': { color: theme.palette.primary.main, fontWeight: 700 },
    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.16) },
  },
  moreItemIcon: {
    minWidth: theme.spacing(4.5),
    color: theme.palette.text.secondary,
  },
  moreItemText: {
    '& .MuiListItemText-primary': {
      fontSize: theme.typography.pxToRem(14),
      fontWeight: 600,
      color: theme.palette.text.primary,
    },
  },
  moreLogout: {
    borderRadius: theme.spacing(1.5),
    margin: theme.spacing(0.1, 1),
    padding: theme.spacing(1.1, 1.5),
    '& .MuiListItemIcon-root': { color: theme.palette.error.main, minWidth: theme.spacing(4.5) },
    '& .MuiListItemText-primary': {
      fontSize: theme.typography.pxToRem(14),
      fontWeight: 600,
      color: theme.palette.error.main,
    },
  },
}));

// ─── icon pill shared between mobile bottom nav items ───────────────────────
const NavPill = ({ active, children, badgeCount = 0 }) => (
  <Badge
    color="error"
    badgeContent={badgeCount}
    max={99}
    overlap="circular"
    invisible={badgeCount <= 0}
  >
    <Box
      sx={{
        width: (t) => t.spacing(4.25),
        height: (t) => t.spacing(4.25),
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: active ? 'primary.main' : 'action.hover',
        color: active ? 'primary.contrastText' : 'text.secondary',
      }}
    >
      {children}
    </Box>
  </Badge>
);

// ─── PageLayout ─────────────────────────────────────────────────────────────
const PageLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const eventsCount = useSelector((state) => state.events.items.length);
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const t = useTranslation();

  const [moreOpen, setMoreOpen] = useState(false);

  const activePinnedKey = getActivePinnedKey(location.pathname);
  const activeSectionKey = getActiveSectionKey(location.pathname);

  // "More" tab is active whenever the current page is NOT one of the 4 direct tabs
  const moreIsActive = !MOBILE_DIRECT_KEYS.has(activePinnedKey);

  // Value fed to BottomNavigation (maps to one of 4 direct keys or 'more')
  const mobileNavValue = MOBILE_DIRECT_KEYS.has(activePinnedKey) ? activePinnedKey : 'more';

  const mobileSections = useMemo(
    () => SECTIONS.filter((section) => visibleItems(section, user).length > 0),
    [user],
  );

  // Sub-nav chip strip data
  const currentSection = !activePinnedKey
    ? mobileSections.find((s) => s.key === activeSectionKey)
    : null;
  const currentItems = currentSection ? visibleItems(currentSection, user) : [];

  const handleDirectNav = (_, val) => {
    if (val === 'more') {
      setMoreOpen(true);
      return;
    }
    const pinned = PINNED.find((p) => p.key === val);
    if (pinned) navigate(pinned.path);
  };

  const handleMoreItemClick = (path) => {
    navigate(path);
    setMoreOpen(false);
  };

  const handleLogout = async () => {
    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user?.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes?.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...user,
            attributes: {
              ...user.attributes,
              notificationTokens:
                tokens.length > 1
                  ? tokens.filter((it) => it !== notificationToken).join(',')
                  : undefined,
            },
          }),
        });
      }
    }
    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login-new');
    dispatch(sessionActions.updateUser(null));
    setMoreOpen(false);
  };

  return (
    <Box className={classes.root}>
      {desktop && <Sidebar />}
      <Box className={`${classes.content} ${!desktop ? classes.contentMobile : ''}`}>
        {/* Sub-nav chip strip — only for section pages on mobile */}
        {!desktop && currentSection && currentItems.length > 1 && (
          <Box className={classes.mobileSubNav}>
            <Stack direction="row" spacing={0.8} sx={{ overflowX: 'auto', pb: 0.2 }}>
              {currentItems.map((item) => (
                <Chip
                  key={item.key}
                  label={t(item.labelKey)}
                  size="small"
                  color={isItemActive(item, location.pathname) ? 'primary' : 'default'}
                  variant={isItemActive(item, location.pathname) ? 'filled' : 'outlined'}
                  onClick={() => navigate(item.path)}
                  sx={{ borderRadius: (t) => t.spacing(1.25), fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Box>
        )}
        {children}
        {/* Spacer keeps content clear of the fixed bottom nav on mobile.
            A real DOM element is used here because padding-bottom on
            overflow:auto containers is ignored on iOS Safari. */}
        {!desktop && <Box className={classes.mobileBottomSpacer} />}
      </Box>

      {/* ── Mobile bottom nav (max 5 tabs) ── */}
      {!desktop && (
        <>
          <Box className={classes.mobileBottomNavWrap}>
            <BottomNavigation
              value={mobileNavValue}
              onChange={handleDirectNav}
              showLabels
              className={classes.mobileBottomNav}
            >
              {mobileDirectPinned.map((item) => {
                const Icon = item.icon;
                const active = mobileNavValue === item.key;
                return (
                  <BottomNavigationAction
                    key={item.key}
                    label={t(item.labelKey)}
                    value={item.key}
                    icon={
                      <NavPill active={active} badgeCount={item.key === 'map' ? eventsCount : 0}>
                        <Icon fontSize="small" />
                      </NavPill>
                    }
                    sx={{
                      color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                      '&.Mui-selected': { color: theme.palette.primary.main },
                    }}
                  />
                );
              })}

              {/* "More" tab — 5th item */}
              <BottomNavigationAction
                label={t('sharedMore')}
                value="more"
                icon={
                  <NavPill active={moreIsActive}>
                    <GridViewOutlined fontSize="small" />
                  </NavPill>
                }
                sx={{
                  color: moreIsActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&.Mui-selected': { color: theme.palette.primary.main },
                }}
              />
            </BottomNavigation>
          </Box>

          {/* ── "More" bottom drawer ── */}
          <Drawer
            anchor="bottom"
            open={moreOpen}
            onClose={() => setMoreOpen(false)}
            slotProps={{ paper: { className: classes.moreDrawerPaper } }}
          >
            {/* Drag handle */}
            <Box className={classes.moreDrawerHandle} />

            {/* Header */}
            <Box className={classes.moreDrawerHeader}>
              <Typography
                sx={{ fontWeight: 800, fontSize: '1rem', color: theme.palette.text.primary }}
              >
                {t('sharedMore')}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setMoreOpen(false)}
                sx={{ color: theme.palette.text.secondary }}
              >
                <CloseOutlined fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ overflowY: 'auto', pb: 2 }}>
              {/* Statistics (pinned items not in direct nav) */}
              {mobileMorePinned.length > 0 && (
                <>
                  <Typography className={classes.moreSectionLabel}>{t('reportChart')}</Typography>
                  <List dense disablePadding>
                    {mobileMorePinned.map((item) => {
                      const Icon = item.icon;
                      const active = activePinnedKey === item.key;
                      return (
                        <ListItemButton
                          key={item.key}
                          className={`${classes.moreItem} ${active ? classes.moreItemActive : ''}`}
                          onClick={() => handleMoreItemClick(item.path)}
                        >
                          <ListItemIcon className={classes.moreItemIcon}>
                            <Icon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={t(item.labelKey)}
                            className={classes.moreItemText}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </>
              )}

              {/* Section groups */}
              {mobileSections.map((section) => {
                const sectionItems = visibleItems(section, user);
                return (
                  <Box key={section.key}>
                    <Divider sx={{ mx: 2, mt: 1 }} />
                    <Typography className={classes.moreSectionLabel}>
                      {t(section.labelKey)}
                    </Typography>
                    <List dense disablePadding>
                      {sectionItems.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item, location.pathname);
                        return (
                          <ListItemButton
                            key={item.key}
                            className={`${classes.moreItem} ${active ? classes.moreItemActive : ''}`}
                            onClick={() => handleMoreItemClick(item.path)}
                          >
                            <ListItemIcon className={classes.moreItemIcon}>
                              <Icon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t(item.labelKey)}
                              className={classes.moreItemText}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Box>
                );
              })}

              {/* Logout */}
              <Divider sx={{ mx: 2, mt: 1 }} />
              <List dense disablePadding sx={{ mt: 0.5 }}>
                <ListItemButton className={classes.moreLogout} onClick={handleLogout}>
                  <ListItemIcon className={classes.moreItemIcon}>
                    <LogoutOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t('loginLogout')} className={classes.moreItemText} />
                </ListItemButton>
              </List>
            </Box>
          </Drawer>
        </>
      )}
    </Box>
  );
};

export default PageLayout;
