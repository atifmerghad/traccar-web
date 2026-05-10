import { Box } from '@mui/material';
import LoginLayoutV2 from './LoginLayoutV2';
import ResetPasswordPageV2 from './ResetPasswordPageV2';

/** V2 reset password — same APIs as classic: `POST /api/password/reset` or `POST /api/password/update`. */
const ResetPasswordV2 = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', width: '100%' }}>
    <LoginLayoutV2 />
    <ResetPasswordPageV2 />
  </Box>
);

export default ResetPasswordV2;
