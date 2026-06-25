import { notFound } from "next/navigation";
import { ShelfPage } from "@/features/public-profile/shelf-page";
import {
  getPublicShelf,
  getSharedPublicShelvesDatabase,
  validatePublicShareCode,
} from "@/features/shelves/service";

interface ShelfRouteProps {
  readonly params:
    | Promise<{
        readonly creatorHandle: string;
        readonly shelfId: string;
      }>
    | {
        readonly creatorHandle: string;
        readonly shelfId: string;
      };
  readonly searchParams?:
    | Promise<{
        readonly share?: string | string[];
      }>
    | {
        readonly share?: string | string[];
      };
}

export default async function PublicShelfRoute({ params, searchParams }: ShelfRouteProps) {
  const { creatorHandle, shelfId } = await params;
  const search = searchParams ? await searchParams : {};
  const database = getSharedPublicShelvesDatabase();
  const result = getPublicShelf(database, {
    creatorHandle,
    shelfId,
  });

  if (!result.ok) {
    notFound();
  }

  const shareCode = validatePublicShareCode(database, {
    shelfId: result.shelf.id,
    shareCode: search.share,
  });

  return <ShelfPage shareCode={shareCode ?? undefined} shelf={result.shelf} />;
}
