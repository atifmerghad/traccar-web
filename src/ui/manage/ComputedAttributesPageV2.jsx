import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Edit,
  DeleteOutline,
  Close,
  CalculateOutlined,
  CodeOutlined,
  PlayArrowOutlined,
  FunctionsOutlined,
} from '@mui/icons-material';
import PageLayout from '../layout/PageLayout';
import { useTranslation } from '../../common/components/LocalizationProvider';
import {
  useManageStyles,
  PageHeader,
  StatCard,
  EmptyState,
  CardSkeletons,
  ConfirmDeleteDialog,
} from './_shared.jsx';

const typeMetaFor = (theme, tr) => ({
  string: {
    color: theme.palette.primary.main,
    bg: alpha(theme.palette.primary.main, 0.16),
    label: tr('computedTypeString'),
  },
  number: {
    color: theme.palette.secondary.main,
    bg: alpha(theme.palette.secondary.main, 0.16),
    label: tr('computedTypeNumber'),
  },
  boolean: {
    color: theme.palette.warning.main,
    bg: alpha(theme.palette.warning.main, 0.16),
    label: tr('computedTypeBoolean'),
  },
});

const useAdmin = () => useSelector((s) => !!s.session?.user?.administrator);

const AttributeDialog = ({ open, onClose, editing, onSaved, devices, classes }) => {
  const theme = useTheme();
  const t = useTranslation();
  const isEdit = !!editing?.id;
  const [form, setForm] = useState({
    description: '',
    attribute: '',
    expression: '',
    type: 'string',
    priority: 0,
  });
  const [testDeviceId, setTestDeviceId] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setTestResult('');
      setTestDeviceId('');
      setForm({
        description: editing?.description || '',
        attribute: editing?.attribute || '',
        expression: editing?.expression || '',
        type: editing?.type || 'string',
        priority: editing?.priority || 0,
      });
    }
  }, [open, editing]);

  const valid = form.description.trim() && form.expression.trim();

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...editing, ...form };
      const url = isEdit ? `/api/attributes/computed/${editing.id}` : '/api/attributes/computed';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      onSaved();
    } catch {
      setError(t('computedSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (!testDeviceId) return;
    setTesting(true);
    setTestResult('');
    try {
      const res = await fetch(`/api/attributes/computed/test?deviceId=${testDeviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      setTestResult(
        res.ok
          ? text || t('computedEvalEmpty')
          : `${t('computedErrorPrefix')} ${text || res.status}`,
      );
    } catch (e) {
      setTestResult(`${t('computedErrorPrefix')} ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
        {isEdit ? t('computedDialogEdit') : t('computedDialogNew')}
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('computedFieldDescription')}
              className={classes.inputDark}
              fullWidth
              size="small"
              autoFocus
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <FormControl size="small" className={classes.inputDark}>
              <InputLabel>{t('computedFieldType')}</InputLabel>
              <Select
                label={t('computedFieldType')}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <MenuItem value="string">{t('computedTypeString')}</MenuItem>
                <MenuItem value="number">{t('computedTypeNumber')}</MenuItem>
                <MenuItem value="boolean">{t('computedTypeBoolean')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            label={t('computedFieldAttribute')}
            placeholder={t('computedFieldAttributePh')}
            className={classes.inputDark}
            fullWidth
            size="small"
            value={form.attribute}
            onChange={(e) => setForm({ ...form, attribute: e.target.value })}
            helperText={t('computedFieldAttributeHelp')}
          />
          <TextField
            label={t('computedFieldExpression')}
            placeholder={t('computedFieldExpressionPh')}
            className={classes.inputDark}
            fullWidth
            multiline
            rows={4}
            value={form.expression}
            onChange={(e) => setForm({ ...form, expression: e.target.value })}
            helperText={t('computedFieldExpressionHelp')}
          />
          <TextField
            type="number"
            label={t('computedFieldPriority')}
            className={classes.inputDark}
            fullWidth
            size="small"
            sx={{ maxWidth: 200 }}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
          />

          <Box
            sx={{
              border: (th) => `1px dashed ${th.palette.divider}`,
              borderRadius: 2,
              padding: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'text.secondary',
              }}
            >
              {t('computedTestSection')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" className={classes.inputDark} sx={{ flex: 1 }}>
                <InputLabel>{t('computedFieldDevice')}</InputLabel>
                <Select
                  label={t('computedFieldDevice')}
                  value={testDeviceId}
                  onChange={(e) => setTestDeviceId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('computedChooseDevice')}</em>
                  </MenuItem>
                  {Object.values(devices).map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={test}
                disabled={!testDeviceId || !form.expression || testing}
                startIcon={<PlayArrowOutlined />}
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {testing ? t('computedTestRunning') : t('computedEvaluate')}
              </Button>
            </Box>
            {testResult && (
              <Alert
                severity={/^(Error|Erreur):/i.test(testResult.trim()) ? 'error' : 'info'}
                sx={{ borderRadius: 2, fontFamily: 'ui-monospace, monospace' }}
              >
                {testResult}
              </Alert>
            )}
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
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          {saving ? t('sharedSaving') : t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ComputedAttributesPageV2 = () => {
  const theme = useTheme();
  const { classes } = useManageStyles();
  const t = useTranslation();
  const typeMeta = useMemo(() => typeMetaFor(theme, t), [theme, t]);
  const isAdmin = useAdmin();
  const devices = useSelector((s) => s.devices.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attributes/computed');
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setSnack({ open: true, msg: t('computedLoadFailed'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter && it.type !== typeFilter) return false;
      if (!q) return true;
      return [it.description, it.attribute, it.expression]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, search, typeFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      string: items.filter((i) => i.type === 'string').length,
      number: items.filter((i) => i.type === 'number').length,
      boolean: items.filter((i) => i.type === 'boolean').length,
    }),
    [items],
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (it) => {
    setEditing(it);
    setDialogOpen(true);
  };
  const onSaved = () => {
    setDialogOpen(false);
    setEditing(null);
    setSnack({ open: true, msg: t('computedSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attributes/computed/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('computedDeleteSnack'), severity: 'success' });
      setConfirmDelete(null);
    } catch {
      setSnack({ open: true, msg: t('computedDeleteFailed'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<CalculateOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('computedPageTitle')}
          subtitle={isAdmin ? t('computedPageSubtitleAdmin') : t('computedPageSubtitleReadonly')}
          onRefresh={reload}
          onCreate={isAdmin ? openCreate : undefined}
          createLabel={t('managePageV2')}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<FunctionsOutlined fontSize="small" />}
            label={t('computedStatTotal')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<CodeOutlined fontSize="small" />}
            label={t('computedTypeString')}
            value={stats.string}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<CalculateOutlined fontSize="small" />}
            label={t('computedTypeNumber')}
            value={stats.number}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<PlayArrowOutlined fontSize="small" />}
            label={t('computedTypeBoolean')}
            value={stats.boolean}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            className={classes.searchField}
            placeholder={t('computedSearchPlaceholder')}
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
          <FormControl size="small" sx={{ minWidth: 180 }} className={classes.inputDark}>
            <InputLabel>{t('computedFieldType')}</InputLabel>
            <Select
              label={t('computedFieldType')}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('computedTypeAll')}</em>
              </MenuItem>
              <MenuItem value="string">{t('computedTypeString')}</MenuItem>
              <MenuItem value="number">{t('computedTypeNumber')}</MenuItem>
              <MenuItem value="boolean">{t('computedTypeBoolean')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <CardSkeletons classes={classes} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalculateOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('computedEmptyTitle')}
            hint={isAdmin ? t('computedEmptyHintAdmin') : t('computedEmptyHintReadonly')}
            ctaLabel={t('managePageV2')}
            onCta={isAdmin ? openCreate : undefined}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => {
              const meta = typeMeta[it.type] || typeMeta.string;
              return (
                <Box key={it.id} className={classes.card}>
                  <Box className={classes.cardHeader}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: meta.bg,
                        color: meta.color,
                      }}
                    >
                      <FunctionsOutlined fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className={classes.cardTitle}>{it.description || '—'}</Typography>
                      <Typography className={classes.cardSub}>
                        {it.attribute || t('computedEvalEmpty')} · {t('computedCardPriority')}{' '}
                        {it.priority || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontSize: '0.78rem',
                      backgroundColor: 'action.hover',
                      borderRadius: 1.5,
                      padding: '8px 10px',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'text.secondary',
                      maxHeight: 110,
                    }}
                  >
                    {it.expression || '—'}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={meta.label}
                      sx={{
                        height: 22,
                        fontSize: theme.typography.caption.fontSize,
                        bgcolor: meta.bg,
                        color: meta.color,
                      }}
                    />
                  </Box>

                  {isAdmin && (
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
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {isAdmin && (
          <AttributeDialog
            open={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
            editing={editing}
            onSaved={onSaved}
            devices={devices}
            classes={classes}
          />
        )}

        <ConfirmDeleteDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={doDelete}
          deleting={deleting}
          target={confirmDelete?.description}
          classes={classes}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack({ ...snack, open: false })}
            sx={{ borderRadius: 2 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

export default ComputedAttributesPageV2;
