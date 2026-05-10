import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Edit,
  DeleteOutline,
  Close,
  SendOutlined,
  SmsOutlined,
  TerminalOutlined,
  BookmarkBorder,
  FilterListOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { prefixString } from '../../common/util/stringUtils';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import PageLayout from '../layout/PageLayout';
import {
  useManageStyles,
  PageHeader,
  StatCard,
  EmptyState,
  CardSkeletons,
  ConfirmDeleteDialog,
} from './_shared.jsx';

const humanizeType = (s = '') =>
  String(s)
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

// ── Dialog ────────────────────────────────────────────────────────────────────

const CommandDialog = ({ open, onClose, editing, onSaved, types, classes }) => {
  const t = useTranslation();
  const isEdit = !!editing?.id;
  const [form, setForm] = useState({
    description: '',
    type: '',
    textChannel: false,
    attributes: {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm({
        description: editing?.description || '',
        type: editing?.type || types[0]?.type || '',
        textChannel: !!editing?.textChannel,
        attributes: editing?.attributes ? { ...editing.attributes } : {},
      });
    }
  }, [open, editing, types]);

  const typeLabel = (type) => {
    const key = prefixString('command', type);
    const tr = t(key);
    return tr && tr !== key ? tr : humanizeType(type);
  };

  const valid = form.type && form.type.trim().length > 0;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const url = isEdit ? `/api/commands/${editing.id}` : '/api/commands';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...editing, ...form } : form;
      await fetchOrThrow(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onSaved();
    } catch {
      setError(t('commandSaveFailed'));
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
        {isEdit ? t('commandDialogEdit') : t('commandDialogNew')}
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label={t('sharedDescription')}
            placeholder={t('commandDescriptionPlaceholder')}
            className={classes.inputDark}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth
            size="small"
            autoFocus
          />
          <FormControl fullWidth size="small" className={classes.inputDark}>
            <InputLabel>{t('commandTypeSelect')}</InputLabel>
            <Select
              label={t('commandTypeSelect')}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {types.length === 0 && (
                <MenuItem value="">
                  <em>{t('sharedNoData')}</em>
                </MenuItem>
              )}
              {types.map((item) => (
                <MenuItem key={item.type} value={item.type}>
                  {typeLabel(item.type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={form.textChannel}
                onChange={(e) => setForm({ ...form, textChannel: e.target.checked })}
              />
            }
            label={t('commandTextChannelLabel')}
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

// ── Page ──────────────────────────────────────────────────────────────────────

const CommandsPageV2 = () => {
  const theme = useTheme();
  const { classes } = useManageStyles();
  const t = useTranslation();

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const typeLabel = (type) => {
    const key = prefixString('command', type);
    const tr = t(key);
    return tr && tr !== key ? tr : humanizeType(type);
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetchOrThrow('/api/commands'),
        fetchOrThrow('/api/commands/types'),
      ]);
      const list = await cRes.json();
      const tlist = await tRes.json();
      setItems(Array.isArray(list) ? list : []);
      setTypes(Array.isArray(tlist) ? tlist : []);
    } catch {
      setSnack({ open: true, msg: t('commandLoadFailed'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const distinctTypes = useMemo(
    () => Array.from(new Set(items.map((it) => it.type))).filter(Boolean),
    [items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter && it.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (it.description || '').toLowerCase().includes(q) ||
        (it.type || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, typeFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      sms: items.filter((it) => it.textChannel).length,
      distinct: distinctTypes.length,
    }),
    [items, distinctTypes],
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
    setSnack({ open: true, msg: t('commandSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetchOrThrow(`/api/commands/${confirmDelete.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('commandDeleted'), severity: 'success' });
      setConfirmDelete(null);
    } catch {
      setSnack({ open: true, msg: t('commandDeleteFailed'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<TerminalOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('sharedSavedCommands')}
          subtitle={t('commandPageSubtitle')}
          onRefresh={reload}
          onCreate={openCreate}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<BookmarkBorder fontSize="small" />}
            label={t('commandStatTotal')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<SmsOutlined fontSize="small" />}
            label={t('commandStatSms')}
            value={stats.sms}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<SendOutlined fontSize="small" />}
            label={t('commandStatTypes')}
            value={stats.distinct}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<FilterListOutlined fontSize="small" />}
            label={t('commandStatAvailable')}
            value={types.length}
            color={theme.palette.info.main}
            bg={alpha(theme.palette.info.main, 0.18)}
            classes={classes}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            className={classes.searchField}
            placeholder={t('commandSearchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }} className={classes.inputDark}>
            <InputLabel>{t('sharedType')}</InputLabel>
            <Select
              label={t('sharedType')}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('commandFilterAll')}</em>
              </MenuItem>
              {distinctTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {typeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <CardSkeletons classes={classes} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TerminalOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('commandEmptyTitle')}
            hint={t('commandEmptyHint')}
            onCta={openCreate}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => (
              <Box key={it.id} className={classes.card}>
                <Box className={classes.cardHeader}>
                  <Box
                    sx={{
                      width: theme.spacing(4.75),
                      height: theme.spacing(4.75),
                      borderRadius: theme.spacing(1.25),
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: alpha(theme.palette.primary.main, 0.16),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <TerminalOutlined fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className={classes.cardTitle}>
                      {it.description || typeLabel(it.type)}
                    </Typography>
                    <Typography className={classes.cardSub}>{typeLabel(it.type)}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {it.textChannel && (
                    <Chip
                      size="small"
                      icon={<SmsOutlined sx={{ fontSize: 14 }} />}
                      label={t('commandSendSms')}
                      sx={{
                        height: 22,
                        fontSize: theme.typography.caption.fontSize,
                        bgcolor: alpha(theme.palette.secondary.main, 0.16),
                        color: theme.palette.secondary.main,
                      }}
                    />
                  )}
                  {it.attributes && Object.keys(it.attributes).length > 0 && (
                    <Chip
                      size="small"
                      label={`${Object.keys(it.attributes).length} ${t('sharedAttributes').toLowerCase()}`}
                      sx={{ height: 22, fontSize: theme.typography.caption.fontSize }}
                    />
                  )}
                </Box>

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
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <CommandDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          editing={editing}
          onSaved={onSaved}
          types={types}
          classes={classes}
        />

        <ConfirmDeleteDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={doDelete}
          deleting={deleting}
          target={
            confirmDelete?.description || (confirmDelete?.type && typeLabel(confirmDelete.type))
          }
          classes={classes}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            sx={{ borderRadius: 2 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

export default CommandsPageV2;
