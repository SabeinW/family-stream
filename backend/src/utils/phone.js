// Digits-only normalization, with the US/Canada country code (1) stripped
// when present, so "+1 (555) 123-4567", "1-555-123-4567", and
// "555-123-4567" all normalize to the same "5551234567" and actually match
// each other. (This is a deliberate simplification, not general E.164
// handling — proper international normalization needs to know the
// country to interpret a leading digit correctly, which nothing here
// tracks. Fine for a small self-reported, unverified lookup field; not
// fine if this ever needs real international correctness.)
function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

function isValidPhone(normalized) {
  return normalized.length >= 7 && normalized.length <= 15;
}

module.exports = { normalizePhone, isValidPhone };
