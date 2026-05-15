export type FaceKey = 'bottom' | 'front' | 'back' | 'left' | 'right' | 'top';

export type FaceSpec = {
  size: [number, number];
  pivot: [number, number, number];
  offset: [number, number, number];
  rotation: [number, number, number];
  isStatic?: boolean;
  parent?: string;
};

export const getFaceSpecs = (w: number, h: number, d: number): Record<FaceKey, FaceSpec> => {
  const hW = w / 2;
  const hH = h / 2;
  const hD = d / 2;

  return {
    bottom: {
      size: [w, d] as [number, number],
      pivot: [0, -hH, 0] as [number, number, number],
      offset: [0, 0, 0] as [number, number, number],
      rotation: [Math.PI / 2, 0, 0] as [number, number, number],
      isStatic: true
    },
    front: {
      size: [w, h] as [number, number],
      pivot: [0, -hH, hD],
      offset: [0, hH, 0],
      rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    },
    back: {
      size: [w, h] as [number, number],
      pivot: [0, -hH, -hD],
      offset: [0, hH, 0],
      rotation: [Math.PI / 2, 0, 0] as [number, number, number],
    },
    left: {
      size: [d, h] as [number, number],
      pivot: [-hW, -hH, 0],
      offset: [0, hH, 0],
      rotation: [0, 0, Math.PI / 2] as [number, number, number],
    },
    right: {
      size: [d, h] as [number, number],
      pivot: [hW, -hH, 0],
      offset: [0, hH, 0],
      rotation: [0, 0, -Math.PI / 2] as [number, number, number],
    },
    top: {
      size: [w, d] as [number, number],
      pivot: [0, hH, hD],
      offset: [0, 0, hD],
      rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
      parent: 'front'
    }
  };
};
