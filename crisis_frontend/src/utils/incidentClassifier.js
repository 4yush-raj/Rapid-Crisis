const lifeThreateningKeywords = [
  'life', 'danger', 'critical', 'unconscious', 'bleeding', 'heart attack', 'collapse', 'not breathing', 'no pulse', 'severe', 'fatal', 'trapped', 'shooting', 'stabbing', 'burns', 'electrocution', 'explosion', 'gas leak', 'poison', 'drowning', 'choking', 'seizure', 'stroke', 'cardiac', 'respiratory', 'amputation', 'massive'];
const fireKeywords = ['fire', 'flames', 'smoke', 'burning', 'blaze', 'wildfire', 'sparks', 'explosion', 'gas leak', 'arson'];
const medicalKeywords = ['medical', 'ambulance', 'injury', 'injured', 'hurt', 'wound', 'bleed', 'blood', 'conscious', 'unconscious', 'heart attack', 'stroke', 'seizure', 'choking', 'breathing', 'allergic', 'doctor', 'hospital'];
const securityKeywords = ['security', 'intruder', 'robbery', 'assault', 'fight', 'theft', 'dangerous', 'weapon', 'gun', 'knife', 'break-in', 'suspicious'];
const maintenanceKeywords = ['leak', 'water leak', 'power outage', 'electricity', 'lights out', 'broken', 'blocked', 'door', 'lock', 'plumbing', 'pipe', 'gas leak', 'HVAC', 'ventilation', 'structural'];
const generalKeywords = ['crowd', 'noise', 'smell', 'odor', 'spill', 'trip', 'slip', 'fall', 'parking', 'delay', 'animal'];

function normalizeText(text) {
  return (text || '').toLowerCase();
}

function containsAny(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function predictPriority(title, description) {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();

  if (containsAny(combined, lifeThreateningKeywords)) {
    return 'high';
  }

  const hasFire = containsAny(combined, fireKeywords);
  const hasMedical = containsAny(combined, medicalKeywords);
  const hasSecurity = containsAny(combined, securityKeywords);
  const hasMaintenance = containsAny(combined, maintenanceKeywords);
  const hasGeneral = containsAny(combined, generalKeywords);

  if (hasFire || hasMedical || hasSecurity) {
    return 'high';
  }

  if (hasMaintenance || hasGeneral) {
    return 'medium';
  }

  return 'low';
}

export function recommendServices(title, description) {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();
  const services = new Set();

  if (containsAny(combined, fireKeywords)) {
    services.add('Fire Team');
  }
  if (containsAny(combined, medicalKeywords)) {
    services.add('Ambulance / Medical Team');
  }
  if (containsAny(combined, securityKeywords)) {
    services.add('Security Team');
  }
  if (containsAny(combined, maintenanceKeywords)) {
    services.add('Maintenance Team');
  }
  if (containsAny(combined, ['flood', 'water', 'leak', 'storm'])) {
    services.add('Flood Response / Utility Team');
  }
  if (containsAny(combined, ['chemical', 'hazard', 'poison'])) {
    services.add('Hazmat Team');
  }
  if (services.size === 0) {
    services.add('General Response Team');
  }

  return Array.from(services);
}
