/**
 * Sosync Theme Configuration
 * Reusable color palette, gradients, and variants for the Expo application.
 */

export const Colors = {
  // Base Colors
  alabasterGrey: "#ebe9e9",
  mintCream: "#f3f8f2",
  steelBlue: "#3581b8",
  sandyBrown: "#fcb07e",
  softLinen: "#dee2d6",

  // Shades
  grey: {
    50: "#f3f2f2",
    100: "#e7e4e4",
    200: "#cfc9c9",
    300: "#b6afaf",
    400: "#9e9494",
    500: "#867979",
    600: "#6b6161",
    700: "#504949",
    800: "#363030",
    900: "#1b1818",
    950: "#131111",
  },
  mint: {
    50: "#f0f6ee",
    100: "#e0edde",
    200: "#c2dbbd",
    300: "#a3c99c",
    400: "#85b87a",
    500: "#66a659",
    600: "#528547",
    700: "#3d6336",
    800: "#294224",
    900: "#142112",
    950: "#0e170c",
  },
  blue: {
    50: "#ebf3f9",
    100: "#d7e8f4",
    200: "#b0d1e8",
    300: "#88badd",
    400: "#61a2d1",
    500: "#398bc6",
    600: "#2e6f9e",
    700: "#225477",
    800: "#17384f",
    900: "#0b1c28",
    950: "#08131c",
  },
  brown: {
    50: "#fef0e6",
    100: "#fee1cd",
    200: "#fcc29c",
    300: "#fba46a",
    400: "#fa8638",
    500: "#f96706",
    600: "#c75305",
    700: "#953e04",
    800: "#632903",
    900: "#321501",
    950: "#230e01",
  },
  linen: {
    50: "#f3f4f0",
    100: "#e7eae1",
    200: "#cfd5c3",
    300: "#b7c0a5",
    400: "#9faa88",
    500: "#87956a",
    600: "#6c7755",
    700: "#515a3f",
    800: "#363c2a",
    900: "#1b1e15",
    950: "#13150f",
  },
};

export const Gradients = {
  // Expo Linear Gradient compatible arrays
  standard: ["#ebe9e9", "#f3f8f2", "#3581b8", "#fcb07e", "#dee2d6"],
  primary: [Colors.steelBlue, Colors.sandyBrown],
  soft: [Colors.alabasterGrey, Colors.softLinen],
  nature: [Colors.mintCream, Colors.softLinen],
};

export const Theme = {
  colors: Colors,
  gradients: Gradients,
  variants: {
    primary: Colors.steelBlue,
    secondary: Colors.sandyBrown,
    background: Colors.mintCream,
    surface: Colors.alabasterGrey,
    text: Colors.grey[900],
    textMuted: Colors.grey[500],
    border: Colors.softLinen,
    success: Colors.mint[500],
    warning: Colors.brown[500],
    error: "#ff4444", // Fallback standard error
    alabaster: Colors.alabasterGrey,
    mint: Colors.mintCream,
    steelBlue: Colors.steelBlue,
    sandyBrown: Colors.sandyBrown,
    softLinen: Colors.softLinen,
  },
  backgrounds: {
    // first main screen bg linear gradiant, 0% albaster, 58% mint, 100% steel blue
    mainScreen: [Colors.alabasterGrey, Colors.mintCream, Colors.steelBlue],
  },
  typography: {
    inter: {
      regular: "Inter_400Regular",
      medium: "Inter_500Medium",
      semibold: "Inter_600SemiBold",
      bold: "Inter_700Bold",
    },
    geom: "Geom",
  },
};

export default Theme;
