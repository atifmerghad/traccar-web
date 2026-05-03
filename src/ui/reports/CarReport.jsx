import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useAttributePreference } from '../../common/util/preferences';
import { formatDistance, formatSpeed, formatVolume, formatNumericHours } from '../../common/util/formatter';
import dayjs from 'dayjs';

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, color, bg }) => (
  <Box sx={{
    flex: 1, minWidth: 0,
    bgcolor: bg, borderRadius: '16px',
    border: '1px solid', borderColor: 'divider',
    p: 3, textAlign: 'center',
  }}>
    <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color, lineHeight: 1.1, mb: 1 }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color }}>
      {title}
    </Typography>
  </Box>
);

// ─── Detail Row ───────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, color = '#1e293b' }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid #f8fafc', '&:last-child': { borderBottom: 'none' } }}>
    <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color }}>{value}</Typography>
  </Stack>
);

// ─── CarReport ────────────────────────────────────────────────────────────────
const CarReport = () => {
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const deviceId = useSelector((state) => state.devices.selectedId);
  const period = useSelector((state) => state.reports?.period || 'today');
  const from = useSelector((state) => state.reports?.from || '');
  const to = useSelector((state) => state.reports?.to || '');

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [summaryData, setSummaryData] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const [summaryRes, tripsRes, stopsRes] = await Promise.all([
        fetch(`/api/reports/summary?${query.toString()}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/reports/trips?${query.toString()}`, { headers: { Accept: 'application/json' } }),
        fetch(`/api/reports/stops?${query.toString()}`, { headers: { Accept: 'application/json' } }),
      ]);
      if (summaryRes.ok) setSummaryData(await summaryRes.json());
      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (stopsRes.ok) setStops(await stopsRes.json());
    } finally { setLoading(false); }
  });

  useEffectAsync(async () => { if (deviceId) await fetchReportData(); }, [deviceId, period, from, to]);

  const stats = useMemo(() => {
    if (summaryData.length === 0) return {
      totalDistance: 0, totalMovementTime: 0, totalParkingTime: 0,
      totalFuel: 0, maxSpeed: 0, totalStops: 0, totalMovements: 0,
      averageSpeed: 0, averageConsumption: 0,
    };
    const summary = summaryData[0];
    const totalDistance = summary.distance || 0;
    const totalMovementTime = trips.reduce((s, t) => s + (t.duration || 0), 0);
    const totalParkingTime = stops.reduce((s, t) => s + (t.duration || 0), 0);
    const totalFuel = summary.spentFuel || 0;
    const maxSpeed = summary.maxSpeed || 0;
    const averageSpeed = summary.averageSpeed || 0;
    const averageConsumption = totalDistance > 0 && totalFuel > 0 ? (totalFuel / totalDistance) * 100 : 0;
    return {
      totalDistance, totalMovementTime, totalParkingTime, totalFuel,
      maxSpeed, totalStops: stops.length, totalMovements: trips.length,
      averageSpeed, averageConsumption,
    };
  }, [summaryData, trips, stops]);

  const selectedDevice = deviceId ? devices[deviceId] : null;
  const dateRange = getDateRange();
  const fromDate = dayjs(dateRange.from);
  const toDate = dayjs(dateRange.to);

  const handleExportPdf = useCatch(async () => {
    if (!deviceId) return;
    const { from: f, to: t2 } = getDateRange();
    const query = new URLSearchParams({ deviceId, from: f, to: t2 });
    window.location.assign(`/api/reports/summary/xlsx?${query.toString()}`);
  });

  return (
    <Box>
      <Paper sx={{ p: 4, borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

        {/* Internal header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>
              Résumé Global de Véhicule
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8', mt: 0.5 }}>
              {selectedDevice?.name || t('sharedDevice')} • {fromDate.format('DD/MM/YYYY')} - {toDate.format('DD/MM/YYYY')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPdf}
            disableElevation
            sx={{ bgcolor: '#1e293b', borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#0f172a' } }}
          >
            Télécharger PDF
          </Button>
        </Stack>

        {/* Row 1 — 3 stat cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5 }}>
          <StatCard
            title="Distance Totale (km)"
            value={formatDistance(stats.totalDistance, distanceUnit, t)}
            color="#0ea5e9"
            bg="#f0f9ff"
          />
          <StatCard
            title="Temps Total en Mouvement"
            value={formatNumericHours(stats.totalMovementTime, t)}
            color="#a855f7"
            bg="#faf5ff"
          />
          <StatCard
            title="Temps Total de Stationnement"
            value={formatNumericHours(stats.totalParkingTime, t)}
            color="#f97316"
            bg="#fff7ed"
          />
        </Box>

        {/* Row 2 — 3 stat cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 4 }}>
          <StatCard
            title="Consommation Totale"
            value={stats.totalFuel > 0 ? formatVolume(stats.totalFuel, volumeUnit, t) : '0.0'}
            color="#22c55e"
            bg="#f0fdf4"
          />
          <StatCard
            title="Vitesse Max (km/h)"
            value={stats.maxSpeed > 0 ? formatSpeed(stats.maxSpeed, speedUnit, t) : '0'}
            color="#ef4444"
            bg="#fef2f2"
          />
          <StatCard
            title="Nombre d'Arrêts"
            value={stats.totalStops.toString()}
            color="#f59e0b"
            bg="#fefce8"
          />
        </Box>

        {/* Bottom two panels side by side */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: 0, border: '1px solid #f1f5f9', borderRadius: '16px', p: 3 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', mb: 2 }}>
              Statistiques de Mouvement
            </Typography>
            <DetailRow label="Mouvements Totaux:" value={stats.totalMovements.toString()} />
            <DetailRow label="Durée Totale:" value={formatNumericHours(stats.totalMovementTime + stats.totalParkingTime, t)} />
            <DetailRow
              label="Consommation Moy:"
              value={stats.averageConsumption > 0 ? `${stats.averageConsumption.toFixed(1)} L/100km` : '0.0 L/100km'}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, border: '1px solid #f1f5f9', borderRadius: '16px', p: 3 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', mb: 2 }}>
              Statistiques d'Efficacité
            </Typography>
            <DetailRow
              label="Vitesse Moyenne:"
              value={stats.averageSpeed > 0 ? formatSpeed(stats.averageSpeed, speedUnit, t) : '0'}
            />
            <DetailRow
              label="Efficacité Carburant:"
              value={stats.averageConsumption > 0 && stats.averageConsumption < 10 ? 'Efficace' : 'Normale'}
              color={stats.averageConsumption > 0 && stats.averageConsumption < 10 ? '#22c55e' : '#1e293b'}
            />
          </Box>
        </Box>

      </Paper>
    </Box>
  );
};

export default CarReport;
