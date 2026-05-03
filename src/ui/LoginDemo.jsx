import React from 'react';
import { Box } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import LoginLayoutNew from './LoginLayoutNew';
import LoginPageNew from './LoginPageNew';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    width: '100%',
  },
}));

const LoginDemo = () => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      <LoginLayoutNew />
      <LoginPageNew />
    </Box>
  );
};

export default LoginDemo;
