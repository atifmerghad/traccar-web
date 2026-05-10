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
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Search,
  Edit,
  DeleteOutline,
  Close,
  NotificationsActiveOutlined,
  NotificationsOutlined,
  Public,
  DevicesOther,
  EmailOutlined,
  SmsOutlined,
  PhoneAndroidOutlined,
} from '@mui/icons-material';
import PageLayout from '../layout/PageLayout';
import { useTranslation, useTranslationKeys } from '../../common/components/LocalizationProvider';
import { prefixString, unprefixString } from '../../common/util/stringUtils';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import {
  useManageStyles,
  PageHeader,
  StatCard,
  EmptyState,
  CardSkeletons,
  ConfirmDeleteDialog,
} from './_shared.jsx';

const buildTypePalette = (theme) => ({
  alarm: { color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.14) },
  overspeed: { color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.14) },
  ignitionOn: {
    color: theme.palette.secondary.main,
    bg: alpha(theme.palette.secondary.main, 0.14),
  },
  ignitionOff: {
    color: theme.palette.text.secondary,
    bg: alpha(theme.palette.text.secondary, 0.18),
  },
  geofenceEnter: { color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.14) },
  geofenceExit: { color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.14) },
  deviceOnline: {
    color: theme.palette.secondary.main,
    bg: alpha(theme.palette.secondary.main, 0.14),
  },
  deviceOffline: { color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.14) },
  deviceMoving: {
    color: theme.palette.secondary.main,
    bg: alpha(theme.palette.secondary.main, 0.14),
  },
  deviceStopped: {
    color: theme.palette.text.secondary,
    bg: alpha(theme.palette.text.secondary, 0.18),
  },
  maintenance: {
    color: theme.palette.secondary.main,
    bg: alpha(theme.palette.secondary.main, 0.14),
  },
  driverChanged: { color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.14) },
});
const defaultTypePalette = (theme) => ({
  color: theme.palette.primary.main,
  bg: alpha(theme.palette.primary.main, 0.14),
});

const NOTIFICATOR_ICON = {
  web: NotificationsActiveOutlined,
  mail: EmailOutlined,
  sms: SmsOutlined,
  firebase: PhoneAndroidOutlined,
  telegram: NotificationsActiveOutlined,
};

const humanize = (s) =>
  (s || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

// ─── Notification dialog ──────────────────────────────────────────────────────

const NotificationDialog = ({
  open,
  onClose,
  onSaved,
  editing,
  types,
  notificators,
  alarms,
  devices,
  initialDeviceIds,
}) => {
  const { classes } = useManageStyles();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const t = useTranslation();
  const isEdit = !!editing;
  const [form, setForm] = useState({
    description: '',
    type: '',
    always: false,
    notificators: [],
    alarms: [],
    deviceIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const availableNotificatorTypes = useMemo(
    () => new Set((notificators || []).map((n) => n.type)),
    [notificators],
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        description: editing.description || '',
        type: editing.type || '',
        always: !!editing.always,
        notificators: editing.notificators
          ? editing.notificators
              .split(/[, ]+/)
              .filter((n) => Boolean(n) && availableNotificatorTypes.has(n))
          : [],
        alarms: editing.attributes?.alarms
          ? editing.attributes.alarms.split(/[, ]+/).filter(Boolean)
          : [],
        deviceIds: [],
      });
    } else {
      setForm({
        description: '',
        type: types[0]?.type || '',
        always: false,
        notificators: [],
        alarms: [],
        deviceIds: [],
      });
    }
    setError('');
    setInfo('');
  }, [open, editing, types, availableNotificatorTypes]);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({ ...prev, deviceIds: initialDeviceIds || [] }));
  }, [open, initialDeviceIds]);

  const hasScope = form.always || form.deviceIds.length > 0;
  const valid = form.type && form.notificators.length > 0 && hasScope;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      const attributes = { ...(editing?.attributes || {}) };
      if (form.type === 'alarm') {
        if (form.alarms.length) attributes.alarms = form.alarms.join();
        else delete attributes.alarms;
      } else {
        delete attributes.alarms;
      }
      const payload = {
        ...(editing || {}),
        description: form.description || '',
        type: form.type,
        always: form.always,
        notificators: form.notificators.join(),
        attributes,
      };
      const res = await fetchOrThrow(
        isEdit ? `/api/notifications/${editing.id}` : '/api/notifications',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const saved = await res.json().catch(() => null);
      onSaved(form.deviceIds, form.always, saved?.id || editing?.id);
    } catch (e) {
      setError(e.message || t('sharedNoData'));
    } finally {
      setSaving(false);
    }
  };

  const testNotificators = async () => {
    if (!form.notificators.length) return;
    setTesting(true);
    setError('');
    setInfo('');
    try {
      const attributes = { ...(editing?.attributes || {}) };
      if (form.type === 'alarm') {
        if (form.alarms.length) attributes.alarms = form.alarms.join();
        else delete attributes.alarms;
      } else {
        delete attributes.alarms;
      }
      const payload = {
        ...(editing || {}),
        description: 'Test message',
        type: form.type,
        always: form.always,
        notificators: form.notificators.join(),
        attributes,
      };
      await Promise.all(
        form.notificators.map((notificator) =>
          fetchOrThrow(`/api/notifications/test/${notificator}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }),
        ),
      );
      setInfo('Test message');
    } catch (e) {
      setError(e.message || t('sharedNoData'));
    } finally {
      setTesting(false);
    }
  };

  const labelForType = (type) => {
    const k = prefixString('event', type);
    const tr = t(k);
    return tr && tr !== k ? tr : humanize(type);
  };
  const labelForNotificator = (n) => {
    const k = prefixString('notificator', n);
    const tr = t(k);
    return tr && tr !== k ? tr : humanize(n);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={mobile}
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
        {isEdit ? t('sharedEdit') : t('sharedNew')}
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label={t('sharedDescription')}
            placeholder={t('sharedNoData')}
            className={classes.inputDark}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth
            size="small"
          />

          <FormControl className={classes.inputDark} size="small" fullWidth>
            <InputLabel>{t('sharedType')}</InputLabel>
            <Select
              label={t('sharedType')}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {types.map((it) => (
                <MenuItem key={it.type} value={it.type}>
                  {labelForType(it.type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.type === 'alarm' && (
            <FormControl className={classes.inputDark} size="small" fullWidth>
              <InputLabel>{t('sharedAlarms')}</InputLabel>
              <Select
                multiple
                label={t('sharedAlarms')}
                value={form.alarms}
                onChange={(e) => setForm({ ...form, alarms: e.target.value })}
                input={<OutlinedInput label={t('sharedAlarms')} />}
                renderValue={(sel) =>
                  sel.map((s) => alarms.find((a) => a.key === s)?.name || s).join(', ')
                }
              >
                {alarms.map((a) => (
                  <MenuItem key={a.key} value={a.key}>
                    <Checkbox checked={form.alarms.includes(a.key)} />
                    <ListItemText primary={a.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl className={classes.inputDark} size="small" fullWidth>
            <InputLabel>{t('notificationNotificators')}</InputLabel>
            <Select
              multiple
              label={t('notificationNotificators')}
              value={form.notificators}
              onChange={(e) => setForm({ ...form, notificators: e.target.value })}
              input={<OutlinedInput label={t('notificationNotificators')} />}
              renderValue={(sel) => sel.map(labelForNotificator).join(', ')}
            >
              {notificators.map((n) => (
                <MenuItem key={n.type} value={n.type}>
                  <Checkbox checked={form.notificators.includes(n.type)} />
                  <ListItemText primary={labelForNotificator(n.type)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl className={classes.inputDark} size="small" fullWidth disabled={form.always}>
            <InputLabel>{t('sharedDevice')}</InputLabel>
            <Select
              multiple
              label={t('sharedDevice')}
              value={form.deviceIds}
              onChange={(e) => setForm({ ...form, deviceIds: e.target.value })}
              input={<OutlinedInput label={t('sharedDevice')} />}
              renderValue={(sel) =>
                sel
                  .map((id) => devices.find((d) => d.id === id))
                  .filter(Boolean)
                  .map((d) => d.name || d.uniqueId)
                  .join(', ')
              }
            >
              {devices.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  <Checkbox checked={form.deviceIds.includes(d.id)} />
                  <ListItemText primary={d.name || d.uniqueId} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!form.always && form.deviceIds.length === 0 && (
            <Typography
              sx={{ fontSize: theme.typography.pxToRem(12.5), color: 'warning.main', mt: -1 }}
            >
              {t('sharedRequired')}
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: theme.typography.pxToRem(14.1), fontWeight: 600 }}>
                {t('notificationAlways')}
              </Typography>
              <Typography sx={{ fontSize: theme.typography.pxToRem(12), color: 'text.secondary' }}>
                {t('notificationAlways')}
              </Typography>
            </Box>
            <Switch
              checked={form.always}
              onChange={(e) =>
                setForm({
                  ...form,
                  always: e.target.checked,
                  deviceIds: e.target.checked ? [] : form.deviceIds,
                })
              }
            />
          </Box>

          {info && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {info}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
        }}
      >
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={testNotificators}
          disabled={!form.notificators.length || saving || testing}
          variant="outlined"
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {testing ? `${t('sharedTest')}...` : t('sharedTestNotificators')}
        </Button>
        <Button
          onClick={save}
          disabled={!valid || saving}
          variant="contained"
          disableElevation
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {saving ? `${t('sharedSave')}...` : t('sharedSave')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const NotificationsPageV2 = () => {
  const { classes } = useManageStyles();
  const theme = useTheme();
  const t = useTranslation();
  const typePaletteMap = useMemo(() => buildTypePalette(theme), [theme]);

  const [items, setItems] = useState([]);
  const [devices, setDevices] = useState([]);
  const [types, setTypes] = useState([]);
  const [notificators, setNotificators] = useState([]);
  const [notificationDeviceIds, setNotificationDeviceIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const alarmKeys = useTranslationKeys((it) => it.startsWith('alarm'));
  const alarms = useMemo(
    () => alarmKeys.map((k) => ({ key: unprefixString('alarm', k), name: t(k) })),
    [alarmKeys, t],
  );
  const availableNotificatorTypes = useMemo(
    () => new Set((notificators || []).map((n) => n.type)),
    [notificators],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, bRes, cRes, dRes] = await Promise.all([
        fetchOrThrow('/api/notifications'),
        fetchOrThrow('/api/notifications/types'),
        fetchOrThrow('/api/notifications/notificators'),
        fetchOrThrow('/api/devices'),
      ]);
      const [a, b, c, d] = await Promise.all([aRes.json(), bRes.json(), cRes.json(), dRes.json()]);
      setItems(Array.isArray(a) ? a : []);
      setTypes(Array.isArray(b) ? b : []);
      setNotificators(Array.isArray(c) ? c : []);
      setDevices(Array.isArray(d) ? d : []);
    } catch {
      setSnack({ open: true, msg: t('sharedNoData'), severity: 'error' });
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
      const desc = (it.description || '').toLowerCase();
      const type = (it.type || '').toLowerCase();
      return desc.includes(q) || type.includes(q);
    });
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      always: items.filter((it) => it.always).length,
      specific: items.filter((it) => !it.always).length,
      channels: new Set(
        items.flatMap((it) => (it.notificators || '').split(/[, ]+/).filter(Boolean)),
      ).size,
    }),
    [items],
  );

  const labelForType = (type) => {
    const k = prefixString('event', type);
    const tr = t(k);
    return tr && tr !== k ? tr : humanize(type);
  };
  const labelForNotificator = (n) => {
    const k = prefixString('notificator', n);
    const tr = t(k);
    return tr && tr !== k ? tr : humanize(n);
  };
  const labelForAlarm = (a) => alarms.find((it) => it.key === a)?.name || humanize(a);

  const openCreate = () => {
    setEditing(null);
    setNotificationDeviceIds([]);
    setDialogOpen(true);
  };
  const openEdit = async (item) => {
    setEditing(item);
    try {
      const res = await fetchOrThrow(`/api/devices?notificationId=${item.id}`);
      const linked = await res.json();
      setNotificationDeviceIds((linked || []).map((d) => d.id));
    } catch {
      setNotificationDeviceIds([]);
    }
    setDialogOpen(true);
  };
  const onSaved = async (deviceIds, always, notificationIdHint) => {
    const notificationId = notificationIdHint || editing?.id;
    if (notificationId) {
      const targetIds = always
        ? []
        : (deviceIds || []).map((id) => Number(id)).filter((id) => !Number.isNaN(id));
      const currentIds = notificationDeviceIds || [];
      const toAdd = targetIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !targetIds.includes(id));
      try {
        await Promise.all(
          toAdd.map((deviceId) =>
            fetchOrThrow('/api/permissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId, notificationId }),
            }),
          ),
        );
        await Promise.all(
          toRemove.map((deviceId) =>
            fetchOrThrow(`/api/permissions?deviceId=${deviceId}&notificationId=${notificationId}`, {
              method: 'DELETE',
            }),
          ),
        );
      } catch {
        setSnack({ open: true, msg: t('sharedNoData'), severity: 'warning' });
      }
    }
    setDialogOpen(false);
    setEditing(null);
    setNotificationDeviceIds([]);
    setSnack({ open: true, msg: t('sharedSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetchOrThrow(`/api/notifications/${confirmDelete.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((n) => n.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('sharedSaved'), severity: 'success' });
      setConfirmDelete(null);
    } catch {
      setSnack({ open: true, msg: t('sharedNoData'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<NotificationsActiveOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('sharedNotifications')}
          subtitle={t('notificationNotificators')}
          onRefresh={reload}
          onCreate={openCreate}
          createLabel={t('sharedNew')}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<NotificationsActiveOutlined fontSize="small" />}
            label={t('sharedNotifications')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<Public fontSize="small" />}
            label={t('notificationAlways')}
            value={stats.always}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<DevicesOther fontSize="small" />}
            label={t('sharedDevice')}
            value={stats.specific}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<EmailOutlined fontSize="small" />}
            label={t('notificationNotificators')}
            value={stats.channels}
            color={theme.palette.info.main}
            bg={alpha(theme.palette.info.main, 0.18)}
            classes={classes}
          />
        </Box>

        <TextField
          className={classes.searchField}
          placeholder={`${t('sharedSearch')}...`}
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
            icon={<NotificationsOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('sharedNoData')}
            hint={t('sharedNotifications')}
            ctaLabel={t('sharedNew')}
            onCta={openCreate}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => {
              const palette = typePaletteMap[it.type] || defaultTypePalette(theme);
              const channels = (it.notificators || '')
                .split(/[, ]+/)
                .filter((n) => Boolean(n) && availableNotificatorTypes.has(n));
              const itemAlarms = (it.attributes?.alarms || '').split(/[, ]+/).filter(Boolean);
              const title = it.description?.trim() || labelForType(it.type);
              return (
                <Box key={it.id} className={classes.card}>
                  <Box className={classes.cardHeader} sx={{ justifyContent: 'space-between' }}>
                    <Box
                      className={classes.statIcon}
                      sx={{ backgroundColor: palette.bg, color: palette.color }}
                    >
                      <NotificationsActiveOutlined fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className={classes.cardTitle}>{title}</Typography>
                      <Typography className={classes.cardSub}>{labelForType(it.type)}</Typography>
                    </Box>
                    {it.always && (
                      <Chip
                        size="small"
                        icon={<Public sx={{ fontSize: 14 }} />}
                        label={t('notificationAlways')}
                        sx={{
                          height: 22,
                          fontSize: theme.typography.caption.fontSize,
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.secondary.main, 0.18),
                          color: theme.palette.secondary.main,
                          '& .MuiChip-icon': { color: theme.palette.secondary.main },
                        }}
                      />
                    )}
                  </Box>

                  <Box className={classes.chipRow}>
                    {channels.map((c) => {
                      const Icon = NOTIFICATOR_ICON[c] || NotificationsOutlined;
                      return (
                        <Chip
                          key={c}
                          size="small"
                          icon={<Icon sx={{ fontSize: 14 }} />}
                          label={labelForNotificator(c)}
                          sx={{
                            height: 22,
                            fontSize: theme.typography.caption.fontSize,
                            fontWeight: 600,
                            bgcolor: theme.palette.action.hover,
                            color: 'text.secondary',
                            '& .MuiChip-icon': { color: 'text.secondary' },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {it.type === 'alarm' && itemAlarms.length > 0 && (
                    <Box className={classes.chipRow}>
                      {itemAlarms.slice(0, 4).map((a) => (
                        <Chip
                          key={a}
                          size="small"
                          label={labelForAlarm(a)}
                          sx={{
                            height: 22,
                            fontSize: theme.typography.caption.fontSize,
                            fontWeight: 600,
                            bgcolor: alpha(theme.palette.warning.main, 0.14),
                            color: theme.palette.warning.main,
                          }}
                        />
                      ))}
                      {itemAlarms.length > 4 && (
                        <Chip
                          size="small"
                          label={`+${itemAlarms.length - 4}`}
                          sx={{
                            height: 22,
                            fontSize: theme.typography.caption.fontSize,
                            fontWeight: 600,
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
                    <Tooltip title={t('sharedRemove')}>
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

      <NotificationDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSaved={onSaved}
        editing={editing}
        types={types}
        notificators={notificators}
        alarms={alarms}
        devices={devices}
        initialDeviceIds={notificationDeviceIds}
      />

      <ConfirmDeleteDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        deleting={deleting}
        title={t('sharedRemove')}
        target={
          confirmDelete
            ? confirmDelete.description?.trim() || labelForType(confirmDelete.type)
            : undefined
        }
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

export default NotificationsPageV2;
