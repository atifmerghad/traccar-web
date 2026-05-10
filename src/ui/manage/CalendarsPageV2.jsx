import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
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
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Edit,
  DeleteOutline,
  Close,
  EventOutlined,
  RepeatOutlined,
  UploadFileOutlined,
  CalendarMonthOutlined,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
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

// ── iCalendar helpers ─────────────────────────────────────────────────────────

const formatTzTime = (time) => {
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `TZID=${tzid}:${time.locale('en').format('YYYYMMDDTHHmmss')}`;
};

const buildICal = ({ start, end, frequency = 'DAILY' }) => {
  const rrule = frequency === 'ONCE' ? 'RRULE:FREQ=DAILY;COUNT=1' : `RRULE:FREQ=${frequency}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Traccar//NONSGML Traccar//EN',
    'BEGIN:VEVENT',
    'UID:00000000-0000-0000-0000-000000000000',
    `DTSTART;${formatTzTime(start)}`,
    `DTEND;${formatTzTime(end)}`,
    rrule,
    'SUMMARY:Event',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return window.btoa(lines.join('\n'));
};

const parseICal = (b64) => {
  if (!b64) return null;
  try {
    const text = window.atob(b64);
    if (!text.includes('//Traccar//')) return null;
    const lines = text.split('\n');
    const startLine = lines.find((l) => l.startsWith('DTSTART'));
    const endLine = lines.find((l) => l.startsWith('DTEND'));
    const rruleLine = lines.find((l) => l.startsWith('RRULE'));
    if (!startLine || !endLine) return null;
    const start = dayjs(startLine.slice(-15));
    const end = dayjs(endLine.slice(-15));
    let frequency = 'DAILY';
    if (rruleLine?.endsWith('COUNT=1')) frequency = 'ONCE';
    else if (rruleLine?.includes('FREQ=WEEKLY')) frequency = 'WEEKLY';
    else if (rruleLine?.includes('FREQ=MONTHLY')) frequency = 'MONTHLY';
    return { start, end, frequency };
  } catch {
    return null;
  }
};

// ── Dialog ────────────────────────────────────────────────────────────────────

const CalendarDialog = ({ open, onClose, editing, onSaved, classes }) => {
  const t = useTranslation();
  const isEdit = !!editing?.id;
  const [name, setName] = useState('');
  const [tab, setTab] = useState(0);
  const [start, setStart] = useState(dayjs().format('YYYY-MM-DDTHH:mm'));
  const [end, setEnd] = useState(dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'));
  const [frequency, setFrequency] = useState('DAILY');
  const [fileData, setFileData] = useState('');
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setFileName('');
      setFileData('');
      setName(editing?.name || '');
      const parsed = parseICal(editing?.data);
      if (parsed) {
        setTab(0);
        setStart(parsed.start.format('YYYY-MM-DDTHH:mm'));
        setEnd(parsed.end.format('YYYY-MM-DDTHH:mm'));
        setFrequency(parsed.frequency);
      } else if (editing?.data) {
        setTab(1);
        setFileData(editing.data);
      } else {
        setTab(0);
        setStart(dayjs().format('YYYY-MM-DDTHH:mm'));
        setEnd(dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'));
        setFrequency('DAILY');
      }
    }
  }, [open, editing]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = String(ev.target.result || '');
      setFileData(result.substr(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(f);
  };

  const valid = name.trim() && (tab === 0 || (tab === 1 && fileData));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const data =
        tab === 0 ? buildICal({ start: dayjs(start), end: dayjs(end), frequency }) : fileData;
      const payload = { ...editing, name, data };
      const url = isEdit ? `/api/calendars/${editing.id}` : '/api/calendars';
      await fetchOrThrow(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch {
      setError(t('calendarSaveFailed'));
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
        {isEdit ? t('calendarDialogEdit') : t('calendarDialogNew')}
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label={t('sharedName')}
            className={classes.inputDark}
            fullWidth
            size="small"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab
              icon={<RepeatOutlined fontSize="small" />}
              iconPosition="start"
              label={t('calendarRecurrenceTab')}
            />
            <Tab
              icon={<UploadFileOutlined fontSize="small" />}
              iconPosition="start"
              label={t('calendarFileTab')}
            />
          </Tabs>

          {tab === 0 && (
            <Stack spacing={2}>
              <Box
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
              >
                <TextField
                  type="datetime-local"
                  label={t('maintenanceStart')}
                  InputLabelProps={{ shrink: true }}
                  className={classes.inputDark}
                  size="small"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
                <TextField
                  type="datetime-local"
                  label={t('calendarEnd')}
                  InputLabelProps={{ shrink: true }}
                  className={classes.inputDark}
                  size="small"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Box>
              <FormControl size="small" className={classes.inputDark} fullWidth>
                <InputLabel>{t('calendarFrequency')}</InputLabel>
                <Select
                  label={t('calendarFrequency')}
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <MenuItem value="ONCE">{t('calendarOnce')}</MenuItem>
                  <MenuItem value="DAILY">{t('calendarDaily')}</MenuItem>
                  <MenuItem value="WEEKLY">{t('calendarWeekly')}</MenuItem>
                  <MenuItem value="MONTHLY">{t('calendarMonthly')}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {tab === 1 && (
            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileOutlined />}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {fileName || t('calendarFilePicker')}
                <input type="file" accept=".ics,text/calendar" hidden onChange={handleFile} />
              </Button>
              {!fileName && fileData && (
                <Typography sx={{ mt: 1, fontSize: '0.78rem', color: 'text.disabled' }}>
                  {t('calendarFileLoaded')}
                </Typography>
              )}
            </Box>
          )}

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

const CalendarsPageV2 = () => {
  const theme = useTheme();
  const { classes } = useManageStyles();
  const t = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const freqLabel = useMemo(
    () => ({
      ONCE: t('calendarOnce'),
      DAILY: t('calendarDaily'),
      WEEKLY: t('calendarWeekly'),
      MONTHLY: t('calendarMonthly'),
    }),
    [t],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/calendars');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setSnack({ open: true, msg: t('calendarLoadFailed'), severity: 'error' });
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
    return items.filter((it) => (it.name || '').toLowerCase().includes(q));
  }, [items, search]);

  const stats = useMemo(() => {
    const parsed = items.map((it) => parseICal(it.data));
    const simpleCount = parsed.filter(Boolean).length;
    return {
      total: items.length,
      simple: simpleCount,
      custom: items.length - simpleCount,
    };
  }, [items]);

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
    setSnack({ open: true, msg: t('calendarSaved'), severity: 'success' });
    reload();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetchOrThrow(`/api/calendars/${confirmDelete.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((it) => it.id !== confirmDelete.id));
      setSnack({ open: true, msg: t('calendarDeleted'), severity: 'success' });
      setConfirmDelete(null);
    } catch {
      setSnack({ open: true, msg: t('calendarDeleteFailed'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<CalendarMonthOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('sharedCalendars')}
          subtitle={t('calendarPageSubtitle')}
          onRefresh={reload}
          onCreate={openCreate}
          classes={classes}
        />

        <Box className={classes.statsGrid}>
          <StatCard
            icon={<CalendarMonthOutlined fontSize="small" />}
            label={t('driversStatTotal')}
            value={stats.total}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<RepeatOutlined fontSize="small" />}
            label={t('calendarStatSimple')}
            value={stats.simple}
            color={theme.palette.secondary.main}
            bg={alpha(theme.palette.secondary.main, 0.18)}
            classes={classes}
          />
          <StatCard
            icon={<UploadFileOutlined fontSize="small" />}
            label={t('calendarStatCustom')}
            value={stats.custom}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.18)}
            classes={classes}
          />
        </Box>

        <TextField
          className={classes.searchField}
          placeholder={`${t('sharedSearch')}…`}
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
            icon={<CalendarMonthOutlined sx={{ fontSize: 40, color: 'text.disabled' }} />}
            title={t('calendarEmptyTitle')}
            hint={t('calendarEmptyHint')}
            onCta={openCreate}
            classes={classes}
          />
        ) : (
          <Box className={classes.cardGrid}>
            {filtered.map((it) => {
              const parsed = parseICal(it.data);
              return (
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
                      <EventOutlined fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography className={classes.cardTitle}>{it.name || '—'}</Typography>
                      <Typography className={classes.cardSub}>
                        {parsed
                          ? freqLabel[parsed.frequency] || t('calendarRecurrence')
                          : t('calendarTypeCustom')}
                      </Typography>
                    </Box>
                  </Box>

                  {parsed && (
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                      {parsed.start.format('DD MMM YYYY · HH:mm')} → {parsed.end.format('HH:mm')}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={parsed ? t('calendarTypeSimple') : t('calendarTypeCustom')}
                      sx={{
                        height: 22,
                        fontSize: theme.typography.caption.fontSize,
                        bgcolor: parsed
                          ? alpha(theme.palette.secondary.main, 0.16)
                          : alpha(theme.palette.warning.main, 0.16),
                        color: parsed ? theme.palette.secondary.main : theme.palette.warning.main,
                      }}
                    />
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

        <CalendarDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          editing={editing}
          onSaved={onSaved}
          classes={classes}
        />

        <ConfirmDeleteDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={doDelete}
          deleting={deleting}
          target={confirmDelete?.name}
          warning={t('calendarDeleteWarning')}
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

export default CalendarsPageV2;
