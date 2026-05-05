import PageLayout from '../PageLayout';
import { useState } from 'react';
import {
  Box, Typography, Button, Select, MenuItem,
  TextField, Stack, FormControl, InputLabel,
  IconButton, Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  FileDownload, CalendarToday, ArrowBack, KeyboardArrowDown,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import dayjs from 'dayjs';
import CarReport from './CarReport';
import CompleteReport from './CompleteReport';
import { useNavigate } from 'react-router-dom';

const REPORT_OPTIONS = [
  { value: 'complete', label: 'Rapport Complet', sub: "Activité complète avec tous les champs" },
  { value: 'summary', label: 'Rapport Global', sub: 'Résumé global du véhicule' },
  { value: 'consumption', label: 'Consommation', sub: 'Carburant pendant les mouvements' },
  { value: 'stops', label: 'Stationnements', sub: 'Activités de stationnement' },
  { value: 'distance', label: 'Distance', sub: 'Distance parcourue sur la période' },
  { value: 'temperature', label: 'Température', sub: 'Surveillance position par position' },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'thisWeek', label: 'Cette semaine' },
  { value: 'previousWeek', label: 'Semaine dernière' },
  { value: 'thisMonth', label: 'Ce mois-ci' },
  { value: 'previousMonth', label: 'Mois dernier' },
  { value: 'custom', label: 'Personnalisé' },
];

const getDateRange = (period, customFrom, customTo) => {
  let selectedFrom, selectedTo;
  switch (period) {
    case 'today': selectedFrom = dayjs().startOf('day'); selectedTo = dayjs().endOf('day'); break;
    case 'yesterday': selectedFrom = dayjs().subtract(1, 'day').startOf('day'); selectedTo = dayjs().subtract(1, 'day').endOf('day'); break;
    case 'thisWeek': selectedFrom = dayjs().startOf('week'); selectedTo = dayjs().endOf('week'); break;
    case 'previousWeek': selectedFrom = dayjs().subtract(1, 'week').startOf('week'); selectedTo = dayjs().subtract(1, 'week').endOf('week'); break;
    case 'thisMonth': selectedFrom = dayjs().startOf('month'); selectedTo = dayjs().endOf('month'); break;
    case 'previousMonth': selectedFrom = dayjs().subtract(1, 'month').startOf('month'); selectedTo = dayjs().subtract(1, 'month').endOf('month'); break;
    default: selectedFrom = dayjs(customFrom); selectedTo = dayjs(customTo); break;
  }
  if (!selectedFrom?.isValid() || !selectedTo?.isValid()) {
    return { from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() };
  }
  return { from: selectedFrom.toISOString(), to: selectedTo.toISOString() };
};

const ReportPageNew = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const devices = useSelector((state) => state.devices.items);
  const storeDeviceId = useSelector((state) => state.devices.selectedId);

  const [reportType, setReportType] = useState('complete');
  const [deviceId, setDeviceId] = useState(storeDeviceId || '');
  const [period, setPeriod] = useState('today');
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'));
  const [customTo, setCustomTo] = useState(dayjs().endOf('day').format('YYYY-MM-DDTHH:mm'));

  const glass = {
    background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
    borderRadius: '14px',
  };

  const darkInputSx = {
    '& .MuiOutlinedInput-root': {
      background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.action.hover,
      borderRadius: '10px',
      color: theme.palette.text.primary,
      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider },
      '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider },
      '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
    '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
    '& .MuiSelect-icon': { color: theme.palette.text.secondary },
  };

  const menuPaperSx = {
    background: isDark ? 'rgba(10,15,30,0.97)' : theme.palette.background.paper,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : theme.palette.divider}`,
    borderRadius: '12px',
    '& .MuiMenuItem-root': {
      color: theme.palette.text.secondary,
      '&:hover': { bgcolor: theme.palette.action.hover, color: theme.palette.text.primary },
      '&.Mui-selected': { bgcolor: 'rgba(99,102,241,0.15)', color: '#818cf8' },
    },
  };

  const dateRange = getDateRange(period, customFrom, customTo);
  const dateLabel = `${dayjs(dateRange.from).format('DD MMM YYYY, HH:mm')} — ${dayjs(dateRange.to).format('DD MMM YYYY, HH:mm')}`;

  const sortedDevices = Object.values(devices).sort((a, b) => a.name.localeCompare(b.name));
  const selectedDevice = deviceId ? devices[deviceId] : null;

  const handleExportExcel = () => {
    if (!deviceId) return;
    const query = new URLSearchParams({ deviceId, from: dateRange.from, to: dateRange.to });
    window.location.assign(`/api/reports/trips/xlsx?${query.toString()}`);
  };

  const childProps = { deviceId, period, customFrom, customTo };

  return (
    <PageLayout>
      <Box sx={{
        width: '100%', flex: 1, boxSizing: 'border-box',
        padding: 3, background: theme.palette.background.default,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                ...glass, borderRadius: '10px', color: theme.palette.text.secondary,
                '&:hover': { background: isDark ? 'rgba(255,255,255,0.1)' : theme.palette.action.selected, color: theme.palette.text.primary },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: theme.palette.text.primary }}>Rapports</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.disabled }}>Analyses et informations sur votre flotte</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              onClick={handleExportExcel}
              disabled={!deviceId}
              sx={{
                ...glass, textTransform: 'none', fontWeight: 600,
                fontSize: '0.82rem', color: theme.palette.text.secondary, px: 2, py: 0.75,
                '&:hover': { background: isDark ? 'rgba(255,255,255,0.09)' : theme.palette.action.selected, color: theme.palette.text.primary },
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              Excel
            </Button>
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              sx={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '10px', textTransform: 'none',
                fontWeight: 600, fontSize: '0.82rem', color: '#818cf8',
                px: 2, py: 0.75,
                '&:hover': { background: 'rgba(99,102,241,0.25)' },
              }}
            >
              PDF
            </Button>
          </Stack>
        </Box>

        {/* ── Filter bar ── */}
        <Box sx={{
          ...glass, p: 2, mb: 3,
          display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
        }}>
          {/* Report type */}
          <FormControl size="small" sx={{ minWidth: 220, ...darkInputSx }}>
            <InputLabel>Type de rapport</InputLabel>
            <Select
              value={reportType}
              label="Type de rapport"
              onChange={(e) => setReportType(e.target.value)}
              IconComponent={KeyboardArrowDown}
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
            >
              {REPORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.25 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{opt.label}</Typography>
                    <Typography sx={{ fontSize: '0.73rem', color: theme.palette.text.disabled, mt: 0.2 }}>{opt.sub}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Device */}
          <Autocomplete
            size="small"
            options={sortedDevices}
            getOptionLabel={(d) => d.name || ''}
            value={selectedDevice || null}
            onChange={(_, v) => setDeviceId(v?.id || '')}
            sx={{ minWidth: 220 }}
            slotProps={{
              paper: {
                sx: menuPaperSx,
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Véhicule"
                sx={darkInputSx}
              />
            )}
          />

          {/* Period */}
          <FormControl size="small" sx={{ minWidth: 180, ...darkInputSx }}>
            <InputLabel>{t('reportPeriod')}</InputLabel>
            <Select
              value={period}
              label={t('reportPeriod')}
              onChange={(e) => setPeriod(e.target.value)}
              IconComponent={KeyboardArrowDown}
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date range display or custom pickers */}
          {period !== 'custom' ? (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
              borderRadius: '10px', px: 2, py: '7px', minWidth: 260,
            }}>
              <CalendarToday sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
              <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, fontWeight: 500 }}>{dateLabel}</Typography>
            </Box>
          ) : (
            <>
              <TextField
                size="small"
                type="datetime-local"
                label={t('reportFrom')}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                sx={{ minWidth: 240, ...darkInputSx }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="datetime-local"
                label={t('reportTo')}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                sx={{ minWidth: 240, ...darkInputSx }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}
        </Box>

        {/* ── Report type pills ── */}
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          {REPORT_OPTIONS.map((opt) => (
            <Box
              key={opt.value}
              onClick={() => setReportType(opt.value)}
              sx={{
                px: 2, py: 0.75, borderRadius: '10px', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600,
                transition: 'all 0.15s ease',
                ...(reportType === opt.value
                  ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }
                  : {
                    background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider}`,
                    color: theme.palette.text.disabled,
                    '&:hover': { border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : theme.palette.divider}`, color: theme.palette.text.secondary },
                  }
                ),
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Stack>

        {/* ── Report content ── */}
        {reportType === 'summary' && <CarReport {...childProps} />}
        {reportType === 'complete' && <CompleteReport {...childProps} />}
        {reportType !== 'summary' && reportType !== 'complete' && (
          <Box sx={{
            ...glass, p: 8, textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '18px',
              background: 'rgba(99,102,241,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', mb: 1,
            }}>
              <CalendarToday sx={{ fontSize: 28, color: '#6366f1' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '1rem' }}>
              {REPORT_OPTIONS.find((o) => o.value === reportType)?.label}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.disabled }}>
              Ce rapport sera disponible prochainement.
            </Typography>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default ReportPageNew;
