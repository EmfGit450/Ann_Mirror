export const enum ForwardDirection {
  PosX,
  NegX,
  PosY,
  NegY,
  PosZ,
  NegZ,
}

interface EditorState {
  settings: {
    app: {
      
    },
    builder: {
      forwardDirection: ForwardDirection;
    }
  }
  preferences: {
    
  }
  quickHelpers: {
    axesEnabled: boolean;
  }
}
