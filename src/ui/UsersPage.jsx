import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Switch, IconButton,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  CircularProgress, Snackbar, Alert, Stack, Tooltip, InputAdornment,
  Avatar, Chip, Grid,
} from '@mui/material';
import {
  PersonAdd, Edit, Search, AdminPanelSettings, DeleteOutline,
  Person, SupervisorAccount, MyLocation, Login,
  Security, Group, VerifiedUser, DoNotDisturb, Close,
  WarningAmberRounded,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import PageLayout from './PageLayout';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      padding: '24px',
      [theme.breakpoints.down('md')]: { padding: '16px' },
      [theme.breakpoints.down('sm')]: { padding: '12px' },
      background: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },

    statCard: {
      background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.background.paper,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '18px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      minWidth: 130,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: theme.palette.action.selected },
      [theme.breakpoints.down('sm')]: {
        minWidth: 0,
        maxWidth: 'none',
        width: '100%',
        padding: '9px 10px',
        gap: 8,
      },
    },

    tableWrap: {
      background: isDark ? 'rgba(255,255,255,0.03)' : theme.palette.background.paper,
      backdropFilter: 'blur(16px)',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '18px',
      overflowX: 'auto',
      overflowY: 'hidden',
      width: '100%',
      WebkitOverflowScrolling: 'touch',
      [theme.breakpoints.down('sm')]: {
        borderRadius: '12px',
      },
    },

    tableHeadCell: {
      color: theme.palette.text.disabled,
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      borderBottom: `1px solid ${theme.palette.divider}`,
      background: isDark ? 'rgba(255,255,255,0.02)' : theme.palette.action.hover,
      padding: '12px 16px',
      whiteSpace: 'nowrap',
      [theme.breakpoints.down('sm')]: { fontSize: '0.64rem', padding: '10px 12px' },
    },

    tableCell: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: '12px 16px',
      color: theme.palette.text.secondary,
      [theme.breakpoints.down('sm')]: { padding: '10px 12px' },
    },

    tableRow: {
      transition: 'background 0.12s',
      '&:hover': { background: theme.palette.action.hover },
      '&:last-child td': { borderBottom: 'none' },
    },

    inputDark: {
      '& .MuiOutlinedInput-root': {
        background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.action.hover,
        borderRadius: '12px',
        color: theme.palette.text.primary,
        fontSize: '0.87rem',
        '& fieldset': { border: `1px solid ${theme.palette.divider}` },
        '&:hover fieldset': { borderColor: theme.palette.action.selected },
        '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
      },
      '& .MuiInputLabel-root': { color: theme.palette.text.disabled, fontSize: '0.85rem' },
      '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
      '& .MuiFormHelperText-root': { color: theme.palette.text.disabled, fontSize: '0.7rem' },
      '& .MuiInputBase-input': { color: theme.palette.text.primary },
    },

    permToggle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      background: isDark ? 'rgba(255,255,255,0.03)' : theme.palette.action.hover,
      borderRadius: '10px',
      border: `1px solid ${theme.palette.divider}`,
      '&:hover': { background: theme.palette.action.selected },
    },

    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: '8px',
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.disabled,
      '&:hover': { color: theme.palette.text.primary, background: theme.palette.action.selected },
      [theme.breakpoints.down('sm')]: { width: 28, height: 28 },
    },
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUserRole = (user) => {
  if (user.administrator) return { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: AdminPanelSettings };
  if (user.userLimit && user.userLimit !== 0) return { label: 'Manager', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', Icon: SupervisorAccount };
  return { label: 'Utilisateur', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', Icon: Person };
};

const fmtExpiry = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  const expired = d < new Date();
  return { label: d.toLocaleDateString('fr-FR'), expired };
};

const EMPTY_USER = {
  name: '', email: '', password: '', phone: '',
  latitude: 0, longitude: 0, zoom: 0,
  expirationTime: '', deviceLimit: 0, userLimit: 0,
  disabled: false, administrator: false, readonly: false,
  deviceReadonly: false, limitCommands: false, disableReports: false,
  fixedEmail: false, temporary: false,
};

const ROLE_FILTERS = [
  { label: 'Tous', value: 'all', color: '#6366f1' },
  { label: 'Admins', value: 'admin', color: '#f59e0b' },
  { label: 'Managers', value: 'manager', color: '#22c55e' },
  { label: 'Utilisateurs', value: 'user', color: '#3b82f6' },
  { label: 'Désactivés', value: 'disabled', color: '#ef4444' },
];

// ─── Permission toggle row ────────────────────────────────────────────────────

const PermRow = ({ label, field, value, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      px: 1.5, py: 0.8,
      background: isDark ? 'rgba(255,255,255,0.03)' : theme.palette.action.hover,
      borderRadius: '10px',
      border: `1px solid ${theme.palette.divider}`,
      '&:hover': { background: theme.palette.action.selected },
    }}>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 500 }}>{label}</Typography>
      <Switch
        size="small"
        checked={!!value}
        onChange={(e) => onChange(field, e.target.checked)}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#6366f1' },
        }}
      />
    </Box>
  );
};

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = ({ icon, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 1 }}>
    {icon}
    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {label}
    </Typography>
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────

const UsersPageNew = () => {
  const { classes } = useStyles();
  const theme = useTheme();
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
      else toast('Erreur lors du chargement', 'error');
    } catch { toast('Erreur de connexion', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => !u.disabled).length,
    admins: users.filter((u) => u.administrator).length,
    expired: users.filter((u) => u.expirationTime && new Date(u.expirationTime) < new Date()).length,
  }), [users]);

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
    if (user.id === currentUser?.id) { toast('Auto-désactivation impossible', 'warning'); return; }
    const updated = { ...user, disabled: !user.disabled };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch { toast('Erreur mise à jour', 'error'); }
  };

  const handleSave = async () => {
    if (!editUser.name || !editUser.email || (!editUser.id && !editUser.password)) {
      toast('Nom, email et mot de passe requis', 'error');
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
        toast(`Utilisateur ${isEdit ? 'mis à jour' : 'créé'}`);
      } else {
        const msg = await res.text();
        toast(msg || "Erreur lors de l'enregistrement", 'error');
      }
    } catch { toast("Erreur lors de l'enregistrement", 'error'); }
    finally { setSaveLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast('Utilisateur supprimé');
      }
    } catch { toast('Erreur lors de la suppression', 'error'); }
    finally { setDeleteLoading(false); }
  };

  const handleLoginAs = async (userId) => {
    try {
      const res = await fetch(`/api/session/${userId}`, { method: 'POST' });
      if (res.ok) window.location.replace('/');
      else toast('Connexion impossible', 'error');
    } catch { toast('Erreur de connexion', 'error'); }
  };

  const handleGetLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setEditUser((p) => ({ ...p, latitude: coords.latitude, longitude: coords.longitude }));
        toast('Position GPS récupérée');
      },
      () => toast('Géolocalisation impossible', 'error'),
    );
  };

  const set = (field, value) => setEditUser((p) => ({ ...p, [field]: value }));

  const dialogPaper = {
    background: isDark ? '#0f172a' : theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '20px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  };

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.05rem', sm: '1.35rem' }, fontWeight: 800, color: 'text.primary' }}>Utilisateurs</Typography>
            <Typography sx={{ fontSize: { xs: '0.74rem', sm: '0.82rem' }, color: 'text.disabled', mt: 0.4 }}>
              Gestion des comptes et des permissions
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
              { icon: <Group sx={{ fontSize: 18, color: '#6366f1' }} />, value: stats.total, label: 'Total' },
              { icon: <VerifiedUser sx={{ fontSize: 18, color: '#22c55e' }} />, value: stats.active, label: 'Actifs' },
              { icon: <AdminPanelSettings sx={{ fontSize: 18, color: '#f59e0b' }} />, value: stats.admins, label: 'Admins' },
              { icon: <DoNotDisturb sx={{ fontSize: 18, color: '#ef4444' }} />, value: stats.expired, label: 'Expirés' },
            ].map(({ icon, value, label }) => (
              <Box key={label} className={classes.statCard}>
                {icon}
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.1rem' }, color: 'text.primary', lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: { xs: '0.62rem', sm: '0.68rem' }, color: 'text.disabled', mt: 0.2 }}>{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Filter bar ── */}
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher par nom ou email..."
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

          <Stack direction="row" spacing={0.7} flexWrap="wrap" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {ROLE_FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                onClick={() => setRoleFilter(f.value)}
                sx={{
                  height: { xs: 26, sm: 28 }, fontSize: { xs: '0.7rem', sm: '0.76rem' }, fontWeight: 600, cursor: 'pointer',
                  color: roleFilter === f.value ? f.color : theme.palette.text.disabled,
                  borderColor: roleFilter === f.value ? `${f.color}50` : theme.palette.divider,
                  background: roleFilter === f.value ? `${f.color}14` : 'transparent',
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
              onClick={() => { setEditUser(EMPTY_USER); setOpen(true); }}
              sx={{
                bgcolor: '#6366f1', borderRadius: '12px', textTransform: 'none',
                fontWeight: 700, px: 2.5, height: { xs: 34, sm: 36 }, fontSize: { xs: '0.8rem', sm: '0.85rem' }, width: { xs: '100%', sm: 'auto' },
                '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              Nouvel utilisateur
            </Button>
          )}
        </Box>

        {/* ── Table ── */}
        <TableContainer className={classes.tableWrap}>
          <Table sx={{ minWidth: { xs: 760, sm: 700 } }}>
            <TableHead>
              <TableRow>
                {['Utilisateur', 'Rôle', 'Limites', 'Expiration', 'Statut', 'Actions'].map((h) => (
                  <TableCell key={h} className={classes.tableHeadCell}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                    <CircularProgress size={28} sx={{ color: '#6366f1' }} />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: 'none', color: 'text.disabled', fontSize: '0.85rem' }}>
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const role = getUserRole(user);
                  const expiry = fmtExpiry(user.expirationTime);
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <TableRow key={user.id} className={classes.tableRow}>

                      <TableCell className={classes.tableCell}>
                        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
                          <Avatar
                            sx={{
                              width: { xs: 30, sm: 34 }, height: { xs: 30, sm: 34 }, fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 700,
                              bgcolor: `${role.color}28`, color: role.color, border: `1px solid ${role.color}40`,
                            }}
                          >
                            {user.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.88rem' }, color: 'text.primary', lineHeight: 1.2 }}>
                              {user.name}
                              {isSelf && (
                                <Box component="span" sx={{ ml: 1, fontSize: '0.65rem', color: '#6366f1', fontWeight: 700 }}>
                                  (vous)
                                </Box>
                              )}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.72rem' }, color: 'text.disabled', mt: 0.2 }}>{user.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Chip
                          icon={<role.Icon sx={{ fontSize: '13px !important', color: `${role.color} !important` }} />}
                          label={role.label}
                          size="small"
                          sx={{
                            bgcolor: role.bg, color: role.color, fontWeight: 700,
                            fontSize: '0.74rem', height: 24, border: `1px solid ${role.color}30`,
                          }}
                        />
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Stack spacing={0.3}>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            Appareils:{' '}
                            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                              {user.deviceLimit === -1 ? '∞' : user.deviceLimit}
                            </Box>
                          </Typography>
                          {user.userLimit !== undefined && (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Utilisateurs:{' '}
                              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                {user.userLimit === -1 ? '∞' : user.userLimit}
                              </Box>
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        {expiry === '—' ? (
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>Jamais</Typography>
                        ) : (
                          <Typography sx={{ fontSize: '0.82rem', color: expiry.expired ? '#ef4444' : 'text.secondary', fontWeight: expiry.expired ? 600 : 400 }}>
                            {expiry.label}
                            {expiry.expired && <Box component="span" sx={{ ml: 0.5, fontSize: '0.68rem' }}>· Expiré</Box>}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: user.disabled ? '#ef4444' : '#22c55e' }} />
                          <Typography sx={{ fontSize: '0.8rem', color: user.disabled ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                            {user.disabled ? 'Désactivé' : 'Actif'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell className={classes.tableCell}>
                        <Stack direction="row" spacing={0.35} alignItems="center" justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}>
                          <Tooltip title={user.disabled ? 'Activer' : 'Désactiver'}>
                            <Switch
                              size="small"
                              checked={!user.disabled}
                              onChange={() => handleToggle(user)}
                              disabled={isSelf}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#22c55e' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22c55e' },
                              }}
                            />
                          </Tooltip>

                          <Tooltip title="Modifier">
                            <IconButton
                              className={classes.actionBtn}
                              size="small"
                              onClick={() => { setEditUser({ ...EMPTY_USER, ...user, password: '' }); setOpen(true); }}
                            >
                              <Edit sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>

                          {isAdmin && !isSelf && (
                            <Tooltip title="Se connecter en tant que cet utilisateur">
                              <IconButton
                                className={classes.actionBtn}
                                size="small"
                                onClick={() => handleLoginAs(user.id)}
                                sx={{ '&:hover': { color: '#6366f1 !important' } }}
                              >
                                <Login sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isAdmin && !isSelf && (
                            <Tooltip title="Supprimer">
                              <IconButton
                                className={classes.actionBtn}
                                size="small"
                                onClick={() => setDeleteTarget(user)}
                                sx={{ '&:hover': { color: '#ef4444 !important', borderColor: 'rgba(239,68,68,0.3) !important' } }}
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
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaper }}>
          <DialogTitle sx={{ p: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem' }}>
                {editUser.id ? 'Modifier le profil' : 'Nouvel utilisateur'}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.3 }}>
                {editUser.id ? `Édition de ${editUser.name}` : 'Créer un nouveau compte utilisateur'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 3, pb: 2, pt: 0 }}>
            <SectionLabel icon={<Person sx={{ fontSize: 14, color: '#6366f1' }} />} label="Informations du compte" />
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Nom complet" value={editUser.name} onChange={(e) => set('name', e.target.value)} className={classes.inputDark} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Adresse email" type="email" value={editUser.email} onChange={(e) => set('email', e.target.value)} className={classes.inputDark} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label={editUser.id ? 'Nouveau mot de passe' : 'Mot de passe *'}
                  type="password" value={editUser.password} onChange={(e) => set('password', e.target.value)}
                  className={classes.inputDark}
                  helperText={editUser.id ? 'Laisser vide pour conserver' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Téléphone" value={editUser.phone || ''} onChange={(e) => set('phone', e.target.value)} className={classes.inputDark} />
              </Grid>
            </Grid>

            <SectionLabel icon={<Security sx={{ fontSize: 14, color: '#f59e0b' }} />} label="Limites & Expiration" />
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth size="small" label="Date d'expiration" type="date"
                  value={editUser.expirationTime ? editUser.expirationTime.toString().split('T')[0] : ''}
                  onChange={(e) => set('expirationTime', e.target.value || null)}
                  className={classes.inputDark}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth size="small" type="number" label="Limite appareils"
                  value={editUser.deviceLimit} onChange={(e) => set('deviceLimit', parseInt(e.target.value, 10))}
                  className={classes.inputDark} helperText="-1 = illimité · 0 = aucun"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth size="small" type="number" label="Limite utilisateurs"
                  value={editUser.userLimit} onChange={(e) => set('userLimit', parseInt(e.target.value, 10))}
                  className={classes.inputDark} helperText="-1 = illimité · 0 = aucun"
                />
              </Grid>
            </Grid>

            <SectionLabel icon={<MyLocation sx={{ fontSize: 14, color: '#22c55e' }} />} label="Position par défaut" />
            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              <TextField size="small" label="Latitude" type="number" value={editUser.latitude || ''} onChange={(e) => set('latitude', parseFloat(e.target.value))} className={classes.inputDark} sx={{ flex: 1 }} />
              <TextField size="small" label="Longitude" type="number" value={editUser.longitude || ''} onChange={(e) => set('longitude', parseFloat(e.target.value))} className={classes.inputDark} sx={{ flex: 1 }} />
              <TextField size="small" label="Zoom" type="number" value={editUser.zoom || ''} onChange={(e) => set('zoom', parseInt(e.target.value, 10))} className={classes.inputDark} sx={{ width: 90 }} />
              <Tooltip title="Utiliser ma position actuelle">
                <IconButton onClick={handleGetLocation} sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', '&:hover': { bgcolor: 'rgba(34,197,94,0.2)' } }}>
                  <MyLocation sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <SectionLabel icon={<AdminPanelSettings sx={{ fontSize: 14, color: '#a855f7' }} />} label="Permissions" />
            <Grid container spacing={1}>
              {[
                { label: 'Administrateur', field: 'administrator' },
                { label: 'Lecture seule', field: 'readonly' },
                { label: 'Appareils lecture seule', field: 'deviceReadonly' },
                { label: 'Bloquer les commandes', field: 'limitCommands' },
                { label: 'Désactiver les rapports', field: 'disableReports' },
                { label: 'Email fixe', field: 'fixedEmail' },
              ].map(({ label, field }) => (
                <Grid item xs={6} sm={4} key={field}>
                  <PermRow label={label} field={field} value={editUser[field]} onChange={set} />
                </Grid>
              ))}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
            <Button onClick={() => setOpen(false)} sx={{ color: 'text.disabled', textTransform: 'none', borderRadius: '10px', '&:hover': { color: 'text.primary' } }}>
              Annuler
            </Button>
            <Button
              variant="contained" disableElevation onClick={handleSave} disabled={saveLoading}
              sx={{ bgcolor: '#6366f1', borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#4f46e5' }, '&.Mui-disabled': { bgcolor: 'rgba(99,102,241,0.3)', color: 'rgba(255,255,255,0.3)' } }}
            >
              {saveLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : (editUser.id ? 'Enregistrer' : 'Créer')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete confirm dialog ── */}
        <Dialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { ...dialogPaper, border: `1px solid rgba(239,68,68,0.2)` } }}
        >
          <DialogContent sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <WarningAmberRounded sx={{ color: '#ef4444', fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', mb: 0.8 }}>
              Supprimer cet utilisateur ?
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.84rem', lineHeight: 1.6 }}>
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{deleteTarget?.name}</Box>
              {' '}sera définitivement supprimé. Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
            <Button fullWidth onClick={() => setDeleteTarget(null)}
              sx={{ borderRadius: '10px', textTransform: 'none', color: 'text.disabled', border: `1px solid ${theme.palette.divider}`, '&:hover': { border: `1px solid ${theme.palette.action.selected}` } }}>
              Annuler
            </Button>
            <Button fullWidth variant="contained" disableElevation onClick={handleDelete} disabled={deleteLoading}
              sx={{ bgcolor: '#ef4444', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#dc2626' } }}>
              {deleteLoading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Supprimer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ borderRadius: '12px', background: isDark ? '#0f172a' : theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </PageLayout>
  );
};

export default UsersPageNew;
