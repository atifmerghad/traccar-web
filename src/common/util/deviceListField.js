/**
 * Resolves a device list row field from the merged `vehicle` object used on
 * the live map (see MainPageV2 `vehicles` useMemo: has `.device` and `.position`).
 *
 * Keys are aligned with Préférences → Véhicules (devicePrimary / deviceSecondary):
 *   name, uniqueId, phone, model, contact
 */
export function getDeviceListFieldValue(vehicle, fieldKey) {
  if (!vehicle || !fieldKey) return '';
  const key = String(fieldKey).trim();
  if (!key) return '';
  const dev = vehicle.device;
  if (!dev) return '';

  switch (key) {
    case 'name':
      return dev.name ?? '';
    case 'uniqueId':
      return dev.uniqueId ?? '';
    case 'phone':
      return dev.phone ?? '';
    case 'model':
      return dev.model ?? '';
    case 'contact':
      return dev.contact ?? '';
    default:
      if (dev[key] != null) return String(dev[key]);
      return '';
  }
}

export function formatDeviceListLines(vehicle, primaryKey, secondaryKey) {
  const p = (primaryKey && String(primaryKey).trim()) || 'name';
  const s = secondaryKey != null ? String(secondaryKey).trim() : '';

  const primary = getDeviceListFieldValue(vehicle, p) || '—';
  let secondary = '';
  if (s && s !== p) {
    const v = getDeviceListFieldValue(vehicle, s);
    if (v) secondary = v;
  }
  return { primary, secondary };
}
