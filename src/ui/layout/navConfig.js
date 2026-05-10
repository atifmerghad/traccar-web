import {
  MapOutlined,
  HomeOutlined,
  HistoryOutlined,
  BarChartOutlined,
  AssessmentOutlined,
  BuildOutlined,
  NotificationsOutlined,
  PersonPinOutlined,
  AccountTreeOutlined,
  ManageAccountsOutlined,
  SettingsOutlined,
  TuneOutlined,
  AdminPanelSettingsOutlined,
  DirectionsCarOutlined,
  SettingsRemoteOutlined,
  EventAvailableOutlined,
  DataObjectOutlined,
  StorageOutlined,
  CampaignOutlined,
} from '@mui/icons-material';

/**
 * PINNED items appear directly in the rail as single-click shortcuts.
 * They have no sub-panel and collapse the sidebar when activated.
 * labelKey: i18n key (see resources/l10n/*.json).
 */
export const PINNED = [
  { key: 'dashboard', icon: HomeOutlined, labelKey: 'navDashboard', path: '/dashboard' },
  { key: 'map', icon: MapOutlined, labelKey: 'mapTitle', path: '/map' },
  { key: 'reports', icon: BarChartOutlined, labelKey: 'reportTitle', path: '/reports-page' },
  { key: 'graph', icon: AssessmentOutlined, labelKey: 'statisticsTitle', path: '/graph-page' },
  { key: 'replay', icon: HistoryOutlined, labelKey: 'reportReplay', path: '/replay-new' },
];

/**
 * Sidebar sections (tier-2 panel).
 * Optional fields:
 *   - adminOnly: only visible to administrators
 *   - placement: 'top' (default) or 'bottom' for the rail position
 */
export const SECTIONS = [
  {
    key: 'manage',
    labelKey: 'navManagementSection',
    descriptionKey: 'navManagementDescription',
    icon: AdminPanelSettingsOutlined,
    placement: 'top',
    items: [
      {
        key: 'devices',
        icon: DirectionsCarOutlined,
        labelKey: 'deviceTitle',
        path: '/devices-new',
      },
      { key: 'groups', icon: AccountTreeOutlined, labelKey: 'settingsGroups', path: '/groups-new' },
      { key: 'drivers', icon: PersonPinOutlined, labelKey: 'sharedDrivers', path: '/drivers-new' },
      {
        key: 'maintenance',
        icon: BuildOutlined,
        labelKey: 'sharedMaintenance',
        path: '/maintenances-page',
      },
      {
        key: 'notifications',
        icon: NotificationsOutlined,
        labelKey: 'sharedNotifications',
        path: '/notifications-new',
      },
      {
        key: 'commands',
        icon: SettingsRemoteOutlined,
        labelKey: 'navCommands',
        path: '/commands-new',
      },
      {
        key: 'calendars',
        icon: EventAvailableOutlined,
        labelKey: 'sharedCalendars',
        path: '/calendars-new',
      },
      {
        key: 'attributes',
        icon: DataObjectOutlined,
        labelKey: 'sharedComputedAttributes',
        path: '/attributes-new',
        adminOnly: true,
      },
      { key: 'users', icon: ManageAccountsOutlined, labelKey: 'settingsUsers', path: '/users-new' },
    ],
  },
  {
    key: 'system',
    labelKey: 'navSystemSection',
    descriptionKey: 'navSystemDescription',
    icon: SettingsOutlined,
    placement: 'bottom',
    items: [
      { key: 'settings', icon: SettingsOutlined, labelKey: 'settingsUser', path: '/settings-page' },
      {
        key: 'preferences',
        icon: TuneOutlined,
        labelKey: 'sharedPreferences',
        path: '/preferences-new',
      },
      {
        key: 'announcements',
        icon: CampaignOutlined,
        labelKey: 'navAnnouncements',
        path: '/announcements-new',
        adminOnly: true,
      },
      {
        key: 'server',
        icon: StorageOutlined,
        labelKey: 'settingsServer',
        path: '/server-new',
        adminOnly: true,
      },
    ],
  },
];

export const isItemActive = (item, pathname) => {
  if (!item?.path) return false;
  const base = item.path.split('?')[0];
  if (base === '/dashboard') return pathname === '/' || pathname === '/dashboard';
  return pathname.startsWith(base);
};

export const isSectionActive = (section, pathname) =>
  section.items.some((item) => isItemActive(item, pathname));

export const getActiveSectionKey = (pathname) =>
  SECTIONS.find((s) => isSectionActive(s, pathname))?.key || null;

export const getActivePinnedKey = (pathname) =>
  PINNED.find((p) => isItemActive(p, pathname))?.key || null;

export const visibleItems = (section, user) =>
  section.items.filter((item) => !item.adminOnly || user?.administrator);
