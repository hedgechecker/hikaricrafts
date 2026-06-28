import {
  Prisma,
  type OptionValue,
  type Option,
  type Product,
  type Image,
  type ProductOption,
  type ProductVariation,
  type ProductVariationOptionValue,
  type Review,
} from "@prisma/client";

export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        verified: true;
      };
    };
  };
}>;

export interface FullVariation extends ProductVariation {
  images: Image[];
  optionValues: (ProductVariationOptionValue & {
    optionValue: OptionValue & {
      option: Option;
    };
  })[];
}

export interface FullProduct extends Product {
  productOptions: (ProductOption & {
    option: Option & {
      values: OptionValue[];
    };
  })[];
  variations: FullVariation[];
  reviews : Review[];
}
