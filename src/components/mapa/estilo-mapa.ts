/**
 * Estilo cinza do Google Maps (Android), para o risco colorido ser a única cor na tela.
 * No iOS o Apple Maps usa mapType "mutedStandard", que já é discreto.
 * Gerado no padrão do Google Maps Styling Wizard.
 */

const COMUM = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

export const ESTILO_CLARO = [
  { elementType: 'geometry', stylers: [{ color: '#EEEDEA' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5E5E66' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F4F1' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DAD8D2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFCFD4' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#E4E2DD' }] },
  ...COMUM,
];

export const ESTILO_ESCURO = [
  { elementType: 'geometry', stylers: [{ color: '#1C1C21' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A8A92' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121215' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2E2E35' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3A3A42' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E0E11' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#232328' }] },
  ...COMUM,
];
