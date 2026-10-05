import { and, asc, eq, max } from 'drizzle-orm';
import type { H3Event, MultiPartData } from 'h3';
import { z } from 'zod';
import type { Tx } from '../../db';
import type { Account } from '../../utils/accounts';
import type { StoredImage } from '../../utils/uploads';
import type { MoveDirection } from '#shared/utils/ordering';
import { movedOrder } from './ordering';

const PHOTOS_FOLDER = 'photos';

const photoInputSchema = z.object({
  title: z.string().trim().max(200).default(''),
  description: z.string().trim().max(2000).default(''),
});

const albumPhotoIdsInOrder = (tx: Tx, albumId: number): number[] =>
  tx
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, albumId))
    .orderBy(asc(schema.photos.sortOrder), asc(schema.photos.id))
    .all()
    .map((photo) => photo.id);

const nextSortOrder = (albumId: number): number => {
  const last = useDb()
    .select({ last: max(schema.photos.sortOrder) })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, albumId))
    .get()?.last;
  return (last ?? -1) + 1;
};

const storedPhoto = (photoId: number) =>
  foundOr404(
    useDb()
      .select({
        albumId: schema.photos.albumId,
        image: schema.photos.image,
        thumbnail: schema.photos.thumbnail,
      })
      .from(schema.photos)
      .where(eq(schema.photos.id, photoId))
      .get(),
    'ERRORS.PHOTO_NOT_FOUND',
  );

const insertPhoto = (albumId: number, stored: StoredImage, uploader: Account) =>
  useDb()
    .insert(schema.photos)
    .values({ ...stored, albumId, authorId: uploader.id, sortOrder: nextSortOrder(albumId) })
    .returning()
    .get();

const storedAlbum = (albumId: number) =>
  foundOr404(
    useDb()
      .select({
        id: schema.albums.id,
        slug: schema.albums.slug,
        title: schema.albums.title,
        coverImage: schema.albums.coverImage,
      })
      .from(schema.albums)
      .where(eq(schema.albums.id, albumId))
      .get(),
    'ERRORS.ALBUM_NOT_FOUND',
  );

export const listAlbumPhotos = (albumId: number) => {
  const album = storedAlbum(albumId);
  const photos = useDb()
    .select({
      id: schema.photos.id,
      title: schema.photos.title,
      description: schema.photos.description,
      thumbnail: schema.photos.thumbnail,
    })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, albumId))
    .orderBy(asc(schema.photos.sortOrder), asc(schema.photos.id))
    .all();
  return { album, photos };
};

export const uploadPhotos = async (event: H3Event, albumId: number, uploads: MultiPartData[], uploader: Account) => {
  const album = storedAlbum(albumId);
  const added = [];
  for (const upload of uploads) {
    const stored = await storeUploadedImage(event, upload, PHOTOS_FOLDER);
    added.push(insertPhoto(album.id, stored, uploader));
  }
  return added;
};

export const updatePhoto = (photoId: number, rawInput: unknown) => {
  const input = parseInput(photoInputSchema, rawInput);
  const updated = useDb()
    .update(schema.photos)
    .set(input)
    .where(eq(schema.photos.id, photoId))
    .returning({ id: schema.photos.id })
    .get();
  return foundOr404(updated, 'ERRORS.PHOTO_NOT_FOUND');
};

export const removePhoto = async (event: H3Event, photoId: number) => {
  const photo = storedPhoto(photoId);
  useDb().transaction((tx) => {
    tx.delete(schema.comments)
      .where(and(eq(schema.comments.targetKind, 'photo'), eq(schema.comments.targetId, photoId)))
      .run();
    tx.update(schema.albums)
      .set({ coverImage: null })
      .where(and(eq(schema.albums.id, photo.albumId), eq(schema.albums.coverImage, photo.thumbnail)))
      .run();
    tx.delete(schema.photos).where(eq(schema.photos.id, photoId)).run();
  });
  await removeStoredFiles(event, [photo.image, photo.thumbnail]);
};

export const setAlbumCover = (photoId: number) => {
  const photo = storedPhoto(photoId);
  useDb().update(schema.albums).set({ coverImage: photo.thumbnail }).where(eq(schema.albums.id, photo.albumId)).run();
};

export const movePhoto = (photoId: number, direction: MoveDirection) => {
  const photo = storedPhoto(photoId);
  useDb().transaction((tx) => {
    movedOrder(albumPhotoIdsInOrder(tx, photo.albumId), photoId, direction).forEach((id, sortOrder) => {
      tx.update(schema.photos).set({ sortOrder }).where(eq(schema.photos.id, id)).run();
    });
  });
};
