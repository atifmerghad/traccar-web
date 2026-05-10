import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Alert,
  Button,
  Tooltip,
} from '@mui/material';
import {
  StorageOutlined,
  TuneOutlined,
  MyLocationOutlined,
  ShieldOutlined,
  PublicOutlined,
  RestartAltOutlined,
  BlockOutlined,
  DataObjectOutlined,
} from '@mui/icons-material';
import PageLayout from '../layout/PageLayout';
import { useTheme } from '@mui/material/styles';
import { sessionActions } from '../../store';
import { useTranslation } from '../../common/components/LocalizationProvider';
import useServerAttributes from '../../common/attributes/useServerAttributes';
import useCommonUserAttributes from '../../common/attributes/useCommonUserAttributes';
import useCommonDeviceAttributes from '../../common/attributes/useCommonDeviceAttributes';
import { useSystemStyles, PageHeader, Section, BottomBar } from './_shared.jsx';
import AttributesEditor from './AttributesEditor.jsx';

const ServerPageV2 = () => {
  const theme = useTheme();
  const { classes } = useSystemStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const serverAttrs = useServerAttributes(t);
  const commonUserAttrs = useCommonUserAttributes(t);
  const commonDeviceAttrs = useCommonDeviceAttributes(t);
  const attributeDefinitions = { ...commonUserAttrs, ...commonDeviceAttrs, ...serverAttrs };

  const original = useSelector((s) => s.session?.server);
  const isAdmin = useSelector((s) => !!s.session?.user?.administrator);

  const [item, setItem] = useState({
    ...(original || {}),
    attributes: { ...(original?.attributes || {}) },
  });
  const [timezones, setTimezones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    if (original) setItem({ ...original, attributes: { ...(original.attributes || {}) } });
  }, [original]);

  useEffect(() => {
    let active = true;
    fetch('/api/server/timezones').then(async (r) => {
      if (!r.ok) return;
      const list = await r.json();
      if (active) setTimezones(Array.isArray(list) ? list : []);
    });
    return () => {
      active = false;
    };
  }, []);

  const setAttr = (k, v) =>
    setItem((i) => ({ ...i, attributes: { ...(i.attributes || {}), [k]: v } }));
  const setField = (k, v) => setItem((i) => ({ ...i, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/server', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      dispatch(sessionActions.updateServer(updated));
      setSnack({ open: true, msg: t('serverSaveSuccess'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: t('serverSaveFailed'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReboot = async () => {
    if (!window.confirm(t('serverRebootConfirm'))) return;
    setRebooting(true);
    try {
      await fetch('/api/server/reboot', { method: 'POST' });
      setSnack({ open: true, msg: t('serverRebootRequested'), severity: 'info' });
    } catch {
      setSnack({ open: true, msg: t('serverRebootFailed'), severity: 'error' });
    } finally {
      setRebooting(false);
    }
  };

  if (!original)
    return (
      <PageLayout>
        <Box className={classes.root} />
      </PageLayout>
    );

  if (!isAdmin) {
    return (
      <PageLayout>
        <Box className={classes.root}>
          <PageHeader
            icon={<StorageOutlined sx={{ color: theme.palette.primary.main }} />}
            title={t('settingsServer')}
            subtitle={t('serverPageSubtitleAdmin')}
            classes={classes}
          />
          <Box className={classes.container}>
            <Section
              icon={<BlockOutlined fontSize="small" />}
              title={t('sharedAccessDenied')}
              classes={classes}
            >
              <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                {t('serverNoAccess')}
              </Typography>
            </Section>
          </Box>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<StorageOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('settingsServer')}
          subtitle={t('serverPageSubtitle')}
          classes={classes}
          right={[
            <Tooltip title={t('serverTooltipReboot')} key="reboot">
              <span>
                <Button
                  size="small"
                  startIcon={<RestartAltOutlined />}
                  variant="outlined"
                  color="warning"
                  onClick={handleReboot}
                  disabled={rebooting}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  {rebooting ? t('serverRebooting') : t('serverReboot')}
                </Button>
              </span>
            </Tooltip>,
          ]}
        />

        <Box className={classes.container}>
          <Section
            icon={<TuneOutlined fontSize="small" />}
            title={t('serverSectionGeneral')}
            classes={classes}
          >
            <Box className={classes.formRow2}>
              <TextField
                label={t('serverMapUrl')}
                className={classes.inputDark}
                size="small"
                value={item.mapUrl || ''}
                onChange={(e) => setField('mapUrl', e.target.value)}
              />
              <TextField
                label={t('serverOverlayUrl')}
                className={classes.inputDark}
                size="small"
                value={item.overlayUrl || ''}
                onChange={(e) => setField('overlayUrl', e.target.value)}
              />
            </Box>
            <Box className={classes.formRow3}>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('serverCoordinateFormat')}</InputLabel>
                <Select
                  label={t('serverCoordinateFormat')}
                  value={item.coordinateFormat || 'dd'}
                  onChange={(e) => setField('coordinateFormat', e.target.value)}
                >
                  <MenuItem value="dd">{t('serverCoordDD')}</MenuItem>
                  <MenuItem value="ddm">{t('serverCoordDDM')}</MenuItem>
                  <MenuItem value="dms">{t('serverCoordDMS')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('serverSpeedUnit')}</InputLabel>
                <Select
                  label={t('serverSpeedUnit')}
                  value={item.attributes?.speedUnit || 'kn'}
                  onChange={(e) => setAttr('speedUnit', e.target.value)}
                >
                  <MenuItem value="kn">{t('serverSpeedKn')}</MenuItem>
                  <MenuItem value="kmh">{t('sharedKmh')}</MenuItem>
                  <MenuItem value="mph">{t('sharedMph')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('serverDistance')}</InputLabel>
                <Select
                  label={t('serverDistance')}
                  value={item.attributes?.distanceUnit || 'km'}
                  onChange={(e) => setAttr('distanceUnit', e.target.value)}
                >
                  <MenuItem value="km">{t('sharedKm')}</MenuItem>
                  <MenuItem value="mi">{t('sharedMi')}</MenuItem>
                  <MenuItem value="nmi">{t('sharedNmi')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box className={classes.formRow3}>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('serverAltitude')}</InputLabel>
                <Select
                  label={t('serverAltitude')}
                  value={item.attributes?.altitudeUnit || 'm'}
                  onChange={(e) => setAttr('altitudeUnit', e.target.value)}
                >
                  <MenuItem value="m">{t('serverAltitudeM')}</MenuItem>
                  <MenuItem value="ft">{t('serverAltitudeFt')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('serverVolume')}</InputLabel>
                <Select
                  label={t('serverVolume')}
                  value={item.attributes?.volumeUnit || 'ltr'}
                  onChange={(e) => setAttr('volumeUnit', e.target.value)}
                >
                  <MenuItem value="ltr">{t('serverVolumeL')}</MenuItem>
                  <MenuItem value="usGal">{t('serverVolumeUsGal')}</MenuItem>
                  <MenuItem value="impGal">{t('serverVolumeImpGal')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('serverTimezone')}</InputLabel>
                <Select
                  label={t('serverTimezone')}
                  value={item.attributes?.timezone || ''}
                  onChange={(e) => setAttr('timezone', e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('serverTimezoneSystem')}</em>
                  </MenuItem>
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box className={classes.formRow2}>
              <TextField
                label={t('serverPoiLayer')}
                className={classes.inputDark}
                size="small"
                value={item.poiLayer || ''}
                onChange={(e) => setField('poiLayer', e.target.value)}
              />
              <TextField
                label={t('serverAnnouncementField')}
                className={classes.inputDark}
                size="small"
                value={item.announcement || ''}
                onChange={(e) => setField('announcement', e.target.value)}
              />
            </Box>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.forceSettings}
                    onChange={(e) => setField('forceSettings', e.target.checked)}
                  />
                }
                label={t('serverForceSettingsLabel')}
              />
            </FormGroup>
          </Section>

          <Section
            icon={<MyLocationOutlined fontSize="small" />}
            title={t('serverDefaultLocation')}
            classes={classes}
          >
            <Box className={classes.formRow3}>
              <TextField
                label={t('positionLatitude')}
                type="number"
                className={classes.inputDark}
                size="small"
                value={item.latitude ?? 0}
                onChange={(e) => setField('latitude', Number(e.target.value))}
              />
              <TextField
                label={t('positionLongitude')}
                type="number"
                className={classes.inputDark}
                size="small"
                value={item.longitude ?? 0}
                onChange={(e) => setField('longitude', Number(e.target.value))}
              />
              <TextField
                label={t('serverZoom')}
                type="number"
                className={classes.inputDark}
                size="small"
                value={item.zoom ?? 0}
                onChange={(e) => setField('zoom', Number(e.target.value))}
              />
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>
              {t('serverDefaultLocationHint')}
            </Typography>
          </Section>

          <Section
            icon={<ShieldOutlined fontSize="small" />}
            title={t('serverPermissions')}
            classes={classes}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.registration}
                    onChange={(e) => setField('registration', e.target.checked)}
                  />
                }
                label={t('serverAllowRegistration')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.readonly}
                    onChange={(e) => setField('readonly', e.target.checked)}
                  />
                }
                label={t('serverReadonlyUsers')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.deviceReadonly}
                    onChange={(e) => setField('deviceReadonly', e.target.checked)}
                  />
                }
                label={t('serverReadonlyDevices')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.limitCommands}
                    onChange={(e) => setField('limitCommands', e.target.checked)}
                  />
                }
                label={t('serverLimitCommands')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.disableReports}
                    onChange={(e) => setField('disableReports', e.target.checked)}
                  />
                }
                label={t('serverDisableReports')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!item.fixedEmail}
                    onChange={(e) => setField('fixedEmail', e.target.checked)}
                  />
                }
                label={t('serverFixedEmail')}
              />
            </FormGroup>
          </Section>

          <Section
            icon={<DataObjectOutlined fontSize="small" />}
            title={t('serverCustomAttributes')}
            hint={t('serverCustomAttributesHint')}
            classes={classes}
          >
            <AttributesEditor
              attributes={item.attributes || {}}
              onChange={(attributes) => setItem((i) => ({ ...i, attributes }))}
              definitions={attributeDefinitions}
              classes={classes}
            />
          </Section>

          <Section
            icon={<PublicOutlined fontSize="small" />}
            title={t('serverInfoSection')}
            classes={classes}
          >
            <Box className={classes.formRow2}>
              <TextField
                label={t('serverVersionLabel')}
                className={classes.inputDark}
                size="small"
                value={original.version || '—'}
                disabled
              />
              <TextField
                label={t('sharedBuild')}
                className={classes.inputDark}
                size="small"
                value={original.attributes?.build || '—'}
                disabled
              />
            </Box>
          </Section>

          <BottomBar
            onCancel={() => navigate(-1)}
            onSave={handleSave}
            saving={saving}
            classes={classes}
          />
        </Box>

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack({ ...snack, open: false })}
            sx={{ borderRadius: 2 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

export default ServerPageV2;
