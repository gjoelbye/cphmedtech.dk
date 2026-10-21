const logoModules = import.meta.glob<{ default: ImageMetadata }>('../assets/logos/*', { eager: true });

export function getLogoSrc(filename: string): ImageMetadata | undefined {
  const key = Object.keys(logoModules).find((k) => k.endsWith(`/${filename}`));
  return key ? logoModules[key].default : undefined;
}
