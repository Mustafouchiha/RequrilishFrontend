// src prop berilsa — o'sha rasm, berilmasa — bo'sh oq joy
export default function Logo({ size = 48, src }) {
  if (!src) {
    return <div style={{ width: size, height: size }} />;
  }
  return (
    <img
      src={src}
      alt="ReQurilish"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
