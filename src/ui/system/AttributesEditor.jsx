import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Tooltip,
  Chip,
  IconButton,
  Switch,
  TextField,
  Autocomplete,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { AddOutlined, DeleteOutline } from '@mui/icons-material';

/**
 * Reusable free-form attributes editor with a key picker (Autocomplete + freeSolo).
 *
 * Props
 * - attributes:  current attributes map { [key]: value }
 * - onChange:    (newAttributes) => void
 * - definitions: { [key]: { name?: string, type?: 'string' | 'number' | 'boolean' } }
 *                used to populate the picker and to label existing rows. Optional.
 * - classes:     style object exposing `inputDark` and `iconBtn`
 *                (re-uses page-level styles so visuals stay consistent).
 * - emptyHint:   text shown when no attributes exist yet
 */

const detectType = (v) => {
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return 'number';
  return 'string';
};

const coerce = (raw, type) => {
  if (type === 'boolean') return raw === true || raw === 'true';
  if (type === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return String(raw ?? '');
};

const AttributesEditor = ({
  attributes,
  onChange,
  classes,
  definitions = {},
  emptyHint = 'Aucun attribut. Ouvrez le sélecteur ci-dessous pour parcourir les attributs disponibles.',
}) => {
  const [picked, setPicked] = useState(null);
  const [newType, setNewType] = useState('string');
  const [newValue, setNewValue] = useState('');

  const entries = Object.entries(attributes || {});

  const options = Object.entries(definitions)
    .filter(([k]) => !(k in (attributes || {})))
    .map(([key, def]) => ({ key, label: def.name || key, type: def.type || 'string' }));

  const updateValue = (k, raw) => {
    const type = detectType(attributes[k]);
    onChange({ ...attributes, [k]: coerce(raw, type) });
  };

  const remove = (k) => {
    const next = { ...attributes };
    delete next[k];
    onChange(next);
  };

  const add = () => {
    if (!picked) return;
    const k = (typeof picked === 'string' ? picked : picked.key).trim();
    if (!k || k in (attributes || {})) return;
    const value = newType === 'boolean' ? false : coerce(newValue, newType);
    onChange({ ...attributes, [k]: value });
    setPicked(null);
    setNewValue('');
    setNewType('string');
  };

  const addDisabled =
    !picked ||
    (typeof picked === 'string' ? !picked.trim() : !picked.key) ||
    (typeof picked === 'object' && picked.key in (attributes || {}));

  return (
    <Stack spacing={1.25}>
      {entries.length === 0 && (
        <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>{emptyHint}</Typography>
      )}

      {entries.map(([k, v]) => {
        const type = detectType(v);
        const friendly = definitions[k]?.name;
        return (
          <Box
            key={k}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <Box sx={{ flex: '0 0 34%', minWidth: 200 }}>
              <Tooltip title={k} placement="top" arrow>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {friendly || k}
                  </Typography>
                  {friendly && (
                    <Typography
                      sx={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.72rem',
                        color: 'text.disabled',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            </Box>
            <Chip
              size="small"
              label={type}
              sx={{ height: 22, fontSize: '0.7rem', textTransform: 'uppercase', flex: '0 0 auto' }}
            />
            {type === 'boolean' ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch
                  size="small"
                  checked={!!v}
                  onChange={(e) => updateValue(k, e.target.checked)}
                />
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {v ? 'true' : 'false'}
                </Typography>
              </Box>
            ) : (
              <TextField
                size="small"
                className={classes?.inputDark}
                type={type === 'number' ? 'number' : 'text'}
                value={String(v ?? '')}
                onChange={(e) => updateValue(k, e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
              />
            )}
            <Tooltip title="Supprimer">
              <IconButton size="small" className={classes?.iconBtn} onClick={() => remove(k)}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap',
          borderTop: (t) => `1px dashed ${t.palette.divider}`,
          pt: 1.5,
        }}
      >
        <Autocomplete
          size="small"
          freeSolo
          autoHighlight
          options={options}
          value={picked}
          onChange={(_, val) => {
            if (!val) {
              setPicked(null);
              return;
            }
            if (typeof val === 'string') {
              setPicked({ key: val, label: val, type: newType });
            } else {
              setPicked(val);
              setNewType(val.type || 'string');
            }
          }}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label || opt.key || '')}
          isOptionEqualToValue={(opt, val) =>
            opt.key === (typeof val === 'string' ? val : val?.key)
          }
          filterOptions={(opts, state) => {
            const q = state.inputValue.trim().toLowerCase();
            if (!q) return opts;
            return opts.filter(
              (o) => o.key.toLowerCase().includes(q) || (o.label || '').toLowerCase().includes(q),
            );
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.key}>
              <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.86rem', fontWeight: 600 }}>
                  {option.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontFamily: 'ui-monospace, monospace',
                    color: 'text.disabled',
                  }}
                >
                  {option.key} · {option.type}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Choisir un attribut…"
              className={classes?.inputDark}
            />
          )}
          sx={{ flex: '1 1 280px', minWidth: 240 }}
        />
        <FormControl size="small" className={classes?.inputDark} sx={{ flex: '0 0 130px' }}>
          <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
            <MenuItem value="string">Texte</MenuItem>
            <MenuItem value="number">Nombre</MenuItem>
            <MenuItem value="boolean">Booléen</MenuItem>
          </Select>
        </FormControl>
        {newType === 'boolean' ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              color: 'text.disabled',
              fontSize: '0.82rem',
            }}
          >
            (sera ajouté avec{' '}
            <Box component="code" sx={{ ml: 0.5 }}>
              false
            </Box>
            )
          </Box>
        ) : (
          <TextField
            size="small"
            placeholder="valeur"
            className={classes?.inputDark}
            type={newType === 'number' ? 'number' : 'text'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            sx={{ flex: 1, minWidth: 160 }}
          />
        )}
        <Tooltip title="Ajouter">
          <span>
            <IconButton
              size="small"
              className={classes?.iconBtn}
              onClick={add}
              disabled={addDisabled}
            >
              <AddOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Stack>
  );
};

export default AttributesEditor;
