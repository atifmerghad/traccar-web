import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Switch, IconButton,
    Dialog, DialogTitle, DialogContent, TextField, DialogActions,
    CircularProgress, Snackbar, Alert, Stack
} from '@mui/material';
import { PersonAdd, Refresh, Edit, Block } from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
    root: {
        padding: theme.spacing(3),
        maxWidth: 1200,
        margin: '0 auto',
    },
    headerCard: {
        padding: theme.spacing(2),
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        marginBottom: theme.spacing(3),
        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.05)',
    },
    tablePaper: {
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
    }
}));

const UsersPageNew = () => {
    const { classes } = useStyles();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // New User State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', disabled: false });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            showSnackbar('Error fetching users', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleToggleUser = async (user) => {
        const updatedUser = { ...user, disabled: !user.disabled };
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser),
            });
            if (response.ok) {
                setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
                showSnackbar(`User ${updatedUser.disabled ? 'deactivated' : 'activated'} successfully`);
            }
        } catch (error) {
            showSnackbar('Failed to update user status', 'error');
        }
    };

    const handleAddUser = async () => {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (response.ok) {
                fetchUsers();
                setOpen(false);
                setNewUser({ name: '', email: '', password: '', disabled: false });
                showSnackbar('User added successfully');
            }
        } catch (error) {
            showSnackbar('Error adding user', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    return (
        <Box className={classes.root}>
            {/* Header Section */}
            <Paper className={classes.headerCard} elevation={0}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h5" fontWeight={900} color="#1e293b">Team Management</Typography>
                        <Typography variant="caption" color="textSecondary">Manage and monitor your sub-users access</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <IconButton onClick={fetchUsers} disabled={loading} sx={{ bgcolor: '#f1f5f9' }}>
                            <Refresh fontSize="small" />
                        </IconButton>
                        <Button
                            variant="contained"
                            startIcon={<PersonAdd />}
                            onClick={() => setOpen(true)}
                            sx={{ borderRadius: '12px', bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' } }}
                        >
                            Add User
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Users Table */}
            <TableContainer component={Paper} className={classes.tablePaper} elevation={0}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell fontWeight={600}>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Box sx={{
                                            display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                            bgcolor: user.disabled ? '#fee2e2' : '#dcfce7', color: user.disabled ? '#ef4444' : '#16a34a'
                                        }}>
                                            {user.disabled ? 'Inactive' : 'Active'}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Switch
                                                size="small"
                                                checked={!user.disabled}
                                                onChange={() => handleToggleUser(user)}
                                                color="success"
                                            />
                                            <IconButton size="small"><Edit fontSize="small" /></IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add User Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900 }}>Create New User</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField fullWidth label="Full Name" variant="outlined" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                        <TextField fullWidth label="Email Address" variant="outlined" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                        <TextField fullWidth label="Password" type="password" variant="outlined" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
                    <Button onClick={handleAddUser} variant="contained" sx={{ borderRadius: '12px', bgcolor: '#1e293b' }}>Confirm Creation</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default UsersPageNew;