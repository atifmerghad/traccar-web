import { Box } from '@mui/material';
import LoginLayoutNew from './LoginLayoutNew';
import LoginPageNew from './LoginPageNew';

const LoginDemo = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
    <LoginLayoutNew />
    <LoginPageNew />
  </Box>
);

export default LoginDemo;
