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
