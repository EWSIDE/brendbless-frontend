/**
 * Тип товара — готов для приёма данных с бэкенда.
 * Все поля опциональны на случай, если бэк отдаёт неполные объекты.
 */
export type Product = {
  id: string; // CUID from Prisma is a string
  name: string;
  price: number;
  oldPrice?: number; // зачёркнутая цена (если есть скидка)
  category: string;
  description: string;
  sizes: string[]; // размеры: S, M, L, XL и т.д.
  imageUrl?: string; // URL фото с бэкенда
  available?: boolean; // в наличии
};

/**
 * Пустой массив — товары будут загружаться с бэкенда.
 */
export const products: Product[] = [];
