import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Stack,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Edit,
  DeleteOutline,
  Close,
  Add,
  FolderOutlined,
  AccountTreeOutlined,
  DirectionsCarOutlined,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import PageLayout from '../layout/PageLayout';
import { groupsActions } from '../../store';
import {
  useManageStyles,
  PageHeader,
  StatCard,
  EmptyState,
  CardSkeletons,
  ConfirmDeleteDialog,
} from './_shared.jsx';

// ── Group dialog ──────────────────────────────────────────────────────────────

const GroupDialog = ({ open, onClose, onSaved, editing, allGroups }) => {
  const { classes } = useManageStyles();
  const t = useTranslation();
  const isEdit = !!editing;
  const [form, setForm] = useState({ name: '', groupId: 0, attributes: {} });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name || '',
            groupId: editing.groupId || 0,
            attributes: { ...(editing.attributes || {}) },
          }
        : { name: '', groupId: 0, attributes: {} },
    );
    setNewKey('');
    setNewValue('');
    setError('');
  }, [open, editing]);

  const valid = form.name.trim();

  const parentOptions = useMemo(() => {
    if (!editing) return allGroups;
    const blocked = new Set([editing.id]);
    let changed = true;
    while (changed) {
      changed = false;
      allGroups.forEach((g) => {
        if (g.groupId && blocked.has(g.groupId) && !blocked.has(g.id)) {
          blocked.add(g.id);
          changed = true;
        }
      });
    }
    return allGroups.filter((g) => !blocked.has(g.id));
  }, [editing, allGroups]);

  const addAttr = () => {
    const k = newKey.trim();
    if (!k) return;
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [k]: newValue } }));
    setNewKey('');
    setNewValue('');
  };

  const removeAttr = (k) => {
    setForm((f) => {
      const next = { ...f.attributes };
      delete next[k];
      return { ...f, attributes: next };
    });
  };

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...(editing || {}),
        name: form.name.trim(),
        groupId: form.groupId || 0,
        attributes: form.attributes,
      };
      await fetchOrThrow(isEdit ? `/api/groups/${editing.id}` : '/api/groups', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (e) {
      setError(e.message || t('groupsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ className: classes.dialogPaper }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {isEdit ? t('groupsDialogEdit') : t('groupsDialogNew')}
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label={t('sharedName')}
            className={classes.inputDark}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            size="small"
            autoFocus
          />

          <FormControl className={classes.inputDark} size="small" fullWidth>
            <InputLabel>{t('groupsParentGroup')}</InputLabel>
            <Select
              label={t('groupsParentGroup')}
              value={form.groupId || 0}
              onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })}
            >
              <MenuItem value={0}>
                <em>{t('groupNoGroup')}</em>
              </MenuItem>
              {parentOptions.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 0.5 }} />
          <Typography className={classes.sectionLabel}>{t('sharedAttributes')}</Typography>

          {Object.entries(form.attributes).length > 0 && (
            <Stack spacing={1}>
              {Object.entries(form.attributes).map(([k, v]) => (
                <Box key={k} className={classes.attrRow}>
                  <TextField
                    size="small"
                    className={classes.inputDark}
                    value={k}
                    disabled
                    sx={{ flex: '0 0 35%' }}
                  />
                  <TextField
                    size="small"
                    className={classes.inputDark}
                    value={String(v)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        attributes: { ...f.attributes, [k]: e.target.value },
                      }))
                    }
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeAttr(k)}
                    className={classes.iconBtn}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}

          <Box className={classes.attrRow}>
            <TextField
              size="small"
              placeholder={t('groupsAttrKeyPlaceholder')}
              className={classes.inputDark}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              sx={{ flex: '0 0 35%' }}
            />
            <TextField
              size="small"
              placeholder={t('groupsAttrValuePlaceholder')}
              className={classes.inputDark}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={addAttr}
              className={classes.iconBtn}
              disabled={!newKey.trim()}
            >
              <Add fontSize="small" />
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={save}
          disabled={!valid || saving}
          variant="contained"
          disableElevation
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {saving ? t('sharedSaving') : t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const GroupsPageV2 = () => {
  const { classes } = useManageStyles();
  const theme = useTheme();
  const t = useTranslation();
  const dispatch = useDispatch();

  const groupsMap = useSelector((state) => state.groups.items);
  const devicesMap = useSelector((state) => state.devices.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/groups');
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      dispatch(groupsActions.refresh(list));
    } catch {
      setSnack({ open: true, msg: t('groupsLoadError'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dispatch, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => (it.name || '').toLowerCase().includes(q));
  }, [items, search]);

  const childCounts = useMemo(() => {
    const counts = {};
    items.forEach((g) => {
      if (g.groupId) counts[g.groupId] = (counts[g.groupId] || 0) + 1;
    });
    return counts;
  }, [items]);

  const deviceCounts = useMemo(() => {
    const counts = {};
    Object.values(devicesMap || {}).forEach((d) => {
      if (d.groupId) counts[d.groupId] = (counts[d.groupId] || 0) + 1;
    });
    return counts;
  }, [devicesMap]);

  const stats = useMemo(
    () => ({
      total: items.length,
      nested: items.filter((it) => it.groupId).length,
      rooted: items.filter((it) => !it.groupId).length,
    }),
    [items],
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const onSaved = () => {
    setDialogOpen(false);
    setEditing(null);
    setSnack({ open: true, msg: t('groupsSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetchOrThrow(`/api/groups/${confirmDelete.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('groupsDeleted'), severity: 'success' });
      setConfirmDelete(null);
      reload();
    } catch {
      setSnack({ open: true, msg: t('groupsDeleteError'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const hasLinkedItems = (item) => item && (childCounts[item.id] || deviceCounts[item.id]);

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<FolderOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('settingsGroups')}
          subtitle={t('groupsPageSubtitle')}
          onRefresh={reload}
          onCreate={openCreate}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<FolderOutlined fontSize="small" />}
            label={t('driversStatTotal')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<AccountTreeOutlined fontSize="small" />}
            label={t('groupsStatRoots')}
            value={stats.rooted}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<SubdirectoryArrowRight fontSize="small" />}
            label={t('groupsStatNested')}
            value={stats.nested}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
        </Box>

        <TextField
          className={classes.searchField}
          placeholder={t('groupsSearchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <CardSkeletons classes={classes} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('groupsEmptyTitle')}
            hint={t('groupsEmptyHint')}
            ctaLabel={t('groupsNewGroup')}
            onCta={openCreate}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => {
              const parent = it.groupId ? groupsMap?.[it.groupId] : null;
              const attrEntries = Object.entries(it.attributes || {});
              const subCount = childCounts[it.id] || 0;
              const devCount = deviceCounts[it.id] || 0;
              return (
                <Box key={it.id} className={classes.card}>
                  <Box className={classes.cardHeader}>
                    <Box className={classes.groupIconBox}>
                      <FolderOutlined fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className={classes.cardTitle}>{it.name}</Typography>
                      <Typography className={classes.cardSub}>
                        {parent ? `↳ ${parent.name}` : t('groupsRootLabel')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      icon={<DirectionsCarOutlined />}
                      label={t('groupsDeviceCountShort').replace('{n}', String(devCount))}
                      className={classes.countChip}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.14),
                        color: theme.palette.primary.main,
                        '& .MuiChip-icon': { color: theme.palette.primary.main },
                      }}
                    />
                    {subCount > 0 && (
                      <Chip
                        size="small"
                        icon={<SubdirectoryArrowRight />}
                        label={t('groupsSubCountShort').replace('{n}', String(subCount))}
                        className={classes.countChip}
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.14),
                          color: theme.palette.warning.main,
                          '& .MuiChip-icon': { color: theme.palette.warning.main },
                        }}
                      />
                    )}
                  </Box>

                  {attrEntries.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {attrEntries.slice(0, 3).map(([k, v]) => (
                        <Box key={k} className={classes.attrPair}>
                          <span className={classes.attrKey}>{k}:</span>
                          <span className={classes.attrValue}>{String(v)}</span>
                        </Box>
                      ))}
                      {attrEntries.length > 3 && (
                        <Chip
                          size="small"
                          label={`+${attrEntries.length - 3}`}
                          sx={{
                            height: 22,
                            fontSize: theme.typography.caption.fontSize,
                            bgcolor: theme.palette.action.hover,
                            color: 'text.secondary',
                          }}
                        />
                      )}
                    </Box>
                  )}

                  <Box className={classes.actionRow}>
                    <Tooltip title={t('sharedEdit')}>
                      <IconButton
                        size="small"
                        className={classes.iconBtn}
                        onClick={() => openEdit(it)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('sharedDelete')}>
                      <IconButton
                        size="small"
                        className={classes.iconBtn}
                        onClick={() => setConfirmDelete(it)}
                        sx={{
                          '&:hover': {
                            color: theme.palette.error.main,
                            borderColor: alpha(theme.palette.error.main, 0.4),
                          },
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <GroupDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
        editing={editing}
        allGroups={items}
      />

      <ConfirmDeleteDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        deleting={deleting}
        title={t('groupsDeleteTitle')}
        target={confirmDelete?.name}
        warning={hasLinkedItems(confirmDelete) ? t('groupsDeleteHasChildrenWarning') : undefined}
        classes={classes}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default GroupsPageV2;
