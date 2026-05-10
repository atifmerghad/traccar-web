import PageLayout from '../layout/PageLayout';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { FileDownload, CalendarToday, ArrowBack, KeyboardArrowDown } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import dayjs from 'dayjs';
import CarReport from './CarReport';
import CompleteReport from './CompleteReport';
import StopsReport from './StopsReport';
import ConsumptionReport from './ConsumptionReport';
import DistanceReport from './DistanceReport';
import TemperatureReport from './TemperatureReport';
import { useNavigate } from 'react-router-dom';

const getDateRange = (period, customFrom, customTo) => {
  let selectedFrom, selectedTo;
  switch (period) {
    case 'today':
      selectedFrom = dayjs().startOf('day');
      selectedTo = dayjs().endOf('day');
      break;
    case 'yesterday':
      selectedFrom = dayjs().subtract(1, 'day').startOf('day');
      selectedTo = dayjs().subtract(1, 'day').endOf('day');
      break;
    case 'thisWeek':
      selectedFrom = dayjs().startOf('week');
      selectedTo = dayjs().endOf('week');
      break;
    case 'previousWeek':
      selectedFrom = dayjs().subtract(1, 'week').startOf('week');
      selectedTo = dayjs().subtract(1, 'week').endOf('week');
      break;
    case 'thisMonth':
      selectedFrom = dayjs().startOf('month');
      selectedTo = dayjs().endOf('month');
      break;
    case 'previousMonth':
      selectedFrom = dayjs().subtract(1, 'month').startOf('month');
      selectedTo = dayjs().subtract(1, 'month').endOf('month');
      break;
    default:
      selectedFrom = dayjs(customFrom);
      selectedTo = dayjs(customTo);
      break;
  }
  if (!selectedFrom?.isValid() || !selectedTo?.isValid()) {
    return { from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() };
  }
  return { from: selectedFrom.toISOString(), to: selectedTo.toISOString() };
};

const ReportPageV2 = () => {
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const devices = useSelector((state) => state.devices.items);
  const storeDeviceId = useSelector((state) => state.devices.selectedId);

  const [reportType, setReportType] = useState('complete');
  const [selectedIds, setSelectedIds] = useState([]);
  const deviceInitRef = useRef(false);
  const [period, setPeriod] = useState('today');
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'));
  const [customTo, setCustomTo] = useState(dayjs().endOf('day').format('YYYY-MM-DDTHH:mm'));
  const REPORT_OPTIONS = [
    {
      value: 'complete',
      label: tt('reportCombined', 'Complete Report'),
      sub: tt('reportCompleteDesc', 'Complete activity with all fields'),
    },
    {
      value: 'summary',
      label: tt('reportSummary', 'Summary Report'),
      sub: tt('reportSummaryDesc', 'Global device summary'),
    },
    {
      value: 'consumption',
      label: tt('positionFuelConsumption', 'Consumption'),
      sub: tt('reportConsumptionDesc', 'Fuel usage while moving'),
    },
    {
      value: 'stops',
      label: tt('reportStops', 'Stops'),
      sub: tt('reportStopsDesc', 'Parking activities'),
    },
    {
      value: 'distance',
      label: tt('sharedDistance', 'Distance'),
      sub: tt('reportDistanceDesc', 'Distance traveled during period'),
    },
    {
      value: 'temperature',
      label: tt('positionTemp', 'Temperature'),
      sub: tt('reportTemperatureDesc', 'Position-by-position monitoring'),
    },
  ];

  const PERIOD_OPTIONS = [
    { value: 'today', label: tt('reportToday', 'Today') },
    { value: 'yesterday', label: tt('reportYesterday', 'Yesterday') },
    { value: 'thisWeek', label: tt('reportThisWeek', 'This Week') },
    { value: 'previousWeek', label: tt('reportPreviousWeek', 'Previous Week') },
    { value: 'thisMonth', label: tt('reportThisMonth', 'This Month') },
    { value: 'previousMonth', label: tt('reportPreviousMonth', 'Previous Month') },
    { value: 'custom', label: tt('reportCustom', 'Custom') },
  ];

  const glass = {
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.05)
      : theme.palette.background.paper,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
    borderRadius: theme.spacing(1.75),
  };

  const darkInputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : theme.palette.action.hover,
      borderRadius: theme.spacing(1.25),
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
      },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
    '& .MuiSelect-icon': { color: theme.palette.text.secondary },
  };

  const menuPaperSx = {
    backgroundColor: isDark
      ? alpha(theme.palette.background.default, 0.97)
      : theme.palette.background.paper,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
    borderRadius: theme.spacing(1.5),
    '& .MuiMenuItem-root': {
      color: theme.palette.text.secondary,
      '&:hover': { bgcolor: theme.palette.action.hover, color: theme.palette.text.primary },
      '&.Mui-selected': {
        bgcolor: alpha(theme.palette.primary.main, 0.15),
        color: theme.palette.primary.light,
      },
    },
  };

  const dateRange = getDateRange(period, customFrom, customTo);
  const dateLabel = `${dayjs(dateRange.from).format('DD MMM YYYY, HH:mm')} — ${dayjs(dateRange.to).format('DD MMM YYYY, HH:mm')}`;

  const sortedDevices = useMemo(
    () => Object.values(devices).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [devices],
  );

  useEffect(() => {
    if (deviceInitRef.current || !sortedDevices.length) return;
    deviceInitRef.current = true;
    const sid = storeDeviceId != null && storeDeviceId !== '' ? Number(storeDeviceId) : null;
    if (sid != null && !Number.isNaN(sid) && sortedDevices.some((d) => Number(d.id) === sid)) {
      setSelectedIds([sid]);
    } else {
      setSelectedIds(sortedDevices.map((d) => Number(d.id)));
    }
  }, [sortedDevices, storeDeviceId]);

  const appendDeviceIds = (query) => {
    selectedIds.forEach((id) => {
      query.append('deviceId', id);
    });
  };

  const EXPORT_ENDPOINT = {
    complete: 'trips',
    summary: 'summary',
    consumption: 'trips',
    stops: 'stops',
    distance: 'summary',
    temperature: 'route',
  };

  const handleExportExcel = () => {
    if (!selectedIds.length) return;
    const query = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
    appendDeviceIds(query);
    const endpoint = EXPORT_ENDPOINT[reportType] || 'trips';
    window.location.assign(`/api/reports/${endpoint}/xlsx?${query.toString()}`);
  };

  const childProps = { deviceIds: selectedIds, period, customFrom, customTo };

  return (
    <PageLayout>
      <Box
        sx={{
          width: '100%',
          flex: 1,
          boxSizing: 'border-box',
          padding: { xs: 1.5, md: 3 },
          background: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                ...glass,
                borderRadius: theme.spacing(1.25),
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: isDark
                    ? alpha(theme.palette.common.white, 0.1)
                    : theme.palette.action.selected,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography
                sx={{ fontSize: '1.2rem', fontWeight: 800, color: theme.palette.text.primary }}
              >
                {tt('reportTitle', 'Reports')}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.disabled }}>
                {tt('reportPageSubtitle', 'Build and export trip reports')}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              onClick={handleExportExcel}
              disabled={!selectedIds.length}
              sx={{
                ...glass,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: theme.palette.text.secondary,
                px: 2,
                py: 0.75,
                width: { xs: '50%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: isDark
                    ? alpha(theme.palette.common.white, 0.09)
                    : theme.palette.action.selected,
                  color: theme.palette.text.primary,
                },
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              {tt('sharedExport', 'Export')} Excel
            </Button>
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: theme.spacing(1.25),
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: theme.palette.primary.light,
                px: 2,
                py: 0.75,
                width: { xs: '50%', sm: 'auto' },
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.25) },
              }}
            >
              {tt('reportExportPdf', 'Export PDF')}
            </Button>
          </Stack>
        </Box>

        {/* ── Filter bar ── */}
        <Box
          sx={{
            ...glass,
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Report type */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 }, ...darkInputSx }}>
            <InputLabel>{tt('reportType', 'Report type')}</InputLabel>
            <Select
              value={reportType}
              label={tt('reportType', 'Report type')}
              onChange={(e) => setReportType(e.target.value)}
              IconComponent={KeyboardArrowDown}
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
            >
              {REPORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.25 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {opt.label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.73rem', color: theme.palette.text.disabled, mt: 0.2 }}
                    >
                      {opt.sub}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Devices: multi-select + all (Traccar API: repeated deviceId params) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              flex: { sm: '1 1 260px' },
              minWidth: { xs: '100%', sm: 260 },
            }}
          >
            <Autocomplete
              multiple
              limitTags={2}
              size="small"
              options={sortedDevices}
              getOptionLabel={(d) => d.name || ''}
              isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
              value={sortedDevices.filter((d) => selectedIds.includes(Number(d.id)))}
              onChange={(_, v) => setSelectedIds(v.map((d) => Number(d.id)))}
              sx={{ flex: 1, minWidth: 0 }}
              slotProps={{
                paper: {
                  sx: menuPaperSx,
                },
              }}
              renderInput={(params) => (
                <TextField {...params} label={tt('deviceTitle', 'Devices')} sx={darkInputSx} />
              )}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedIds(sortedDevices.map((d) => Number(d.id)))}
              disabled={!sortedDevices.length}
              sx={{
                flexShrink: 0,
                mt: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.2)
                  : theme.palette.divider,
                color: theme.palette.text.secondary,
              }}
            >
              {t('groupAllDevices')}
            </Button>
          </Box>

          {/* Period */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 }, ...darkInputSx }}>
            <InputLabel>{t('reportPeriod')}</InputLabel>
            <Select
              value={period}
              label={t('reportPeriod')}
              onChange={(e) => setPeriod(e.target.value)}
              IconComponent={KeyboardArrowDown}
              MenuProps={{ PaperProps: { sx: menuPaperSx } }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date range display or custom pickers */}
          {period !== 'custom' ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: isDark
                  ? alpha(theme.palette.common.white, 0.04)
                  : theme.palette.action.hover,
                border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
                borderRadius: theme.spacing(1.25),
                px: 2,
                py: '7px',
                minWidth: { xs: '100%', sm: 260 },
              }}
            >
              <CalendarToday sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
              <Typography
                sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, fontWeight: 500 }}
              >
                {dateLabel}
              </Typography>
            </Box>
          ) : (
            <>
              <TextField
                size="small"
                type="datetime-local"
                label={t('reportFrom')}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 240 }, ...darkInputSx }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="datetime-local"
                label={t('reportTo')}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 240 }, ...darkInputSx }}
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
                px: 2,
                py: 0.75,
                borderRadius: theme.spacing(1.25),
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
                ...(reportType === opt.value
                  ? {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                      color: theme.palette.primary.light,
                    }
                  : {
                      backgroundColor: isDark
                        ? alpha(theme.palette.common.white, 0.04)
                        : theme.palette.action.hover,
                      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
                      color: theme.palette.text.disabled,
                      '&:hover': {
                        border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.15) : theme.palette.divider}`,
                        color: theme.palette.text.secondary,
                      },
                    }),
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Stack>

        {/* ── Report content ── */}
        {reportType === 'summary' && <CarReport {...childProps} />}
        {reportType === 'complete' && <CompleteReport {...childProps} />}
        {reportType === 'stops' && <StopsReport {...childProps} />}
        {reportType === 'consumption' && <ConsumptionReport {...childProps} />}
        {reportType === 'distance' && <DistanceReport {...childProps} />}
        {reportType === 'temperature' && <TemperatureReport {...childProps} />}
      </Box>
    </PageLayout>
  );
};

export default ReportPageV2;
