import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Skeleton, TablePagination } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Thermostat, Warning, TableRows } from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { formatTime, formatTemperature, formatSpeed } from '../../common/util/formatter';
import { useAttributePreference } from '../../common/util/preferences';
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

const TEMP_KEYS = ['temp1', 'temp2', 'temp3', 'temp4', 'temperature'];

const extractTemp = (attributes) => {
  if (!attributes) return null;
  for (const key of TEMP_KEYS) {
    if (attributes[key] != null && !Number.isNaN(Number(attributes[key]))) {
      return Number(attributes[key]);
    }
  }
  return null;
};

const TemperatureReport = ({
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
  const speedUnit = useAttributePreference('speedUnit');

  const effectiveIds = useMemo(() => {
    if (Array.isArray(propDeviceIds) && propDeviceIds.length) {
      return propDeviceIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    }
    const one = legacyDeviceId ?? storeDeviceId;
    return one != null && one !== '' ? [Number(one)] : [];
  }, [propDeviceIds, legacyDeviceId, storeDeviceId]);

  const multiDevice = effectiveIds.length > 1;

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

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
      const allPositions = [];
      // Fetch route per device (Traccar route endpoint takes one deviceId at a time)
      await Promise.all(
        effectiveIds.map(async (id) => {
          const query = new URLSearchParams({ deviceId: id, from: range.from, to: range.to });
          const res = await fetch(`/api/reports/route?${query.toString()}`, {
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          // Only keep positions that have temperature data
          const withTemp = data.filter((pos) => extractTemp(pos.attributes) !== null);
          withTemp.forEach((pos) => allPositions.push({ ...pos, _deviceId: id }));
        }),
      );
      // Sort by fixTime descending
      allPositions.sort((a, b) => new Date(b.fixTime).getTime() - new Date(a.fixTime).getTime());
      setPositions(allPositions);
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

  const stats = useMemo(() => {
    if (!positions.length) return { min: null, max: null, avg: null };
    const temps = positions.map((p) => extractTemp(p.attributes)).filter((v) => v !== null);
    if (!temps.length) return { min: null, max: null, avg: null };
    return {
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: temps.reduce((s, v) => s + v, 0) / temps.length,
    };
  }, [positions]);

  const noTempData = !loading && !error && effectiveIds.length > 0 && positions.length === 0;
  const pageData = positions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const colCount = (multiDevice ? 1 : 0) + 4;

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

  const tempColor = (val) => {
    if (val === null) return theme.palette.text.disabled;
    if (val > 35) return theme.palette.error.main;
    if (val > 25) return theme.palette.warning.main;
    if (val < 0) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  if (!effectiveIds.length) {
    return (
      <Box sx={{ ...glass, p: 6, textAlign: 'center' }}>
        <Thermostat sx={{ fontSize: 56, color: theme.palette.action.disabledBackground, mb: 2 }} />
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

  if (noTempData) {
    return (
      <Box
        sx={{
          ...glass,
          p: 8,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '18px',
            backgroundColor: alpha(theme.palette.warning.main, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <Thermostat sx={{ fontSize: 28, color: theme.palette.warning.main }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '1rem' }}>
          {t('reportNoTempData')}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.disabled, maxWidth: 360 }}>
          {t('reportNoTempDataHint')}
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
            label: t('reportTempReadings'),
            value: loading ? '…' : positions.length.toString(),
            color: theme.palette.primary.main,
          },
          {
            label: t('reportTempMin'),
            value: loading ? '…' : stats.min !== null ? formatTemperature(stats.min) : '—',
            color: theme.palette.info.main,
          },
          {
            label: t('reportTempMax'),
            value: loading ? '…' : stats.max !== null ? formatTemperature(stats.max) : '—',
            color: theme.palette.error.main,
          },
          {
            label: t('reportTempAvg'),
            value: loading ? '…' : stats.avg !== null ? formatTemperature(stats.avg) : '—',
            color: theme.palette.warning.main,
          },
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
          sx={{ width: '100%', borderCollapse: 'collapse', minWidth: multiDevice ? 700 : 580 }}
        >
          <Box component="thead">
            <Box component="tr">
              {multiDevice && <Box {...hCell}>{t('reportDeviceName')}</Box>}
              <Box {...hCell}>{t('positionFixTime')}</Box>
              <Box {...hCell}>{t('positionTemp')}</Box>
              <Box {...hCell}>{t('positionSpeed')}</Box>
              <Box {...hCell}>{t('positionAddress')}</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {loading ? (
              Array(8)
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
              pageData.map((pos, i) => {
                const temp = extractTemp(pos.attributes);
                return (
                  <Box
                    component="tr"
                    key={pos.id || i}
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
                        {devices[pos._deviceId]?.name || '—'}
                      </Box>
                    )}
                    <Box component="td">{formatTime(pos.fixTime, 'minutes')}</Box>
                    <Box
                      component="td"
                      sx={{ fontWeight: 700, color: `${tempColor(temp)} !important` }}
                    >
                      {temp !== null ? formatTemperature(temp) : '—'}
                    </Box>
                    <Box component="td">
                      {pos.speed > 0 ? formatSpeed(pos.speed, speedUnit, t) : '—'}
                    </Box>
                    <Box
                      component="td"
                      sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {pos.address || `${pos.latitude?.toFixed(5)}, ${pos.longitude?.toFixed(5)}`}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {!loading && positions.length > 50 && (
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
            count={positions.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[50, 100, 250]}
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

export default TemperatureReport;
