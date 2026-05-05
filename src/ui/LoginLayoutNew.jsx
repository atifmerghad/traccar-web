import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBack, ArrowForward, GpsFixed, Speed, Analytics, NotificationsActive } from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { keyframes } from '@emotion/react';

const livePulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
  70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
`;

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    panel: {
      flex: '0 0 50%',
      display: 'flex',
      flexDirection: 'column',
      background: isDark
        ? 'linear-gradient(160deg, #0c1629 0%, #080d1a 45%, #0a1020 100%)'
        : `linear-gradient(160deg, #e0e7ff 0%, ${theme.palette.background.default} 45%, #f0f4ff 100%)`,
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100vh',
      padding: '36px 48px',
      '@media (max-width: 900px)': { display: 'none' },
    },
    grid: {
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
      backgroundSize: '52px 52px',
      pointerEvents: 'none',
    },
    glowTop: {
      position: 'absolute',
      top: '-15%',
      left: '-15%',
      width: '70%',
      height: '70%',
      background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 65%)',
      pointerEvents: 'none',
    },
    glowBottom: {
      position: 'absolute',
      bottom: '-15%',
      right: '-10%',
      width: '55%',
      height: '55%',
      background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 65%)',
      pointerEvents: 'none',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      position: 'relative',
      zIndex: 1,
      marginBottom: 48,
    },
    logoIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
      flexShrink: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      maxWidth: 520,
      transition: 'opacity 0.25s ease',
    },
    slideTitle: {
      fontSize: '3.4rem',
      fontWeight: 800,
      color: theme.palette.text.primary,
      lineHeight: 1.1,
      marginBottom: 14,
      letterSpacing: '-0.025em',
    },
    tagline: {
      fontSize: '1.15rem',
      fontWeight: 500,
      color: theme.palette.text.secondary,
      marginBottom: 14,
    },
    description: {
      fontSize: '0.92rem',
      lineHeight: 1.8,
      color: theme.palette.text.disabled,
      marginBottom: 40,
    },
    featureRow: {
      display: 'flex',
      gap: 10,
      marginBottom: 40,
    },
    featureCard: {
      flex: 1,
      background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.action.hover,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : theme.palette.divider}`,
      borderRadius: 14,
      padding: '14px 12px',
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.14)' : theme.palette.divider },
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'relative',
      zIndex: 1,
    },
    navBtn: {
      width: 34,
      height: 34,
      color: theme.palette.text.disabled,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
      borderRadius: '50%',
      '&:hover': {
        background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.selected,
        color: theme.palette.text.primary,
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : theme.palette.divider,
      },
    },
    dot: {
      height: 6,
      borderRadius: 3,
      background: isDark ? 'rgba(255,255,255,0.15)' : theme.palette.action.selected,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    dotActive: {
      background: '#6366f1',
      width: '20px !important',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#22c55e',
      flexShrink: 0,
      animation: `${livePulse} 2s ease-in-out infinite`,
    },
  };
});

const SLIDES = [
  {
    titleStart: 'Bienvenue sur',
    titleHighlight: 'Geo',
    titleEnd: '',
    tagline: 'La solution intelligente pour votre flotte',
    description:
      'Gérez, surveillez et optimisez votre parc de véhicules en temps réel. Localisations live, historiques de trajets et analyses puissantes — tout en un.',
  },
  {
    titleStart: 'Suivi',
    titleHighlight: 'en temps réel',
    titleEnd: '',
    tagline: 'Localisations live sur carte interactive',
    description:
      "Visualisez l'ensemble de votre flotte sur une carte interactive. Recevez des alertes instantanées et prenez des décisions éclairées en toute situation.",
  },
  {
    titleStart: 'Analyses',
    titleHighlight: 'avancées',
    titleEnd: '',
    tagline: 'Des insights pour optimiser vos opérations',
    description:
      "Accédez à des rapports détaillés sur les trajets, la consommation et l'efficacité de vos conducteurs. Réduisez vos coûts avec des données fiables.",
  },
  {
    titleStart: 'Gestion',
    titleHighlight: 'centralisée',
    titleEnd: '',
    tagline: 'Un seul tableau de bord pour tout gérer',
    description:
      "Pilotez vos véhicules, créez des géofences, configurez des alertes et consultez l'historique complet depuis une interface intuitive et rapide.",
  },
];

const FEATURES = [
  { Icon: GpsFixed, label: 'GPS Live', sub: 'Précision < 10m', color: '#6366f1' },
  { Icon: Speed, label: 'Performances', sub: 'Rapports temps réel', color: '#22c55e' },
  { Icon: NotificationsActive, label: 'Alertes', sub: 'Notifications push', color: '#f59e0b' },
];

const LoginLayoutNew = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fading, setFading] = useState(false);

  const changeSlide = useCallback((newIndex) => {
    setFading(true);
    setTimeout(() => {
      setCurrentSlide(newIndex);
      setFading(false);
    }, 200);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      changeSlide((currentSlide + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [currentSlide, changeSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <Box className={classes.panel}>
      <Box className={classes.grid} />
      <Box className={classes.glowTop} />
      <Box className={classes.glowBottom} />

      {/* Logo */}
      <Box className={classes.logo}>
        <Box className={classes.logoIcon}>
          <GpsFixed sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '0.12em', lineHeight: 1 }}>
            GEO
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: theme.palette.text.disabled, letterSpacing: '0.18em', textTransform: 'uppercase', mt: 0.3 }}>
            Vehicle Tracking
          </Typography>
        </Box>
      </Box>

      {/* Slide content */}
      <Box className={classes.content} sx={{ opacity: fading ? 0 : 1 }}>
        <Typography className={classes.slideTitle}>
          {slide.titleStart && `${slide.titleStart} `}
          <Box
            component="span"
            sx={{
              background: 'linear-gradient(135deg, #818cf8, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {slide.titleHighlight}
          </Box>
          {slide.titleEnd && ` ${slide.titleEnd}`}
        </Typography>

        <Typography className={classes.tagline}>{slide.tagline}</Typography>
        <Typography className={classes.description}>{slide.description}</Typography>

        {/* Feature cards */}
        <Box className={classes.featureRow}>
          {FEATURES.map(({ Icon, label, sub, color }) => (
            <Box key={label} className={classes.featureCard}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '9px',
                  background: `${color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                <Icon sx={{ fontSize: 16, color }} />
              </Box>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                {label}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.disabled, mt: 0.3 }}>{sub}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Navigation */}
      <Box className={classes.nav}>
        <IconButton
          className={classes.navBtn}
          size="small"
          onClick={() => changeSlide((currentSlide - 1 + SLIDES.length) % SLIDES.length)}
        >
          <ArrowBack sx={{ fontSize: 16 }} />
        </IconButton>

        <Box sx={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <Box
              key={i}
              className={`${classes.dot} ${i === currentSlide ? classes.dotActive : ''}`}
              sx={{ width: i === currentSlide ? 20 : 6 }}
              onClick={() => changeSlide(i)}
            />
          ))}
        </Box>

        <IconButton
          className={classes.navBtn}
          size="small"
          onClick={() => changeSlide((currentSlide + 1) % SLIDES.length)}
        >
          <ArrowForward sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Live indicator */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box className={classes.liveDot} />
          <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.disabled }}>Systèmes opérationnels</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginLayoutNew;
