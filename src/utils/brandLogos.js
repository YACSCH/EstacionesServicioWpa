import copec from '../assets/logos/copec.svg';
import shell from '../assets/logos/shell.svg';
import gulf from '../assets/logos/gulf.svg';

const LOGOS = {
  COPEC: copec,
  SHELL: shell,
  GULF: gulf,
};

export function getStationLogo(brand = '') {
  const key = brand.toUpperCase().trim();
  for (const [name, src] of Object.entries(LOGOS)) {
    if (key.includes(name)) {
      return src;
    }
  }
  return null;
}
