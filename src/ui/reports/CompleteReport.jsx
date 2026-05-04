import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Stack, Skeleton, TablePagination,
  Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  History, ContentCopy, Share, KeyboardArrowUp,
  KeyboardArrowDown as SortDown, TableRows, Warning,
} from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import {
  formatDistance, formatSpeed, formatVolume,
  formatTime, formatNumericHours, formatTemperature,
} from '../../common/util/formatter';
import dayjs from 'dayjs';
import AddressValue from '../../common/components/AddressValue';

const GLASS = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
};

const MovementIcon = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '2px' }}>
    {Array(9).fill(0).map((_, i) => (
      <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#10b981' }} />
    ))}
  </Box>
);

const ParkIcon = () => (
  <Box sx={{
    width: 22, height: 22, borderRadius: '6px',
    background: 'rgba(59,130,246,0.15)', border: '1.5px solid rgba(59,130,246,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>P</Typography>
  </Box>
);

const Pill = ({ label, color, bg }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    px: 1.5, py: 0.3, borderRadius: '6px', bgcolor: bg, color,
    fontWeight: 700, fontSize: '0.78rem', minWidth: 44,
  }}>
    {label}
  </Box>
);

const SortIcon = ({ field, sortField, sortDir }) => {
  if (field !== sortField) return <SortDown sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />;
  return sortDir === 'asc'
    ? <KeyboardArrowUp sx={{ fontSize: 14, color: '#6366f1' }} />
    : <SortDown sx={{ fontSize: 14, color: '#6366f1' }} />;
};

const SkeletonRow = ({ cols }) => (
  <Box sx={{ display: 'contents' }}>
    <Box component="tr" sx={{ '& td': { py: 1.5, px: 1.5, borderBottom: '1px solid rgba(255,255,255,0.04)' } }}>
      {Array(cols).fill(0).map((_, i) => (
        <Box component="td" key={i}>
          <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  </Box>
);

const CompleteReport = ({ deviceId: propDeviceId, period, customFrom, customTo }) => {
  const t = useTranslation();
  const storeDeviceId = useSelector((state) => state.devices.selectedId);
  const deviceId = propDeviceId || storeDeviceId;

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState('start');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
    setPage(0);
  };

  const getDateRange = () => {
    let selectedFrom, selectedTo;
    switch (period) {
      case 'today': selectedFrom = dayjs().startOf('day'); selectedTo = dayjs().endOf('day'); break;
      case 'yesterday': selectedFrom = dayjs().subtract(1, 'day').startOf('day'); selectedTo = dayjs().subtract(1, 'day').endOf('day'); break;
      case 'thisWeek': selectedFrom = dayjs().startOf('week'); selectedTo = dayjs().endOf('week'); break;
      case 'previousWeek': selectedFrom = dayjs().subtract(1, 'week').startOf('week'); selectedTo = dayjs().subtract(1, 'week').endOf('week'); break;
      case 'thisMonth': selectedFrom = dayjs().startOf('month'); selectedTo = dayjs().endOf('month'); break;
      case 'previousMonth': selectedFrom = dayjs().subtract(1, 'month').startOf('month'); selectedTo = dayjs().subtract(1, 'month').endOf('month'); break;
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
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const { from: fromDate, to: toDate } = getDateRange();
      const query = new URLSearchParams({ deviceId, from: fromDate, to: toDate });
      const [tripsRes, stopsRes] = await Promise.all([
        fetch(`/api/reports/trips?${query.toString()}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/reports/stops?${query.toString()}`, { headers: { Accept: 'application/json' } }),
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
    if (deviceId) fetchData();
  }, [deviceId, period, customFrom, customTo]);

  const totals = useMemo(() => {
    const duration = trips.reduce((s, tr) => s + (tr.duration || 0), 0) + stops.reduce((s, st) => s + (st.duration || 0), 0);
    const distance = trips.reduce((s, tr) => s + (tr.distance || 0), 0);
    const fuel = trips.reduce((s, tr) => s + (tr.spentFuel || 0), 0);
    return { duration, distance, fuel, stops: stops.length };
  }, [trips, stops]);

  const reportData = useMemo(() => {
    const combined = [
      ...trips.map((trip) => ({
        type: 'route', id: trip.id,
        start: trip.startTime, end: trip.endTime, duration: trip.duration,
        distance: trip.distance, maxSpeed: trip.maxSpeed, fuel: trip.spentFuel || 0,
        averageTemperature: trip.averageTemperature,
        startLat: trip.startLat, startLon: trip.startLon,
        endLat: trip.endLat, endLon: trip.endLon,
        startAddress: trip.startAddress, endAddress: trip.endAddress,
      })),
      ...stops.map((stop) => ({
        type: 'park', id: stop.id,
        start: stop.startTime, end: stop.endTime, duration: stop.duration,
        distance: 0, maxSpeed: 0, fuel: 0,
        averageTemperature: stop.averageTemperature,
        startLat: stop.latitude, startLon: stop.longitude,
        endLat: stop.latitude, endLon: stop.longitude,
        startAddress: stop.address, endAddress: stop.address,
      })),
    ];
    combined.sort((a, b) => {
      let valA = a[sortField], valB = b[sortField];
      if (sortField === 'start' || sortField === 'end') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return combined;
  }, [trips, stops, sortField, sortDir]);

  const pageData = reportData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const hCell = (field) => ({
    component: 'th',
    onClick: field ? () => handleSort(field) : undefined,
    sx: {
      fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
      color: sortField === field ? '#6366f1' : '#475569',
      bgcolor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)',
      whiteSpace: 'nowrap', py: 1.5, px: 1.5,
      cursor: field ? 'pointer' : 'default',
      userSelect: 'none',
      '&:hover': field ? { color: '#818cf8' } : {},
      letterSpacing: '0.05em',
    },
  });

  if (!deviceId) {
    return (
      <Box sx={{ ...GLASS, p: 6, textAlign: 'center' }}>
        <TableRows sx={{ fontSize: 56, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>Aucun véhicule sélectionné</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Sélectionnez un véhicule pour afficher le rapport complet.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...GLASS, p: 6, textAlign: 'center' }}>
        <Warning sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>Erreur</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Summary totals strip */}
      <Box sx={{
        display: 'flex', gap: 3, px: 2, py: 1.5,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px 14px 0 0',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Durée Totale', value: formatNumericHours(totals.duration, t), color: '#f59e0b' },
          { label: 'Distance Totale', value: formatDistance(totals.distance, distanceUnit, t), color: '#f97316' },
          { label: 'Carburant', value: totals.fuel > 0 ? formatVolume(totals.fuel, volumeUnit, t) : '0.0 L', color: '#10b981' },
          { label: 'Arrêts', value: totals.stops.toString(), color: '#6366f1' },
        ].map((item) => (
          <Box key={item.label}>
            <Typography sx={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: item.color }}>{item.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Table wrapper */}
      <Box sx={{
        ...GLASS, borderRadius: '0 0 14px 14px',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none', overflow: 'auto',
      }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <Box component="thead">
            <Box component="tr">
              <Box {...hCell(null)} sx={{ ...hCell(null).sx, width: 44 }}>ÉTAT</Box>
              <Box {...hCell('start')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  DÉBUT <SortIcon field="start" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('end')}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  FIN <SortIcon field="end" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('duration')} sx={{ ...hCell('duration').sx, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                  DURÉE <SortIcon field="duration" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('distance')} sx={{ ...hCell('distance').sx, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                  DISTANCE <SortIcon field="distance" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('maxSpeed')} sx={{ ...hCell('maxSpeed').sx, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5} justifyContent="center">
                  VIT. MAX <SortIcon field="maxSpeed" sortField={sortField} sortDir={sortDir} />
                </Stack>
              </Box>
              <Box {...hCell('fuel')} sx={{ ...hCell('fuel').sx, textAlign: 'center' }}>CARBURANT</Box>
              <Box {...hCell(null)} sx={{ ...hCell(null).sx, textAlign: 'center' }}>TEMP. MOY.</Box>
              <Box {...hCell(null)}>LIEU DE DÉPART</Box>
            </Box>
          </Box>

          <Box component="tbody">
            {loading ? (
              Array(8).fill(0).map((_, i) => <SkeletonRow key={i} cols={9} />)
            ) : pageData.length === 0 ? (
              <Box component="tr">
                <Box component="td" colSpan={9} sx={{ py: 8, textAlign: 'center' }}>
                  <TableRows sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 1.5, display: 'block', mx: 'auto' }} />
                  <Typography sx={{ color: '#475569', fontWeight: 600 }}>Aucune donnée</Typography>
                  <Typography sx={{ color: '#334155', fontSize: '0.82rem', mt: 0.5 }}>
                    Essayez une autre période ou un autre véhicule.
                  </Typography>
                </Box>
              </Box>
            ) : (
              pageData.map((row) => (
                <Box
                  component="tr"
                  key={`${row.type}-${row.id}`}
                  onClick={(e) => { setSelectedRow(row); setAnchorEl(e.currentTarget); }}
                  sx={{
                    cursor: 'pointer',
                    '& td': {
                      py: 1.25, px: 1.5, fontSize: '0.82rem',
                      color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      whiteSpace: 'nowrap',
                    },
                    '&:hover td': { bgcolor: 'rgba(99,102,241,0.06)', color: '#cbd5e1' },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <Box component="td">
                    {row.type === 'route' ? <MovementIcon /> : <ParkIcon />}
                  </Box>
                  <Box component="td">{formatTime(row.start, 'minutes')}</Box>
                  <Box component="td">{formatTime(row.end, 'minutes')}</Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    <Pill label={formatNumericHours(row.duration, t)} color="#92400e" bg="rgba(245,158,11,0.15)" />
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.distance > 0
                      ? <Pill label={formatDistance(row.distance, distanceUnit, t)} color="#92400e" bg="rgba(249,115,22,0.12)" />
                      : <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>0.0</Typography>
                    }
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.maxSpeed > 0
                      ? <Pill label={formatSpeed(row.maxSpeed, speedUnit, t)} color="#166534" bg="rgba(34,197,94,0.12)" />
                      : <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>0</Typography>
                    }
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.fuel > 0 ? formatVolume(row.fuel, volumeUnit, t) : '0.0'}
                  </Box>
                  <Box component="td" sx={{ textAlign: 'center' }}>
                    {row.averageTemperature != null ? formatTemperature(row.averageTemperature) : '—'}
                  </Box>
                  <Box component="td" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', color: '#6366f1 !important' }}>
                    {row.startLat != null && row.startLon != null
                      ? <AddressValue latitude={row.startLat} longitude={row.startLon} originalAddress={row.startAddress} />
                      : (row.startAddress || '—')}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      {/* Pagination */}
      {!loading && reportData.length > 10 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          borderTop: '1px solid rgba(255,255,255,0.06)', pt: 1,
        }}>
          <TablePagination
            component="div"
            count={reportData.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Lignes:"
            labelDisplayedRows={({ from: f, to: tVal, count }) => `${f}–${tVal} sur ${count}`}
            sx={{
              color: '#94a3b8', fontSize: '0.82rem',
              '& .MuiTablePagination-select': { color: '#f1f5f9' },
              '& .MuiTablePagination-selectIcon': { color: '#94a3b8' },
              '& .MuiIconButton-root': { color: '#94a3b8', '&:disabled': { color: '#334155' } },
            }}
          />
        </Box>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: '14px', mt: 1, minWidth: 200,
              background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        {[
          { icon: <History fontSize="small" />, label: "Voir dans l'Historique" },
          { icon: <ContentCopy fontSize="small" />, label: 'Copier les Détails' },
          { icon: <Share fontSize="small" />, label: "Partager l'Activité" },
        ].map((item, i) => (
          <MenuItem key={i} onClick={() => { setAnchorEl(null); setSelectedRow(null); }}
            sx={{ py: 1.25, px: 2, gap: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: '#94a3b8' }}>{item.icon}</ListItemIcon>
            <ListItemText slotProps={{ primary: { style: { fontSize: '0.88rem', fontWeight: 500, color: '#f1f5f9' } } }}>
              {item.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default CompleteReport;
