import { Box } from '@mui/material';
import LoginLayoutV2 from './LoginLayoutV2';
import LoginPageV2 from './LoginPageV2';

/** Same DOM order always: flex + document/theme RTL mirror columns (hero start, form end). */
const LoginV2 = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
    <LoginLayoutV2 />
    <LoginPageV2 />
  </Box>
);

export default LoginV2;
