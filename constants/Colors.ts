export const uiKit = {
  palette: {
    night: "#092043",
    ocean: "#057dc0",
    sky: "#5dd9fa",
    mint: "#09e85c",
    white: "#ffffff",
    blush: "#ffc3b8",
    sun: "#fee917",
    transparent: "#0000",
  },
  surfaces: {
    appBackground: "#092043",
    cardBackground: "rgba(5, 125, 192, 0.14)",
    cardStrong: "rgba(9, 32, 67, 0.96)",
    overlay: "rgba(2, 9, 26, 0.72)",
    border: "rgba(93, 217, 250, 0.16)",
    inputBackground: "rgba(0, 0, 0, 0.14)",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.78)",
    muted: "rgba(255, 255, 255, 0.56)",
    accent: "#5dd9fa",
    success: "#09e85c",
    warning: "#fee917",
    danger: "#ffc3b8",
  },
  actions: {
    primary: "#09e85c",
    secondary: "#057dc0",
    accent: "#fee917",
    danger: "#ffc3b8",
    mapMarker: "#5dd9fa",
  },
  gradients: {
    glowA: "rgba(93, 217, 250, 0.18)",
    glowB: "rgba(9, 232, 92, 0.12)",
    glowC: "rgba(255, 195, 184, 0.14)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    pill: 999,
  },
  typography: {
    title: 38,
    headline: 26,
    body: 15,
    small: 12,
  },
  shared: {
    screen: {
      flex: 1,
      backgroundColor: "#092043",
    },
    card: {
      backgroundColor: "rgba(9, 32, 67, 0.96)",
      borderColor: "rgba(93, 217, 250, 0.16)",
      borderWidth: 1,
      borderRadius: 28,
    },
    input: {
      backgroundColor: "rgba(0, 0, 0, 0.14)",
      color: "#ffffff",
      borderColor: "rgba(93, 217, 250, 0.16)",
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    buttonPrimary: {
      backgroundColor: "#09e85c",
      borderRadius: 18,
      minHeight: 54,
    },
    buttonAccent: {
      backgroundColor: "#fee917",
      borderRadius: 18,
      minHeight: 54,
    },
  },
} as const;

const Colors = {
  ...uiKit,
  light: {
    text: uiKit.text.primary,
    background: uiKit.surfaces.appBackground,
    tint: uiKit.actions.secondary,
    tabIconDefault: uiKit.text.muted,
    tabIconSelected: uiKit.actions.secondary,
  },
  dark: {
    text: uiKit.text.primary,
    background: uiKit.surfaces.appBackground,
    tint: uiKit.actions.accent,
    tabIconDefault: uiKit.text.muted,
    tabIconSelected: uiKit.actions.accent,
  },
} as const;

export default Colors;
