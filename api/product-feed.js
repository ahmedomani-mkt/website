// Meta Commerce Catalog product feed — CSV, generated live from Supabase
// ao_products on every request (no static/manually-edited file). Public,
// unauthenticated GET, matching the same anon key already embedded in
// every public HTML page (safe: RLS enforces public-read/admin-write —
// see claude.md → Security Notes).
//
// Meta fetches this URL on a schedule (Commerce Manager → Catalog →
// Data Sources → scheduled feed) — see claude.md for setup steps.

const SB_URL = 'https://lhunamvderddsplishtg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodW5hbXZkZXJkZHNwbGlzaHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTEzNzMsImV4cCI6MjA5ODE2NzM3M30.AUjhZ4Qtw3hfX-HCIlsdAJpzSutW-GxjQ0D9S11W0vw';
const DEFAULT_BRAND = 'Ahmed Omani Auto Marketing';

const CATALOG_LABEL = { ads: 'كتالوج الدعاية والإعلان', marketing: 'كتالوج التسويق' };
const CATEGORY_LABEL = {
  signage: 'يافطات وواجهات', print: 'مطبوعات', uniform: 'يوني فورم',
  accessories: 'اكسسوارات', digital: 'خدمات رقمية', branding: 'هوية بصرية', general: 'عام',
};

function csvField(v) {
  var s = v === null || v === undefined ? '' : String(v);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function csvRow(fields) {
  return fields.map(csvField).join(',') + '\r\n';
}

async function sbGet(path) {
  var res = await fetch(SB_URL + path, {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
  });
  if (!res.ok) throw new Error('Supabase ' + path + ' -> HTTP ' + res.status);
  return res.json();
}

module.exports = async function handler(req, res) {
  try {
    var host = req.headers['x-forwarded-host'] || req.headers.host;
    var origin = 'https://' + host;

    var settingsRows = await sbGet('/rest/v1/ao_settings?select=site_title&id=eq.1');
    var brand = (settingsRows[0] && settingsRows[0].site_title && settingsRows[0].site_title.trim()) || DEFAULT_BRAND;

    var products = await sbGet(
      '/rest/v1/ao_products?select=id,title,description,catalog,category,image_url,images,price,price_note,is_active'
      + '&is_active=eq.true&order=sort_order.asc'
    );

    var header = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'additional_image_link', 'brand', 'product_type'];
    var body = csvRow(header);
    var included = 0, skippedNoPrice = 0, skippedNoImage = 0;

    products.forEach(function (p) {
      var price = p.price === null || p.price === undefined ? NaN : parseFloat(p.price);
      if (isNaN(price) || price <= 0) { skippedNoPrice++; return; }
      if (!p.image_url) { skippedNoImage++; return; }

      var extraImages = Array.isArray(p.images)
        ? p.images.filter(function (u, i, arr) { return u && u !== p.image_url && arr.indexOf(u) === i; })
        : [];
      var productType = [CATALOG_LABEL[p.catalog] || p.catalog, CATEGORY_LABEL[p.category] || p.category].filter(Boolean).join(' > ');

      body += csvRow([
        p.id,
        p.title || '',
        (p.description || '').replace(/[\r\n]+/g, ' ').trim(),
        'in stock',
        'new',
        price.toFixed(2) + ' EGP',
        origin + '/product.html?id=' + p.id,
        p.image_url,
        extraImages.slice(0, 10).join(','),
        brand,
        productType,
      ]);
      included++;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="product-feed.csv"');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
    res.setHeader('X-Feed-Included', String(included));
    res.setHeader('X-Feed-Skipped-No-Price', String(skippedNoPrice));
    res.setHeader('X-Feed-Skipped-No-Image', String(skippedNoImage));
    res.status(200).send(body);
  } catch (err) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(502).send('Feed generation failed: ' + (err && err.message ? err.message : String(err)));
  }
};
