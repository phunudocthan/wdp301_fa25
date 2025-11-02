import React, { useEffect } from 'react';

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

const ImageModal: React.FC<Props> = ({ src, alt = '', onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="image-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close image" className="image-modal-close" onClick={onClose}>✕</button>
        <img src={src} alt={alt} />
      </div>
    </div>
  );
};

export default ImageModal;
