import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Edit,
  DeleteOutline,
  Close,
  PersonOutlined,
  BadgeOutlined,
  KeyOutlined,
  ExpandMore,
  ContentCopy,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import PageLayout from '../layout/PageLayout';
import AttributesEditor from '../system/AttributesEditor.jsx';
import {
  useManageStyles,
  PageHeader,
  StatCard,
  EmptyState,
  CardSkeletons,
  ConfirmDeleteDialog,
} from './_shared.jsx';

const buildDriverAttributeDefs = (t) => ({
  phone: { name: t('sharedPhone'), type: 'string' },
  email: { name: t('userEmail'), type: 'string' },
  licenseNumber: { name: t('driverAttrLicenseNumber'), type: 'string' },
  licenseClass: { name: t('driverAttrLicenseClass'), type: 'string' },
  licenseExpiry: { name: t('driverAttrLicenseExpiry'), type: 'string' },
  birthDate: { name: t('driverAttrBirthDate'), type: 'string' },
  hireDate: { name: t('driverAttrHireDate'), type: 'string' },
  address: { name: t('sharedAddress'), type: 'string' },
  bloodType: { name: t('driverAttrBloodType'), type: 'string' },
  emergencyContact: { name: t('driverAttrEmergencyContact'), type: 'string' },
  emergencyPhone: { name: t('driverAttrEmergencyPhone'), type: 'string' },
  notes: { name: t('driverAttrNotes'), type: 'string' },
  active: { name: t('driverAttrActive'), type: 'boolean' },
});

const nameInitials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

// ── Driver dialog ─────────────────────────────────────────────────────────────

const DriverDialog = ({ open, onClose, onSaved, editing }) => {
  const { classes } = useManageStyles();
  const t = useTranslation();
  const driverAttrDefs = useMemo(() => buildDriverAttributeDefs(t), [t]);
  const isEdit = !!editing;
  const [form, setForm] = useState({ name: '', uniqueId: '', attributes: {} });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name || '',
            uniqueId: editing.uniqueId || '',
            attributes: { ...(editing.attributes || {}) },
          }
        : { name: '', uniqueId: '', attributes: {} },
    );
    setError('');
  }, [open, editing]);

  const valid = form.name.trim() && form.uniqueId.trim();

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...(editing || {}),
        name: form.name.trim(),
        uniqueId: form.uniqueId.trim(),
        attributes: form.attributes,
      };
      await fetchOrThrow(isEdit ? `/api/drivers/${editing.id}` : '/api/drivers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (e) {
      setError(e.message || t('driverSaveFailed'));
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
        {isEdit ? t('driverDialogEdit') : t('driverDialogNew')}
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
          <TextField
            label={t('driverUniqueIdLabel')}
            placeholder={t('driverUniqueIdPlaceholder')}
            helperText={t('driverUniqueIdHelper')}
            className={classes.inputDark}
            value={form.uniqueId}
            onChange={(e) => setForm({ ...form, uniqueId: e.target.value })}
            fullWidth
            size="small"
          />
          <Divider sx={{ my: 0.5 }} />
          <Typography className={classes.sectionLabel}>{t('driverAttributesHeading')}</Typography>
          <AttributesEditor
            attributes={form.attributes}
            onChange={(attributes) => setForm((f) => ({ ...f, attributes }))}
            definitions={driverAttrDefs}
            classes={classes}
            emptyHint={t('driverAttributesEmptyHint')}
          />
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

const DriversPageV2 = () => {
  const { classes } = useManageStyles();
  const theme = useTheme();
  const t = useTranslation();

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
      const response = await fetchOrThrow('/api/drivers');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setSnack({ open: true, msg: t('driverLoadFailed'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = (it.name || '').toLowerCase();
      const uid = (it.uniqueId || '').toLowerCase();
      return name.includes(q) || uid.includes(q);
    });
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      withId: items.filter((it) => it.uniqueId?.trim()).length,
      withAttrs: items.filter((it) => it.attributes && Object.keys(it.attributes).length).length,
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
    setSnack({ open: true, msg: t('driverSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetchOrThrow(`/api/drivers/${confirmDelete.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('driverDeleted'), severity: 'success' });
      setConfirmDelete(null);
    } catch {
      setSnack({ open: true, msg: t('driverDeleteFailed'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const copyUid = async (uid) => {
    try {
      await navigator.clipboard.writeText(uid);
      setSnack({ open: true, msg: t('driverUidCopied'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: t('driverUidCopyFailed'), severity: 'error' });
    }
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<BadgeOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('sharedDrivers')}
          subtitle={t('driversPageSubtitle')}
          onRefresh={reload}
          onCreate={openCreate}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<PersonOutlined fontSize="small" />}
            label={t('driversStatTotal')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<KeyOutlined fontSize="small" />}
            label={t('driversStatWithCard')}
            value={stats.withId}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<ExpandMore fontSize="small" />}
            label={t('driversStatWithAttrs')}
            value={stats.withAttrs}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
        </Box>

        <TextField
          className={classes.searchField}
          placeholder={t('driversSearchPlaceholder')}
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
            icon={<BadgeOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('driversEmptyTitle')}
            hint={t('driversEmptyHint')}
            ctaLabel={t('driversNewDriver')}
            onCta={openCreate}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => {
              const attrEntries = Object.entries(it.attributes || {});
              return (
                <Box key={it.id} className={classes.card}>
                  <Box className={classes.cardHeader}>
                    <Box className={classes.avatar}>{nameInitials(it.name)}</Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className={classes.cardTitle}>{it.name || '—'}</Typography>
                      <Typography className={classes.cardSub}>
                        {attrEntries.length > 0
                          ? t('driversAttrsCount').replace('{n}', String(attrEntries.length))
                          : t('driversAttrsNone')}
                      </Typography>
                    </Box>
                  </Box>

                  <Tooltip title={t('driversCopyUid')}>
                    <Box
                      className={classes.uidRow}
                      onClick={() => copyUid(it.uniqueId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <KeyOutlined sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
                      <Typography
                        sx={{
                          flex: 1,
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {it.uniqueId || '—'}
                      </Typography>
                      <ContentCopy sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>

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

      <DriverDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
        editing={editing}
      />

      <ConfirmDeleteDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        deleting={deleting}
        title={t('driversDeleteTitle')}
        target={confirmDelete ? confirmDelete.name || confirmDelete.uniqueId : undefined}
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

export default DriversPageV2;
