import { notFound } from "next/navigation";
import { ShelfPage } from "@/features/public-profile/shelf-page";
import { getPublicShelf, getSharedPublicShelvesDatabase } from "@/features/shelves/service";

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
        readonly share?: string;
      }>
    | {
        readonly share?: string;
      };
}

export default async function PublicShelfRoute({ params, searchParams }: ShelfRouteProps) {
  const { creatorHandle, shelfId } = await params;
  const search = searchParams ? await searchParams : {};
  const result = getPublicShelf(getSharedPublicShelvesDatabase(), {
    creatorHandle,
    shelfId,
  });

  if (!result.ok) {
    notFound();
  }

  return <ShelfPage shareCode={search.share} shelf={result.shelf} />;
}
