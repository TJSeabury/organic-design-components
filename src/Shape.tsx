import React, { useRef, useEffect, useState } from 'react';

interface ShapeProps {
  imageUrl: string;
  width?: number | string;
  height?: number | string;
  float?: 'left' | 'right' | 'none';
  shapeMargin?: number | string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Shape: React.FC<ShapeProps> = ({
  imageUrl,
  width = 'auto',
  height = 'auto',
  float = 'left',
  shapeMargin = 0,
  className = '',
  style = {},
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shapeBlobUrl, setShapeBlobUrl] = useState<string | null>(null);

  // Create canvas blob for shape-outside
  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || !imageLoaded) return;

    const createShapeBlob = () => {
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      if (containerWidth <= 0 || containerHeight <= 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Draw the image to the canvas at the container size
      ctx.drawImage(image, 0, 0, containerWidth, containerHeight);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Revoke previous blob URL if it exists
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          setShapeBlobUrl(blobUrl);
        }
      }, 'image/png');
    };

    createShapeBlob();
    
    const resizeObserver = new ResizeObserver(createShapeBlob);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageLoaded, width, height, imageUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    float,
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    shapeOutside: shapeBlobUrl ? `url(${shapeBlobUrl})` : 'none',
    shapeMargin: typeof shapeMargin === 'number' ? `${shapeMargin}px` : shapeMargin,
    backgroundColor: 'white',
    //backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    maskImage: shapeBlobUrl ? `url(${shapeBlobUrl})` : 'none',
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: shapeBlobUrl ? `url(${shapeBlobUrl})` : 'none',
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    ...style,
  };

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt=""
        style={{ display: 'none' }}
        onLoad={() => setImageLoaded(true)}
      />
      {children}
    </div>
  );
};

