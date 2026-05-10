import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Skeleton, TablePagination } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { LocalParking, Warning, TableRows } from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import { formatTime, formatNumericHours, formatVolume } from '../../common/util/formatter';
import AddressValue from '../../common/components/AddressValue';
import dayjs from 'dayjs';

const getDateRange = (period, customFrom, customTo) => {
  let from, to;
  switch (period) {
    case 'today':
      from = dayjs().startOf('day');
      to = dayjs().endOf('day');
      break;
    case 'yesterday':
      from = dayjs().subtract(1, 'day').startOf('day');
      to = dayjs().subtract(1, 'day').endOf('day');
      break;
    case 'thisWeek':
      from = dayjs().startOf('week');
      to = dayjs().endOf('week');
      break;
    case 'previousWeek':
      from = dayjs().subtract(1, 'week').startOf('week');
      to = dayjs().subtract(1, 'week').endOf('week');
      break;
    case 'thisMonth':
      from = dayjs().startOf('month');
      to = dayjs().endOf('month');
      break;
    case 'previousMonth':
      from = dayjs().subtract(1, 'month').startOf('month');
      to = dayjs().subtract(1, 'month').endOf('month');
      break;
    default:
      from = dayjs(customFrom);
      to = dayjs(customTo);
      break;
  }
  if (!from?.isValid() || !to?.isValid()) {
    return { from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() };
  }
  return { from: from.toISOString(), to: to.toISOString() };
};

const StopsReport = ({
  deviceIds: propDeviceIds,
  deviceId: legacyDeviceId,
  period,
  customFrom,
  customTo,
}) => {
  const t = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const devices = useSelector((state) => state.devices.items);
  const storeDeviceId = useSelector((state) => state.devices.selectedId);
  const volumeUnit = useAttributePreference('volumeUnit');

  const effectiveIds = useMemo(() => {
    if (Array.isArray(propDeviceIds) && propDeviceIds.length) {
      return propDeviceIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    }
    const one = legacyDeviceId ?? storeDeviceId;
    return one != null && one !== '' ? [Number(one)] : [];
  }, [propDeviceIds, legacyDeviceId, storeDeviceId]);

  const multiDevice = effectiveIds.length > 1;

  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const glass = {
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.04)
      : theme.palette.background.paper,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
    borderRadius: '16px',
  };

  const fetchData = useCatch(async () => {
    if (!effectiveIds.length) return;
    setLoading(true);
    setError(null);
    try {
      const range = getDateRange(period, customFrom, customTo);
      const query = new URLSearchParams({ from: range.from, to: range.to });
      effectiveIds.forEach((id) => query.append('deviceId', id));
      const res = await fetch(`/api/reports/stops?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStops(await res.json());
      setPage(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  });

  useEffectAsync(async () => {
    if (effectiveIds.length) fetchData();
  }, [effectiveIds.join(','), period, customFrom, customTo]);

  const totals = useMemo(
    () => ({
      count: stops.length,
      duration: stops.reduce((s, st) => s + (st.duration || 0), 0),
      avgDuration:
        stops.length > 0 ? stops.reduce((s, st) => s + (st.duration || 0), 0) / stops.length : 0,
      fuel: stops.reduce((s, st) => s + (st.spentFuel || 0), 0),
    }),
    [stops],
  );

  const showFuel = totals.fuel > 0;
  const pageData = stops.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const colCount = (multiDevice ? 1 : 0) + 4 + (showFuel ? 1 : 0);

  const hCell = {
    component: 'th',
    sx: {
      fontWeight: 700,
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: theme.palette.text.disabled,
      bgcolor: isDark ? alpha(theme.palette.common.white, 0.03) : theme.palette.action.hover,
      borderBottom: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
      whiteSpace: 'nowrap',
      py: 1.5,
      px: 1.5,
    },
  };

  if (!effectiveIds.length) {
    return (
      <Box sx={{ ...glass, p: 6, textAlign: 'center' }}>
        <LocalParking
          sx={{ fontSize: 56, color: theme.palette.action.disabledBackground, mb: 2 }}
        />
        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
          {t('reportNoVehicleSelected')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
          {t('reportNoVehicleHint')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...glass, p: 6, textAlign: 'center' }}>
        <Warning sx={{ fontSize: 48, color: theme.palette.error.main, mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
          {t('reportLoadError')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* KPI strip */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          px: 2,
          py: 1.5,
          flexWrap: 'wrap',
          backgroundColor: isDark
            ? alpha(theme.palette.common.white, 0.03)
            : theme.palette.action.hover,
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
          borderRadius: '14px 14px 0 0',
        }}
      >
        {[
          {
            label: t('reportStops'),
            value: loading ? '…' : totals.count.toString(),
            color: theme.palette.primary.main,
          },
          {
            label: t('reportDuration'),
            value: loading ? '…' : formatNumericHours(totals.duration, t),
            color: theme.palette.warning.main,
          },
          {
            label: t('reportAvgStopDuration'),
            value: loading ? '…' : formatNumericHours(totals.avgDuration, t),
            color: theme.palette.info.main,
          },
          ...(showFuel
            ? [
                {
                  label: t('reportSpentFuel'),
                  value: loading ? '…' : formatVolume(totals.fuel, volumeUnit, t),
                  color: theme.palette.success.main,
                },
              ]
            : []),
        ].map((item) => (
          <Box key={item.label}>
            <Typography
              sx={{
                fontSize: '0.7rem',
                color: theme.palette.text.disabled,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {item.label}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: item.color }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box sx={{ ...glass, borderRadius: '0 0 14px 14px', borderTop: 'none', overflow: 'auto' }}>
        <Box
          component="table"
          sx={{ width: '100%', borderCollapse: 'collapse', minWidth: multiDevice ? 800 : 680 }}
        >
          <Box component="thead">
            <Box component="tr">
              {multiDevice && <Box {...hCell}>{t('reportDeviceName')}</Box>}
              <Box {...hCell}>{t('reportStartTime')}</Box>
              <Box {...hCell}>{t('reportEndTime')}</Box>
              <Box {...hCell}>{t('reportDuration')}</Box>
              {showFuel && <Box {...hCell}>{t('reportSpentFuel')}</Box>}
              <Box {...hCell}>{t('reportStartAddress')}</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {loading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Box component="tr" key={i}>
                    {Array(colCount)
                      .fill(0)
                      .map((__, j) => (
                        <Box
                          component="td"
                          key={j}
                          sx={{
                            py: 1.5,
                            px: 1.5,
                            borderBottom: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.04) : theme.palette.divider}`,
                          }}
                        >
                          <Skeleton
                            variant="text"
                            sx={{
                              bgcolor: isDark
                                ? alpha(theme.palette.common.white, 0.07)
                                : alpha(theme.palette.common.black, 0.07),
                            }}
                          />
                        </Box>
                      ))}
                  </Box>
                ))
            ) : pageData.length === 0 ? (
              <Box component="tr">
                <Box component="td" colSpan={colCount} sx={{ py: 8, textAlign: 'center' }}>
                  <TableRows
                    sx={{
                      fontSize: 48,
                      color: theme.palette.action.disabledBackground,
                      mb: 1.5,
                      display: 'block',
                      mx: 'auto',
                    }}
                  />
                  <Typography sx={{ color: theme.palette.text.disabled, fontWeight: 600 }}>
                    {t('sharedNoData')}
                  </Typography>
                </Box>
              </Box>
            ) : (
              pageData.map((stop, i) => (
                <Box
                  component="tr"
                  key={stop.id || i}
                  sx={{
                    '& td': {
                      py: 1.25,
                      px: 1.5,
                      fontSize: '0.82rem',
                      color: theme.palette.text.secondary,
                      borderBottom: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.04) : theme.palette.divider}`,
                      whiteSpace: 'nowrap',
                    },
                    '&:hover td': {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      color: theme.palette.text.primary,
                    },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  {multiDevice && (
                    <Box
                      component="td"
                      sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {devices[stop.deviceId]?.name || stop.deviceName || '—'}
                    </Box>
                  )}
                  <Box component="td">{formatTime(stop.startTime, 'minutes')}</Box>
                  <Box component="td">{formatTime(stop.endTime, 'minutes')}</Box>
                  <Box component="td">{formatNumericHours(stop.duration, t)}</Box>
                  {showFuel && (
                    <Box component="td">
                      {stop.spentFuel > 0 ? formatVolume(stop.spentFuel, volumeUnit, t) : '—'}
                    </Box>
                  )}
                  <Box
                    component="td"
                    sx={{
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: `${theme.palette.primary.main} !important`,
                    }}
                  >
                    {stop.latitude != null && stop.longitude != null ? (
                      <AddressValue
                        latitude={stop.latitude}
                        longitude={stop.longitude}
                        originalAddress={stop.address}
                      />
                    ) : (
                      stop.address || '—'
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {!loading && stops.length > 10 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.divider}`,
            pt: 1,
          }}
        >
          <TablePagination
            component="div"
            count={stops.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{
              color: theme.palette.text.secondary,
              '& .MuiIconButton-root': {
                color: theme.palette.text.secondary,
                '&:disabled': { color: theme.palette.text.disabled },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default StopsReport;
