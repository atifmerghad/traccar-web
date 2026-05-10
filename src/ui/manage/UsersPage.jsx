import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  InputAdornment,
  Avatar,
  Chip,
  Grid,
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Search,
  AdminPanelSettings,
  DeleteOutline,
  Person,
  SupervisorAccount,
  MyLocation,
  Login,
  Security,
  Group,
  VerifiedUser,
  DoNotDisturb,
  Close,
  WarningAmberRounded,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { alpha, useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from '../layout/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      padding: theme.spacing(3),
      [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2.5),
    },

    statCard: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.background.paper,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(2.25),
      padding: theme.spacing(2, 2.5),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.75),
      minWidth: 130,
      transition: theme.transitions.create('border-color', {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': { borderColor: theme.palette.action.selected },
      [theme.breakpoints.down('sm')]: {
        minWidth: 0,
        maxWidth: 'none',
        width: '100%',
        padding: theme.spacing(1.1, 1.25),
        gap: theme.spacing(1),
      },
    },

    tableWrap: {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.03)
        : theme.palette.background.paper,
      backdropFilter: 'blur(16px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(2.25),
      overflowX: 'auto',
      overflowY: 'hidden',
      width: '100%',
      WebkitOverflowScrolling: 'touch',
      [theme.breakpoints.down('sm')]: {
        borderRadius: theme.spacing(1.5),
      },
    },

    tableHeadCell: {
      color: theme.palette.text.disabled,
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      borderBottom: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.02)
        : theme.palette.action.hover,
      padding: theme.spacing(1.5, 2),
      whiteSpace: 'nowrap',
      [theme.breakpoints.down('sm')]: { fontSize: '0.64rem', padding: theme.spacing(1.25, 1.5) },
    },

    tableCell: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1.5, 2),
      color: theme.palette.text.secondary,
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.25, 1.5) },
    },

    tableRow: {
      transition: theme.transitions.create('background-color', {
        duration: theme.transitions.duration.shortest,
      }),
      '&:hover': { backgroundColor: theme.palette.action.hover },
      '&:last-child td': { borderBottom: 'none' },
    },

    inputDark: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.05)
          : theme.palette.action.hover,
        borderRadius: theme.spacing(1.5),
        color: theme.palette.text.primary,
        fontSize: '0.87rem',
        '& fieldset': { border: `1px solid ${theme.palette.divider}` },
        '&:hover fieldset': { borderColor: theme.palette.action.selected },
        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 2 },
      },
      '& .MuiInputLabel-root': { color: theme.palette.text.disabled, fontSize: '0.85rem' },
      '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
      '& .MuiFormHelperText-root': { color: theme.palette.text.disabled, fontSize: '0.7rem' },
      '& .MuiInputBase-input': { color: theme.palette.text.primary },
    },

    permToggle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing(1, 1.5),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.03)
        : theme.palette.action.hover,
      borderRadius: theme.spacing(1.25),
      border: `1px solid ${theme.palette.divider}`,
      '&:hover': { backgroundColor: theme.palette.action.selected },
    },

    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.disabled,
      transition: theme.transitions.create(['color', 'background-color'], {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.action.selected,
      },
      [theme.breakpoints.down('sm')]: { width: 28, height: 28 },
    },
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUserRole = (user, t, theme) => {
  if (user.administrator) {
    return {
      label: t('usersRoleAdmin'),
      color: theme.palette.warning.main,
      bg: alpha(theme.palette.warning.main, 0.12),
      Icon: AdminPanelSettings,
    };
  }
  if (user.userLimit && user.userLimit !== 0) {
    return {
      label: t('usersRoleManager'),
      color: theme.palette.secondary.main,
      bg: alpha(theme.palette.secondary.main, 0.12),
      Icon: SupervisorAccount,
    };
  }
  return {
    label: t('usersRoleUser'),
    color: theme.palette.primary.main,
    bg: alpha(theme.palette.primary.main, 0.12),
    Icon: Person,
  };
};

const fmtExpiry = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  const expired = d < new Date();
  return { label: d.toLocaleDateString(undefined), expired };
};

const EMPTY_USER = {
  name: '',
  email: '',
  password: '',
  phone: '',
  latitude: 0,
  longitude: 0,
  zoom: 0,
  expirationTime: '',
  deviceLimit: 0,
  userLimit: 0,
  disabled: false,
  administrator: false,
  readonly: false,
  deviceReadonly: false,
  limitCommands: false,
  disableReports: false,
  fixedEmail: false,
  temporary: false,
};

// ─── Permission toggle row ────────────────────────────────────────────────────

const PermRow = ({ label, field, value, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1.5,
        py: 0.8,
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.03)
          : theme.palette.action.hover,
        borderRadius: theme.spacing(1.25),
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': { backgroundColor: theme.palette.action.selected },
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 500 }}>
        {label}
      </Typography>
      <Switch
        size="small"
        checked={!!value}
        onChange={(e) => onChange(field, e.target.checked)}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': { color: theme.palette.primary.main },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      />
    </Box>
  );
};

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 1 }}>
    {icon}
    <Typography
      sx={{
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'text.disabled',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}
    >
      {label}
    </Typography>
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────

const UsersPageV2 = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const currentUser = useSelector((state) => state.session.user);
  const isAdmin = currentUser?.administrator;
  const canManage = isAdmin || (currentUser?.userLimit && currentUser.userLimit !== 0);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(EMPTY_USER);
  const [saveLoading, setSaveLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const toast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const roleFilters = useMemo(
    () => [
      { label: t('usersFilterAll'), value: 'all', color: theme.palette.primary.main },
      { label: t('usersFilterAdmins'), value: 'admin', color: theme.palette.warning.main },
      { label: t('usersFilterManagers'), value: 'manager', color: theme.palette.secondary.main },
      { label: t('usersFilterUsers'), value: 'user', color: theme.palette.info.main },
      { label: t('usersFilterDisabled'), value: 'disabled', color: theme.palette.error.main },
    ],
    [t, theme],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
      else toast(t('usersLoadError'), 'error');
    } catch {
      toast(t('usersNetworkError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => !u.disabled).length,
      admins: users.filter((u) => u.administrator).length,
      expired: users.filter((u) => u.expirationTime && new Date(u.expirationTime) < new Date())
        .length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users
      .filter((u) => {
        if (roleFilter === 'admin') return u.administrator;
        if (roleFilter === 'manager') return !u.administrator && u.userLimit && u.userLimit !== 0;
        if (roleFilter === 'user') return !u.administrator && (!u.userLimit || u.userLimit === 0);
        if (roleFilter === 'disabled') return u.disabled;
        return true;
      })
      .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, searchTerm, roleFilter]);

  const handleToggle = async (user) => {
    if (user.id === currentUser?.id) {
      toast(t('usersSelfDisable'), 'warning');
      return;
    }
    const updated = { ...user, disabled: !user.disabled };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch {
      toast(t('usersUpdateError'), 'error');
    }
  };

  const handleSave = async () => {
    if (!editUser.name || !editUser.email || (!editUser.id && !editUser.password)) {
      toast(t('usersRequiredFields'), 'error');
      return;
    }
    setSaveLoading(true);
    const isEdit = !!editUser.id;
    const body = { ...editUser };
    if (isEdit && !body.password) delete body.password;
    try {
      const res = await fetch(isEdit ? `/api/users/${editUser.id}` : '/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchUsers();
        setOpen(false);
        toast(isEdit ? t('usersToastUpdated') : t('usersToastCreated'));
      } else {
        const msg = await res.text();
        toast(msg || t('usersSaveError'), 'error');
      }
    } catch {
      toast(t('usersSaveError'), 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast(t('usersDeleted'));
      }
    } catch {
      toast(t('usersDeleteError'), 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLoginAs = async (userId) => {
    try {
      const res = await fetch(`/api/session/${userId}`, { method: 'POST' });
      if (res.ok) window.location.replace('/');
      else toast(t('usersLoginAsError'), 'error');
    } catch {
      toast(t('usersNetworkError'), 'error');
    }
  };

  const handleGetLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setEditUser((p) => ({ ...p, latitude: coords.latitude, longitude: coords.longitude }));
        toast(t('usersLocationOk'));
      },
      () => toast(t('usersLocationError'), 'error'),
    );
  };

  const set = (field, value) => setEditUser((p) => ({ ...p, [field]: value }));

  const dialogPaper = useMemo(
    () => ({
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(2.5),
      boxShadow: theme.shadows[isDark ? 24 : 8],
    }),
    [theme, isDark],
  );

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', sm: '1.35rem' },
                fontWeight: 800,
                color: 'text.primary',
              }}
            >
              {t('settingsUsers')}
            </Typography>
            <Typography
              sx={{ fontSize: { xs: '0.74rem', sm: '0.82rem' }, color: 'text.disabled', mt: 0.4 }}
            >
              {t('usersPageSubtitle')}
            </Typography>
          </Box>

          <Box
            sx={{
              width: { xs: '100%', sm: 'auto' },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, auto)' },
              gap: { xs: 1, sm: 1.5 },
            }}
          >
            {[
              {
                icon: <Group sx={{ fontSize: 18, color: theme.palette.primary.main }} />,
                value: stats.total,
                label: t('usersStatTotal'),
              },
              {
                icon: <VerifiedUser sx={{ fontSize: 18, color: theme.palette.secondary.main }} />,
                value: stats.active,
                label: t('usersStatActive'),
              },
              {
                icon: (
                  <AdminPanelSettings sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                ),
                value: stats.admins,
                label: t('usersStatAdmins'),
              },
              {
                icon: <DoNotDisturb sx={{ fontSize: 18, color: theme.palette.error.main }} />,
                value: stats.expired,
                label: t('usersStatExpired'),
              },
            ].map(({ icon, value, label }) => (
              <Box key={label} className={classes.statCard}>
                {icon}
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.95rem', sm: '1.1rem' },
                      color: 'text.primary',
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: '0.62rem', sm: '0.68rem' },
                      color: 'text.disabled',
                      mt: 0.2,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Filter bar ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder={t('usersSearchPlaceholder')}
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={classes.inputDark}
            sx={{ minWidth: { xs: '100%', sm: 280 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.disabled', fontSize: 17 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack
            direction="row"
            spacing={0.7}
            flexWrap="wrap"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {roleFilters.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                onClick={() => setRoleFilter(f.value)}
                sx={{
                  height: { xs: 26, sm: 28 },
                  fontSize: { xs: '0.7rem', sm: '0.76rem' },
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: roleFilter === f.value ? f.color : theme.palette.text.disabled,
                  borderColor:
                    roleFilter === f.value ? alpha(f.color, 0.31) : theme.palette.divider,
                  backgroundColor: roleFilter === f.value ? alpha(f.color, 0.08) : 'transparent',
                  border: '1px solid',
                  '&:hover': { borderColor: theme.palette.action.selected },
                }}
              />
            ))}
          </Stack>

          <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />

          {canManage && (
            <Button
              variant="contained"
              disableElevation
              startIcon={<PersonAdd sx={{ fontSize: '16px !important' }} />}
              onClick={() => {
                setEditUser(EMPTY_USER);
                setOpen(true);
              }}
              sx={{
                bgcolor: theme.palette.primary.main,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                height: { xs: 34, sm: 36 },
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {t('usersNewButton')}
            </Button>
          )}
        </Box>

        {/* ── Table ── */}
        <TableContainer className={classes.tableWrap}>
          <Table sx={{ minWidth: { xs: 760, sm: 700 } }}>
            <TableHead>
              <TableRow>
                {[
                  t('usersTableUser'),
                  t('usersTableRole'),
                  t('usersTableLimits'),
                  t('usersTableExpiration'),
                  t('usersTableStatus'),
                  t('usersTableActions'),
                ].map((h) => (
                  <TableCell key={h} className={classes.tableHeadCell}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                    <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 6,
                      borderBottom: 'none',
                      color: 'text.disabled',
                      fontSize: '0.85rem',
                    }}
                  >
                    {t('usersEmpty')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const role = getUserRole(user, t, theme);
                  const expiry = fmtExpiry(user.expirationTime);
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <TableRow key={user.id} className={classes.tableRow}>
                      <TableCell className={classes.tableCell}>
                        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
                          <Avatar
                            sx={{
                              width: { xs: 30, sm: 34 },
                              height: { xs: 30, sm: 34 },
                              fontSize: { xs: '0.75rem', sm: '0.85rem' },
                              fontWeight: 700,
                              bgcolor: alpha(role.color, 0.16),
                              color: role.color,
                              border: `1px solid ${alpha(role.color, 0.25)}`,
                            }}
                          >
                            {user.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '0.8rem', sm: '0.88rem' },
                                color: 'text.primary',
                                lineHeight: 1.2,
                              }}
                            >
                              {user.name}
                              {isSelf && (
                                <Box
                                  component="span"
                                  sx={{
                                    ml: 1,
                                    fontSize: '0.65rem',
                                    color: 'primary.main',
                                    fontWeight: 700,
                                  }}
                                >
                                  {t('usersYouSuffix')}
                                </Box>
                              )}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: { xs: '0.66rem', sm: '0.72rem' },
                                color: 'text.disabled',
                                mt: 0.2,
                              }}
                            >
                              {user.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Chip
                          icon={
                            <role.Icon
                              sx={{
                                fontSize: '13px !important',
                                color: `${role.color} !important`,
                              }}
                            />
                          }
                          label={role.label}
                          size="small"
                          sx={{
                            bgcolor: role.bg,
                            color: role.color,
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            height: 24,
                            border: `1px solid ${alpha(role.color, 0.19)}`,
                          }}
                        />
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Stack spacing={0.3}>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {t('usersDeviceLimitLabel')}{' '}
                            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                              {user.deviceLimit === -1 ? '∞' : user.deviceLimit}
                            </Box>
                          </Typography>
                          {user.userLimit !== undefined && (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              {t('usersUserLimitLabel')}{' '}
                              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                {user.userLimit === -1 ? '∞' : user.userLimit}
                              </Box>
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        {expiry === '—' ? (
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>
                            {t('usersExpiryNever')}
                          </Typography>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: '0.82rem',
                              color: expiry.expired ? 'error.main' : 'text.secondary',
                              fontWeight: expiry.expired ? 600 : 400,
                            }}
                          >
                            {expiry.label}
                            {expiry.expired && (
                              <Box component="span" sx={{ ml: 0.5, fontSize: '0.68rem' }}>
                                {t('usersExpiryExpiredTag')}
                              </Box>
                            )}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              bgcolor: user.disabled ? 'error.main' : 'secondary.main',
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.8rem',
                              color: user.disabled ? 'error.main' : 'secondary.main',
                              fontWeight: 600,
                            }}
                          >
                            {user.disabled ? t('usersStatusDisabled') : t('usersStatusActive')}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Stack
                          direction="row"
                          spacing={0.35}
                          alignItems="center"
                          justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
                        >
                          <Tooltip
                            title={
                              user.disabled ? t('usersTooltipEnable') : t('usersTooltipDisable')
                            }
                          >
                            <Switch
                              size="small"
                              checked={!user.disabled}
                              onChange={() => handleToggle(user)}
                              disabled={isSelf}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: theme.palette.secondary.main,
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: theme.palette.secondary.main,
                                },
                              }}
                            />
                          </Tooltip>

                          <Tooltip title={t('usersTooltipEdit')}>
                            <IconButton
                              className={classes.actionBtn}
                              size="small"
                              onClick={() => {
                                setEditUser({ ...EMPTY_USER, ...user, password: '' });
                                setOpen(true);
                              }}
                            >
                              <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>

                          {isAdmin && !isSelf && (
                            <Tooltip title={t('usersTooltipLoginAs')}>
                              <IconButton
                                className={classes.actionBtn}
                                size="small"
                                onClick={() => handleLoginAs(user.id)}
                                sx={{ '&:hover': { color: 'primary.main' } }}
                              >
                                <Login sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isAdmin && !isSelf && (
                            <Tooltip title={t('usersTooltipDelete')}>
                              <IconButton
                                className={classes.actionBtn}
                                size="small"
                                onClick={() => setDeleteTarget(user)}
                                sx={{
                                  '&:hover': {
                                    color: 'error.main',
                                    borderColor: alpha(theme.palette.error.main, 0.3),
                                  },
                                }}
                              >
                                <DeleteOutline sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Create / Edit Dialog ── */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: dialogPaper }}
        >
          <DialogTitle
            sx={{
              p: '20px 24px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem' }}>
                {editUser.id ? t('usersDialogEditTitle') : t('usersDialogNewTitle')}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.3 }}>
                {editUser.id
                  ? t('usersDialogEditSubtitle').replace('{name}', editUser.name || '')
                  : t('usersDialogNewSubtitle')}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pb: 2, pt: 0 }}>
            <SectionLabel
              icon={<Person sx={{ fontSize: 14, color: theme.palette.primary.main }} />}
              label={t('usersSectionAccount')}
            />
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label={t('usersFullName')}
                  value={editUser.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={classes.inputDark}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label={t('usersEmail')}
                  type="email"
                  value={editUser.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={classes.inputDark}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={editUser.id ? t('usersPasswordNew') : t('usersPasswordRequired')}
                  type="password"
                  value={editUser.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={classes.inputDark}
                  helperText={editUser.id ? t('usersPasswordKeepEmpty') : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('sharedPhone')}
                  value={editUser.phone || ''}
                  onChange={(e) => set('phone', e.target.value)}
                  className={classes.inputDark}
                />
              </Grid>
            </Grid>

            <SectionLabel
              icon={<Security sx={{ fontSize: 14, color: theme.palette.warning.main }} />}
              label={t('usersSectionLimits')}
            />
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t('usersExpirationDate')}
                  type="date"
                  value={
                    editUser.expirationTime ? editUser.expirationTime.toString().split('T')[0] : ''
                  }
                  onChange={(e) => set('expirationTime', e.target.value || null)}
                  className={classes.inputDark}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t('usersDeviceLimit')}
                  value={editUser.deviceLimit}
                  onChange={(e) => set('deviceLimit', parseInt(e.target.value, 10))}
                  className={classes.inputDark}
                  helperText={t('usersLimitHelper')}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t('usersUserLimit')}
                  value={editUser.userLimit}
                  onChange={(e) => set('userLimit', parseInt(e.target.value, 10))}
                  className={classes.inputDark}
                  helperText={t('usersLimitHelper')}
                />
              </Grid>
            </Grid>

            <SectionLabel
              icon={<MyLocation sx={{ fontSize: 14, color: theme.palette.secondary.main }} />}
              label={t('usersSectionDefaultPosition')}
            />
            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label={t('positionLatitude')}
                type="number"
                value={editUser.latitude || ''}
                onChange={(e) => set('latitude', parseFloat(e.target.value))}
                className={classes.inputDark}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label={t('positionLongitude')}
                type="number"
                value={editUser.longitude || ''}
                onChange={(e) => set('longitude', parseFloat(e.target.value))}
                className={classes.inputDark}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label={t('serverZoom')}
                type="number"
                value={editUser.zoom || ''}
                onChange={(e) => set('zoom', parseInt(e.target.value, 10))}
                className={classes.inputDark}
                sx={{ width: 90 }}
              />
              <Tooltip title={t('usersUseMyLocation')}>
                <IconButton
                  onClick={handleGetLocation}
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    borderRadius: theme.spacing(1.25),
                    '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) },
                  }}
                >
                  <MyLocation sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <SectionLabel
              icon={<AdminPanelSettings sx={{ fontSize: 14, color: theme.palette.info.main }} />}
              label={t('serverPermissions')}
            />
            <Grid container spacing={1}>
              {[
                { label: t('usersPermissionAdmin'), field: 'administrator' },
                { label: t('usersPermissionReadonly'), field: 'readonly' },
                { label: t('usersPermissionDeviceReadonly'), field: 'deviceReadonly' },
                { label: t('usersPermissionLimitCommands'), field: 'limitCommands' },
                { label: t('usersPermissionDisableReports'), field: 'disableReports' },
                { label: t('usersPermissionFixedEmail'), field: 'fixedEmail' },
              ].map(({ label, field }) => (
                <Grid item xs={6} sm={4} key={field}>
                  <PermRow label={label} field={field} value={editUser[field]} onChange={set} />
                </Grid>
              ))}
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 2.5,
              pt: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              gap: 1,
            }}
          >
            <Button
              onClick={() => setOpen(false)}
              sx={{
                color: 'text.disabled',
                textTransform: 'none',
                borderRadius: '10px',
                '&:hover': { color: 'text.primary' },
              }}
            >
              {t('sharedCancel')}
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSave}
              disabled={saveLoading}
              sx={{
                bgcolor: theme.palette.primary.main,
                borderRadius: theme.spacing(1.25),
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                '&.Mui-disabled': {
                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                  color: alpha(theme.palette.primary.contrastText, 0.3),
                },
              }}
            >
              {saveLoading ? (
                <CircularProgress size={18} sx={{ color: 'primary.contrastText' }} />
              ) : editUser.id ? (
                t('sharedSave')
              ) : (
                t('usersDialogCreate')
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete confirm dialog ── */}
        <Dialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { ...dialogPaper, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` },
          }}
        >
          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.error.main, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <WarningAmberRounded sx={{ color: theme.palette.error.main, fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', mb: 0.8 }}>
              {t('usersDeleteTitle')}
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.84rem', lineHeight: 1.6 }}>
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {deleteTarget?.name}
              </Box>{' '}
              {t('usersDeleteBody')}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
            <Button
              fullWidth
              onClick={() => setDeleteTarget(null)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                color: 'text.disabled',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': { border: `1px solid ${theme.palette.action.selected}` },
              }}
            >
              {t('sharedCancel')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={handleDelete}
              disabled={deleteLoading}
              sx={{
                bgcolor: theme.palette.error.main,
                borderRadius: theme.spacing(1.25),
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: theme.palette.error.dark },
              }}
            >
              {deleteLoading ? (
                <CircularProgress size={16} sx={{ color: 'primary.contrastText' }} />
              ) : (
                t('sharedDelete')
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{
              borderRadius: theme.spacing(1.5),
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

export default UsersPageV2;
