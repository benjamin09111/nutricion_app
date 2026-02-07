---
trigger: always_on
description: Financial data architecture and aggregation best practices
---

# Financial Data Architecture & Aggregation

## 🎯 Core Principle

**Never trust a single denormalized total. Always maintain an immutable event log as the source of truth.**

---

## ❌ The Anti-Pattern: Single Row Denormalization

### What NOT to do:
```sql
-- BAD: Single row that gets updated
CREATE TABLE revenue_summary (
    id INT PRIMARY KEY,
    total_mrr DECIMAL,
    total_users INT,
    last_updated TIMESTAMP
);

-- Every payment updates this row
UPDATE revenue_summary SET total_mrr = total_mrr + 100 WHERE id = 1;
```

### Why it fails:

1. **Race Conditions** 🏃‍♂️💥
   - Two concurrent transactions can overwrite each other
   - Example: Process A and B both read $100, both add $10, both save $110
   - **Result**: You sold $20 but your database says $10

2. **Irreversible Errors** 💣
   - If a refund script fails but the payment succeeded, your total is wrong forever
   - No audit trail to detect or fix the corruption

3. **No Historical Context** 📊
   - Can't answer: "What was our MRR last month?"
   - Can't calculate: "What's our growth rate?"
   - Can't debug: "Where did this number come from?"

---

## ✅ The Professional Pattern: Event Sourcing + Aggregation

### Architecture Layers

#### **Layer 1: Source of Truth (Immutable Events)**
These tables are **append-only**. Never update or delete.

```sql
-- The sacred truth: every transaction is a row
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    amount DECIMAL NOT NULL,
    currency VARCHAR(3) DEFAULT 'CLP',
    status VARCHAR(20) NOT NULL, -- 'completed', 'refunded', 'failed'
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'paused'
    started_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscription_events (
    id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'created', 'renewed', 'cancelled', 'upgraded'
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Rules**:
- ✅ INSERT only
- ❌ Never UPDATE or DELETE
- ✅ Use status flags for cancellations
- ✅ Store metadata for debugging

---

#### **Layer 2: Daily Aggregations (Historical Cache)**
Pre-calculated metrics stored as **daily snapshots**.

```sql
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    
    -- Revenue Metrics
    mrr_total DECIMAL NOT NULL,
    arr_total DECIMAL NOT NULL,
    new_revenue DECIMAL NOT NULL,
    churned_revenue DECIMAL NOT NULL,
    
    -- User Metrics
    total_users INT NOT NULL,
    new_users INT NOT NULL,
    churned_users INT NOT NULL,
    active_subscriptions INT NOT NULL,
    
    -- Growth Metrics
    mrr_growth_rate DECIMAL,
    user_growth_rate DECIMAL,
    churn_rate DECIMAL,
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_date UNIQUE(date)
);

-- Index for fast dashboard queries
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);
```

**How it's populated**:

1. **Background Job (Cron)** - Recommended for MVP
   ```typescript
   // Run every night at 00:00 UTC
   async function calculateDailyMetrics() {
       const yesterday = new Date();
       yesterday.setDate(yesterday.getDate() - 1);
       
       const metrics = await prisma.$queryRaw`
           SELECT 
               COUNT(DISTINCT user_id) as total_users,
               SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as new_revenue,
               -- ... more calculations
           FROM payments
           WHERE DATE(created_at) = ${yesterday}
       `;
       
       await prisma.dailyMetrics.create({
           data: {
               date: yesterday,
               ...metrics
           }
       });
   }
   ```

2. **Materialized Views (PostgreSQL)** - For production scale
   ```sql
   CREATE MATERIALIZED VIEW daily_revenue_mv AS
   SELECT 
       DATE(created_at) as date,
       SUM(amount) as total_revenue,
       COUNT(DISTINCT user_id) as unique_payers
   FROM payments
   WHERE status = 'completed'
   GROUP BY DATE(created_at);
   
   -- Refresh every hour
   CREATE UNIQUE INDEX ON daily_revenue_mv(date);
   REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue_mv;
   ```

---

#### **Layer 3: Real-Time Aggregations (On-Demand)**
For metrics that need to be "live" (like today's revenue).

```typescript
// Service method for dashboard
async getDashboardMetrics() {
    // Get historical data (fast - pre-calculated)
    const lastMonth = await prisma.dailyMetrics.findMany({
        where: {
            date: {
                gte: thirtyDaysAgo,
                lt: today
            }
        },
        orderBy: { date: 'desc' }
    });
    
    // Get TODAY's data (live calculation)
    const todayMetrics = await prisma.$queryRaw`
        SELECT 
            COUNT(DISTINCT user_id) as new_users_today,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue_today
        FROM payments
        WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    return {
        historical: lastMonth,
        today: todayMetrics,
        trends: calculateTrends(lastMonth)
    };
}
```

---

## 🔒 Data Integrity Rules

### 1. Transactions for Multi-Table Updates
```typescript
await prisma.$transaction(async (tx) => {
    // 1. Create payment record
    const payment = await tx.payment.create({
        data: { userId, amount, status: 'completed' }
    });
    
    // 2. Update subscription
    await tx.subscription.update({
        where: { userId },
        data: { endsAt: newEndDate }
    });
    
    // 3. Log event
    await tx.subscriptionEvent.create({
        data: { 
            subscriptionId, 
            eventType: 'renewed',
            metadata: { paymentId: payment.id }
        }
    });
});
```

### 2. Idempotency Keys for Payments
```typescript
// Prevent duplicate charges
const payment = await prisma.payment.upsert({
    where: { idempotencyKey: webhookId },
    update: {},
    create: {
        idempotencyKey: webhookId,
        userId,
        amount,
        status: 'completed'
    }
});
```

### 3. Soft Deletes for Financial Records
```typescript
// NEVER physically delete financial data
await prisma.payment.update({
    where: { id },
    data: { 
        status: 'refunded',
        refundedAt: new Date(),
        refundReason: 'Customer request'
    }
});
```

---

## 📊 Dashboard Query Strategy

### Fast Reads (Pre-Aggregated)
```typescript
// Get last 30 days of metrics (instant)
const metrics = await prisma.dailyMetrics.findMany({
    where: {
        date: { gte: thirtyDaysAgo }
    },
    orderBy: { date: 'desc' }
});
```

### Growth Calculations
```typescript
function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
}

const mrrGrowth = calculateGrowth(
    metrics[0].mrr_total,
    metrics[30].mrr_total
);
```

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (Current)
- ✅ Create `payments` and `subscriptions` tables
- ✅ Implement append-only pattern
- ✅ Use Prisma transactions for multi-step operations

### Phase 2: Aggregation (Next)
- 🔲 Create `daily_metrics` table
- 🔲 Build nightly cron job (BullMQ + Redis)
- 🔲 Backfill historical data

### Phase 3: Production Scale
- 🔲 Implement materialized views
- 🔲 Add real-time metrics cache (Redis)
- 🔲 Set up monitoring for aggregation jobs

---

## 🎓 Key Takeaways

1. **Source of Truth = Immutable Events**
   - Every payment, subscription change, refund is a row
   - Never update financial records, only append

2. **Aggregations = Calculated Views**
   - Daily snapshots for historical trends
   - Real-time calculations only for "today"

3. **Performance = Pre-Calculation**
   - Dashboard reads pre-calculated data (fast)
   - Background jobs do the heavy lifting (async)

4. **Integrity = Transactions + Idempotency**
   - Use database transactions for multi-step operations
   - Prevent duplicate charges with idempotency keys

5. **Auditability = Complete History**
   - Can always recalculate totals from source events
   - Can answer "what happened on X date?"

---

## 🔗 Related Patterns

- **Event Sourcing**: Store all state changes as events
- **CQRS**: Separate read models from write models
- **Materialized Views**: Database-level pre-calculation
- **Time-Series Data**: Optimized for temporal queries

---

**Remember**: In financial systems, **trust but verify**. Your aggregated totals should always be verifiable by summing the source events.
