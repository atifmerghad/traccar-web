import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, IconButton, Typography, Tooltip, Divider, Badge } from '@mui/material';
import {
  LogoutOutlined,
  ChevronLeft,
  ChevronRight,
  NotificationsActiveOutlined,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions } from '../../store';
import { nativePostMessage } from '../../common/components/NativeInterface';
import usePersistedState from '../../common/util/usePersistedState';
import EventsDrawerV2 from './EventsDrawerV2';
import { useTranslation } from '../../common/components/LocalizationProvider';
import {
  PINNED,
  SECTIONS,
  isItemActive,
  isSectionActive,
  getActiveSectionKey,
  visibleItems,
} from './navConfig';

const useStyles = makeStyles({ name: 'Sidebar' })((theme) => {
  const isDark = theme.palette.mode === 'dark';
  const panelW = theme.spacing(28);
  return {
    container: {
      display: 'flex',
      height: '100vh',
      flexShrink: 0,
      position: 'relative',
    },
    rail: {
      width: theme.spacing(8),
      flexShrink: 0,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.97)
        : alpha(theme.palette.background.paper, 0.97),
      backdropFilter: `blur(${theme.spacing(2.5)})`,
      WebkitBackdropFilter: `blur(${theme.spacing(2.5)})`,
      borderInlineEnd: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      zIndex: 11,
    },
    logo: {
      width: theme.spacing(5),
      height: theme.spacing(5),
      backgroundColor: alpha(theme.palette.primary.main, 0.15),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.spacing(1.25),
      marginBottom: theme.spacing(1.5),
      cursor: 'pointer',
      flexShrink: 0,
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': { transform: 'scale(1.06)' },
    },
    railStack: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      alignItems: 'center',
      width: '100%',
      padding: theme.spacing(0, 1.25),
    },
    spacer: { flexGrow: 1 },
    sectionDivider: {
      width: theme.spacing(3),
      height: 1,
      backgroundColor: theme.palette.divider,
      margin: theme.spacing(0.75, 0),
      borderRadius: 1,
    },
    railBtn: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      borderRadius: theme.spacing(1.5),
      padding: 0,
      transition: theme.transitions.create('background-color', {
        duration: theme.transitions.duration.shorter,
      }),
      position: 'relative',
    },
    railBtnActive: {
      '&::before': {
        content: '""',
        position: 'absolute',
        insetInlineStart: theme.spacing(-1.25),
        top: theme.spacing(1.25),
        bottom: theme.spacing(1.25),
        width: 3,
        borderStartEndRadius: 3,
        borderEndEndRadius: 3,
        backgroundColor: theme.palette.primary.main,
      },
    },
    railIcon: {
      fontSize: theme.typography.pxToRem(22),
      transition: theme.transitions.create('color', {
        duration: theme.transitions.duration.shorter,
      }),
    },

    pinnedBtn: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      borderRadius: theme.spacing(1.5),
      padding: 0,
      transition: theme.transitions.create(['background-color', 'transform'], {
        duration: theme.transitions.duration.shorter,
      }),
      position: 'relative',
      '&:hover': { transform: 'scale(1.05)' },
    },
    pinnedBtnActive: {
      '&::before': {
        content: '""',
        position: 'absolute',
        insetInlineStart: theme.spacing(-1.25),
        top: theme.spacing(1),
        bottom: theme.spacing(1),
        width: 3,
        borderStartEndRadius: 3,
        borderEndEndRadius: 3,
        backgroundColor: theme.palette.primary.main,
      },
    },

    panel: {
      width: panelW,
      flexShrink: 0,
      backgroundColor: isDark
        ? alpha(theme.palette.background.default, 0.96)
        : theme.palette.background.paper,
      borderInlineEnd: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: theme.transitions.create('width', { duration: 180 }),
    },
    panelCollapsed: {
      width: 0,
      borderInlineEnd: 'none',
    },
    panelHeader: {
      padding: theme.spacing(2.25, 2, 1.5),
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing(1),
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    panelTitle: {
      fontSize: theme.typography.pxToRem(15.2),
      fontWeight: 700,
      color: theme.palette.text.primary,
      lineHeight: 1.2,
    },
    panelSubtitle: {
      fontSize: theme.typography.pxToRem(11.8),
      color: theme.palette.text.secondary,
      marginTop: theme.spacing(0.25),
    },
    panelList: {
      flex: 1,
      overflowY: 'auto',
      padding: theme.spacing(1, 0.75),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
    },
    panelItem: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      padding: theme.spacing(1.125, 1.5),
      borderRadius: theme.spacing(1.25),
      cursor: 'pointer',
      transition: theme.transitions.create(['background-color', 'color'], { duration: 150 }),
      position: 'relative',
      color: theme.palette.text.secondary,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      },
    },
    panelItemActive: {
      backgroundColor: alpha(theme.palette.primary.main, 0.14),
      color: theme.palette.primary.main,
      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
      '&::before': {
        content: '""',
        position: 'absolute',
        insetInlineStart: 0,
        top: theme.spacing(1),
        bottom: theme.spacing(1),
        width: 3,
        borderStartEndRadius: 3,
        borderEndEndRadius: 3,
        backgroundColor: theme.palette.primary.main,
      },
    },
    panelItemIcon: {
      width: theme.spacing(2.75),
      height: theme.spacing(2.75),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    panelItemLabel: {
      flex: 1,
      fontSize: theme.typography.pxToRem(13.8),
      fontWeight: 600,
      textAlign: 'start',
    },
    collapseBtn: {
      width: theme.spacing(3.25),
      height: theme.spacing(3.25),
      borderRadius: theme.spacing(1),
      color: theme.palette.text.disabled,
      '&:hover': {
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.action.hover,
      },
    },
    panelExpandFloater: {
      position: 'absolute',
      top: '50%',
      insetInlineStart: `calc(${theme.spacing(8)} - ${theme.spacing(1.5)})`,
      transform: 'translateY(-50%)',
      width: theme.spacing(3),
      height: theme.spacing(4.5),
      borderStartEndRadius: theme.spacing(0.75),
      borderEndEndRadius: theme.spacing(0.75),
      backgroundColor: isDark
        ? alpha(theme.palette.primary.main, 0.18)
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderInlineStart: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: theme.palette.text.secondary,
      zIndex: 12,
      opacity: 0,
      transition: theme.transitions.create('opacity', { duration: 180 }),
      '&:hover': {
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.action.hover,
      },
    },
    panelExpandFloaterVisible: { opacity: 1 },
  };
});

// ───────────────────────────────────────────────────────────────────────────────

const RailButton = ({ active, onClick, tooltip, Icon, classes, badgeCount = 0 }) => {
  const theme = useTheme();
  const tipSide = theme.direction === 'rtl' ? 'left' : 'right';
  return (
    <Tooltip title={tooltip} placement={tipSide}>
      <IconButton
        className={`${classes.railBtn} ${active ? classes.railBtnActive : ''}`}
        sx={{ bgcolor: active ? alpha(theme.palette.primary.main, 0.14) : 'transparent' }}
        onClick={onClick}
      >
        <Badge
          color="error"
          badgeContent={badgeCount}
          max={99}
          overlap="circular"
          invisible={badgeCount <= 0}
        >
          <Icon
            className={classes.railIcon}
            sx={{ color: active ? 'primary.main' : 'text.disabled' }}
          />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

const PinnedButton = ({ item, active, onClick, classes }) => {
  const theme = useTheme();
  const t = useTranslation();
  const Icon = item.icon;

  const tipSide = theme.direction === 'rtl' ? 'left' : 'right';
  return (
    <Tooltip title={t(item.labelKey)} placement={tipSide}>
      <IconButton
        className={`${classes.pinnedBtn} ${active ? classes.pinnedBtnActive : ''}`}
        sx={{ bgcolor: active ? alpha(theme.palette.primary.main, 0.18) : 'transparent' }}
        onClick={onClick}
      >
        <Icon
          className={classes.railIcon}
          sx={{
            color: active ? 'primary.main' : 'text.secondary',
            fontSize: theme.typography.pxToRem(24),
          }}
        />
      </IconButton>
    </Tooltip>
  );
};

// ───────────────────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const t = useTranslation();

  const [collapsed, setCollapsed] = usePersistedState('sidebarPanelCollapsed', false);
  const [hoveringEdge, setHoveringEdge] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const eventsCount = useSelector((state) => state.events.items.length);

  const lastVisited = useRef({});

  useEffect(() => {
    const matched = SECTIONS.find((s) => isSectionActive(s, location.pathname));
    if (matched) lastVisited.current[matched.key] = location.pathname;
  }, [location.pathname]);

  const initialSection = useMemo(
    () => getActiveSectionKey(location.pathname) || SECTIONS[0].key,
    [],
  );
  const [selectedKey, setSelectedKey] = useState(initialSection);

  useEffect(() => {
    const matched = getActiveSectionKey(location.pathname);
    if (matched) setSelectedKey(matched);
  }, [location.pathname]);

  const selectedSection = useMemo(
    () => SECTIONS.find((s) => s.key === selectedKey) || SECTIONS[0],
    [selectedKey],
  );

  const visibleSelectedItems = useMemo(
    () => visibleItems(selectedSection, user),
    [selectedSection, user],
  );

  const onPinnedClick = (item) => {
    navigate(item.path);
    setCollapsed(true); // give full width to dashboard/map
  };

  const onRailSectionClick = (section) => {
    if (selectedKey === section.key && !collapsed) {
      setCollapsed(true);
      return;
    }
    setCollapsed(false);
    setSelectedKey(section.key);
    if (!isSectionActive(section, location.pathname)) {
      const target =
        lastVisited.current[section.key] ||
        visibleItems(section, user)[0]?.path ||
        section.items[0].path;
      navigate(target);
    }
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
            notificationTokens:
              tokens.length > 1
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

  const topSections = SECTIONS.filter((s) => s.placement !== 'bottom');
  const bottomSections = SECTIONS.filter((s) => s.placement === 'bottom');

  return (
    <Box className={classes.container}>
      {/* Tier 1 — Rail */}
      <Box
        className={classes.rail}
        onMouseEnter={() => setHoveringEdge(true)}
        onMouseLeave={() => setHoveringEdge(false)}
      >
        {/* Logo */}
        <Box className={classes.logo} onClick={() => navigate('/dashboard')}>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: theme.typography.pxToRem(22),
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            G
          </Typography>
        </Box>

        {/* Pinned items — direct single-click navigation */}
        <Box className={classes.railStack} sx={{ mb: 0.5 }}>
          {PINNED.map((item) => (
            <PinnedButton
              key={item.key}
              item={item}
              active={isItemActive(item, location.pathname)}
              onClick={() => onPinnedClick(item)}
              classes={classes}
            />
          ))}
        </Box>

        {/* Divider between pinned and sections */}
        <Divider className={classes.sectionDivider} />

        {/* Section buttons */}
        <Box className={classes.railStack} sx={{ mt: 0.5 }}>
          {topSections.map((section, idx) => (
            <Box
              key={section.key}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
              }}
            >
              {idx > 0 && <Divider className={classes.sectionDivider} />}
              <RailButton
                Icon={section.icon}
                active={selectedKey === section.key && !collapsed}
                tooltip={t(section.labelKey)}
                onClick={() => onRailSectionClick(section)}
                classes={classes}
              />
            </Box>
          ))}
        </Box>

        <Box className={classes.spacer} />

        <Box className={classes.railStack}>
          <Divider className={classes.sectionDivider} />
          {bottomSections.map((section) => (
            <RailButton
              key={section.key}
              Icon={section.icon}
              active={selectedKey === section.key && !collapsed}
              tooltip={t(section.labelKey)}
              onClick={() => onRailSectionClick(section)}
              classes={classes}
            />
          ))}
          <RailButton
            Icon={NotificationsActiveOutlined}
            active={eventsOpen}
            badgeCount={eventsCount}
            tooltip={t('reportEvents') || 'Events'}
            onClick={() => setEventsOpen(true)}
            classes={classes}
          />
          <RailButton
            Icon={LogoutOutlined}
            active={false}
            tooltip={t('loginLogout')}
            onClick={handleLogout}
            classes={classes}
          />
        </Box>
      </Box>

      {/* Tier 2 — Panel */}
      <Box className={`${classes.panel} ${collapsed ? classes.panelCollapsed : ''}`}>
        {!collapsed && (
          <>
            <Box className={classes.panelHeader}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography className={classes.panelTitle}>
                  {t(selectedSection.labelKey)}
                </Typography>
                {selectedSection.descriptionKey && (
                  <Typography className={classes.panelSubtitle}>
                    {t(selectedSection.descriptionKey)}
                  </Typography>
                )}
              </Box>
              <Tooltip title={t('sharedRemove') || 'Collapse'}>
                <IconButton
                  size="small"
                  className={classes.collapseBtn}
                  onClick={() => setCollapsed(true)}
                >
                  {theme.direction === 'rtl' ? (
                    <ChevronRight fontSize="small" />
                  ) : (
                    <ChevronLeft fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
            <Box className={classes.panelList}>
              {visibleSelectedItems.map((item) => {
                const ItemIcon = item.icon;
                const active = isItemActive(item, location.pathname);
                return (
                  <Box
                    key={item.key}
                    className={`${classes.panelItem} ${active ? classes.panelItemActive : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Box className={classes.panelItemIcon}>
                      <ItemIcon fontSize="small" />
                    </Box>
                    <Typography className={classes.panelItemLabel}>{t(item.labelKey)}</Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Box>

      {/* Floating expand handle when panel is collapsed */}
      {collapsed && (
        <Box
          className={`${classes.panelExpandFloater} ${hoveringEdge ? classes.panelExpandFloaterVisible : ''}`}
          onMouseEnter={() => setHoveringEdge(true)}
          onMouseLeave={() => setHoveringEdge(false)}
          onClick={() => setCollapsed(false)}
        >
          {theme.direction === 'rtl' ? (
            <ChevronLeft fontSize="small" />
          ) : (
            <ChevronRight fontSize="small" />
          )}
        </Box>
      )}
      <EventsDrawerV2 open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </Box>
  );
};

export default Sidebar;
