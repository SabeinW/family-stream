import React from 'react';
import { ListVideo } from 'lucide-react';
import { api } from '../lib/api';

export default function PlaylistCover({ coverColor, thumbnails }) {
  const cells = [...thumbnails, null, null, null].slice(0, 4);
  return (
    <div
      className="aspect-video rounded-lg overflow-hidden relative grid grid-cols-2 grid-rows-2 gap-px"
      style={{ backgroundImage: `linear-gradient(135deg, rgb(${coverColor}), rgb(${coverColor} / 0.4))` }}
    >
      {cells.map((c, i) =>
        c ? (
          <img key={c.mediaId} src={api.thumbnailUrl(c.mediaId)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div key={i} />
        )
      )}
      {thumbnails.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ListVideo className="w-8 h-8 text-white/50" />
        </div>
      )}
    </div>
  );
}
