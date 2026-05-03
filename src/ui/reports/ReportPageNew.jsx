import PageLayout from '../PageLayout';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Select, MenuItem,
  TextField, Stack, FormControl, InputLabel, IconButton,
} from '@mui/material';
import {
  FileDownload, CalendarToday, ArrowBack, KeyboardArrowDown,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import { formatDistance, formatSpeed, formatVolume, formatTime, formatNumericHours } from '../../common/util/formatter';
import dayjs from 'dayjs';
import SelectField from '../../common/components/SelectField';
import { makeStyles } from 'tss-react/mui';
import CarReport from './CarReport';
import CompleteReport from './CompleteReport';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    flex: 1,
    boxSizing: 'border-box',
    padding: theme.spacing(3),
    backgroundColor: '#f1f5f9',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: theme.spacing(3),
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e2e8f0' },
    '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid #cbd5e1' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '2px solid #6366f1' },
    boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',
  },
  reportTypeSelect: {
    minWidth: 240,
  },
  deviceSelect: {
    minWidth: 240,
  },
  dateField: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    minWidth: 260,
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #e2e8f0' },
    '& .MuiOutlinedInput-root': { borderRadius: '10px' },
  },
  exportBtn: {
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '7px 16px',
    fontSize: '0.85rem',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#475569',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    '&:hover': { backgroundColor: '#f8fafc' },
  },
}));

const REPORT_OPTIONS = [
  { value: 'complete', label: 'Rapport Complet', sub: "Rapport d'activité complet avec tous les champs" },
  { value: 'consumption', label: 'Rapport de Consommation', sub: 'Consommation de carburant pendant les mouvements' },
  { value: 'stops', label: 'Stationnements', sub: 'Activités de stationnement du véhicule' },
  { value: 'distance', label: 'Rapport de Distance', sub: 'Distance parcourue sur la période' },
  { value: 'temperature', label: 'Rapport de Température', sub: 'Surveillance de température position par position' },
  { value: 'summary', label: 'Rapport Global de Véhicule', sub: 'Rapport Global de Véhicule' },
];

const ReportPageNew = () => {
  const { classes } = useStyles();
  const t = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [reportType, setReportType] = useState('complete');
  const [loading, setLoading] = useState(false);

  const devices = useSelector((state) => state.devices.items);
  const deviceId = useSelector((state) => state.devices.selectedId);
  const period = useSelector((state) => state.reports?.period || 'today');
  const from = useSelector((state) => state.reports?.from || '');
  const to = useSelector((state) => state.reports?.to || '');

  const getDateRange = () => {
    let selectedFrom, selectedTo;
    switch (period) {
      case 'today': selectedFrom = dayjs().startOf('day'); selectedTo = dayjs().endOf('day'); break;
      case 'yesterday': selectedFrom = dayjs().subtract(1, 'day').startOf('day'); selectedTo = dayjs().subtract(1, 'day').endOf('day'); break;
      case 'thisWeek': selectedFrom = dayjs().startOf('week'); selectedTo = dayjs().endOf('week'); break;
      case 'previousWeek': selectedFrom = dayjs().subtract(1, 'week').startOf('week'); selectedTo = dayjs().subtract(1, 'week').endOf('week'); break;
      case 'thisMonth': selectedFrom = dayjs().startOf('month'); selectedTo = dayjs().endOf('month'); break;
      case 'previousMonth': selectedFrom = dayjs().subtract(1, 'month').startOf('month'); selectedTo = dayjs().subtract(1, 'month').endOf('month'); break;
      default: selectedFrom = dayjs(from, 'YYYY-MM-DDTHH:mm'); selectedTo = dayjs(to, 'YYYY-MM-DDTHH:mm'); break;
    }
    if (!selectedFrom?.isValid() || !selectedTo?.isValid()) {
      return { from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() };
    }
    return { from: selectedFrom.toISOString(), to: selectedTo.toISOString() };
  };

  const selectedLabel = REPORT_OPTIONS.find((o) => o.value === reportType)?.label || 'Rapport Complet';
  const dateRange = getDateRange();
  const dateLabel = `${dayjs(dateRange.from).format('MMM DD, YYYY HH:mm')} - ${dayjs(dateRange.to).format('MMM DD, YYYY HH:mm')}`;

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Rapports</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>Analyses et informations sur votre flotte</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              className={classes.exportBtn}
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              endIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
              onClick={() => {
                const { from: f, to: t2 } = getDateRange();
                const query = new URLSearchParams({ deviceId, from: f, to: t2 });
                window.location.assign(`/api/reports/trips/xlsx?${query.toString()}`);
              }}
              disabled={!deviceId}
            >
              Exporter Excel
            </Button>
            <Button
              className={classes.exportBtn}
              startIcon={<FileDownload sx={{ fontSize: 16 }} />}
              endIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
              sx={{ color: '#6366f1 !important', borderColor: '#e0e7ff !important', bgcolor: '#f5f3ff !important' }}
            >
              Exporter PDF
            </Button>
          </Stack>
        </Box>

        {/* Filter Bar */}
        <Box className={classes.filterBar}>
          {/* Report Type */}
          <Select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            size="small"
            className={`${classes.dropdown} ${classes.reportTypeSelect}`}
            IconComponent={KeyboardArrowDown}
            renderValue={() => selectedLabel}
            sx={{ minWidth: 240 }}
          >
            {REPORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: reportType === opt.value ? '#6366f1' : '#1e293b' }}>
                    {opt.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.25 }}>{opt.sub}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>

          {/* Device Select */}
          <Box sx={{ minWidth: 240 }}>
            <SelectField
              label={t('reportDevice')}
              data={Object.values(devices).sort((a, b) => a.name.localeCompare(b.name))}
              value={deviceId}
              fullWidth
            />
          </Box>

          {/* Period */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('reportPeriod')}</InputLabel>
            <Select
              value={period}
              label={t('reportPeriod')}
              className={classes.dropdown}
            >
              <MenuItem value="today">{t('reportToday')}</MenuItem>
              <MenuItem value="yesterday">{t('reportYesterday')}</MenuItem>
              <MenuItem value="thisWeek">{t('reportThisWeek')}</MenuItem>
              <MenuItem value="previousWeek">{t('reportPreviousWeek')}</MenuItem>
              <MenuItem value="thisMonth">{t('reportThisMonth')}</MenuItem>
              <MenuItem value="previousMonth">{t('reportPreviousMonth')}</MenuItem>
              <MenuItem value="custom">{t('reportCustom')}</MenuItem>
            </Select>
          </FormControl>

          {/* Date display / custom pickers */}
          {period !== 'custom' ? (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: '#fff', borderRadius: '10px', px: 2, py: '7px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              minWidth: 280,
            }}>
              <CalendarToday sx={{ fontSize: 15, color: '#94a3b8' }} />
              <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>{dateLabel}</Typography>
            </Box>
          ) : (
            <>
              <TextField size="small" type="datetime-local" label={t('reportFrom')} value={from} className={classes.dateField} />
              <TextField size="small" type="datetime-local" label={t('reportTo')} value={to} className={classes.dateField} />
            </>
          )}
        </Box>

        {/* Report content */}
        {reportType === 'summary' && <CarReport />}
        {reportType === 'complete' && <CompleteReport />}
        {reportType !== 'summary' && reportType !== 'complete' && (
          <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#fff', borderRadius: 3 }}>
            <Typography color="textSecondary" sx={{ fontWeight: 600 }}>
              Rapport "{REPORT_OPTIONS.find((o) => o.value === reportType)?.label}" — bientôt disponible
            </Typography>
          </Box>
        )}
      </Box>
    </PageLayout>
  );
};

export default ReportPageNew;
