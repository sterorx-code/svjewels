import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// ── Helpers ───────────────────────────────────────────────────────
function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); }
  catch { return []; }
}

function writeOrders(orders) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// ── Middleware & Static ───────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'product.html'));
});

app.get('/cartier', (req, res) => res.sendFile(path.join(__dirname, 'collection.html')));
app.get('/ap',      (req, res) => res.sendFile(path.join(__dirname, 'collection.html')));
app.get('/rolex',   (req, res) => res.sendFile(path.join(__dirname, 'collection.html')));

app.get('/reviews', (req, res) => res.sendFile(path.join(__dirname, 'reviews.html')));

app.get('/order-complete', (req, res) => {
  res.sendFile(path.join(__dirname, 'order-complete.html'));
});

// ── SEO ───────────────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  const base = 'https://svvjewels.shop';
  const today = new Date().toISOString().split('T')[0];
  const staticUrls = [
    { loc: `${base}/`,        priority: '1.0', changefreq: 'weekly' },
    { loc: `${base}/cartier`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${base}/ap`,      priority: '0.9', changefreq: 'weekly' },
    { loc: `${base}/rolex`,   priority: '0.9', changefreq: 'weekly' },
    { loc: `${base}/reviews`, priority: '0.8', changefreq: 'weekly' },
  ];
  const productIds = Array.from({ length: 38 }, (_, i) => i + 1);
  const productUrls = productIds.map(id => ({
    loc: `${base}/product/${id}`, priority: '0.7', changefreq: 'monthly',
  }));
  const all = [...staticUrls, ...productUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    all.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')
  }\n</urlset>`;
  res.set('Content-Type', 'application/xml').send(xml);
});

// ── POST /api/checkout ────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  const { firstName, lastName, email, phone, address, city, state, zip, country, product } = req.body;

  if (!email || !firstName || !lastName || !product) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const orderId = `SV-${Date.now()}`;
  const order = {
    id: orderId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    customer: { firstName, lastName, email, phone },
    shipping: { address, city, state, zip, country },
    product,
  };

  const orders = readOrders();
  orders.push(order);
  writeOrders(orders);

  console.log(`[Order] ${orderId} — ${product.title} — ${email}`);

  const whopPlanId = product.whopPlanId || null;
  res.json({ success: true, orderId, whopPlanId });
});

// ── POST /api/cart-checkout ───────────────────────────────────────
app.post('/api/cart-checkout', async (req, res) => {
  const { firstName, lastName, email, phone, address, city, state, zip, country, items } = req.body;

  if (!email || !firstName || !lastName || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsePrice = s => parseFloat((s || '0').replace(/[^0-9.]/g, '')) || 0;
  const total = items.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0);

  const orderId = `SV-${Date.now()}`;
  const order = {
    id: orderId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    customer: { firstName, lastName, email, phone },
    shipping: { address, city, state, zip, country },
    items,
    total: `$${total.toFixed(2)}`,
  };

  const orders = readOrders();
  orders.push(order);
  writeOrders(orders);

  console.log(`[Cart Order] ${orderId} — ${items.length} item(s) — $${total.toFixed(2)} — ${email}`);

  // Single item, single unit → use the product's fixed plan ID (no API call needed)
  const singleItem = items.length === 1 && items[0].qty === 1;
  if (singleItem && items[0].whopPlanId) {
    return res.json({ success: true, orderId, whopPlanId: items[0].whopPlanId });
  }

  // Multi-item or qty > 1 → create a dynamic Whop checkout session for the exact total
  if (process.env.WHOP_API_KEY && process.env.WHOP_COMPANY_ID) {
    try {
      const totalInCents = Math.round(total * 100);
      const whopRes = await fetch('https://api.whop.com/api/v5/checkout_configurations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: process.env.WHOP_COMPANY_ID,
          plan: { base_currency_price: totalInCents, billing_period: null },
          metadata: { order_id: orderId, email, item_count: items.length },
        }),
      });
      const session = await whopRes.json();
      if (session.id) {
        order.whopSessionId = session.id;
        writeOrders(orders);
        return res.json({
          success: true,
          orderId,
          whop: { sessionId: session.id, planId: session.plan_id ?? session.plan?.id ?? null },
        });
      }
      console.error('[Whop] Unexpected cart checkout response:', JSON.stringify(session));
    } catch (err) {
      console.error('[Whop] Cart checkout error:', err.message);
    }
  }

  res.json({ success: true, orderId });
});

// ── GET /api/orders (admin) ───────────────────────────────────────
app.get('/api/orders', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(readOrders());
});

// ── POST /api/whop/webhook ────────────────────────────────────────
app.post('/api/whop/webhook', express.raw({ type: '*/*' }), (req, res) => {
  if (process.env.WHOP_WEBHOOK_SECRET) {
    const sig = req.headers['x-whop-signature'] ?? req.headers['whop-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.WHOP_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');
    if (sig !== expected && sig !== `sha256=${expected}`) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (event.action === 'payment.succeeded') {
    const orderId = event.data?.metadata?.order_id;
    if (orderId) {
      const orders = readOrders();
      const order = orders.find(o => o.id === orderId);
      if (order) {
        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        order.whopPaymentId = event.data.id;
        writeOrders(orders);
        console.log(`[Whop] Order ${orderId} marked as paid`);
      }
    }
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`\n  ◆ SV Jewels — http://localhost:${PORT}\n`);
});
