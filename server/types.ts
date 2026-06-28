import { Prisma } from "@prisma/client";

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
