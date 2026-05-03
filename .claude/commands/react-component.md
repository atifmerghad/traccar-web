# React Component Generator

Generate a new React functional component following this project's conventions (React 19, MUI v7, tss-react/mui).

## Instructions

Create a React component based on the user's description: $ARGUMENTS

Follow these project conventions:

### Component Structure
```jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  // styles here
}));

const ComponentName = ({ prop1, prop2 }) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.root}>
      {/* JSX here */}
    </Box>
  );
};

export default ComponentName;
```

### Rules
- Use `makeStyles` from `tss-react/mui` for custom styles (not `sx` for complex styles)
- Use `sx` prop only for simple one-off overrides
- Use MUI v7 components: Box, Stack, Typography, Paper, IconButton, etc.
- Functional components with hooks only — no class components
- Destructure props in function signature
- Use `useTheme` and `useMediaQuery` for responsive behavior
- Place the component file in `src/ui/` for UI pages or `src/common/components/` for shared components
- Export default at the bottom

Generate the full component file content ready to copy-paste.
