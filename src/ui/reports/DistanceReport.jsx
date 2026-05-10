import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Skeleton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { DirectionsCar, Warning, TableRows } from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import {
  formatDistance,
  formatSpeed,
  formatNumericHours,
  formatVolume,
} from '../../common/util/formatter';
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

const DistanceReport = ({
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
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const effectiveIds = useMemo(() => {
    if (Array.isArray(propDeviceIds) && propDeviceIds.length) {
      return propDeviceIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    }
    const one = legacyDeviceId ?? storeDeviceId;
    return one != null && one !== '' ? [Number(one)] : [];
  }, [propDeviceIds, legacyDeviceId, storeDeviceId]);

  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const res = await fetch(`/api/reports/summary?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSummary(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  });

  useEffectAsync(async () => {
    if (effectiveIds.length) fetchData();
  }, [effectiveIds.join(','), period, customFrom, customTo]);

  const totals = useMemo(() => {
    const totalDist = summary.reduce((s, row) => s + (row.distance || 0), 0);
    const totalFuel = summary.reduce((s, row) => s + (row.spentFuel || 0), 0);
    const totalEngineHours = summary.reduce((s, row) => s + (row.engineHours || 0), 0);
    const maxSpeed = summary.reduce((s, row) => Math.max(s, row.maxSpeed || 0), 0);
    const topDevice =
      summary.length > 0
        ? summary.reduce(
            (best, row) => ((row.distance || 0) > (best?.distance || 0) ? row : best),
            null,
          )
        : null;
    return { totalDist, totalFuel, totalEngineHours, maxSpeed, topDevice };
  }, [summary]);

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
        <DirectionsCar
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

  const colCount = 6;

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
            label: t('sharedDistance'),
            value: loading ? '…' : formatDistance(totals.totalDist, distanceUnit, t),
            color: theme.palette.info.main,
          },
          {
            label: t('reportMaximumSpeed'),
            value: loading
              ? '…'
              : totals.maxSpeed > 0
                ? formatSpeed(totals.maxSpeed, speedUnit, t)
                : '—',
            color: theme.palette.error.main,
          },
          {
            label: t('reportEngineHours'),
            value: loading
              ? '…'
              : totals.totalEngineHours > 0
                ? formatNumericHours(totals.totalEngineHours, t)
                : '—',
            color: theme.palette.warning.main,
          },
          ...(totals.totalFuel > 0
            ? [
                {
                  label: t('reportSpentFuel'),
                  value: formatVolume(totals.totalFuel, volumeUnit, t),
                  color: theme.palette.success.main,
                },
              ]
            : []),
          ...(totals.topDevice
            ? [
                {
                  label: t('reportTopDevice'),
                  value:
                    devices[totals.topDevice.deviceId]?.name || totals.topDevice.deviceName || '—',
                  color: theme.palette.primary.main,
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
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <Box component="thead">
            <Box component="tr">
              <Box {...hCell}>{t('reportDeviceName')}</Box>
              <Box {...hCell}>{t('sharedDistance')}</Box>
              <Box {...hCell}>{t('reportAverageSpeed')}</Box>
              <Box {...hCell}>{t('reportMaximumSpeed')}</Box>
              <Box {...hCell}>{t('reportEngineHours')}</Box>
              <Box {...hCell}>{t('reportSpentFuel')}</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {loading ? (
              Array(effectiveIds.length || 3)
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
            ) : summary.length === 0 ? (
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
              summary.map((row, i) => (
                <Box
                  component="tr"
                  key={row.deviceId || i}
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
                  <Box
                    component="td"
                    sx={{
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 600,
                      color: `${theme.palette.text.primary} !important`,
                    }}
                  >
                    {devices[row.deviceId]?.name || row.deviceName || '—'}
                  </Box>
                  <Box
                    component="td"
                    sx={{ color: `${theme.palette.info.main} !important`, fontWeight: 700 }}
                  >
                    {formatDistance(row.distance || 0, distanceUnit, t)}
                  </Box>
                  <Box component="td">
                    {row.averageSpeed > 0 ? formatSpeed(row.averageSpeed, speedUnit, t) : '—'}
                  </Box>
                  <Box component="td">
                    {row.maxSpeed > 0 ? formatSpeed(row.maxSpeed, speedUnit, t) : '—'}
                  </Box>
                  <Box component="td">
                    {row.engineHours > 0 ? formatNumericHours(row.engineHours, t) : '—'}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      color: `${row.spentFuel > 0 ? theme.palette.success.main : theme.palette.text.disabled} !important`,
                    }}
                  >
                    {row.spentFuel > 0 ? formatVolume(row.spentFuel, volumeUnit, t) : '—'}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DistanceReport;
