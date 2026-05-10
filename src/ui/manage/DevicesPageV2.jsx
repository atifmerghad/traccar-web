import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  Divider,
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
  DevicesOtherOutlined,
  FiberManualRecord,
  GpsFixedOutlined,
  GpsOffOutlined,
  PhoneAndroidOutlined,
  FolderOutlined,
  ContentCopy,
  ImageOutlined,
  DeleteSweepOutlined,
} from '@mui/icons-material';
import PageLayout from '../layout/PageLayout';
import deviceCategories from '../../common/util/deviceCategories';
import { useTranslation } from '../../common/components/LocalizationProvider';
import useDeviceAttributes from '../../common/attributes/useDeviceAttributes';
import useCommonDeviceAttributes from '../../common/attributes/useCommonDeviceAttributes';
import AttributesEditor from '../system/AttributesEditor.jsx';
import {
  useManageStyles,
  PageHeader,
  StatCard,
  EmptyState,
  CardSkeletons,
  ConfirmDeleteDialog,
} from './_shared.jsx';
import { userMessageFromApiErrorBody } from '../../common/util/apiErrorMessage';

const DeviceDialog = ({ open, onClose, editing, onSaved, groups, classes }) => {
  const theme = useTheme();
  const t = useTranslation();
  const commonDeviceAttrs = useCommonDeviceAttributes(t);
  const deviceAttrs = useDeviceAttributes(t);
  const attributeDefinitions = useMemo(() => {
    const merged = { ...commonDeviceAttrs, ...deviceAttrs };
    const withoutImage = { ...merged };
    delete withoutImage.deviceImage;
    return withoutImage;
  }, [commonDeviceAttrs, deviceAttrs]);

  const isEdit = !!editing?.id;
  const [form, setForm] = useState({
    name: '',
    uniqueId: '',
    groupId: '',
    phone: '',
    model: '',
    contact: '',
    category: 'default',
    expirationTime: '',
    disabled: false,
    attributes: {},
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const editorResetRef = useRef(0);

  useEffect(() => {
    if (open) {
      setError('');
      editorResetRef.current += 1;
      setForm({
        name: editing?.name || '',
        uniqueId: editing?.uniqueId || '',
        groupId: editing?.groupId || '',
        phone: editing?.phone || '',
        model: editing?.model || '',
        contact: editing?.contact || '',
        category: editing?.category || 'default',
        expirationTime: editing?.expirationTime ? String(editing.expirationTime).slice(0, 10) : '',
        disabled: !!editing?.disabled,
        attributes: editing?.attributes ? { ...editing.attributes } : {},
      });
      setImageFile(null);
      setImagePreviewUrl('');
    }
  }, [open, editing]);

  useEffect(
    () => () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl],
  );

  const valid = form.name.trim() && form.uniqueId.trim();
  const editableAttributes = { ...(form.attributes || {}) };
  delete editableAttributes.deviceImage;
  const existingImageName = form.attributes?.deviceImage;
  const existingImageUrl =
    existingImageName && form.uniqueId ? `/api/media/${form.uniqueId}/${existingImageName}` : '';
  const currentImageUrl = imagePreviewUrl || existingImageUrl;

  const handleImageInput = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl('');
    const nextAttrs = { ...(form.attributes || {}) };
    delete nextAttrs.deviceImage;
    setForm({ ...form, attributes: nextAttrs });
  };

  const compressImageForUpload = async (file) => {
    if (!file || !file.type?.startsWith('image/')) return file;
    if (file.size <= 900 * 1024) return file;

    const imageUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl;
      });

      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const targetWidth = Math.max(1, Math.round(image.width * scale));
      const targetHeight = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext('2d');
      if (!context) return file;
      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      const targetBytes = 900 * 1024;
      const toBlob = (quality) =>
        new Promise((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
        });

      let blob = await toBlob(0.82);
      if (!blob) return file;
      for (const quality of [0.74, 0.66, 0.58, 0.5, 0.42]) {
        if (blob.size <= targetBytes) break;

        const nextBlob = await toBlob(quality);
        if (nextBlob) blob = nextBlob;
      }

      if (blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const buildPayload = (attributesOverride = form.attributes, idOverride = editing?.id) => ({
        ...(idOverride ? { id: idOverride } : {}),
        name: form.name,
        uniqueId: form.uniqueId,
        groupId: form.groupId || 0,
        phone: form.phone || '',
        model: form.model || '',
        contact: form.contact || '',
        category: form.category || 'default',
        expirationTime: form.expirationTime || null,
        disabled: !!form.disabled,
        attributes: attributesOverride || {},
      });
      const payload = buildPayload();
      const url = isEdit ? `/api/devices/${editing.id}` : '/api/devices';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const savedDevice = await res.json().catch(() => null);
      const savedId = savedDevice?.id || editing?.id;

      if (savedId && imageFile) {
        const uploadFile = await compressImageForUpload(imageFile);
        const uploadRes = await fetch(`/api/devices/${savedId}/image`, {
          method: 'POST',
          body: uploadFile,
        });
        if (!uploadRes.ok) throw new Error(await uploadRes.text());
        const deviceImage = await uploadRes.text();
        const persistRes = await fetch(`/api/devices/${savedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildPayload(
              {
                ...(form.attributes || {}),
                deviceImage,
              },
              savedId,
            ),
          ),
        });
        if (!persistRes.ok) throw new Error(await persistRes.text());
      }
      onSaved();
    } catch (e) {
      setError(userMessageFromApiErrorBody(e?.message || '', t));
    } finally {
      setSaving(false);
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
        {isEdit ? t('deviceDialogEdit') : t('deviceDialogNew')}
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('sharedName')}
              className={classes.inputDark}
              fullWidth
              size="small"
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label={t('deviceUniqueIdImei')}
              className={classes.inputDark}
              fullWidth
              size="small"
              value={form.uniqueId}
              onChange={(e) => setForm({ ...form, uniqueId: e.target.value })}
            />
            <FormControl fullWidth size="small" className={classes.inputDark}>
              <InputLabel>{t('settingsGroups')}</InputLabel>
              <Select
                label={t('settingsGroups')}
                value={form.groupId}
                onChange={(e) => setForm({ ...form, groupId: e.target.value })}
              >
                <MenuItem value="">
                  <em>{t('groupNoGroup')}</em>
                </MenuItem>
                {Object.values(groups).map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" className={classes.inputDark}>
              <InputLabel>{t('deviceCategory')}</InputLabel>
              <Select
                label={t('deviceCategory')}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {deviceCategories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {t(`category${c.charAt(0).toUpperCase() + c.slice(1)}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('sharedPhone')}
              className={classes.inputDark}
              fullWidth
              size="small"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <TextField
              label={t('deviceModel')}
              className={classes.inputDark}
              fullWidth
              size="small"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
            <TextField
              label={t('deviceContact')}
              className={classes.inputDark}
              fullWidth
              size="small"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <TextField
              label={t('usersExpirationDate')}
              type="date"
              InputLabelProps={{ shrink: true }}
              className={classes.inputDark}
              fullWidth
              size="small"
              value={form.expirationTime}
              onChange={(e) => setForm({ ...form, expirationTime: e.target.value })}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={form.disabled}
                onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
              />
            }
            label={t('deviceDisabled')}
          />

          <Stack spacing={1}>
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'text.secondary',
              }}
            >
              {t('deviceImageSection')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageOutlined />}
                sx={{ textTransform: 'none' }}
              >
                {currentImageUrl ? t('deviceImageReplace') : t('deviceImageUpload')}
                <input hidden type="file" accept="image/*" onChange={handleImageInput} />
              </Button>
              {(currentImageUrl || existingImageName) && (
                <Button
                  variant="text"
                  color="error"
                  startIcon={<DeleteSweepOutlined />}
                  sx={{ textTransform: 'none' }}
                  onClick={handleClearImage}
                >
                  {t('sharedRemove')}
                </Button>
              )}
            </Stack>
            {currentImageUrl ? (
              <Box
                component="img"
                src={currentImageUrl}
                alt={t('deviceImageAlt')}
                sx={{
                  width: '100%',
                  maxWidth: 260,
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('deviceImageNone')}
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 0.5 }} />
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'text.secondary',
            }}
          >
            {t('sharedAttributes')}
          </Typography>

          <AttributesEditor
            key={editorResetRef.current}
            attributes={editableAttributes}
            onChange={(attributes) =>
              setForm((f) => ({
                ...f,
                attributes: {
                  ...attributes,
                  ...(f.attributes?.deviceImage ? { deviceImage: f.attributes.deviceImage } : {}),
                },
              }))
            }
            definitions={attributeDefinitions}
            classes={classes}
            emptyHint={t('deviceAttributesHint')}
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

const DevicesPageV2 = () => {
  const theme = useTheme();
  const { classes } = useManageStyles();
  const t = useTranslation();
  const groups = useSelector((s) => s.groups.items);

  const statusMeta = useMemo(
    () => ({
      online: { color: theme.palette.secondary.main, label: t('sharedOnline') },
      offline: { color: theme.palette.error.main, label: t('sharedOffline') },
      unknown: { color: theme.palette.text.secondary, label: t('sharedUnknown') },
    }),
    [t, theme],
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices');
      const data = res.ok ? await res.json() : [];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setSnack({ open: true, msg: t('devicesLoadError'), severity: 'error' });
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
      if (statusFilter && it.status !== statusFilter) return false;
      if (!q) return true;
      const groupName = (it.groupId && groups[it.groupId]?.name) || '';
      return [it.name, it.uniqueId, it.phone, it.model, groupName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, search, statusFilter, groups]);

  const stats = useMemo(
    () => ({
      total: items.length,
      online: items.filter((i) => i.status === 'online').length,
      offline: items.filter((i) => i.status === 'offline').length,
      grouped: items.filter((i) => i.groupId).length,
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
    setSnack({ open: true, msg: t('devicesSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/devices/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('devicesDeleted'), severity: 'success' });
      setConfirmDelete(null);
    } catch {
      setSnack({ open: true, msg: t('devicesDeleteError'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const copyId = async (uid) => {
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
          icon={<DevicesOtherOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('deviceTitle')}
          subtitle={t('devicesPageSubtitle')}
          onRefresh={reload}
          onCreate={openCreate}
          createLabel={t('devicesNew')}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<DevicesOtherOutlined fontSize="small" />}
            label={t('driversStatTotal')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<GpsFixedOutlined fontSize="small" />}
            label={t('sharedOnline')}
            value={stats.online}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<GpsOffOutlined fontSize="small" />}
            label={t('sharedOffline')}
            value={stats.offline}
            color={theme.palette.error.main}
            bg={alpha(theme.palette.error.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<FolderOutlined fontSize="small" />}
            label={t('devicesStatGrouped')}
            value={stats.grouped}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            className={classes.searchField}
            placeholder={t('devicesSearchPlaceholder')}
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
            <InputLabel>{t('devicesStatusFilter')}</InputLabel>
            <Select
              label={t('devicesStatusFilter')}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('computedTypeAll')}</em>
              </MenuItem>
              <MenuItem value="online">{t('sharedOnline')}</MenuItem>
              <MenuItem value="offline">{t('sharedOffline')}</MenuItem>
              <MenuItem value="unknown">{t('sharedUnknown')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <CardSkeletons classes={classes} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<DevicesOtherOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('devicesEmptyTitle')}
            hint={t('devicesEmptyHint')}
            ctaLabel={t('devicesNew')}
            onCta={openCreate}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => {
              const meta = statusMeta[it.status] || statusMeta.unknown;
              const groupName = it.groupId && groups[it.groupId]?.name;
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
                        backgroundColor: alpha(theme.palette.primary.main, 0.16),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <DevicesOtherOutlined fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className={classes.cardTitle}>{it.name || '—'}</Typography>
                      <Typography className={classes.cardSub}>
                        {it.model ||
                          (it.category
                            ? t(
                                `category${it.category.charAt(0).toUpperCase() + it.category.slice(1)}`,
                              )
                            : t('devicesDefaultTypeLabel'))}
                        {groupName ? ` · ${groupName}` : ''}
                      </Typography>
                    </Box>
                    <Tooltip title={meta.label}>
                      <FiberManualRecord sx={{ color: meta.color, fontSize: 14 }} />
                    </Tooltip>
                  </Box>

                  <Box>
                    <Tooltip title={t('driversCopyUid')}>
                      <Box
                        onClick={() => copyId(it.uniqueId)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          fontSize: '0.8rem',
                          color: 'text.secondary',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {it.uniqueId || '—'}
                        </Box>
                        <ContentCopy sx={{ fontSize: 13, color: 'text.disabled' }} />
                      </Box>
                    </Tooltip>
                    {it.phone && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          fontSize: '0.78rem',
                          color: 'text.secondary',
                          mt: 0.5,
                        }}
                      >
                        <PhoneAndroidOutlined sx={{ fontSize: 14 }} /> {it.phone}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {it.disabled && (
                      <Chip
                        size="small"
                        label={t('deviceDisabled')}
                        sx={{
                          height: 22,
                          fontSize: theme.typography.caption.fontSize,
                          bgcolor: alpha(theme.palette.error.main, 0.16),
                          color: theme.palette.error.main,
                        }}
                      />
                    )}
                    {it.category && it.category !== 'default' && (
                      <Chip
                        size="small"
                        label={t(
                          `category${it.category.charAt(0).toUpperCase() + it.category.slice(1)}`,
                        )}
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
              );
            })}
          </Box>
        )}

        <DeviceDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          editing={editing}
          onSaved={onSaved}
          groups={groups}
          classes={classes}
        />

        <ConfirmDeleteDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={doDelete}
          deleting={deleting}
          target={confirmDelete?.name}
          warning={t('devicesDeleteRelatedWarning')}
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

export default DevicesPageV2;
