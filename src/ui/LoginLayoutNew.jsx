import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  leftPanel: {
    flex: '0 0 50%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(4, 6),
    background: `linear-gradient(135deg, ${theme.palette.primary.dark || theme.palette.primary.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
    color: theme.palette.primary.contrastText || 'white',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(8),
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.spacing(1),
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: theme.palette.primary.light || theme.palette.secondary.light,
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '1px',
    lineHeight: 1,
  },
  logoSubtitle: {
    fontSize: '11px',
    fontWeight: 400,
    letterSpacing: '2px',
    opacity: 0.8,
    marginTop: theme.spacing(0.25),
  },
  leftContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: '500px',
    margin: '0 auto',
    width: '100%',
  },
  welcomeTitle: {
    fontSize: '4.5rem',
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    lineHeight: 1.1,
    [theme.breakpoints.down('lg')]: {
      fontSize: '4rem',
    },
    [theme.breakpoints.down('md')]: {
      fontSize: '3.5rem',
    },
  },
  trackyHighlight: {
    color: theme.palette.primary.light || theme.palette.secondary.light,
  },
  tagline: {
    fontSize: '2rem',
    fontWeight: 400,
    marginBottom: theme.spacing(4),
    opacity: 0.95,
    [theme.breakpoints.down('lg')]: {
      fontSize: '1.75rem',
    },
    [theme.breakpoints.down('md')]: {
      fontSize: '1.5rem',
    },
  },
  description: {
    fontSize: '1.25rem',
    lineHeight: 1.7,
    opacity: 0.9,
    marginBottom: theme.spacing(8),
    [theme.breakpoints.down('lg')]: {
      fontSize: '1.125rem',
    },
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    marginTop: 'auto',
  },
  navButton: {
    color: theme.palette.primary.contrastText || 'white',
    minWidth: 'auto',
    width: 40,
    height: 40,
    padding: 0,
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      transform: 'scale(1.1)',
    },
    '& svg': {
      fontSize: '20px',
    },
  },
  dots: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transition: 'background-color 0.3s',
  },
  dotActive: {
    backgroundColor: theme.palette.primary.light || theme.palette.secondary.light,
  },
}));

const carouselSlides = [
  {
    title: 'Welcome to Tracky',
    highlight: 'Tracky',
    tagline: 'The smart way to track your fleet',
    description: 'Tracky helps you monitor, manage, and optimize your vehicles in real time. Get instant insights, live locations, and powerful analytics for your entire fleet —all in one platform.',
  },
  {
    title: 'Real-Time Tracking',
    highlight: 'Tracking',
    tagline: 'Monitor your fleet in real-time',
    description: 'See the exact location of all your vehicles on an interactive map. Get instant updates, route history, and detailed analytics to make informed decisions about your fleet operations.',
  },
  {
    title: 'Smart Analytics',
    highlight: 'Analytics',
    tagline: 'Powerful insights at your fingertips',
    description: 'Access comprehensive reports and analytics to optimize routes, reduce fuel consumption, and improve overall fleet efficiency. Make data-driven decisions with ease.',
  },
  {
    title: 'Easy Management',
    highlight: 'Management',
    tagline: 'Simplify fleet operations',
    description: 'Manage all your vehicles, drivers, and routes from a single intuitive dashboard. Set up geofences, receive alerts, and keep your fleet running smoothly.',
  },
];

const LoginLayoutNew = () => {
  const { classes } = useStyles();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  const currentSlideData = carouselSlides[currentSlide];

  return (
    <Box className={classes.leftPanel}>
      {/* Logo */}
      <Box className={classes.logo}>
        <Box className={classes.logoIcon}>T</Box>
        <Box className={classes.logoText}>
          <Typography className={classes.logoTitle}>TRACKY</Typography>
          <Typography className={classes.logoSubtitle}>VEHICLES TRACKING</Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box className={classes.leftContent}>
        <Typography className={classes.welcomeTitle}>
          {currentSlideData.title.split(' ').map((word, index, array) => {
            const words = currentSlideData.title.split(' ');
            const highlightIndex = words.findIndex(w => 
              w.toLowerCase().includes(currentSlideData.highlight.toLowerCase())
            );
            if (index === highlightIndex) {
              return (
                <React.Fragment key={index}>
                  <span className={classes.trackyHighlight}>{word}</span>
                  {index < array.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            }
            return <React.Fragment key={index}>{word}{index < array.length - 1 ? ' ' : ''}</React.Fragment>;
          })}
        </Typography>
        <Typography className={classes.tagline}>
          {currentSlideData.tagline}
        </Typography>
        <Typography className={classes.description}>
          {currentSlideData.description}
        </Typography>
      </Box>

      {/* Navigation */}
      <Box className={classes.navigation}>
        <IconButton 
          className={classes.navButton} 
          size="small"
          onClick={handlePrevSlide}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box className={classes.dots}>
          {carouselSlides.map((_, index) => (
            <Box
              key={index}
              className={`${classes.dot} ${index === currentSlide ? classes.dotActive : ''}`}
              onClick={() => handleDotClick(index)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        <IconButton 
          className={classes.navButton} 
          size="small"
          onClick={handleNextSlide}
        >
          <ArrowForward fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default LoginLayoutNew;

