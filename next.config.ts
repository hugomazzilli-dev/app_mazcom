import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
export const TYPES: Record<string, { label: string; color: string; bg: string} > = {
  drone: { label: 'Site Web', color: '#60a5fa', bg: '#0d1520' },
  corporate: { label: 'Corporate', color: '#a78bfa', bg: '#150d20' },
  interview: { label: 'Interview', color: '#c084fc', bg: '#1a1530' },
  chantier: { label: 'Vidéo chantier', color: '#f97316', bg: '#1a1210' },
  rs: { label: 'Réseaux sociaux', color: '#fb923c', bg: '#1a1008' },
  immo: { label: 'Immobilier', color: '#818cf8', bg: '#120d1a' },
  montage: { label: 'Montage', color: '#34d399', bg: '#0d1a15' },
}
