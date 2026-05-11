export default function Logo({ size = 48 }) {
  return (
    <img
      src="/logo.png"
      alt="ReQurilish"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
