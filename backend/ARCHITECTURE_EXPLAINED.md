# دليل السوفتوير أركيتكت — شرح كل حاجة من الصفر
## مشروع Goodsandu Backend

> اللهجة: مصري + تقني. الهدف: تفهم مش تحفظ.

---

## الفهرس

1. [الصورة الكبيرة — إيه اللي بيحصل لما يجي Request؟](#1-الصورة-الكبيرة)
2. [Redis — ليه وإزاي؟](#2-redis--ليه-وإزاي)
3. [نظام الـ Cart — Redis-First Architecture](#3-نظام-الـ-cart)
4. [Inventory Lock System — أذكى حاجة في المشروع](#4-inventory-lock-system)
5. [Checkout Flow — من البداية للنهاية](#5-checkout-flow)
6. [Payment Strategy Pattern — Design Pattern حقيقي](#6-payment-strategy-pattern)
7. [Webhook Idempotency — الضمانة ضد التكرار](#7-webhook-idempotency)
8. [Event-Driven System — النوتيفيكيشنز والـ Events](#8-event-driven-system)
9. [JWT + Refresh Token Rotation — الـ Auth System](#9-jwt--refresh-token-rotation)
10. [Google OAuth One-Time Code — الـ Fix اللي اتعمل](#10-google-oauth-one-time-code)
11. [Global Interceptors — Currency + Translation](#11-global-interceptors)
12. [Order FSM — State Machine للأوردر](#12-order-fsm)
13. [Home Page Caching — Cache-Aside Pattern](#13-home-page-caching)
14. [الـ Senior Mindset — إزاي تفكر زي أركيتكت](#14-الـ-senior-mindset)

---

## 1. الصورة الكبيرة

قبل أي حاجة، خليني أوريلك إيه اللي بيحصل لما أي Request بيوصل للـ server:

```
المستخدم يبعت Request
        ↓
[ CORS Check ] — هل الـ origin مسموح؟
        ↓
[ CookieParser ] — بيحلل الـ cookies (عشان الـ refreshToken)
        ↓
[ ValidationPipe ] — بيتأكد إن الـ DTO صح
        ↓
[ TranslationInterceptor ] — بيحول { ar: "...", en: "..." } للغة المطلوبة
        ↓
[ CurrencyInterceptor ] — بيحول الأسعار من جنيه للعملة المطلوبة
        ↓
[ JwtAuthGuard ] — بيتحقق من الـ access token
        ↓
[ RolesGuard ] — هل الـ user عنده الـ role الصح؟
        ↓
[ Controller ] — بيستقبل الـ request ويبعته للـ Service
        ↓
[ Service ] — Business Logic
        ↓
[ Prisma / Redis ] — قاعدة البيانات
        ↓
الـ Response يرجع بنفس الترتيب بالعكس
```

**المهم:** الـ Interceptors بيشتغلوا على الـ Response وهو راجع. يعني:
- الـ CurrencyInterceptor بيمسك الـ response كله ويحول كل رقم اسمه "price" أو "total" إلخ.
- الـ TranslationInterceptor بيمسك كل object فيه `{ ar, en }` ويحطلك اللغة المطلوبة بس.

---

## 2. Redis — ليه وإزاي؟

### إيه هو Redis؟

Redis هو **database بس في الـ RAM** (الميموري). ده معناه:
- قراءة وكتابة بالـ **microseconds** (مش milliseconds زي Postgres)
- لو الـ server وقع، **البيانات اتمسحت** (إلا لو عملت persistence)
- **مش مناسب** لبيانات مهمة زي الأوردرات والمستخدمين

### إمتى نستخدم Redis في المشروع ده؟

| الاستخدام | السبب |
|-----------|-------|
| الـ Cart | عايزين read/write سريع جداً — المستخدم بياخد الـ cart كل شوية |
| Inventory Locks | محتاجين نحجز ستوك بسرعة لـ 15 دقيقة |
| Exchange Rates | محتاجين نحوّل عملة على كل request — لازم تبقى O(1) |
| Home Cache | الـ home بياخد 19 query — كاشيها 60 ثانية |
| Mega Menu | الـ category tree بياخد 3 queries — كاشيه ساعة |
| OAuth Codes | كود مرة واحدة بـ TTL 30 ثانية |

### الأوامر الأساسية اللي بنستخدمها:

```typescript
// SET — خزّن قيمة مع TTL (بتتمسح أوتوماتيك)
await redis.set('key', 'value', 'EX', 3600); // بتتمسح بعد ساعة

// GET — جيب القيمة
const val = await redis.get('key');

// DEL — امسحها
await redis.del('key');

// HSET — Hash: زي object بس في Redis
await redis.hset('myhash', 'field1', 'value1');

// HGETALL — جيب كل الـ hash دفعة واحدة
const obj = await redis.hgetall('myhash');
// بيرجع { field1: 'value1', field2: 'value2' }

// HDEL — امسح field معين من الـ hash
await redis.hdel('myhash', 'field1');

// MGET — جيب كذا key دفعة واحدة (round-trip واحد!)
const values = await redis.mget('key1', 'key2', 'key3');
```

---

## 3. نظام الـ Cart

### الفكرة الكبيرة: Redis-First

الـ Cart مش بيتحفظ في Postgres أولاً — بيتحفظ في **Redis أولاً**. ليه؟

لأن المستخدم ممكن:
- يضيف item
- يشيل item
- يغير الكمية
- يشوف الـ cart

كل ده بيحصل بسرعة عالية جداً. لو كنا بنكتب في Postgres كل مرة، كنا هنضغط عليه جداً.

### شكل الـ Cart في Redis

```typescript
// الـ key في Redis: "cart:user:{userId}"
// القيمة (JSON string):
{
  "items": {
    "variant-uuid-1": {
      "variantId": "variant-uuid-1",
      "quantity": 2,
      "priceSnapshot": 15000,  // السعر لما اتضاف بالسنت
      "addedAt": "2024-01-01T00:00:00Z"
    },
    "variant-uuid-2": {
      "variantId": "variant-uuid-2",
      "quantity": 1,
      "priceSnapshot": 30000,
      "addedAt": "2024-01-01T00:05:00Z"
    }
  },
  "promoCode": "SUMMER20"
}
```

لاحظ إن الـ `items` هو **object مش array** — ده عشان نوصل لأي item بالـ variantId في O(1) من غير ما نعمل loop.

### إيه هو الـ priceSnapshot ولماذا؟

لما المستخدم يضيف item، بنحفظ السعر **وقت الإضافة**. لو السعر اتغير بعدين، الـ cart بيظهرله alert إن السعر اتغير:

```typescript
// في CartService.getHydratedCart
if (effectivePrice !== cachedItem.priceSnapshot) {
  const trend = effectivePrice < cachedItem.priceSnapshot ? 'dropped' : 'increased';
  
  alerts.push({
    type: 'PRICE_CHANGED',
    message: { en: `Price ${trend}...` }
  });
}
```

### الـ Guest Cart

المستخدم قبل ما يعمل Login عنده cart كـ guest. الـ key بتاعته:
- Guest: `cart:session:{sessionId}` — بتتمسح بعد 7 أيام
- User: `cart:user:{userId}` — بتتمسح بعد 30 يوم

لما اليوزر يعمل Login، الكارت بتاعه كـ guest بتتدمج مع الكارت بتاعه كـ user:

```typescript
// في CartService.syncGuestCart
async syncGuestCart(userId: string, guestSessionId: string) {
  const guestCart = await this.cartRepository.getCart(guestSessionId, true);
  const userCart  = await this.cartRepository.getCart(userId, false);

  // دمج: لو نفس الـ variant موجود، جمّع الكميات
  for (const [variantId, guestItem] of Object.entries(guestCart.items)) {
    if (userCart.items[variantId]) {
      userCart.items[variantId].quantity += guestItem.quantity;
    } else {
      userCart.items[variantId] = guestItem;
    }
  }

  // احفظ الـ merged cart وامسح الـ guest cart
  await this.cartRepository.setCart(userId, userCart, false);
  await this.cartRepository.deleteCart(guestSessionId, true);
}
```

### الـ Hydrated Cart — إيه ده؟

الـ "raw cart" في Redis عبارة عن variant IDs وكميات بس. الـ "hydrated cart" بيضيف:
- اسم المنتج
- الصورة
- السعر الحالي من الـ DB
- هل في ستوك؟
- الـ attributes (لون، مقاس إلخ)

```typescript
async getHydratedCart(id: string, isGuest: boolean) {
  // 1. جيب الـ raw cart من Redis (fast)
  const rawCart = await this.cartRepository.getCart(id, isGuest);
  
  // 2. جيب تفاصيل الـ variants من Postgres (دفعة واحدة)
  const dbVariants = await this.prisma.variant.findMany({
    where: { id: { in: Object.keys(rawCart.items) } },
    include: { product: true }
  });
  
  // 3. جيب الـ locks دفعة واحدة (مش loop!)
  const lockResults = await Promise.all(
    dbVariants.map(v => this.lockService.getTotalLockedQuantity(v.id, userId))
  );
  
  // 4. احسب True Available = stockQuantity - locked by others
  // ...
}
```

---

## 4. Inventory Lock System — أذكى حاجة في المشروع

### المشكلة اللي بيحلها

تخيل عندك **منتج واحد** و**100 مستخدم** بيحاولوا يشتروه في نفس الوقت. لو مسمحتش بحجز مؤقت:

```
User A يشوف: Stock = 1 ✅
User B يشوف: Stock = 1 ✅
User A يشتري → Stock = 0
User B يشتري → Stock = -1 ❌ (overselling!)
```

### الحل: Optimistic Locking في Redis

لما اليوزر يبدأ الـ Checkout، بنحجزله الستوك في Redis لـ 15 دقيقة. لو ما دفعش، الحجز بيتمسح أوتوماتيك.

### شكل الـ Keys في Redis

```
inventory:lock:v:{variantId}:u:{userId} = quantity  (مع TTL 15 دقيقة)
inventory:lock:index:v:{variantId}      = { userId1: 1, userId2: 1, ... }  (الـ index)
```

### ليه بنستخدم اتنين Keys؟

**الـ individual key** عشان الـ TTL — Redis يعرف يمسحه أوتوماتيك لما الوقت ينتهي.

**الـ index hash** عشان نعرف مين كل اللي عندهم locks على نفس الـ variant من غير ما نعمل SCAN.

```
لو عندنا:
inventory:lock:v:ABC:u:USER1 = 2  (TTL: 14 دقيقة)
inventory:lock:v:ABC:u:USER2 = 1  (TTL: 12 دقيقة)
inventory:lock:index:v:ABC   = { USER1: 1, USER2: 1 }

لما نيجي نحسب إجمالي الـ locked:
1. HGETALL inventory:lock:index:v:ABC → [USER1, USER2]
2. MGET inventory:lock:v:ABC:u:USER1, inventory:lock:v:ABC:u:USER2
   → [2, 1]  (round-trip واحد!)
3. الـ total = 2 + 1 = 3
```

### ليه ده أحسن من SCAN؟

الـ SCAN القديم كان بيعمل كده:

```typescript
// ❌ الطريقة القديمة — SCAN بيمشي على كل الـ Redis keyspace
let cursor = '0';
do {
  const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `inventory:lock:v:${variantId}:u:*`);
  cursor = newCursor;
  // process keys...
} while (cursor !== '0');
```

**المشكلة:** SCAN بيمشي على **كل الـ keys في Redis** مش بس اللي عايزاها. لو عندك مليون key، كل عملية SCAN بتمشي على مليون key!

الطريقة الجديدة:

```typescript
// ✅ الطريقة الجديدة — HGETALL + MGET (O(1) للـ index)
const index = await redis.hgetall(`inventory:lock:index:v:${variantId}`);
const userIds = Object.keys(index);
const values = await redis.mget(...userIds.map(uid => `inventory:lock:v:${variantId}:u:${uid}`));
// جيب كل القيم بـ round-trip واحد!
```

### إيه اللي بيحصل لما TTL ينتهي؟

لو USER1 مدفعش في 15 دقيقة، الـ Redis بيمسح `inventory:lock:v:ABC:u:USER1` أوتوماتيك.

لكن الـ index `inventory:lock:index:v:ABC` لسه فيه `USER1: 1`. ده اسمه **stale entry**.

الحل اللي عملناه: **Lazy Cleanup** — لما نيجي نحسب الـ total, لو MGET رجّعت `null` لـ key معين، يبقى الـ lock انتهى وبنمسح الـ userId من الـ index:

```typescript
values.forEach((val, i) => {
  if (val === null) {
    // الـ TTL انتهى — بنمسح من الـ index بدون ما نبلوك الـ caller
    expiredUserIds.push(userIds[i]);
  } else {
    total += parseInt(val, 10);
  }
});

if (expiredUserIds.length > 0) {
  // fire-and-forget — مش بنستناها
  redis.hdel(indexKey, ...expiredUserIds).catch(() => {});
}
```

---

## 5. Checkout Flow — من البداية للنهاية

### الخطوات الكاملة

```
POST /checkout/initiate
        ↓
POST /checkout/pay
        ↓
[Webhook من Stripe/Kashier يوصل]
        ↓
[Order تبقى CONFIRMED + Stock ينزل]
```

### المرحلة الأولى: Initiate

```typescript
async initiateCheckout(userId: string) {
  // 1. جيب الـ cart وتأكد إن فيه items
  const cart = await this.cartService.getHydratedCart(userId, false);
  if (cart.items.length === 0) throw new BadRequestException('Cart is empty');

  // 2. تأكد إن كل item عنده ستوك كافي
  this.validateCartStock(cart);

  // 3. شوف لو في locks موجودة خلينا نستخدم أقل TTL
  // (عشان ما نعملش reset للـ lock لو اليوزر عمل initiate تاني)
  const existingTtls = await Promise.all(
    cart.items.map(item => this.lockService.getLockTTL(item.variantId, userId))
  );
  const validTtls = existingTtls.filter(t => t !== null);
  
  // لو كل الـ items معملهم lock خليني اخد أقل TTL
  const ttl = validTtls.length === cart.items.length 
    ? Math.min(...validTtls) 
    : 15 * 60; // افتراضي 15 دقيقة

  // 4. عمل Lock على كل items بالتوازي
  await Promise.all(
    cart.items.map(item => 
      this.lockService.lock(item.variantId, userId, item.quantity, ttl)
    )
  );
}
```

### المرحلة التانية: Pay

```typescript
async processCheckoutPay(userId, dto, guestSessionId) {
  // 1. جيب الـ cart من جديد (ممكن اتغير)
  const cart = await this.cartService.getHydratedCart(userId, false);
  
  // 2. تحقق من الستوك مرة تانية (race condition protection)
  this.validateCartStock(cart);

  // 3. تحقق من الـ Locks — لو انتهت إمكانية Recovery
  await this.verifyAndRecoverLocks(userId, cart);

  // 4. جيب اليوزر والعنوان معاً (parallel!)
  const [user, address] = await Promise.all([
    this.prisma.user.findUnique({ where: { id: userId } }),
    this.prisma.address.findFirst({ where: { id: dto.addressId, userId } }),
  ]);

  // 5. احسب الشحن
  const shippingInfo = await this.shippingService.calculateShipping(userId, dto.addressId, address);

  // 6. إنشاء Order بحالة PENDING
  const order = await this.createPendingOrder(userId, cart, shippingInfo.shippingFee, ...);

  // 7. جيب الـ Payment Strategy المناسبة وابعت Payment Intent
  const strategy = this.paymentStrategyResolver.getStrategy(dto.paymentGateway);
  const paymentResponse = await strategy.createPaymentIntent(order, user, order.total, order.currency);

  // 8. لو COD: confirm فوراً + نزّل الستوك
  if (dto.paymentGateway === PaymentGateway.COD) {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });
      await decrementStockForOrderItems(tx, order.items);
      await tx.orderStatusLog.create({ ... });
    });
    // release الـ locks
    // ابعت notification للأدمن
  }

  // 9. امسح الـ cart
  await this.clearCartsAfterOrder(userId, guestSessionId);

  return { orderId, orderNumber, total, payment: paymentResponse };
}
```

### الـ verifyAndRecoverLocks — الـ Recovery Pattern

ده السيناريو اللي بيحصل:
1. اليوزر عمل Initiate (حجز الستوك لـ 15 دقيقة)
2. فضل 20 دقيقة في صفحة الدفع ← الـ lock انتهى!
3. عمل Pay

بدل ما نرجعله Error، بنحاول نعمل **recovery**:

```typescript
async verifyAndRecoverLocks(userId, cart) {
  // 1. شوف مين من الـ items ماعندوش lock أو lock بكمية أقل
  const existingLocks = await Promise.all(
    variantIds.map(vid => this.lockService.getLock(vid, userId))
  );
  
  const missingLockVariantIds = cart.items.filter(item => {
    const lockQty = lockStatusMap.get(item.variantId);
    return lockQty === null || lockQty < item.quantity; // مفيش lock أو الكمية أقل
  }).map(item => item.variantId);

  if (missingLockVariantIds.length === 0) return; // كل شيء تمام

  // 2. تحقق من الـ DB: هل لسه في ستوك؟
  const [dbVariants, totalLocks] = await Promise.all([
    this.prisma.variant.findMany({ where: { id: { in: missingLockVariantIds } } }),
    Promise.all(missingLockVariantIds.map(vid => this.lockService.getTotalLockedQuantity(vid, userId)))
  ]);

  // 3. لو في ستوك → أعمل lock من جديد
  // لو مفيش → throw ConflictException
}
```

### الـ Flash Sale Enforcement

ده الكود اللي اضفناه داخل الـ transaction بتاع `createPendingOrder`:

```typescript
// لكل item في الـ cart:
const flashSaleItem = await tx.flashSaleItem.findFirst({
  where: {
    productId: item.productId,
    flashSale: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now }
    }
  }
});

if (flashSaleItem) {
  // 1. تأكد إن اليوزر ما اشتراش أكتر من الـ maxPerUser
  const alreadyPurchased = await tx.orderItem.aggregate({
    where: { 
      order: { userId, status: { not: 'CANCELLED' } },
      variant: { productId: item.productId }
    },
    _sum: { quantity: true }
  });
  
  if ((alreadyPurchased._sum.quantity || 0) + item.quantity > flashSaleItem.maxPerUser) {
    throw new ConflictException('Purchase limit exceeded');
  }

  // 2. Atomic Update: نزّل الـ soldQuantity بس لو في ستوك
  const updatedRows = await tx.$executeRaw`
    UPDATE "FlashSaleItem"
    SET "soldQuantity" = "soldQuantity" + ${item.quantity}
    WHERE "id" = ${flashSaleItem.id}
      AND "soldQuantity" + ${item.quantity} <= "stockLimit"
  `;

  // لو مفيش rows اتعملت UPDATE = الستوك خلص
  if (updatedRows === 0) {
    throw new ConflictException('Flash sale stock limit reached');
  }
}
```

**ليه ده Atomic؟** لأن الـ `WHERE` و الـ `SET` بيتنفذوا في عملية واحدة في الـ database. مفيش race condition ممكن يحصل بين "التحقق" و"التحديث".

---

## 6. Payment Strategy Pattern

### إيه هو الـ Strategy Pattern؟

تخيل عندك وظيفة "ادفع" — لكن ممكن تدفع بـ Stripe، Kashier، أو COD. كل واحد ليه طريقة مختلفة.

بدل ما تكتب:
```typescript
if (gateway === 'STRIPE') { ... }
else if (gateway === 'KASHIER') { ... }
else if (gateway === 'COD') { ... }
```

بتعمل **Interface** واحد، وكل gateway بيـ implement الـ interface ده:

```typescript
// الـ Interface — العقد
interface IPaymentStrategy {
  createPaymentIntent(order, user, amount, currency): Promise<PaymentResponse>;
}

// كل strategy بتـ implement نفس الـ method
class StripeStrategy implements IPaymentStrategy {
  async createPaymentIntent(order, user, amount, currency) {
    const pi = await this.stripe.paymentIntents.create({ amount, currency });
    return { type: 'STRIPE', clientSecret: pi.client_secret };
  }
}

class KashierStrategy implements IPaymentStrategy {
  async createPaymentIntent(order, user, amount, currency) {
    const response = await axios.post('https://api.kashier.io/...', { ... });
    return { type: 'KASHIER', paymentUrl: response.data.sessionUrl };
  }
}

class CodStrategy implements IPaymentStrategy {
  async createPaymentIntent(order, user, amount, currency) {
    return { type: 'COD', message: 'Pay on delivery' };
  }
}
```

### الـ Resolver — الـ Router

```typescript
class PaymentStrategyResolver {
  constructor(
    private stripe: StripeStrategy,
    private kashier: KashierStrategy,
    private cod: CodStrategy,
  ) {}

  getStrategy(gateway: PaymentGateway): IPaymentStrategy {
    switch (gateway) {
      case 'STRIPE':  return this.stripeStrategy;
      case 'KASHIER': return this.kashierStrategy;
      case 'COD':     return this.codStrategy;
      default: throw new BadRequestException(`Gateway ${gateway} not supported`);
    }
  }
}
```

### الاستخدام في الـ Checkout

```typescript
const strategy = this.paymentStrategyResolver.getStrategy(dto.paymentGateway);
const paymentResponse = await strategy.createPaymentIntent(order, user, order.total, order.currency);
```

**الجمال:** الـ CheckoutService مش عارف أي gateway بيشتغل — بس بتقوله "اعمل payment intent" والـ strategy هي اللي تعرف إزاي.

لما تيجي تضيف Tamara أو Tabby، بتعمل class جديد بس وتضيفه للـ Resolver. الـ CheckoutService ما بيتغيرش خالص.

---

## 7. Webhook Idempotency

### إيه هو الـ Webhook؟

بعد ما المستخدم يدفع بـ Stripe مثلاً، Stripe بتبعتلك **HTTP Request** على الـ backend بتاعك تقولك "الدفع نجح". ده هو الـ Webhook.

### المشكلة: Stripe ممكن تبعتلك نفس الـ Webhook أكتر من مرة

لو الـ server بتاعك استغرق وقت في الرد أو رجّع error مؤقت، Stripe هتبعت تاني. ولو ما عندكش حماية:

```
Webhook 1: Order CONFIRMED + Stock -5 ✅
Webhook 2: Order CONFIRMED + Stock -5 مرة تانية ❌ (الستوك اتأثر مرتين!)
```

### الحل: ProcessedWebhook Table + ACID Transaction

```prisma
model ProcessedWebhook {
  id        String         @id  // الـ Event ID من Stripe/Kashier
  provider  PaymentGateway
  createdAt DateTime       @default(now())
}
```

والكود:

```typescript
await this.prisma.$transaction(async (tx) => {
  // ❶ أول حاجة: اكتب الـ event ID في الـ ProcessedWebhook
  // لو الـ event ده اتعمل قبل كده، هيتعمل unique constraint violation
  // وده هيـ rollback الـ transaction كلها
  await tx.processedWebhook.create({
    data: { id: eventId, provider: gateway }
  });

  // ❷ حدّث حالة الأوردر
  await tx.order.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED', paymentId: providerTxId }
  });

  // ❸ نزّل الستوك
  await decrementStockForOrderItems(tx, order.items);

  // ❹ سجّل في الـ status log
  await tx.orderStatusLog.create({ ... });
});
```

### ليه الـ `processedWebhook.create` لازم يكون أول حاجة؟

لأن الـ ACID transaction بتشتغل كده:
- لو حصل error في أي step، كل الـ transaction بتتـ rollback
- الـ unique constraint على `ProcessedWebhook.id` هيتعمل تلقائياً
- لو ورد الـ webhook تاني مرة، الـ `create` هيفشل فوراً وهيـ rollback قبل ما يعمل أي حاجة

**التسلسل المهم:**
```
Webhook 1 يوصل:
  → tx.processedWebhook.create("evt_123") ✅
  → order.update(CONFIRMED) ✅
  → decrementStock ✅
  → commit ✅

Webhook 1 يوصل تاني مرة:
  → tx.processedWebhook.create("evt_123") ❌ Unique violation!
  → Rollback! مفيش حاجة اتغيرت ✅
```

### الـ Fast-Path Check (Pre-Transaction Optimization)

قبل ما ندخل الـ transaction، بنعمل check سريع:

```typescript
// شوف بسرعة من غير transaction
if (await this.isEventProcessed(event.id)) {
  return { received: true }; // تجاهل - اتعمل قبل كده
}

// بعدين ادخل الـ transaction
await this.prisma.$transaction(async (tx) => { ... });
```

ده بيوفر ضغط على الـ DB لو الـ retry كتير.

---

## 8. Event-Driven System

### الفكرة الكبيرة

بدل ما الـ VariantsService يبعت notification لكل المستخدمين اللي عندهم المنتج في الـ wishlist مباشرة (وده coupling تقيل)، بيبعت **event** فقط، وحد تاني بيسمع العيفنت ده ويعمل اللي عليه.

### التسلسل كامل

```
Admin يغير السعر لـ أقل
        ↓
VariantsService.updateVariant يعمل update
        ↓
[ يكتشف إن السعر نزل ]
        ↓
eventEmitter.emit('variant.price.dropped', { variantId, newPrice, productName })
        ↓
[ WishlistEventListener يسمع الـ event ]
        ↓
يجيب كل المستخدمين اللي عندهم الـ variant في الـ wishlist
        ↓
يبعتلهم in-app notification + FCM push
```

### الكود: Emit Event

```typescript
// في VariantsService.updateVariant
if (dto.specificPrice !== undefined && dto.specificPrice < oldVariant.specificPrice) {
  // السعر نزل! ابعت event
  this.eventEmitter.emit('variant.price.dropped', {
    variantId,
    newPrice: dto.specificPrice,
    productName: 'Product Name',
  });
}
```

### الكود: Listen للـ Event

```typescript
@Injectable()
export class WishlistEventListener {
  
  @OnEvent('variant.price.dropped')  // ← decorator بيقوله اسمع الـ event ده
  async handlePriceDrop(payload: { variantId: string; newPrice: number; productName: string }) {
    
    // 1. جيب كل المستخدمين اللي عندهم الـ variant في الـ wishlist
    const wishlistedBy = await this.prisma.wishlistItem.findMany({
      where: { variantId: payload.variantId },
      select: { wishlist: { select: { userId: true, user: { select: { fcmTokens: true } } } } }
    });

    // 2. ابعت in-app notification لكل واحد
    await this.prisma.notification.createMany({
      data: wishlistedBy.map(item => ({
        userId: item.wishlist.userId,
        type: 'PRICE_DROP',
        title: { en: 'Price Drop!', ar: 'تخفيض سعر!' },
        message: { en: `Price dropped to ${payload.newPrice / 100} EGP` }
      }))
    });

    // 3. ابعت FCM Push للـ devices
    const allTokens = wishlistedBy.flatMap(item => item.wishlist.user.fcmTokens);
    await this.firebaseService.sendPushNotification(allTokens, 'Price Drop!', '...');
  }
}
```

### ليه ده أحسن من الـ Direct Call؟

**بدون Event-Driven:**
```typescript
// VariantsService لازم يعرف عن WishlistService و NotificationsService
class VariantsService {
  constructor(
    private wishlistService: WishlistService,
    private notificationsService: NotificationsService,
    private firebaseService: FirebaseService,
    // ... المشروع هيبقى مشبوك في بعض
  ) {}
}
```

**مع Event-Driven:**
```typescript
// VariantsService بس يعرف EventEmitter
class VariantsService {
  constructor(private eventEmitter: EventEmitter2) {}
  // مش محتاج يعرف مين هيعمل إيه بعدين
}
```

الـ **decoupling** ده معناه:
- تقدر تضيف Feature جديدة (مثلاً: ابعت Email كمان) من غير ما تلمس VariantsService
- تقدر تغير الـ notification logic من غير ما تلمس الـ business logic

### الـ Admin Notification Fan-Out

```typescript
async sendAdminNotification(payload) {
  // 1. جيب كل الأدمنز (مكاشه في Redis 5 دقائق)
  const admins = await this.getAdminUsers();
  
  // guard: لو الأدمنز أكتر من 200 مكملوش (منعاً للـ runaway inserts)
  if (admins.length > MAX_ADMIN_FAN_OUT) {
    this.logger.warn('Admin count exceeds fan-out limit');
    return;
  }

  // 2. ابعت in-app notification لكل أدمن دفعة واحدة
  await this.prisma.notification.createMany({
    data: admins.map(admin => ({
      userId: admin.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      isAdminNotification: true,
    }))
  });

  // 3. جمّع كل الـ FCM tokens للأدمنز وابعتهم مرة واحدة
  const allFcmTokens = [...new Set(admins.flatMap(a => a.fcmTokens))];
  if (allFcmTokens.length > 0) {
    await this.firebaseService.sendPushNotification(allFcmTokens, ...);
  }
}
```

### الـ Firebase FCM — إزاي بيشتغل؟

كل device بتاع المستخدم عنده **FCM Token** — زي عنوانه على Firebase. بتبعتله push notification من خلال الـ token ده.

```typescript
// الـ FCM multicast limit = 500 token في الرسالة الواحدة
// الكود بيقسم الـ tokens لـ chunks

const batches = [];
for (let i = 0; i < fcmTokens.length; i += 500) {
  batches.push(fcmTokens.slice(i, i + 500));
}

for (const batch of batches) {
  const response = await admin.messaging(this.firebaseApp).sendEachForMulticast({
    tokens: batch,
    notification: { title, body },
  });

  // لو token مش valid، امسحه من الـ DB
  if (response.failureCount > 0) {
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        failedTokens.push(batch[idx]);
      }
    });
  }
}

// امسح كل الـ invalid tokens دفعة واحدة
await this.pruneInvalidTokens(failedTokens);
```

---

## 9. JWT + Refresh Token Rotation

### إيه الفرق بين Access Token و Refresh Token؟

| | Access Token | Refresh Token |
|---|---|---|
| مدته | 15 دقيقة | 30 يوم |
| فين بيتحفظ | Response Body | HTTP-Only Cookie |
| بيتبعت فين | Header كل request | بس على `/auth/refresh` |
| لو اتسرق | هاك لـ 15 دقيقة | مشكلة كبيرة |

### ليه Access Token قصير؟

لو حد سرق الـ access token، هياخد access لـ 15 دقيقة بس ثم ينتهي. لو كان 30 يوم كان كارثة.

### الـ Token Rotation Pattern

لما اليوزر يطلب refresh:

```typescript
async refreshTokens(userId, email, role, refreshToken) {
  const user = await this.usersService.findById(userId);
  
  // تحقق من الـ refresh token (بيتحفظ hashed في الـ DB)
  const isRefreshTokenMatching = await this.hashingService.compare(
    refreshToken,
    user.hashedRefreshToken
  );
  
  if (!isRefreshTokenMatching) throw new UnauthorizedException();

  // ❶ طلع access token جديد + refresh token جديد
  const [accessToken, newRefreshToken] = await Promise.all([
    this.jwtService.signAsync({ sub: userId, email, role }, { expiresIn: '15m' }),
    this.jwtService.signAsync({ sub: userId, email, role }, { expiresIn: '30d' }),
  ]);

  // ❷ حفظ الـ refresh token الجديد في الـ DB (hashed)
  const hashedRT = await this.hashingService.hash(newRefreshToken);
  await this.usersService.updateRaw(userId, { hashedRefreshToken: hashedRT });

  return { accessToken, refreshToken: newRefreshToken };
}
```

**الجمال هنا:** كل مرة الـ refresh token بيتجدد. لو حد سرق refresh token قديم، مش هيشتغل لأن الـ DB عنده الجديد بس.

### ليه الـ Refresh Token في Cookie مش في الـ Body؟

الـ `HttpOnly Cookie` مش ممكن يقروها JavaScript. يعني لو في XSS attack على الـ frontend:

```javascript
// هجوم XSS
document.cookie; // مش هيرجع الـ refreshToken — محمي!
localStorage.getItem('refreshToken'); // لو كان هناك كان اترجع ❌
```

### الـ Lockout System — حماية من الـ Brute Force

```typescript
// لو الـ password غلط:
const updated = await this.usersService.updateRaw(user.id, {
  failedLoginAttempts: { increment: 1 } // atomic increment
});

if (updated.failedLoginAttempts >= 5) {
  // lock الحساب 15 دقيقة
  await this.usersService.updateRaw(user.id, {
    lockoutUntil: new Date(Date.now() + 15 * 60 * 1000)
  });
}
```

لاحظ إن `{ increment: 1 }` ده **atomic** — مش "اقرا ثم زود بواحد". ده بيعمل `UPDATE SET failedLoginAttempts = failedLoginAttempts + 1` مباشرة في الـ SQL، يعني مفيش race condition.

---

## 10. Google OAuth One-Time Code

### المشكلة القديمة

```typescript
// ❌ قبل الـ Fix — الـ tokens في الـ URL
res.redirect(
  `${frontendUrl}/callback?token=${accessToken}&refreshToken=${refreshToken}&user=${userJson}`
);
```

المشكلة:
- الـ URL بيتسجل في كل server log (nginx, cloudflare, ...)
- الـ URL بيتحفظ في browser history
- الـ URL بيتبعت في `Referer` header لو الصفحة لوّدت resource خارجي

### الحل: One-Time Code

```typescript
// ❶ ابعت code بدل الـ tokens
const code = uuidv4(); // "a1b2c3d4-..."
await redis.set(`oauth:code:${code}`, JSON.stringify({ accessToken, refreshToken, user }), 'EX', 30);

res.redirect(`${frontendUrl}/callback?code=${code}`);
// الـ URL: /callback?code=a1b2c3d4-e5f6-... ← مفيش tokens
```

```typescript
// ❷ الـ Frontend يبعت الـ code للـ Backend
POST /auth/google/exchange?code=a1b2c3d4-e5f6-...

// ❸ الـ Backend يبدل الـ code بالـ tokens
const raw = await redis.get(`oauth:code:${code}`);
if (!raw) throw new UnauthorizedException('Invalid or expired code');

await redis.del(`oauth:code:${code}`); // مرة واحدة بس!

const { accessToken, refreshToken, user } = JSON.parse(raw);
this.setRefreshTokenCookie(res, refreshToken);
return { accessToken, user };
```

**الـ TTL 30 ثانية** يعني لو حد حصل على الـ code من الـ log، بعد 30 ثانية مش هيفيد بشيء.

---

## 11. Global Interceptors

### الـ Translation Interceptor

كل الـ multilingual fields في الـ DB بتتحفظ كـ JSON:
```json
{ "ar": "إلكترونيات", "en": "Electronics" }
```

الـ TranslationInterceptor بيحول كل response أوتوماتيك:

```typescript
// الـ detection logic
const hasAr = 'ar' in data;
const hasEn = 'en' in data;
const isSmall = Object.keys(data).length <= 3;

if (hasAr && hasEn && isSmall) {
  // ده object تراجمة
  return data[lang] || data['en'] || data['ar'] || '';
}
```

فبدل ما الـ response يكون:
```json
{ "name": { "ar": "إلكترونيات", "en": "Electronics" } }
```

يبقى:
```json
{ "name": "إلكترونيات" }  // لو x-language: ar
```

### الـ Currency Interceptor

نفس الفكرة — بيمسح كل response ويدور على fields اسمها `price`, `total`, `subtotal`, `fee`, `amount`, `discount`:

```typescript
// الـ pattern اللي بيمسح بيه
private readonly currencyKeyPattern = /(price|total|discount|fee|amount|subtotal|min|max)$/i;

// التحويل: (الـ value / 100 سنت) * rate
if (this.currencyKeyPattern.test(key) && typeof value === 'number') {
  transformedObj[key] = Number(((value / 100) * rate).toFixed(2));
}
```

الـ `rate` بيجي من Redis hash `exchange_rates` اللي بيتحدث كل 12 ساعة.

**ملاحظة مهمة:** الـ CurrencyInterceptor بيتعامل مع **display فقط**. الـ DB دايماً بيحفظ بالجنيه المصري (EGP) بالسنت. لو المستخدم طلب بالدولار، الـ interceptor بيحوّل الأرقام في الـ response بس.

---

## 12. Order FSM — Finite State Machine

### إيه هو الـ FSM؟

الـ Order ليه حالات (states) محددة. مش كل حالة ممكن تتحول لأي حالة تانية.

```
PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
    ↘          ↘
  CANCELLED   CANCELLED
```

### التطبيق في الكود

```typescript
// جدول الـ transitions المسموح بيها
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED'],
  SHIPPED:   ['DELIVERED'],
  DELIVERED: [],   // مفيش transitions من DELIVERED
  CANCELLED: [],   // مفيش transitions من CANCELLED
};

export function validateTransition(current: OrderStatus, target: OrderStatus): void {
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed.includes(target)) {
    throw new BadRequestException(
      `Invalid transition: ${current} → ${target}`
    );
  }
}
```

### الاستخدام

```typescript
// لما الأدمن يغير حالة الأوردر:
validateTransition(order.status, targetStatus); // بيـ throw لو مش مسموح

// نظام تسجيل التغييرات في OrderStatusLog
await tx.orderStatusLog.create({
  data: {
    orderId: order.id,
    oldStatus: order.status,
    newStatus: targetStatus,
    createdBy: adminId,
  }
});
```

### إمتى بيرجع الستوك؟

```typescript
// بس لو الأوردر كان CONFIRMED أو PREPARING
// لأن الستوك بيتنزل لما الأوردر يتـ CONFIRM
export function shouldRestoreStockOnCancel(currentStatus: OrderStatus): boolean {
  return currentStatus === 'CONFIRMED' || currentStatus === 'PREPARING';
}
```

لو الأوردر لسه PENDING والمستخدم إلغاه، الستوك مش اتنزل من الأساس فمش محتاج يرجع.

---

## 13. Home Page Caching — Cache-Aside Pattern

### المشكلة

الـ home page كانت بتعمل 7-19 query كل request. لو 1000 مستخدم في نفس الوقت، ده 7000-19000 query في الثانية من endpoint واحد بس.

### الـ Cache-Aside Pattern

```
Request يجي للـ Home Page
        ↓
    في Redis Cache؟
   ↙             ↘
  نعم              لا
   ↓                ↓
رجّع Cache      Execute الـ 19 queries
فوراً              ↓
              حفظ في Redis (60 ثانية)
                   ↓
              رجّع النتيجة
```

### الكود

```typescript
async getHomeData() {
  // ❶ اتحقق من الـ Cache أولاً
  const cached = await this.redis.get('home:data');
  if (cached) return JSON.parse(cached);

  // ❷ مفيش cache — بنّي من الـ DB
  const result = await this.buildHomeData();

  // ❸ خزّن في Redis (async — مش بنستنى)
  this.redis.set('home:data', JSON.stringify(result), 'EX', 60).catch(() => {});

  return result;
}
```

لاحظ إن الـ `redis.set` بيتعمل `.catch(() => {})` — يعني لو Redis وقع، الـ response بيرجع عادي من الـ DB ومش بيـ crash.

### الـ Cache Invalidation

لما الأدمن يعمل أي تعديل، الـ cache بيتمسح:

```typescript
// في كل admin write method:
async createBanner(dto) {
  const result = await this.prisma.homeBanner.create({ ... });
  void this.invalidateHomeCache(); // fire-and-forget
  return result;
}

async invalidateHomeCache() {
  await this.redis.del('home:data');
}
```

الـ `void` قبل `this.invalidateHomeCache()` معناها "ابعت الـ async function بس متستناهاش". الـ response بيرجع للأدمن فوراً والـ cache بيتمسح في الـ background.

---

## 14. الـ Senior Mindset — إزاي تفكر زي أركيتكت

### ❶ دايماً فكر في الـ Concurrency

كل ما تشوف حاجة بتـ "Read ثم Write"، اسأل نفسك: لو اتنين بيعملوها في نفس الوقت إيه اللي هيحصل؟

```typescript
// ❌ خطر — Check then Act (race condition)
const current = await prisma.variant.findUnique({ where: { id } });
if (current.stockQuantity >= requestedQty) {
  await prisma.variant.update({ data: { stockQuantity: { decrement: requestedQty } } });
}

// ✅ صح — Atomic operation
const result = await prisma.$executeRaw`
  UPDATE "Variant" SET "stockQuantity" = "stockQuantity" - ${qty}
  WHERE id = ${id} AND "stockQuantity" >= ${qty}
`;
if (result === 0) throw new ConflictException('Out of stock');
```

### ❷ دايماً فكر في الـ Failure

ماذا يحدث لو Redis وقع؟ ماذا يحدث لو الـ webhook اتبعت مرتين؟

```typescript
// ✅ دايماً handle الـ failure gracefully
this.redis.set(key, value).catch(() => {
  // مش critical — الـ cache هيتبنى من الـ DB في الـ request الجاي
});
```

### ❸ الـ Transactions للـ ACID Operations

أي عملية لازم تحصل كلها أو ما تحصلش خالص → استخدم Transaction:

```typescript
await prisma.$transaction(async (tx) => {
  // ❶ اعمل الـ idempotency check الأول
  await tx.processedWebhook.create({ data: { id: eventId } });
  
  // ❷ العمليات التانية
  await tx.order.update({ ... });
  await decrementStock(tx, items);
  
  // لو أي حاجة فشلت → كل حاجة اتـ rollback
});
```

### ❹ الـ Snapshot Pattern

لما بتعمل Order، بتعمل snapshot للـ address والـ product name والسعر. ليه؟

```typescript
// في OrderItem:
productName: item.name,    // snapshot — مش FK
variantAttrs: item.attributes, // snapshot
sku: item.sku,             // snapshot
unitPrice: item.unitPrice, // snapshot
```

لو المنتج اتغير اسمه أو سعره أو اتمسح، الأوردر القديم لسه بيظهر البيانات الصح.

### ❺ الـ fire-and-forget Pattern

بعض العمليات مش لازم تستنى نتيجتها:

```typescript
// ❌ بيبلوك الـ response
await this.notificationsService.sendAdminNotification({ ... });

// ✅ بيـ fire ومش بيستنى
void this.notificationsService.sendAdminNotification({ ... });
// الـ void بيقول: "بعت الـ Promise بس مش هستناها"
```

لو الـ notification فشلت، الـ checkout مش محتاج يفشل معاها.

### ❻ الـ Parallel vs Sequential

```typescript
// ❌ Sequential — كل واحدة بتستنى اللي قبلها
const user = await prisma.user.findUnique({ where: { id: userId } });
const address = await prisma.address.findFirst({ where: { id: addressId } });
// وقت: 20ms + 20ms = 40ms

// ✅ Parallel — بيتنفذوا مع بعض
const [user, address] = await Promise.all([
  prisma.user.findUnique({ where: { id: userId } }),
  prisma.address.findFirst({ where: { id: addressId } }),
]);
// وقت: max(20ms, 20ms) = 20ms فقط!
```

القاعدة: لو ما في dependency بين الـ calls، اعملهم parallel.

### ❼ الـ Cryptography الصح

```typescript
// ❌ مش آمن — Math.random() قابل للتوقع
const otp = Math.floor(Math.random() * 1000000).toString();

// ✅ آمن — crypto.randomInt()
import { randomInt } from 'crypto';
const otp = randomInt(100000, 1000000).toString(); // CSPRNG

// ❌ مش آمن — String comparison
if (userInput === storedOtp) { ... }

// ✅ آمن — Timing-safe comparison (منع timing attacks)
import { timingSafeEqual } from 'crypto';
const isValid = timingSafeEqual(Buffer.from(userInput), Buffer.from(storedOtp));
```

### ❽ الـ Rate Limiting

كل endpoint حساس لازم يكون عليه Rate Limit:

```typescript
// تسجيل الدخول: 10 محاولات في الدقيقة
@Throttle({ default: { limit: 10, ttl: 60000 } })

// الـ 2FA: 5 محاولات في 5 دقائق (الـ OTP بسيط = 1,000,000 تركيبة)
@Throttle({ default: { limit: 5, ttl: 300000 } })

// Reset Password: 5 محاولات في 5 دقائق
@Throttle({ default: { limit: 5, ttl: 300000 } })
```

---

## ملخص: الـ Stack والـ Patterns المستخدمة

| المشكلة | الحل |
|---------|------|
| Cart سريع | Redis-First with PostgreSQL sync |
| Overselling | Redis Inventory Locks + HGETALL/MGET |
| Payment flexibility | Strategy Pattern |
| Webhook duplicates | ProcessedWebhook + ACID Transaction |
| Price/Stock alerts | Event-Driven (EventEmitter2) |
| Push notifications | Firebase FCM Multicast |
| Token security | JWT Rotation + HttpOnly Cookie |
| OAuth tokens in URL | Redis One-Time Code (30s TTL) |
| Multilingual | JSONB + TranslationInterceptor |
| Multi-currency | Redis Exchange Rates + CurrencyInterceptor |
| Home page performance | Cache-Aside Pattern (Redis 60s) |
| Category menu | Redis Mega Menu Cache (1 hour) |
| Order integrity | FSM + OrderStatusLog |
| Flash sale limits | Atomic SQL UPDATE with WHERE condition |

---

> **القاعدة الذهبية:** كل ما تكتب code، اسأل نفسك:
> 1. لو عندي 10,000 user بيعملوا نفس الحاجة في نفس الوقت، إيه اللي هيتكسر؟
> 2. لو حصل error في المنتصف، البيانات هتبقى consistent؟
> 3. لو الـ service ده وقع، باقي الـ system هيكمل؟
