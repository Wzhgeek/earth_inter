export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
}

export interface TrackingState {
  leftHand: HandData | null;
  rightHand: HandData | null;
}

export enum Continent {
  AFRICA_EUROPE = "非洲 / 欧洲战区",
  ASIA = "亚洲 / 远东防线",
  PACIFIC = "太平洋 / 海洋监测",
  AMERICAS = "美洲 / 战略腹地",
  UNKNOWN = "扫描中..."
}

export interface PlanetStats {
  gravity: string;
  temp: string;
  atmosphere: string;
  population: string;
}

export interface PlanetConfig {
  id: 'earth' | 'mars' | 'moon';
  name: string;
  texture: string;
  color: string; // Hex for 3D light
  theme: 'cyan' | 'red' | 'slate'; // Tailwind color theme key
  stats: PlanetStats;
}

export const PLANETS: PlanetConfig[] = [
  {
    id: 'earth',
    name: 'TERRA (EARTH)',
    texture: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    color: '#00FFFF',
    theme: 'cyan',
    stats: {
      gravity: '9.807 m/s²',
      temp: '14°C',
      atmosphere: 'N2 / O2',
      population: '8.1 Billion'
    }
  },
  {
    id: 'mars',
    name: 'MARS (ARES)',
    texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k.jpg',
    color: '#FF4500',
    theme: 'red',
    stats: {
      gravity: '3.721 m/s²',
      temp: '-63°C',
      atmosphere: 'CO2 / Ar',
      population: '0 (Colony Pending)'
    }
  },
  {
    id: 'moon',
    name: 'LUNA',
    texture: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
    color: '#E2E8F0',
    theme: 'slate',
    stats: {
      gravity: '1.62 m/s²',
      temp: '-53°C',
      atmosphere: 'None',
      population: 'Outpost Alpha'
    }
  }
];