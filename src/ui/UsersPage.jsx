import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Switch, IconButton,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  CircularProgress, Snackbar, Alert, Stack, Tooltip, InputAdornment,
  Avatar, Chip, Paper, Grid, Card
} from '@mui/material';
import {
  PersonAdd, Edit, Search, AdminPanelSettings,
  Person, SupervisorAccount, MyLocation,
  Security, Group, VerifiedUser, DoNotDisturb
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import PageLayout from './PageLayout';

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(4),
    maxWidth: '100% !important',
    minHeight: '100vh',
    color: '#f1f5f9',
  },
  glassCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
  },
  // Sleek Mini Stat Card Style for the integrated row
  miniStat: {
    padding: '8px 16px',
    background: 'rgba(30, 41, 59, 0.4)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    minWidth: '140px'
  }
}));

const getUserRole = (user) => {
  if (user.administrator) return {
    label: 'Admin', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', Icon: AdminPanelSettings
  };
  if (user.userLimit !== 0) return {
    label: 'Manager', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', Icon: SupervisorAccount
  };
  return {
    label: 'User', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', Icon: Person
  };
};

const SectionBox = ({ title, icon, children }) => (
  <Box sx={{ mb: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, px: 0.5 }}>
      {icon}
      <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </Typography>
    </Stack>
    <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      {children}
    </Paper>
  </Box>
);

const UsersPageNew = () => {
  const { classes } = useStyles();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const initialUserState = {
    name: '', email: '', password: '', phone: '',
    latitude: '', longitude: '',
    expirationTime: '', deviceLimit: 0, userLimit: 0,
    disabled: false, administrator: false, readonly: false,
    deviceReadonly: false, limitCommands: false, disableReports: false,
    fixedEmail: false
  };

  const [newUser, setNewUser] = useState(initialUserState);

  const isDocAdmin = currentUser?.administrator;
  const canManageUsers = isDocAdmin || (currentUser?.userLimit && currentUser.userLimit !== 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, usersRes] = await Promise.all([
        fetch('/api/session'),
        fetch('/api/users'),
      ]);
      if (sessionRes.ok) setCurrentUser(await sessionRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur de connexion', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleUser = async (user) => {
    if (user.id === currentUser?.id) {
      setSnackbar({ open: true, message: 'Auto-désactivation impossible', severity: 'warning' });
      return;
    }
    const updatedUser = { ...user, disabled: !user.disabled };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        setSnackbar({ open: true, message: 'Statut mis à jour', severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Échec de la mise à jour', severity: 'error' });
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setNewUser(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setSnackbar({ open: true, message: 'Position GPS récupérée', severity: 'success' });
      }, () => {
        setSnackbar({ open: true, message: 'Géolocalisation impossible', severity: 'error' });
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email || (!newUser.id && !newUser.password)) {
      setSnackbar({
        open: true,
        message: 'Veuillez remplir les champs obligatoires (Nom, Email, Password)',
        severity: 'error'
      });
      return;
    }

    setSaveLoading(true);
    const method = newUser.id ? 'PUT' : 'POST';
    const url = newUser.id ? `/api/users/${newUser.id}` : '/api/users';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        await fetchData();
        setOpen(false);
        setNewUser(initialUserState);
        setSnackbar({ open: true, message: `Utilisateur ${newUser.id ? 'mis à jour' : 'créé'}`, severity: 'success' });
      } else {
        throw new Error();
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => !u.disabled).length,
    admins: users.filter(u => u.administrator).length,
    expired: users.filter(u => u.expirationTime && new Date(u.expirationTime) < new Date()).length
  };

  const PermissionToggle = ({ label, field }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{
      px: 1.5, py: 0.5,
      bgcolor: 'rgba(255,255,255,0.02)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.03)',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
    }}>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>{label}</Typography>
      <Switch
        size="small"
        checked={newUser[field] || false}
        onChange={(e) => setNewUser({ ...newUser, [field]: e.target.checked })}
      />
    </Stack>
  );

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* SLEEK INTEGRATED HEADER ROW: STATS + SEARCH + ADD BUTTON */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 4, width: '100%', overflowX: 'auto', pb: 1 }}
        >
          {/* STATS SECTION[cite: 5] */}
          <Box className={classes.miniStat}>
            <Group sx={{ color: '#6366f1', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{stats.total}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>Total</Typography>
            </Box>
          </Box>

          <Box className={classes.miniStat}>
            <VerifiedUser sx={{ color: '#22c55e', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{stats.active}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>Actifs</Typography>
            </Box>
          </Box>

          <Box className={classes.miniStat}>
            <AdminPanelSettings sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{stats.admins}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>Admins</Typography>
            </Box>
          </Box>

          <Box className={classes.miniStat}>
            <DoNotDisturb sx={{ color: '#ef4444', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{stats.expired}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>Expirés</Typography>
            </Box>
          </Box>

          {/* SPACER */}
          <Box sx={{ flexGrow: 1 }} />

          {/* SEARCH & ACTIONS[cite: 5] */}
          <TextField
            placeholder="Rechercher..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 300, ...inputStyle }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748b', fontSize: 18 }} /></InputAdornment>
            }}
          />

          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => { setNewUser(initialUserState); setOpen(true); }}
            disabled={!canManageUsers}
            sx={{
              borderRadius: '10px',
              bgcolor: '#6366f1',
              px: 3,
              height: 40,
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            Ajouter
          </Button>
        </Stack>

        {/* TABLE[cite: 5] */}
        <TableContainer component={Paper} className={classes.glassCard}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)' }}>
              <TableRow>
                {['Utilisateur', 'Expiration', 'Rôle & Limites', 'Statut', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
              ) : filteredUsers.map((user) => {
                const role = getUserRole(user);
                return (
                  <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: role.color, width: 36, height: 36 }}>{user.name?.charAt(0).toUpperCase()}</Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{user.name}</Typography>
                          <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>{user.email}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                      {user.expirationTime ? new Date(user.expirationTime).toLocaleDateString() : 'Jamais'}
                    </TableCell>
                    <TableCell>
                      <Chip label={role.label} size="small" sx={{ bgcolor: role.bg, color: role.color, fontWeight: 700, mb: 0.5 }} />
                      <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                        Appareils: {Number(user.deviceLimit) === -1 ? 'Illimité' : user.deviceLimit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: user.disabled ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }} />
                        {user.disabled ? 'Désactivé' : 'Actif'}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Switch checked={!user.disabled} onChange={() => handleToggleUser(user)} size="small" color="success" />
                        <IconButton size="small" sx={{ color: '#6366f1' }} onClick={() => { setNewUser(user); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* MODAL (KEPT AS IS)[cite: 5] */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: '#0f172a', borderRadius: '24px' } }}>
          <DialogTitle sx={{ color: '#fff', p: 3, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{newUser.id ? 'Modifier' : 'Nouveau'} Profil</Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 1, overflowY: 'hidden' }}>
            <Stack spacing={2}>
              <SectionBox title="Informations & Limites" icon={<Person sx={{ color: '#6366f1', fontSize: '1.1rem' }} />}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}><TextField fullWidth size="small" required label="Nom Complet" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} sx={inputStyle} /></Grid>
                  <Grid item xs={12} sm={3}><TextField fullWidth size="small" required label="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} sx={inputStyle} /></Grid>
                  <Grid item xs={12} sm={3}><TextField fullWidth size="small" required={!newUser.id} label="Mot de passe" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} sx={inputStyle} /></Grid>
                  <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Téléphone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} sx={inputStyle} /></Grid>

                  <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="date" label="Expiration" InputLabelProps={{ shrink: true }} value={newUser.expirationTime ? newUser.expirationTime.split('T')[0] : ''} onChange={(e) => setNewUser({ ...newUser, expirationTime: e.target.value })} sx={inputStyle} /></Grid>
                  <Grid item xs={12} sm={2}><TextField fullWidth size="small" type="number" label="Max Appareils" value={newUser.deviceLimit} onChange={(e) => setNewUser({ ...newUser, deviceLimit: e.target.value })} helperText="-1 = Illimité" sx={inputStyle} /></Grid>
                  <Grid item xs={12} sm={2}><TextField fullWidth size="small" type="number" label="Max Utilisateurs" value={newUser.userLimit} onChange={(e) => setNewUser({ ...newUser, userLimit: e.target.value })} sx={inputStyle} /></Grid>
                  <Grid item xs={12} sm={5}>
                    <Stack direction="row" spacing={1}>
                      <TextField fullWidth size="small" label="Lat" value={newUser.latitude} sx={inputStyle} />
                      <TextField fullWidth size="small" label="Lng" value={newUser.longitude} sx={inputStyle} />
                      <IconButton onClick={handleGetLocation} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '8px' }}><MyLocation fontSize="small" /></IconButton>
                    </Stack>
                  </Grid>
                </Grid>
              </SectionBox>

              <SectionBox title="Permissions" icon={<Security sx={{ color: '#6366f1', fontSize: '1.1rem' }} />}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3} md={2.4}><PermissionToggle label="Admin" field="administrator" /></Grid>
                  <Grid item xs={6} sm={3} md={2.4}><PermissionToggle label="Lecture Seule" field="readonly" /></Grid>
                  <Grid item xs={6} sm={3} md={2.4}><PermissionToggle label="App. Lecture" field="deviceReadonly" /></Grid>
                  <Grid item xs={6} sm={3} md={2.4}><PermissionToggle label="Bloquer Cmd" field="limitCommands" /></Grid>
                  <Grid item xs={6} sm={3} md={2.4}><PermissionToggle label="Sans Rapports" field="disableReports" /></Grid>
                </Grid>
              </SectionBox>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setOpen(false)} sx={{ color: '#94a3b8' }}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleSaveUser}
              disabled={saveLoading}
              sx={{ bgcolor: '#6366f1', borderRadius: '10px', px: 4 }}
            >
              {saveLoading ? <CircularProgress size={24} /> : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#fff', borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.03)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1' }
  },
  '& .MuiInputLabel-root': { color: '#64748b', fontSize: '0.85rem' },
  '& .MuiFormHelperText-root': { color: '#64748b', fontSize: '0.6rem' }
};

export default UsersPageNew;