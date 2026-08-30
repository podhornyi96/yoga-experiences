import { formatPrice, type Price } from "@/data/experiences";

export function PriceTag({
  price,
  className = "",
}: {
  price: Price;
  className?: string;
}) {
  return (
    <span className={`font-semibold text-forest ${className}`}>
      {formatPrice(price)}
    </span>
  );
}
