import type { Scenario } from './types';

/**
 * The correctness interview. Almost nothing here is about scale; it is about what happens
 * when a network call times out after the money has already moved.
 */
export const PAYMENTS: Scenario = {
  id: 'payments',
  title: 'Design a payment system',
  opening:
    'Design the service that takes a customer payment for an order. Assume a third-party payment provider does the actual card processing.',
  difficulty: 'advanced',
  minutes: 40,
  assesses: [
    'requirements',
    'architecture',
    'data-modelling',
    'reliability',
    'consistency',
    'failure-handling',
    'trade-offs',
    'communication',
    'adaptability',
  ],
  startPhase: 'open',
  phases: [
    {
      id: 'open',
      kind: 'clarify',
      prompt:
        'Design the service that takes a customer payment for an order. Assume a third-party provider does the card processing.',
      note: 'Scale is not the point of this interview. Something else is.',
      next: 'first-design',
      choices: [
        {
          id: 'clarify-correct',
          text: 'The thing I want to pin down first is what must never happen. I assume charging a customer twice for one order is unacceptable, and that losing a payment we already took is worse. Are we the system of record for whether an order is paid, and do we need to reconcile against the provider?',
          quality: 'strong',
          scores: { requirements: 2, consistency: 1, communication: 1 },
          reaction:
            'Yes on all counts. Double charging is the failure we care about most, and yes, we reconcile daily against the provider.',
          coaching:
            'Opening with the invariant rather than the throughput is exactly right for a payments question. The interviewer is testing correctness under partial failure, and you have signalled that you know that.',
          concepts: ['correctness', 'requirement-clarification', 'idempotency'],
        },
        {
          id: 'clarify-scale',
          text: 'How many payments per second do we need to handle, and what is our latency target?',
          quality: 'adequate',
          scores: { requirements: 0 },
          reaction:
            'A few hundred per second at peak, and a second or two is fine. Does that change your design much?',
          coaching:
            'A reasonable question, but a few hundred per second is a workload any single database handles. Payments interviews are almost never about throughput; the difficulty is entirely in duplicate prevention and partial failure.',
        },
        {
          id: 'clarify-none',
          text: 'I will have an API that takes an order ID and an amount, calls the provider, and marks the order paid when it succeeds.',
          quality: 'weak',
          scores: { requirements: -2, consistency: -1 },
          reaction:
            'The call to the provider times out and you never learn the outcome. Was the customer charged?',
          coaching:
            'Jumping to the happy path in a payments question walks straight into the trap. A timeout is not a failure — it is an unknown outcome, and the entire design exists to handle that.',
        },
      ],
    },

    {
      id: 'first-design',
      kind: 'design',
      prompt: 'Sketch it. What happens when the customer presses pay?',
      next: 'timeout',
      choices: [
        {
          id: 'design-idem',
          text: 'The client generates an idempotency key for the attempt and sends it with the request. We write a payment_attempt row keyed on that idempotency key in the same transaction that records the intent, in a pending state. Then we call the provider, passing our key as their idempotency key too. When we learn the outcome, we update our row. If the same key arrives again, we return the stored result rather than calling the provider a second time.',
          quality: 'strong',
          scores: { architecture: 2, consistency: 2, 'data-modelling': 2 },
          reaction:
            'Good. Now: you call the provider and the connection times out. What is the state of the world?',
          coaching:
            'Writing the attempt row before calling the provider is the crucial ordering. If you call first and record after, a crash in between leaves you with a charge you have no record of — which is the failure that costs real money.',
          concepts: ['idempotency-key', 'atomicity', 'outbox'],
        },
        {
          id: 'design-status',
          text: 'Create a payment record in a pending state, call the provider, then update it to succeeded or failed based on the response.',
          quality: 'adequate',
          scores: { architecture: 1, 'data-modelling': 1 },
          reaction:
            'What stops the customer pressing pay twice, or their browser retrying, from creating two pending records and two charges?',
          coaching:
            'The state machine is right and the deduplication is missing. Without a caller-supplied key that you enforce uniqueness on, every retry — by the user, the browser, or your own client library — is a fresh payment.',
          concepts: ['idempotency'],
        },
        {
          id: 'design-sync',
          text: 'Call the provider synchronously, and if it succeeds, write the payment and mark the order paid in one transaction.',
          quality: 'weak',
          scores: { architecture: -1, consistency: -2 },
          reaction:
            'The provider succeeds and your database write fails. The customer has been charged and your system does not know. What now?',
          coaching:
            'Doing the external side effect before the local record means any crash between them produces money moved with no record of it. The durable record must exist before the irreversible action.',
          concepts: ['dual-write', 'atomicity'],
        },
      ],
    },

    {
      id: 'timeout',
      kind: 'failure',
      prompt:
        'You call the provider. The connection times out. You have no idea whether the customer was charged. What do you do?',
      next: 'db-fails',
      choices: [
        {
          id: 'timeout-good',
          text: 'The attempt stays in an indeterminate state — not failed. I never guess. I retry with the same idempotency key, which the provider deduplicates, so a retry either returns the original result or performs the charge exactly once. If retries keep timing out, the attempt goes to a reconciliation queue that queries the provider for the outcome by our key. The customer sees "processing", not "failed", because telling them it failed when it may have succeeded is how you get a second charge.',
          quality: 'strong',
          scores: { 'failure-handling': 2, consistency: 2, reliability: 2 },
          reaction:
            'Exactly. The user-facing part matters as much as the machinery.',
          coaching:
            'The insight most candidates miss is the user interface consequence: showing "payment failed" on a timeout invites the customer to try again, and now you have two charges from one intent. Indeterminate is a state, and it has to be modelled.',
          concepts: ['idempotency-key', 'retry', 'at-least-once', 'effectively-once'],
        },
        {
          id: 'timeout-retry',
          text: 'Retry the request with the same idempotency key, since the provider will deduplicate it.',
          quality: 'adequate',
          scores: { 'failure-handling': 1, consistency: 1 },
          reaction:
            'And if every retry times out and you are still unsure after 30 seconds, with a customer waiting?',
          coaching:
            'Retrying with the key is correct and incomplete. You need a terminal path for the case where retries do not resolve it: an indeterminate state, an asynchronous reconciliation process, and a customer-facing status that does not claim failure.',
          concepts: ['retry', 'idempotency-key'],
        },
        {
          id: 'timeout-fail',
          text: 'Mark the payment failed and let the customer try again.',
          quality: 'weak',
          scores: { 'failure-handling': -2, consistency: -2 },
          reaction:
            'The first charge went through. The customer has now paid twice. This is the exact failure you said was unacceptable.',
          coaching:
            'A timeout is an unknown outcome, not a negative one. Treating unknown as failed and inviting a retry is the single most common way real systems double charge people.',
        },
      ],
    },

    {
      id: 'db-fails',
      kind: 'failure',
      prompt:
        'The provider confirms the charge succeeded. Your service crashes before it can write that result. What happens?',
      next: 'order-update',
      choices: [
        {
          id: 'crash-good',
          text: 'The attempt row is still pending, which is correct — we never lost the fact that an attempt exists, because we wrote it first. A background reconciler picks up attempts that have been pending beyond a threshold, queries the provider by our idempotency key, and settles them. This is why the row must be written before the external call: the record of intent is what makes recovery possible.',
          quality: 'strong',
          scores: { 'failure-handling': 2, reliability: 2, 'data-modelling': 1 },
          reaction:
            'Good. Now the order service needs to know the payment succeeded.',
          coaching:
            'This is the payoff for the earlier ordering decision, and saying so explicitly connects your design choices to the failure they were made for.',
          concepts: ['atomicity', 'outbox', 'idempotency-key'],
        },
        {
          id: 'crash-partial',
          text: 'The payment is stuck in pending. We would need some process to clean up stale pending payments.',
          quality: 'adequate',
          scores: { 'failure-handling': 1, reliability: 0 },
          reaction:
            'Clean up how? You cannot decide the outcome without asking someone who knows it.',
          coaching:
            'Right diagnosis, vague remedy. "Clean up" must mean querying the provider by the key you sent them, which only works because you stored that key before the call.',
          concepts: ['idempotency-key'],
        },
        {
          id: 'crash-weak',
          text: 'We would rely on the provider webhook to tell us the payment succeeded.',
          quality: 'weak',
          scores: { 'failure-handling': -1, reliability: -1 },
          reaction:
            'Webhooks can be delayed, duplicated, or lost. Is a webhook you have not received evidence of anything?',
          coaching:
            'Webhooks are a useful optimisation and a poor foundation. They are at-least-once at best and absent at worst, so they must be an accelerator on top of a reconciliation process that works without them.',
          concepts: ['at-least-once', 'duplicate-processing'],
        },
      ],
    },

    {
      id: 'order-update',
      kind: 'pressure',
      prompt:
        'The payment succeeded. Now the order service must mark the order paid, and it lives in a different database. How do you keep them consistent?',
      next: 'refund',
      choices: [
        {
          id: 'order-outbox',
          text: 'Not a distributed transaction. I would write a payment_succeeded event into an outbox table in the same transaction that updates the payment row, so the event and the state change commit together. A relay publishes from the outbox, and the order service consumes it idempotently, keyed on the payment ID, so redelivery is harmless. The two systems are eventually consistent, and the window is small and observable.',
          quality: 'strong',
          scores: { consistency: 2, architecture: 2, 'trade-offs': 2 },
          reaction:
            'Good. What does the customer see during that window?',
          coaching:
            'Outbox plus idempotent consumer is the standard answer, and the part that earns credit is naming what you gave up: atomicity across services, replaced by a bounded eventual-consistency window you can measure and alert on.',
          concepts: ['outbox', 'dual-write', 'eventual-consistency', 'idempotency'],
        },
        {
          id: 'order-2pc',
          text: 'A two-phase commit across the payment database and the order database, so both commit or neither does.',
          quality: 'adequate',
          scores: { consistency: 1, 'trade-offs': -1 },
          reaction:
            'What happens to both services if the coordinator dies between prepare and commit?',
          coaching:
            'Two-phase commit is genuinely atomic and genuinely blocking. Participants hold locks until the coordinator returns, so your availability becomes the product of every participant plus the coordinator. It is rarely the right answer across service boundaries.',
          concepts: ['two-phase-commit', 'distributed-transaction'],
        },
        {
          id: 'order-direct',
          text: 'The payment service calls the order service directly to mark it paid.',
          quality: 'weak',
          scores: { consistency: -2, reliability: -1 },
          reaction:
            'The call fails after the payment committed. You have money taken and an unpaid order, and no record that the call needs retrying.',
          coaching:
            'This is the dual-write problem: two writes to two systems with no atomicity between them. Any crash in between leaves them permanently disagreeing, and nothing in the system knows.',
          concepts: ['dual-write'],
        },
      ],
    },

    {
      id: 'refund',
      kind: 'pressure',
      prompt:
        'A customer is refunded twice because an operator clicked the button twice in an admin tool. How would you have prevented that?',
      next: 'wrap',
      choices: [
        {
          id: 'refund-good',
          text: 'The same property, applied one level up: a refund is an operation with its own idempotency key, derived from something stable like the payment ID plus the refund reason, not generated fresh per click. The admin tool sends the key with the request, so the second click returns the first refund rather than creating a second one. The general rule is that any operation with an irreversible external effect needs a caller-supplied key, and that includes internal tools — which are usually the ones that get forgotten.',
          quality: 'strong',
          scores: { consistency: 2, 'trade-offs': 1, adaptability: 2 },
          reaction: 'Right, and internal tools are exactly where this is usually missed.',
          coaching:
            'Generalising the principle rather than patching the instance is what is being tested. The interviewer wants to know whether idempotency is a rule you apply or a trick you learned for one endpoint.',
          concepts: ['idempotency', 'idempotency-key', 'audit-log'],
        },
        {
          id: 'refund-ui',
          text: 'Disable the button after the first click.',
          quality: 'weak',
          scores: { consistency: -2 },
          reaction:
            'Two operators, two browser tabs, or one retry from a flaky connection. Is the button the guarantee?',
          coaching:
            'Client-side prevention is not a guarantee, it is a convenience. The invariant has to be enforced by the system that owns the money, because that is the only place all the requests converge.',
        },
        {
          id: 'refund-check',
          text: 'Check whether a refund already exists for that payment before creating one.',
          quality: 'adequate',
          scores: { consistency: 0 },
          reaction:
            'Both clicks check at the same instant and both see no refund. What closes that race?',
          coaching:
            'Check-then-act again. The check and the write must be one atomic operation — a unique constraint on the idempotency key does it, and nothing at the application layer does it reliably.',
          concepts: ['lost-update', 'optimistic-concurrency'],
        },
      ],
    },

    {
      id: 'wrap',
      kind: 'wrap',
      prompt: 'Last question. How would you know, tomorrow morning, that any of this went wrong?',
      choices: [
        {
          id: 'wrap-good',
          text: 'Reconciliation is the answer, and it should be a first-class part of the system rather than a script someone runs. Daily, we pull the provider settlement report and compare it against our records in both directions: charges they have that we do not, and charges we think we made that they have no record of. Both directions matter, because the first is money we took without recording and the second is a bug in our state machine. I would alert on the count of attempts stuck in an indeterminate state, and treat a non-zero unreconciled balance as a paging incident rather than a report.',
          quality: 'strong',
          scores: { reliability: 2, 'failure-handling': 2, communication: 2 },
          reaction: 'Good. Reconciliation in both directions is the part people forget.',
          coaching:
            'Financial systems are defined by their reconciliation, not by their happy path. Naming both directions of the comparison, and treating a discrepancy as an incident, is the answer of someone who has operated one.',
          concepts: ['audit-log', 'alerting', 'observability'],
        },
        {
          id: 'wrap-monitor',
          text: 'Monitoring and alerting on payment failure rates.',
          quality: 'adequate',
          scores: { reliability: 0 },
          reaction:
            'A failure rate tells you about failures you know about. What about the charges you never recorded?',
          coaching:
            'Error-rate monitoring cannot detect a discrepancy between two systems, because from your side nothing errored. Only comparing against the provider finds money that moved without a record.',
        },
        {
          id: 'wrap-logs',
          text: 'We would see it in the logs if something went wrong.',
          quality: 'weak',
          scores: { reliability: -2, communication: -1 },
          reaction: 'Who is reading them, and what would they be looking for?',
          coaching:
            'Logs are for investigating a problem you already know about. Detection requires something that actively compares expected against actual and raises an alarm on the difference.',
        },
      ],
    },
  ],
};
