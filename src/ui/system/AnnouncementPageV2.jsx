import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  Button,
  Stack,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  CampaignOutlined,
  GroupOutlined,
  MailOutline,
  NotificationsActiveOutlined,
  SendOutlined,
  BlockOutlined,
} from '@mui/icons-material';
import PageLayout from '../layout/PageLayout';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useSystemStyles, PageHeader, Section } from './_shared.jsx';

const humanize = (s = '') =>
  String(s)
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const AnnouncementPageV2 = () => {
  const theme = useTheme();
  const { classes } = useSystemStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const isAdmin = useSelector((s) => !!s.session?.user?.administrator);
  const isManager = useSelector(
    (s) => !!(s.session?.user?.administrator || s.session?.user?.userLimit !== 0),
  );

  const [users, setUsers] = useState([]);
  const [notificators, setNotificators] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notificator, setNotificator] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/users').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/notifications/notificators?announcement=true').then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([u, n]) => {
        if (!active) return;
        setUsers(Array.isArray(u) ? u : []);
        const list = Array.isArray(n) ? n : [];
        setNotificators(list);
        if (list.length > 0) setNotificator(list[0].type);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const allUserIds = useMemo(() => users.map((u) => u.id), [users]);
  const allSelected = selectedUsers.length > 0 && selectedUsers.length === allUserIds.length;

  const valid = selectedUsers.length > 0 && notificator && subject.trim() && body.trim();

  const send = async () => {
    setSending(true);
    try {
      const query = new URLSearchParams();
      selectedUsers.forEach((id) => query.append('userId', String(id)));
      const res = await fetch(`/api/notifications/send/${notificator}?${query.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) throw new Error();
      setSnack({ open: true, msg: t('announcementSent'), severity: 'success' });
      setSubject('');
      setBody('');
      setSelectedUsers([]);
    } catch {
      setSnack({ open: true, msg: t('announcementSendFailed'), severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (!isManager && !isAdmin) {
    return (
      <PageLayout>
        <Box className={classes.root}>
          <PageHeader
            icon={<CampaignOutlined sx={{ color: theme.palette.primary.main }} />}
            title={t('announcementPageTitle')}
            subtitle={t('announcementPageSubtitleAdmin')}
            classes={classes}
          />
          <Box className={classes.container}>
            <Section
              icon={<BlockOutlined fontSize="small" />}
              title={t('sharedAccessDenied')}
              classes={classes}
            >
              <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                {t('announcementNoAccess')}
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
          icon={<CampaignOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('announcementPageTitle')}
          subtitle={t('announcementPageSubtitle')}
          classes={classes}
        />

        <Box className={classes.container}>
          <Section
            icon={<GroupOutlined fontSize="small" />}
            title={t('announcementRecipients')}
            hint={t('announcementRecipientsHint').replace('{count}', String(selectedUsers.length))}
            classes={classes}
          >
            <FormControl size="small" className={classes.inputDark} fullWidth>
              <InputLabel>{t('announcementUsersLabel')}</InputLabel>
              <Select
                multiple
                label={t('announcementUsersLabel')}
                value={selectedUsers}
                onChange={(e) => setSelectedUsers(e.target.value)}
                input={<OutlinedInput label={t('announcementUsersLabel')} />}
                renderValue={(sel) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sel.slice(0, 6).map((id) => {
                      const u = users.find((x) => x.id === id);
                      return (
                        <Chip
                          key={id}
                          size="small"
                          label={u?.name || u?.email || id}
                          sx={{ height: 22, fontSize: '0.72rem' }}
                        />
                      );
                    })}
                    {sel.length > 6 && (
                      <Chip
                        size="small"
                        label={`+${sel.length - 6}`}
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />
                    )}
                  </Box>
                )}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    <Checkbox checked={selectedUsers.indexOf(u.id) > -1} size="small" />
                    <ListItemText primary={u.name || u.email} secondary={u.email} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 2 }}
                onClick={() => setSelectedUsers(allSelected ? [] : allUserIds)}
                disabled={users.length === 0}
              >
                {allSelected ? t('announcementDeselectAll') : t('announcementSelectAll')}
              </Button>
            </Stack>
          </Section>

          <Section
            icon={<NotificationsActiveOutlined fontSize="small" />}
            title={t('announcementChannel')}
            classes={classes}
          >
            <FormControl size="small" className={classes.inputDark} fullWidth>
              <InputLabel>{t('announcementNotificator')}</InputLabel>
              <Select
                label={t('announcementNotificator')}
                value={notificator}
                onChange={(e) => setNotificator(e.target.value)}
              >
                {notificators.length === 0 && (
                  <MenuItem value="">
                    <em>{t('announcementNoChannel')}</em>
                  </MenuItem>
                )}
                {notificators.map((n) => (
                  <MenuItem key={n.type} value={n.type}>
                    {humanize(n.type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Section>

          <Section
            icon={<MailOutline fontSize="small" />}
            title={t('announcementMessage')}
            classes={classes}
          >
            <TextField
              label={t('sharedSubject')}
              className={classes.inputDark}
              fullWidth
              size="small"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <TextField
              label={t('sharedContent')}
              className={classes.inputDark}
              fullWidth
              multiline
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>
              {t('announcementHint')}
            </Typography>
          </Section>

          <Box className={classes.bottomBar}>
            <Button onClick={() => navigate(-1)} sx={{ textTransform: 'none' }}>
              {t('sharedCancel')}
            </Button>
            <Button
              onClick={send}
              disabled={!valid || sending}
              startIcon={<SendOutlined />}
              variant="contained"
              disableElevation
              sx={{
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {sending ? t('announcementSending') : t('announcementSend')}
            </Button>
          </Box>
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

export default AnnouncementPageV2;
