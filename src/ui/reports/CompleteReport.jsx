import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Menu, MenuItem,
  ListItemIcon, ListItemText, Chip
} from '@mui/material';
import { History, ContentCopy, Share, LocalParking } from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import {
  formatDistance, formatSpeed, formatVolume,
  formatTime, formatNumericHours, formatTemperature,
} from '../../common/util/formatter';
import dayjs from 'dayjs';
import AddressValue from '../../common/components/AddressValue';
import TableShimmer from '../../common/components/TableShimmer';

// Movement icon — 3x3 dots grid like screenshot
const MovementIcon = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 5px)', gap: '2px', width: 20 }}>
    {Array(9).fill(0).map((_, i) => (
      <Box key={i} sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10b981' }} />
    ))}
  </Box>
);

const ParkIcon = () => (
  <Box sx={{
    width: 24, height: 24, borderRadius: '6px',
    bgcolor: '#eff6ff', border: '1.5px solid #3b82f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>P</Typography>
  </Box>
);

// Colored pill chip
const Pill = ({ label, bg, color }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    px: 1.5, py: 0.25, borderRadius: '6px',
    bgcolor: bg, color, fontWeight: 700, fontSize: '0.8rem',
    minWidth: 48,
  }}>
    {label}
  </Box>
);

const CompleteReport = () => {
  const t = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const devices = useSelector((state) => state.devices.items);
  const deviceId = useSelector((state) => state.devices.selectedId);
  const period = useSelector((state) => state.reports?.period || 'today');
  const from = useSelector((state) => state.reports?.from || '');
  const to = useSelector((state) => state.reports?.to || '');

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const open = Boolean(anchorEl);

  const handleRowClick = (event, row) => {
    setSelectedRow(row);
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => { setAnchorEl(null); setSelectedRow(null); };

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

  const fetchReportData = useCatch(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const { from: fromDate, to: toDate } = getDateRange();
      const query = new URLSearchParams({ deviceId, from: fromDate, to: toDate });
      const tripsRes = await fetch(`/api/reports/trips?${query.toString()}`, { headers: { Accept: 'application/json' } });
      if (tripsRes.ok) setTrips(await tripsRes.json());
      const stopsRes = await fetch(`/api/reports/stops?${query.toString()}`, { headers: { Accept: 'application/json' } });
      if (stopsRes.ok) setStops(await stopsRes.json());
    } finally { setLoading(false); }
  });

  useEffectAsync(async () => { if (deviceId) await fetchReportData(); }, [deviceId, period, from, to]);

  const totals = useMemo(() => {
    const duration = trips.reduce((s, t) => s + (t.duration || 0), 0) + stops.reduce((s, t) => s + (t.duration || 0), 0);
    const distance = trips.reduce((s, t) => s + (t.distance || 0), 0);
    const fuel = trips.reduce((s, t) => s + (t.spentFuel || 0), 0);
    const allTemps = [
      ...trips.filter((t) => t.averageTemperature != null).map((t) => t.averageTemperature),
      ...stops.filter((s) => s.averageTemperature != null).map((s) => s.averageTemperature),
    ];
    return {
      duration, distance, fuel,
      stops: stops.length,
      averageTemperature: allTemps.length > 0 ? allTemps.reduce((s, v) => s + v, 0) / allTemps.length : null,
    };
  }, [trips, stops]);

  const reportData = useMemo(() => {
    const combined = [
      ...trips.map((trip) => ({
        type: 'route', id: trip.id, deviceId: trip.deviceId,
        start: trip.startTime, end: trip.endTime, duration: trip.duration,
        distance: trip.distance, maxSpeed: trip.maxSpeed, fuel: trip.spentFuel || 0,
        stops: 0, averageTemperature: trip.averageTemperature,
        startLat: trip.startLat, startLon: trip.startLon,
        endLat: trip.endLat, endLon: trip.endLon,
        startAddress: trip.startAddress, endAddress: trip.endAddress,
      })),
      ...stops.map((stop) => ({
        type: 'park', id: stop.id, deviceId: stop.deviceId,
        start: stop.startTime, end: stop.endTime, duration: stop.duration,
        distance: 0, maxSpeed: 0, fuel: 0, stops: 0,
        averageTemperature: stop.averageTemperature,
        startLat: stop.latitude, startLon: stop.longitude,
        endLat: stop.latitude, endLon: stop.longitude,
        startAddress: stop.address, endAddress: stop.address,
      })),
    ];
    return combined.sort((a, b) => new Date(b.start) - new Date(a.start));
  }, [trips, stops]);

  // Header cell style
  const hCell = {
    fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase',
    color: '#94a3b8', bgcolor: '#fff', borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap', py: 1.5, px: 1.5,
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {/* ÉTAT */}
              <TableCell sx={{ ...hCell, width: 48 }}>ÉTAT</TableCell>
              {/* HEURE DE DÉBUT */}
              <TableCell sx={hCell}>HEURE DE DÉBUT</TableCell>
              {/* HEURE DE FIN */}
              <TableCell sx={hCell}>HEURE DE FIN</TableCell>
              {/* DURÉE — with total below */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>
                <Box>DURÉE</Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, textTransform: 'none' }}>
                  {formatNumericHours(totals.duration, t)}
                </Typography>
              </TableCell>
              {/* DISTANCE */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>
                <Box>DISTANCE (km)</Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 700, textTransform: 'none' }}>
                  {formatDistance(totals.distance, distanceUnit, t)}
                </Typography>
              </TableCell>
              {/* VITESSE MAX */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>VITESSE MA...</TableCell>
              {/* CONSOMMATION */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>
                <Box>CONSOMMA...</Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, textTransform: 'none' }}>
                  {totals.fuel > 0 ? formatVolume(totals.fuel, volumeUnit, t) : '0.0 L'}
                </Typography>
              </TableCell>
              {/* CONSOMMATION L/100km */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>
                <Box>CONSOMMATION ...</Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 700, textTransform: 'none' }}>0.0 L/100km</Typography>
              </TableCell>
              {/* ARRÊTS */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>
                <Box>ARRÊTS</Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, textTransform: 'none' }}>
                  {totals.stops}
                </Typography>
              </TableCell>
              {/* TEMP MOY */}
              <TableCell sx={{ ...hCell, textAlign: 'center' }}>TEMP MOY ...</TableCell>
              {/* LIEU DE DÉPART */}
              <TableCell sx={hCell}>LIEU DE DÉ...</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableShimmer columns={11} />
            ) : reportData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                  <Typography color="textSecondary">{t('sharedNoData')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reportData.map((row) => (
                <TableRow
                  key={`${row.type}-${row.id}`}
                  hover
                  onClick={(e) => handleRowClick(e, row)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: '#fff',
                    '&:hover': { bgcolor: '#f8fafc' },
                    '& td': { borderBottom: '1px solid #f8fafc', py: 1, px: 1.5 },
                  }}
                >
                  {/* ÉTAT icon */}
                  <TableCell>
                    {row.type === 'route' ? <MovementIcon /> : <ParkIcon />}
                  </TableCell>

                  {/* Start time */}
                  <TableCell sx={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                    {formatTime(row.start, 'minutes')}
                  </TableCell>

                  {/* End time */}
                  <TableCell sx={{ fontSize: '0.82rem', color: '#475569', whiteSpace: 'nowrap' }}>
                    {formatTime(row.end, 'minutes')}
                  </TableCell>

                  {/* Duration — yellow pill */}
                  <TableCell align="center">
                    <Pill label={formatNumericHours(row.duration, t)} bg="#fef9c3" color="#92400e" />
                  </TableCell>

                  {/* Distance — yellow pill if > 0 */}
                  <TableCell align="center">
                    {row.distance > 0
                      ? <Pill label={formatDistance(row.distance, distanceUnit, t)} bg="#fef3c7" color="#92400e" />
                      : <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>0.0</Typography>
                    }
                  </TableCell>

                  {/* Max speed — green pill if > 0 */}
                  <TableCell align="center">
                    {row.maxSpeed > 0
                      ? <Pill label={formatSpeed(row.maxSpeed, speedUnit, t)} bg="#dcfce7" color="#166534" />
                      : <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>0</Typography>
                    }
                  </TableCell>

                  {/* Fuel */}
                  <TableCell align="center">
                    <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                      {row.fuel > 0 ? formatVolume(row.fuel, volumeUnit, t) : '0.0'}
                    </Typography>
                  </TableCell>

                  {/* L/100km */}
                  <TableCell align="center">
                    <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>0.0</Typography>
                  </TableCell>

                  {/* Stops — amber pill */}
                  <TableCell align="center">
                    {row.stops > 0
                      ? <Pill label={row.stops} bg="#fef9c3" color="#92400e" />
                      : <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>0</Typography>
                    }
                  </TableCell>

                  {/* Avg temp */}
                  <TableCell align="center">
                    <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                      {row.averageTemperature != null ? formatTemperature(row.averageTemperature) : '0.0°C'}
                    </Typography>
                  </TableCell>

                  {/* Start address — blue link style */}
                  <TableCell sx={{ color: '#3b82f6', fontSize: '0.82rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.startLat != null && row.startLon != null ? (
                      <AddressValue latitude={row.startLat} longitude={row.startLon} originalAddress={row.startAddress} />
                    ) : (row.startAddress || '-')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl} open={open} onClose={handleClose}
        PaperProps={{ elevation: 3, sx: { borderRadius: '12px', mt: 1, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
      >
        {[
          { icon: <History fontSize="small" />, label: "Voir dans l'Historique" },
          { icon: <ContentCopy fontSize="small" />, label: 'Copier les Détails' },
          { icon: <Share fontSize="small" />, label: "Partager l'Activité" },
        ].map((item, i) => (
          <MenuItem key={i} onClick={handleClose} sx={{ py: 1.25, px: 2, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto', color: '#64748b' }}>{item.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default CompleteReport;
