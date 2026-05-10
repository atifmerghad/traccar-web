import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useTheme, alpha, darken } from '@mui/material/styles';
import { ArrowBack, ArrowForward, GpsFixed, Speed, NotificationsActive } from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { keyframes } from '@emotion/react';
import { useTranslation } from '../../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  const panelAngle = theme.direction === 'rtl' ? '200deg' : '160deg';
  const bgDefault = theme.palette.background.default;
  const primary = theme.palette.primary.main;
  const gridLine = alpha(primary, 0.05);
  const gridSize = theme.spacing(6.5);

  const livePulse = keyframes`
    0%   { box-shadow: 0 0 0 0 ${alpha(theme.palette.secondary.main, 0.5)}; }
    70%  { box-shadow: 0 0 0 ${theme.spacing(1)} ${alpha(theme.palette.secondary.main, 0)}; }
    100% { box-shadow: 0 0 0 0 ${alpha(theme.palette.secondary.main, 0)}; }
  `;

  const darkPanelGradient = `linear-gradient(${panelAngle}, ${darken(bgDefault, 0.28)} 0%, ${bgDefault} 45%, ${darken(bgDefault, 0.12)} 100%)`;
  const lightPanelGradient = `linear-gradient(${panelAngle}, ${alpha(primary, 0.12)} 0%, ${bgDefault} 45%, ${alpha(primary, 0.06)} 100%)`;

  return {
    panel: {
      flex: '0 0 50%',
      display: 'flex',
      flexDirection: 'column',
      // Use backgroundImage (not background): stylis-rtl/cssjanus flips the first N% inside background: and breaks gradients.
      backgroundColor: bgDefault,
      backgroundImage: isDark ? darkPanelGradient : lightPanelGradient,
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100vh',
      padding: theme.spacing(4.5, 6),
      [theme.breakpoints.down('md')]: { display: 'none' },
    },
    grid: {
      position: 'absolute',
      inset: 0,
      backgroundImage: `linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
      backgroundSize: `${gridSize} ${gridSize}`,
      pointerEvents: 'none',
    },
    glowTop: {
      position: 'absolute',
      top: '-15%',
      left: '-15%',
      width: '70%',
      height: '70%',
      backgroundImage: `radial-gradient(ellipse, ${alpha(primary, 0.14)} 0%, transparent 65%)`,
      pointerEvents: 'none',
    },
    glowBottom: {
      position: 'absolute',
      bottom: '-15%',
      right: '-10%',
      width: '55%',
      height: '55%',
      backgroundImage: `radial-gradient(ellipse, ${alpha(theme.palette.secondary.main, 0.07)} 0%, transparent 65%)`,
      pointerEvents: 'none',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      position: 'relative',
      zIndex: 1,
      marginBottom: theme.spacing(6),
    },
    logoIcon: {
      width: theme.spacing(5.5),
      height: theme.spacing(5.5),
      borderRadius: theme.spacing(1.5),
      backgroundColor: primary,
      backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${theme.palette.primary.light} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 ${theme.spacing(0.5)} ${theme.spacing(2.5)} ${alpha(primary, 0.45)}`,
      flexShrink: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      maxWidth: theme.spacing(65),
      transition: theme.transitions.create('opacity', {
        duration: theme.transitions.duration.shorter,
      }),
    },
    slideTitle: {
      fontSize: theme.typography.pxToRem(54),
      fontWeight: 800,
      color: theme.palette.text.primary,
      lineHeight: 1.1,
      marginBottom: theme.spacing(1.75),
      letterSpacing: '-0.025em',
      textAlign: 'start',
    },
    tagline: {
      fontSize: theme.typography.pxToRem(18.4),
      fontWeight: 500,
      color: theme.palette.text.secondary,
      marginBottom: theme.spacing(1.75),
      textAlign: 'start',
    },
    description: {
      fontSize: theme.typography.pxToRem(14.75),
      lineHeight: 1.8,
      color: theme.palette.text.disabled,
      marginBottom: theme.spacing(5),
      textAlign: 'start',
    },
    featureRow: {
      display: 'flex',
      gap: theme.spacing(1.25),
      marginBottom: theme.spacing(5),
    },
    featureCard: {
      flex: 1,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.04)
        : theme.palette.action.hover,
      backdropFilter: `blur(${theme.spacing(1.25)})`,
      WebkitBackdropFilter: `blur(${theme.spacing(1.25)})`,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.07) : theme.palette.divider}`,
      borderRadius: theme.spacing(1.75),
      padding: theme.spacing(1.75, 1.5),
      transition: theme.transitions.create('border-color', {
        duration: theme.transitions.duration.shorter,
      }),
      '&:hover': {
        borderColor: isDark ? alpha(theme.palette.common.white, 0.14) : theme.palette.divider,
      },
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.25),
      position: 'relative',
      zIndex: 1,
    },
    navBtn: {
      width: theme.spacing(4.25),
      height: theme.spacing(4.25),
      color: theme.palette.text.disabled,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.08) : theme.palette.divider}`,
      borderRadius: '50%',
      '&:hover': {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.06)
          : theme.palette.action.selected,
        color: theme.palette.text.primary,
        borderColor: isDark ? alpha(theme.palette.common.white, 0.2) : theme.palette.divider,
      },
    },
    dot: {
      height: theme.spacing(0.75),
      borderRadius: theme.spacing(0.375),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.15)
        : theme.palette.action.selected,
      cursor: 'pointer',
      transition: theme.transitions.create(['width', 'background-color'], {
        duration: theme.transitions.duration.standard,
      }),
    },
    dotActive: {
      backgroundColor: theme.palette.primary.main,
      width: `${theme.spacing(2.5)} !important`,
    },
    liveDot: {
      width: theme.spacing(1),
      height: theme.spacing(1),
      borderRadius: '50%',
      backgroundColor: theme.palette.secondary.main,
      flexShrink: 0,
      animation: `${livePulse} 2s ease-in-out infinite`,
    },
  };
});

const LoginLayoutV2 = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key || value === undefined ? fallback : value;
  };

  const SLIDES = useMemo(
    () => [
      {
        titleStart: tt('loginHeroSlide1TitleStart', 'Welcome to'),
        titleHighlight: tt('loginHeroSlide1Highlight', 'Geo'),
        titleEnd: '',
        tagline: tt('loginHeroSlide1Tagline', 'The smart solution for your fleet'),
        description: tt(
          'loginHeroSlide1Description',
          'Manage, monitor and optimize your vehicle fleet in real time. Live locations, trip history and powerful analytics — all in one.',
        ),
      },
      {
        titleStart: tt('loginHeroSlide2TitleStart', 'Live'),
        titleHighlight: tt('loginHeroSlide2Highlight', 'tracking'),
        titleEnd: '',
        tagline: tt('loginHeroSlide2Tagline', 'Live locations on an interactive map'),
        description: tt(
          'loginHeroSlide2Description',
          'See your entire fleet on an interactive map. Get instant alerts and make informed decisions in any situation.',
        ),
      },
      {
        titleStart: tt('loginHeroSlide3TitleStart', 'Advanced'),
        titleHighlight: tt('loginHeroSlide3Highlight', 'analytics'),
        titleEnd: '',
        tagline: tt('loginHeroSlide3Tagline', 'Insights to optimize your operations'),
        description: tt(
          'loginHeroSlide3Description',
          'Access detailed reports on trips, fuel use and driver efficiency. Reduce costs with reliable data.',
        ),
      },
      {
        titleStart: tt('loginHeroSlide4TitleStart', 'Centralized'),
        titleHighlight: tt('loginHeroSlide4Highlight', 'management'),
        titleEnd: '',
        tagline: tt('loginHeroSlide4Tagline', 'One dashboard to manage everything'),
        description: tt(
          'loginHeroSlide4Description',
          'Manage vehicles, create geofences, configure alerts and review full history from one fast, intuitive interface.',
        ),
      },
    ],
    [t],
  );

  const FEATURES = useMemo(
    () => [
      {
        Icon: GpsFixed,
        label: tt('loginHeroFeature1Label', 'GPS Live'),
        sub: tt('loginHeroFeature1Sub', 'Accuracy under 10 m'),
        color: theme.palette.primary.main,
      },
      {
        Icon: Speed,
        label: tt('loginHeroFeature2Label', 'Performance'),
        sub: tt('loginHeroFeature2Sub', 'Real-time reports'),
        color: theme.palette.secondary.main,
      },
      {
        Icon: NotificationsActive,
        label: tt('loginHeroFeature3Label', 'Alerts'),
        sub: tt('loginHeroFeature3Sub', 'Push notifications'),
        color: theme.palette.warning.main,
      },
    ],
    [t, theme.palette.primary.main, theme.palette.secondary.main, theme.palette.warning.main],
  );

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
  const primaryLight = theme.palette.primary.light;

  return (
    <Box className={classes.panel}>
      <Box className={classes.grid} />
      <Box className={classes.glowTop} />
      <Box className={classes.glowBottom} />

      {/* Logo */}
      <Box className={classes.logo}>
        <Box className={classes.logoIcon}>
          <GpsFixed
            sx={{ color: theme.palette.common.white, fontSize: theme.typography.pxToRem(22) }}
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.12em', lineHeight: 1 }}
          >
            {tt('loginHeroBrandTitle', 'GEO')}
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.pxToRem(10),
              color: 'text.disabled',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              mt: 0.3,
            }}
          >
            {tt('loginHeroBrandTagline', 'Vehicle Tracking')}
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
              backgroundImage: `linear-gradient(135deg, ${primaryLight}, ${theme.palette.primary.main})`,
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
                  width: theme.spacing(4),
                  height: theme.spacing(4),
                  borderRadius: theme.spacing(1.125),
                  bgcolor: alpha(color, 0.09),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                <Icon sx={{ fontSize: theme.typography.pxToRem(16), color }} />
              </Box>
              <Typography
                sx={{
                  fontSize: theme.typography.pxToRem(12.5),
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                {label}
              </Typography>
              <Typography
                sx={{ fontSize: theme.typography.pxToRem(11.2), color: 'text.disabled', mt: 0.3 }}
              >
                {sub}
              </Typography>
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
          <ArrowBack sx={{ fontSize: theme.typography.pxToRem(16) }} />
        </IconButton>

        <Box sx={{ display: 'flex', gap: theme.spacing(0.75), alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <Box
              key={i}
              className={`${classes.dot} ${i === currentSlide ? classes.dotActive : ''}`}
              sx={{ width: i === currentSlide ? theme.spacing(2.5) : theme.spacing(0.75) }}
              onClick={() => changeSlide(i)}
            />
          ))}
        </Box>

        <IconButton
          className={classes.navBtn}
          size="small"
          onClick={() => changeSlide((currentSlide + 1) % SLIDES.length)}
        >
          <ArrowForward sx={{ fontSize: theme.typography.pxToRem(16) }} />
        </IconButton>

        {/* Live indicator */}
        <Box sx={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box className={classes.liveDot} />
          <Typography sx={{ fontSize: theme.typography.pxToRem(11.5), color: 'text.disabled' }}>
            {tt('loginHeroSystemsStatus', 'Systems operational')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginLayoutV2;
