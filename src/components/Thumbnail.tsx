import { useState, type ImgHTMLAttributes } from "react";

export default function Thumbnail({ src, onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState<string[]>([]);
  // Standalone HTML has no relay: try the Archive's other public thumbnail URL once.
  const direct = src?.match(/^https:\/\/archive\.org\/services\/img\/([^/?#]+)$/);
  const candidates = [src, direct && `https://archive.org/download/${direct[1]}/__ia_thumb.jpg`];
  const image = candidates.find((url): url is string => !!url && !failed.includes(url));
  return image ? (
    <img {...props} onLoad={onLoad} src={image} onError={() => setFailed(prev => [...prev.slice(-2), image])} />
  ) : (
    <span className="px-1 text-center text-[10px] text-mute">No preview available</span>
  );
}
