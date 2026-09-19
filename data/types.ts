export type ImageAsset = { src: string; alt: string };
export type ThreeScene =
  | { enabled: false; roomId?: string }
  | { enabled: true; roomId: string };
export type Project = {
  id: string;
  slug: string;
  title: string;
  location: string;
  year: number;
  style: string;
  area: string;
  description: string;
  introduction: string;
  concept: string;
  coverImage: ImageAsset;
  gallery: ImageAsset[];
  materials: string[];
  products: string[];
  spaces: string[];
  threeScene: ThreeScene;
};
export type Space = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: ImageAsset;
  products: string[];
  materials: string[];
};
export type Collection = {
  slug: string;
  title: string;
  description: string;
  image: ImageAsset;
  projects: string[];
};
export type Material = {
  slug: string;
  title: string;
  family: string;
  description: string;
  detail: string;
  finish: string;
  care: string;
  image: ImageAsset;
  color: string;
};
export type SketchfabAssetViewer = {
  provider: 'sketchfab';
  uid: string;
  /** Optional public model URL; otherwise derived from the UID. */
  url?: string;
};
export type AssetMarketplace = { provider: 'fab'; url: string };
export type ProductAsset = {
  available: boolean;
  viewer?: SketchfabAssetViewer;
  marketplace?: AssetMarketplace;
  poster?: ImageAsset;
  formats?: string[];
  software?: string[];
  textures?: string;
  polygonCount?: string;
  vertices?: string;
  uv?: string;
  realWorldScale?: boolean;
  fileSize?: string;
  version?: string;
};
export type Product = {
  slug: string;
  title: string;
  category: string;
  collection: string;
  description: string;
  dimensions: string;
  material: string;
  image: ImageAsset;
  /** Reference photography remains explicitly identified, including for assets. */
  imageRole?: 'reference' | 'model-render';
  asset: ProductAsset;
};
export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  description: string;
  image: ImageAsset;
  sections: { heading: string; body: string }[];
};
