/** Sección Amazonlink: armados con sus links de Amazon + componentes recomendados. */

export type AmazonComponent = {
  /** Nombre del componente, ej. "Ryzen 5 5600" */
  name: string;
  /** Link de Amazon (puede ser sin tag; el tag se agrega al mostrar) */
  url: string;
  price?: number | null;
};

export type AmazonBuild = {
  id: string;
  /** Nombre del armado, ej. "ANTAS Nova — Gaming 1080p" */
  name: string;
  description?: string;
  images: string[];
  videos: string[];
  components: AmazonComponent[];
  createdAt: string;
  updatedAt: string;
};

export type AmazonProduct = {
  id: string;
  name: string;
  category?: string;
  image?: string;
  /** Link de Amazon del componente recomendado */
  url: string;
  price?: number | null;
  badge?: string;
  createdAt: string;
  updatedAt: string;
};

export type AmazonData = {
  /** Código de afiliado de Amazon Associates, ej. "antaspc-20" */
  tag: string;
  builds: AmazonBuild[];
  products: AmazonProduct[];
};
