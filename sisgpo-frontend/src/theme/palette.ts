export const palette = {
  background: '#121212',
  cardBlue: '#39436F',
  cardSlate: '#1c232d',
  inputField: '#1b222c',
  cardGreen: '#3B5E5A',
  spamRed: '#8B1C1C',
  premiumOrange: '#F79E1B',
  textMain: '#D3D3D3',
  textSecondary: '#9E9E9E',
  tagBlue: '#007AFF',
  searchbar: '#1E1E1E',
} as const;

export type PaletteKey = keyof typeof palette;






