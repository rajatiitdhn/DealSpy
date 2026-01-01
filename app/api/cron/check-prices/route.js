import { sendPriceDropAlert } from "@/lib/email";
import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronsecret = process.env.CRON_SECRET;

    if (!cronsecret || authHeader !== `Bearer ${cronsecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //Use service role to bypass RLS

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");
    if (productsError) {
      throw productsError;
    }
    console.log(`Found ${products.length} products to check prices for.`);

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);
        if (!productData.currentPrice) {
          results.failed += 1;
          continue;
        }
        const newPrice = parseFloat(productData.currentPrice);
        const oldPrice = parseFloat(product.current_price);

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currencyCode || product.currency,
            name: productData.productName || product.name,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (oldPrice !== newPrice) {
          await supabase.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency: productData.currencyCode || product.currency,
          });
          results.priceChanges += 1;
          if (newPrice < oldPrice) {
            // Send alert
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);
            if (user?.email) {
              // Send email alert
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice
              );
                if (emailResult.success) {
                    results.alertsSent += 1;
                }
            }
          }
        }
        results.updated += 1;
      } catch (error) {
        console.error(`Failed to update product ID ${product.id}:`, error);
        results.failed += 1;
      }
    }
    return NextResponse.json({
      success: true,
      message: "Price check completed",
      results,
    });
  } catch (error) {
    console.error("Cron price check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
