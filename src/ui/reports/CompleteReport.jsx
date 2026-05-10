import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Stack,
  Skeleton,
  TablePagination,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  History,
  ContentCopy,
  Share,
  KeyboardArrowUp,
  KeyboardArrowDown as SortDown,
  TableRows,
  Warning,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import {
  formatDistance,
  formatSpeed,
  formatVolume,
  formatTime,
  formatNumericHours,
  formatTemperature,
} from '../../common/util/formatter';
import dayjs from 'dayjs';
import AddressValue from '../../common/components/AddressValue';

const MovementIcon = () => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '2px' }}>
      {Array(9)
        .fill(0)
        .map((_, i) => (
          <Box
            key={i}
            sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.success.main }}
          />
        ))}
    </Box>
  );
};

const ParkIcon = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: '6px',
        backgroundColor: alpha(theme.palette.info.main, 0.15),
        border: `1.5px solid ${alpha(theme.palette.info.main, 0.4)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{ fontSize: '0.68rem', fontWeight: 800, color: theme.palette.info.main, lineHeight: 1 }}
      >
        P
      </Typography>
    </Box>
  );
};

const Pill = ({ label, color, bg }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: 1.5,
      py: 0.3,
      borderRadius: '6px',
      bgcolor: bg,
      color,
      fontWeight: 700,
      fontSize: '0.78rem',
      minWidth: 44,
    }}
  >
    {label}
  </Box>
);

const SortIcon = ({ field, sortField, sortDir }) => {
  const theme = useTheme();
  if (field !== sortField)
    return <SortDown sx={{ fontSize: 14, color: theme.palette.text.disabled }} />;
  return sortDir === 'asc' ? (
    <KeyboardArrowUp sx={{ fontSize: 14, color: theme.palette.primary.main }} />
  ) : (
    <SortDown sx={{ fontSize: 14, color: theme.palette.primary.main }} />
  );
};

const SkeletonRow = ({ cols }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ display: 'contents' }}>
      <Box
        component="tr"
        sx={{
          '& td': {
            py: 1.5,
            px: 1.5,
            borderBottom: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.04) : theme.palette.divider}`,
          },
        }}
      >
        {Array(cols)
          .fill(0)
          .map((_, i) => (
            <Box component="td" key={i}>
              <Skeleton
                variant="text"
                sx={{
                  bgcolor: isDark
                    ? alpha(theme.palette.common.white, 0.07)
                    : alpha(theme.palette.common.black, 0.07),
                  borderRadius: 1,
                }}
              />
            </Box>
          ))}
      </Box>
    </Box>
  );
};

const CompleteReport = ({
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

  const effectiveIds = useMemo(() => {
    if (Array.isArray(propDeviceIds) && propDeviceIds.length) {
      return propDeviceIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    }
    const one = legacyDeviceId ?? storeDeviceId;
    return one != null && one !== '' ? [Number(one)] : [];
  }, [propDeviceIds, legacyDeviceId, storeDeviceId]);

  const multiDevice = effectiveIds.length > 1;

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [anchorEl, setAnchorEl] = useState(null);
  const [, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState('start');
  const [sortDir, setSortDir] = useState('desc');

  const glass = {
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.04)
      : theme.palette.background.paper,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
    borderRadius: '16px',
  };

  const handleSort = (field) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const getDateRange = () => {
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

  const fetchData = useCatch(async () => {
    if (!effectiveIds.length) return;
    setLoading(true);
    setError(null);
    try {
      const { from: fromDate, to: toDate } = getDateRange();
      const query = new URLSearchParams({ from: fromDate, to: toDate });
      effectiveIds.forEach((id) => query.append('deviceId', id));
      const [tripsRes, stopsRes] = await Promise.all([
        fetch(`/api/reports/trips?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        }),
        fetch(`/api/reports/stops?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        }),
      ]);
      if (!tripsRes.ok || !stopsRes.ok) throw new Error('Erreur de chargement des données');
      setTrips(await tripsRes.json());
      setStops(await stopsRes.json());
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

  const totals = useMemo(() => {
    const duration =
      trips.reduce((s, tr) => s + (tr.duration || 0), 0) +
      stops.reduce((s, st) => s + (st.duration || 0), 0);
    const distance = trips.reduce((s, tr) => s + (tr.distance || 0), 0);
    const fuel = trips.reduce((s, tr) => s + (tr.spentFuel || 0), 0);
    return { duration, distance, fuel, stops: stops.length };
  }, [trips, stops]);

  const reportData = useMemo(() => {
    const combined = [
      ...trips.map((trip) => ({
        type: 'route',
        id: trip.id,
        deviceId: trip.deviceId,
        deviceName: devices[trip.deviceId]?.name || '',
        start: trip.startTime,
        end: trip.endTime,
        duration: trip.duration,
        distance: trip.distance,
        maxSpeed: trip.maxSpeed,
        fuel: trip.spentFuel || 0,
        averageTemperature: trip.averageTemperature,
        startLat: trip.startLat,
        startLon: trip.startLon,
        endLat: trip.endLat,
        endLon: trip.endLon,
        startAddress: trip.startAddress,
        endAddress: trip.endAddress,
      })),
      ...stops.map((stop) => ({
        type: 'park',
        id: stop.id,
        deviceId: stop.deviceId,
        deviceName: devices[stop.deviceId]?.name || '',
        start: stop.startTime,
        end: stop.endTime,
        duration: stop.duration,
        distance: 0,
        maxSpeed: 0,
        fuel: 0,
        averageTemperature: stop.averageTemperature,
        startLat: stop.latitude,
        startLon: stop.longitude,
        endLat: stop.latitude,
        endLon: stop.longitude,
        startAddress: stop.address,
        endAddress: stop.address,
      })),
    ];
    combined.sort((a, b) => {
      let valA = a[sortField],
        valB = b[sortField];
      if (sortField === 'start' || sortField === 'end') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (sortField === 'deviceName') {
        valA = (a.deviceName || '').toLowerCase();
        valB = (b.deviceName || '').toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return combined;
  }, [trips, stops, sortField, sortDir, devices]);

  const pageData = reportData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const colCount = multiDevice ? 10 : 9;

  const hCell = (field) => ({
    component: 'th',
    onClick: field ? () => handleSort(field) : undefined,
    sx: {
      fontWeight: 700,
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      color: sortField === field ? theme.palette.primary.main : theme.palette.text.disabled,
      bgcolor: isDark ? alpha(theme.palette.common.white, 0.03) : theme.palette.action.hover,
      borderBottom: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
      whiteSpace: 'nowrap',
      py: 1.5,
      px: 1.5,
      cursor: field ? 'pointer' : 'default',
      userSelect: 'none',
      '&:hover': field ? { color: theme.palette.primary.light } : {},
      letterSpacing: '0.05em',
    },
  });

  if (!effectiveIds.length) {
    return (
      <Box sx={{ ...glass, p: 6, textAlign: 'center' }}>
        <TableRows sx={{ fontSize: 56, color: theme.palette.action.disabledBackground, mb: 2 }} />
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
      {/* Summary totals strip */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          px: 2,
          py: 1.5,
          backgroundColor: isDark
            ? alpha(theme.palette.common.white, 0.03)
            : theme.palette.action.hover,
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
          borderRadius: '14px 14px 0 0',
          flexWrap: 'wrap',
        }}
      >
        {[
          {
            label: t('reportDuration'),
            value: formatNumericHours(totals.duration, t),
            color: theme.palette.warning.main,
          },
          {
            label: t('sharedDistance'),
            value: formatDistance(totals.distance, distanceUnit, t),
            color: theme.palette.warning.dark,
          },
          {
            label: t('reportSpentFuel'),
            value: totals.fuel > 0 ? formatVolume(totals.fuel, volumeUnit, t) : '0.0 L',
            color: theme.palette.success.main,
          },
          {
            label: t('reportStops'),
            value: totals.stops.toString(),
            color: theme.palette.primary.main,
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

      {/* Table wrapper */}
      <Box
        sx={{
          ...glass,
          borderRadius: `0 0 ${theme.spacing(1.75)} ${theme.spacing(1.75)}`,
          border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
          borderTop: 'none',
          overflow: 'auto',
        }}
      >
        <Box
          component="table"
          sx={{ width: '100%', borderCollapse: 'collapse', minWidth: multiDevice ? 1000 : 900 }}
        >
          <Box component="thead">
            <Box component="tr">
              <Box {...hCell(null)} sx={{ ...hCell(null).sx, width: 44 }}>
                {t('reportStatus')}
              </Box>
              {multiDevice && (
                <Box {...hCell('deviceName')}>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    {t('reportDeviceName')}{' '}
                    <SortIcon field="deviceName" sortField={sortField} sortDir={sortDir} />
                  </Stack>
                </Box>
              )}
              <Box {...hCell('start')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {t('reportStartTime')}{' '}
                  <SortIcon field="start" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('end')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {t('reportEndTime')}{' '}
                  <SortIcon field="end" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('duration')} sx={{ ...hCell('duration').sx, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                  {t('reportDuration')}{' '}
                  <SortIcon field="duration" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('distance')} sx={{ ...hCell('distance').sx, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                  {t('sharedDistance')}{' '}
                  <SortIcon field="distance" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('maxSpeed')} sx={{ ...hCell('maxSpeed').sx, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                  {t('reportMaximumSpeed')}{' '}
                  <SortIcon field="maxSpeed" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('fuel')} sx={{ ...hCell('fuel').sx, textAlign: 'center' }}>
                {t('reportSpentFuel')}
              </Box>
              <Box {...hCell(null)} sx={{ ...hCell(null).sx, textAlign: 'center' }}>
                {t('reportAvgTemperature')}
              </Box>
              <Box {...hCell(null)}>{t('reportStartAddress')}</Box>
            </Box>
          </Box>

          <Box component="tbody">
            {loading ? (
              Array(8)
                .fill(0)
                .map((_, i) => <SkeletonRow key={i} cols={colCount} />)
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
                  <Typography
                    sx={{ color: theme.palette.text.disabled, fontSize: '0.82rem', mt: 0.5 }}
                  >
                    {t('reportNoDataHint')}
                  </Typography>
                </Box>
              </Box>
            ) : (
              pageData.map((row) => (
                <Box
                  component="tr"
                  key={`${row.type}-${row.deviceId}-${row.id}`}
                  onClick={(e) => {
                    setSelectedRow(row);
                    setAnchorEl(e.currentTarget);
                  }}
                  sx={{
                    cursor: 'pointer',
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
                  <Box component="td">{row.type === 'route' ? <MovementIcon /> : <ParkIcon />}</Box>
                  {multiDevice && (
                    <Box
                      component="td"
                      sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {row.deviceName || '—'}
                    </Box>
                  )}
                  <Box component="td">{formatTime(row.start, 'minutes')}</Box>
                  <Box component="td">{formatTime(row.end, 'minutes')}</Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    <Pill
                      label={formatNumericHours(row.duration, t)}
                      color={theme.palette.warning.dark}
                      bg={alpha(theme.palette.warning.main, 0.15)}
                    />
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.distance > 0 ? (
                      <Pill
                        label={formatDistance(row.distance, distanceUnit, t)}
                        color={theme.palette.warning.dark}
                        bg={alpha(theme.palette.warning.main, 0.12)}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.disabled }}>
                        0.0
                      </Typography>
                    )}
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.maxSpeed > 0 ? (
                      <Pill
                        label={formatSpeed(row.maxSpeed, speedUnit, t)}
                        color={theme.palette.success.dark}
                        bg={alpha(theme.palette.success.main, 0.12)}
                      />
                    ) : (
                      <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.disabled }}>
                        0
                      </Typography>
                    )}
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.fuel > 0 ? formatVolume(row.fuel, volumeUnit, t) : '0.0'}
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.averageTemperature != null
                      ? formatTemperature(row.averageTemperature)
                      : '—'}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: `${theme.palette.primary.main} !important`,
                    }}
                  >
                    {row.startLat != null && row.startLon != null ? (
                      <AddressValue
                        latitude={row.startLat}
                        longitude={row.startLon}
                        originalAddress={row.startAddress}
                      />
                    ) : (
                      row.startAddress || '—'
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* Pagination */}
      {!loading && reportData.length > 10 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderTop: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.06) : theme.palette.divider}`,
            pt: 1,
          }}
        >
          <TablePagination
            component="div"
            count={reportData.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage={t('reportRowsPerPage')}
            labelDisplayedRows={({ from: f, to: tVal, count }) => `${f}–${tVal} / ${count}`}
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.82rem',
              '& .MuiTablePagination-select': { color: theme.palette.text.primary },
              '& .MuiTablePagination-selectIcon': { color: theme.palette.text.secondary },
              '& .MuiIconButton-root': {
                color: theme.palette.text.secondary,
                '&:disabled': { color: theme.palette.text.disabled },
              },
            }}
          />
        </Box>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setSelectedRow(null);
        }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: theme.spacing(1.75),
              mt: 1,
              minWidth: 200,
              backgroundColor: isDark
                ? alpha(theme.palette.background.default, 0.97)
                : theme.palette.background.paper,
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.1) : theme.palette.divider}`,
              boxShadow: `0 ${theme.spacing(1)} ${theme.spacing(4)} ${alpha(theme.palette.common.black, 0.5)}`,
            },
          },
        }}
      >
        {[
          { icon: <History fontSize="small" />, label: t('reportReplay') },
          { icon: <ContentCopy fontSize="small" />, label: t('sharedCopy') },
          { icon: <Share fontSize="small" />, label: t('reportShare') },
        ].map((item, i) => (
          <MenuItem
            key={i}
            onClick={() => {
              setAnchorEl(null);
              setSelectedRow(null);
            }}
            sx={{ py: 1.25, px: 2, gap: 1.5, '&:hover': { bgcolor: theme.palette.action.hover } }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: theme.palette.text.secondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              slotProps={{
                primary: {
                  style: {
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  },
                },
              }}
            >
              {item.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default CompleteReport;
