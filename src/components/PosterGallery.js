'use client';

import { useEffect, useState } from 'react';

export function PosterGallery({ images, title, subjects = [], locale = 'en' }) {
  const [lightbox, setLightbox] = useState(null);
  const ru = locale === 'ru';

  useEffect(() => {
    if (lightbox === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setLightbox(null);
      if (event.key === 'ArrowLeft') setLightbox((current) => (current - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setLightbox((current) => (current + 1) % images.length);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [images.length, lightbox]);

  return (
    <>
      <div className="poster-gallery">
        {images.map((src, index) => (
          <button key={src} type="button" className="poster-thumb" onClick={() => setLightbox(index)} aria-label={`${ru ? 'Открыть изображение' : 'Open image'} ${index + 1}`}>
            <img src={src} alt={`${title} - ${subjects[index] || `${ru ? 'изображение' : 'image'} ${index + 1}`}`} loading="lazy" width="1122" height="1402" />
            <span>{ru ? 'Увеличить' : 'View full image'}</span>
          </button>
        ))}
      </div>
      {lightbox !== null ? (
        <div className="image-lightbox open" role="dialog" aria-modal="true" aria-label={`${title} ${ru ? 'галерея' : 'gallery'}`} onClick={() => setLightbox(null)}>
          <button className="lightbox-close" type="button" aria-label={ru ? 'Закрыть' : 'Close'} onClick={() => setLightbox(null)}>&times;</button>
          <button className="lightbox-arrow lightbox-prev" type="button" aria-label={ru ? 'Предыдущее изображение' : 'Previous image'} onClick={(event) => { event.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}>&lt;</button>
          <div className="lightbox-stage" onClick={(event) => event.stopPropagation()}>
            <img src={images[lightbox]} alt={`${title} - ${subjects[lightbox] || `${ru ? 'изображение' : 'image'} ${lightbox + 1}`}`} />
            <div className="lightbox-counter">{lightbox + 1} / {images.length}</div>
          </div>
          <button className="lightbox-arrow lightbox-next" type="button" aria-label={ru ? 'Следующее изображение' : 'Next image'} onClick={(event) => { event.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}>&gt;</button>
        </div>
      ) : null}
    </>
  );
}
