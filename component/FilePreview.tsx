import { extOf, isImageName, linkKind } from '@/lib/format';

/** Pratinjau satu pengumpulan: gambar bila ada, selain itu kotak warna dengan jenis berkas atau tautan. */
export default function FilePreview({
  fileName,
  url,
  link,
}: {
  fileName: string | null;
  url?: string;
  link: string | null;
}) {
  if (fileName && url && isImageName(fileName)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={`Pratinjau ${fileName}`} loading="lazy" />;
  }
  if (fileName) {
    return (
      <div className="file-tile c-lilac">
        <b>{extOf(fileName) || 'file'}</b>
        <span>{fileName}</span>
      </div>
    );
  }
  if (link) {
    return (
      <div className="file-tile c-sun">
        <b>{linkKind(link)}</b>
        <span>Tautan</span>
      </div>
    );
  }
  return (
    <div className="file-tile c-sun">
      <b>—</b>
      <span>Tanpa berkas</span>
    </div>
  );
}
