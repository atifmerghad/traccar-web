import { Box } from '@mui/material';
import LoginLayoutV2 from './LoginLayoutV2';
import RegisterPageV2 from './RegisterPageV2';

/** V2 registration — same layout shell as login; matches Traccar `POST /api/users`. */
const RegisterV2 = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
    <LoginLayoutV2 />
    <RegisterPageV2 />
  </Box>
);

export default RegisterV2;
