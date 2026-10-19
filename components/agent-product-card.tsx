"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductDetailsToolInvocation } from "@/lib/agent";

interface AgentProductCardProps {
  invocation: ProductDetailsToolInvocation;
}

type ProductDetails = NonNullable<
  Extract<
    ProductDetailsToolInvocation,
    { state: "output-available" }
  >["output"]["product"]
>;

function StockBadge({ stock }: { stock: ProductDetails["stock"] }) {
  if (!stock) return null;
  const label = !stock.inStock
    ? "Out of stock"
    : stock.lowStock
      ? `Only ${stock.quantity} left`
      : "In stock";
  return (
    <span
      className={`shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs ${
        stock.inStock ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

export function AgentProductCard({ invocation }: AgentProductCardProps) {
  if (
    invocation.state === "input-streaming" ||
    invocation.state === "input-available"
  ) {
    const id = invocation.input?.product;
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Looking up{id ? ` "${id}"` : ""}…
      </div>
    );
  }

  if (invocation.state === "output-error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Couldn&apos;t load product details.
      </div>
    );
  }

  if (invocation.state !== "output-available") return null;

  const output = invocation.output;

  if (!output) return null;

  if ("error" in output && output.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {output.error}
      </div>
    );
  }

  const { product, relatedProducts } = output;

  if (!product) return null;

  const image = product.images[0];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {image && (
        <Link
          href={product.url}
          className="relative block aspect-4/3 bg-secondary"
        >
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="448px"
            className="object-cover"
          />
        </Link>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {product.formattedPrice}
            </p>
          </div>
          <StockBadge stock={product.stock} />
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {product.description}
        </p>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <Link
          href={product.url}
          className="inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          View product →
        </Link>
      </div>
      {relatedProducts.length > 0 && (
        <div className="border-t border-border p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            You might also like
          </p>
          <div className="grid grid-cols-3 gap-2">
            {relatedProducts.map((related) => (
              <Link
                key={related.id}
                href={`/products/${related.slug}`}
                className="group block min-w-0"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
                  {related.image && (
                    <Image
                      src={related.image}
                      alt={related.name}
                      fill
                      sizes="128px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-1 truncate text-xs font-medium">
                  {related.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {related.formattedPrice}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
