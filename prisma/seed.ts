/**
 * MomDaily seed data.
 *
 * ⚠️ PLACEHOLDER CONTENT — DEV USE ONLY ⚠️
 * The 50 tips below exist to exercise the schema, the selector, and the
 * dashboard end-to-end. They are intentionally generic and non-medical.
 * Before launch, the content lead (ideally an RDN or pediatric writer)
 * must replace these with reviewed, source-backed tips. Tips here are
 * marked publishedAt = now so dev builds have a working library.
 *
 * To run:
 *   npm run db:seed
 *
 * Re-running is safe — uses upsert by slug.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Goal = "sleep" | "feeding" | "milestones" | "self_care";
type Category = "nutrition" | "sleep" | "milestones" | "self_care" | "safety";

interface SeedTip {
  slug: string;
  title: string;
  body: string;
  category: Category;
  ageMinMonths: number;
  ageMaxMonths: number;
  goalsHit: Goal[];
  sources?: string[];
}

const PLACEHOLDER_SOURCE = "Placeholder content — pending content-lead review";

const TIPS: SeedTip[] = [
  // ── Nutrition (20) ────────────────────────────────────────────────────────
  {
    slug: "nutrition-trust-hunger-cues",
    title: "Trust your baby's hunger cues",
    body: "Newborns don't read clocks. Rooting, sucking on hands, and turning toward you are early hunger signs — crying is late. Feeding on cue rather than a strict schedule is widely supported in the first months.",
    category: "nutrition",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-cluster-feeding-normal",
    title: "Cluster feeding is normal",
    body: "Long stretches of frequent feeds — sometimes hours in a row — show up during growth spurts. It's exhausting and it's also a feature, not a problem. Snacks, water, and a comfortable spot help.",
    category: "nutrition",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["feeding", "self_care"],
  },
  {
    slug: "nutrition-wet-diaper-check",
    title: "Wet diapers are the simplest green light",
    body: "By the end of the first week, most babies have 6+ wet diapers a day. It's a more reliable read on intake than how long a feed lasted.",
    category: "nutrition",
    ageMinMonths: 0,
    ageMaxMonths: 6,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-solids-readiness-signs",
    title: "Solids readiness shows up in the body, not the calendar",
    body: "Steady head control, sitting with little support, and a curious lean toward food matter more than hitting six months on the dot. If the signs aren't there, waiting is fine.",
    category: "nutrition",
    ageMinMonths: 4,
    ageMaxMonths: 7,
    goalsHit: ["feeding", "milestones"],
  },
  {
    slug: "nutrition-iron-around-six-months",
    title: "Iron stores start to dip around six months",
    body: "Babies are born with iron stores that gradually run low. Iron-rich first foods — soft-cooked meats, lentils, fortified cereals — help bridge the gap as solids ramp up.",
    category: "nutrition",
    ageMinMonths: 5,
    ageMaxMonths: 9,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-first-foods-simple",
    title: "First foods can be very simple",
    body: "A few soft-cooked vegetables and one source of iron each day is more than enough for week one. Variety can build slowly — there's no race.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 9,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-texture-over-variety",
    title: "Texture matters more than variety in week one",
    body: "A new texture is its own learning event. Letting one food repeat for a few days while baby figures out the feel of it isn't picky — it's how chewing develops.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 10,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-touching-food-is-learning",
    title: "Touching food is part of learning to eat",
    body: "Smearing, squishing, dropping — it looks like rejection but it's data collection. Plates that allow exploration tend to lead to better eaters down the line.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 14,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-reactions-time-to-spot",
    title: "Reactions usually show up within hours, not minutes",
    body: "Most food reactions appear within a few hours of eating. Keeping a simple note of new foods and timing makes the picture clearer if something does come up.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 12,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-allergens-one-at-a-time",
    title: "Allergens go in one at a time",
    body: "Common allergens (egg, peanut, dairy, wheat, fish) are best introduced one new one every three or so days, so any reaction is easier to trace.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 12,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-self-feeding-mess",
    title: "Self-feeding is messier but worth it",
    body: "Handing your baby a pre-loaded spoon at nine months looks chaotic and is the start of real autonomy. A wipeable mat under the chair pays for itself fast.",
    category: "nutrition",
    ageMinMonths: 8,
    ageMaxMonths: 14,
    goalsHit: ["feeding", "milestones"],
  },
  {
    slug: "nutrition-iron-rich-brain",
    title: "Iron-rich foods support brain development",
    body: "Meat, eggs, lentils, and fortified cereals offer iron in a form babies absorb well. A small serving most days is more useful than perfect daily targets.",
    category: "nutrition",
    ageMinMonths: 9,
    ageMaxMonths: 14,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-cup-transition-slow",
    title: "Cup transitions take weeks, not days",
    body: "Open cups and straw cups both work — and both feel weird at first. Practising at one meal a day is enough; the rest of the day stays familiar.",
    category: "nutrition",
    ageMinMonths: 10,
    ageMaxMonths: 16,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-toddler-appetite-slowdown",
    title: "Appetite slows after the first birthday",
    body: "Growth rate drops after twelve months, and so does appetite. A toddler eating a quarter of what they ate at nine months is usually fine.",
    category: "nutrition",
    ageMinMonths: 12,
    ageMaxMonths: 20,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-repeated-exposure",
    title: "Repeated exposure beats one-shot tries",
    body: "It can take 10–15 exposures before a toddler accepts a new food. Putting it on the plate without pressure — even if it gets ignored — is the work.",
    category: "nutrition",
    ageMinMonths: 12,
    ageMaxMonths: 24,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-family-meals-teach",
    title: "Family meals teach more than the food itself",
    body: "Eating together, even briefly, builds vocabulary, modeling, and the rhythm of meals. The shared moment matters more than what's on the plate.",
    category: "nutrition",
    ageMinMonths: 12,
    ageMaxMonths: 36,
    goalsHit: ["feeding", "self_care"],
  },
  {
    slug: "nutrition-saying-no-is-okay",
    title: "Letting them say no is part of eating well",
    body: "Toddlers learning to refuse food are practising autonomy, not rejecting you. Pressure tends to backfire; calm offering tends to land.",
    category: "nutrition",
    ageMinMonths: 15,
    ageMaxMonths: 30,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-snack-windows",
    title: "Snack windows beat constant grazing",
    body: "Predictable meal + snack times build appetite. A toddler who's been nibbling all morning rarely shows up hungry at lunch.",
    category: "nutrition",
    ageMinMonths: 15,
    ageMaxMonths: 36,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-two-textures-widen-palate",
    title: "Two textures on a plate widen the palate",
    body: "Pairing a familiar food with something new in the same meal lowers the bar. The new food sits next to a friend.",
    category: "nutrition",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["feeding"],
  },
  {
    slug: "nutrition-cooking-together",
    title: "Cooking together teaches more than recipes",
    body: "Stirring, pouring, smelling, naming — a toddler at the counter is learning math, language, and food at the same time. Five minutes counts.",
    category: "nutrition",
    ageMinMonths: 24,
    ageMaxMonths: 36,
    goalsHit: ["feeding", "milestones"],
  },

  // ── Sleep (10) ────────────────────────────────────────────────────────────
  {
    slug: "sleep-day-night-rhythm-later",
    title: "Day-night rhythm comes later than you'd think",
    body: "Newborn sleep is scattered across 24 hours by design. A clear day-night rhythm settles in around 8–12 weeks for most babies.",
    category: "sleep",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-short-naps-typical",
    title: "Short naps are typical and not a problem",
    body: "Twenty- and thirty-minute naps are common in the early months. They don't mean something's wrong with sleep — they mean your baby is small.",
    category: "sleep",
    ageMinMonths: 0,
    ageMaxMonths: 5,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-four-month-shift",
    title: "The 4-month shift is real, not a regression",
    body: "Around four months, infant sleep cycles mature into something closer to adult sleep — with more wakeups. It's biology, not a step backward.",
    category: "sleep",
    ageMinMonths: 3,
    ageMaxMonths: 6,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-wake-windows",
    title: "Wake windows shape the next nap",
    body: "An overtired baby sleeps worse, not more. Watching for tired cues — and starting wind-down before the meltdown — often saves the nap.",
    category: "sleep",
    ageMinMonths: 3,
    ageMaxMonths: 9,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-routines-over-schedules",
    title: "Routines matter more than schedules",
    body: "Same order, same cues — bath, book, lights down, feed. Even if the clock varies, the sequence tells the body it's time.",
    category: "sleep",
    ageMinMonths: 4,
    ageMaxMonths: 12,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-associations-are-okay",
    title: "Sleep associations form fast — that's okay",
    body: "Whatever helps your baby fall asleep tends to be what they look for at every wake. Pick associations you can live with at 3 a.m.",
    category: "sleep",
    ageMinMonths: 6,
    ageMaxMonths: 14,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-object-permanence-wakes",
    title: "Night waking can spike around object permanence",
    body: "When your baby realises you exist even when you're out of sight, you might get called back at 2 a.m. to prove it. This eases as the new skill settles.",
    category: "sleep",
    ageMinMonths: 7,
    ageMaxMonths: 12,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-two-to-one-nap",
    title: "The two-to-one nap shift has no single right age",
    body: "Some toddlers drop to one nap at twelve months, others at eighteen. Signs: long stalls before nap two, shorter night sleep, or skipping it altogether.",
    category: "sleep",
    ageMinMonths: 11,
    ageMaxMonths: 20,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-toddler-stalling",
    title: "Toddler stalling is normal — and a phase",
    body: "Water, one more book, a hug — bedtime stalling is age-appropriate, not manipulation. Calm, repeated boundaries usually do more than negotiation.",
    category: "sleep",
    ageMinMonths: 18,
    ageMaxMonths: 30,
    goalsHit: ["sleep"],
  },
  {
    slug: "sleep-crib-to-bed-vary",
    title: "Crib-to-bed transitions vary widely",
    body: "Some toddlers move at two and a half, some closer to three and a half. The trigger is usually climbing out, not the calendar.",
    category: "sleep",
    ageMinMonths: 24,
    ageMaxMonths: 36,
    goalsHit: ["sleep"],
  },

  // ── Milestones (8) ────────────────────────────────────────────────────────
  {
    slug: "milestones-tummy-time-builds-neck",
    title: "Tummy time builds neck strength",
    body: "Short bursts spread through the day add up. Chest-to-chest counts. So does a propped-up mirror.",
    category: "milestones",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-rolling-can-surprise",
    title: "Rolling can happen suddenly",
    body: "One day they can't, the next day they're across the mat. From here, never leave them on a raised surface — even briefly.",
    category: "milestones",
    ageMinMonths: 3,
    ageMaxMonths: 7,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-babbling-is-conversation",
    title: "Babbling is conversation practice",
    body: "Pausing to let your baby \"reply\" — even with vowel sounds — builds the rhythm of turn-taking that real speech needs.",
    category: "milestones",
    ageMinMonths: 4,
    ageMaxMonths: 8,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-sitting-core-strength",
    title: "Sitting independently builds core strength",
    body: "Free sitting takes weeks of wobble before it sticks. A U-shaped pillow or your hand at their hips while they reach is enough scaffolding.",
    category: "milestones",
    ageMinMonths: 6,
    ageMaxMonths: 10,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-pull-to-stand",
    title: "Pulling to stand precedes cruising",
    body: "Before walking, babies typically pull up on furniture and side-step along it. A clear, low path makes the practice safer and more inviting.",
    category: "milestones",
    ageMinMonths: 8,
    ageMaxMonths: 13,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-first-steps-timeline",
    title: "First steps land on their own timeline",
    body: "Independent walking shows up anywhere from 9 to 18 months for healthy toddlers. Most are walking by 15 months; some take longer and are still on track.",
    category: "milestones",
    ageMinMonths: 11,
    ageMaxMonths: 18,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-vocab-surges",
    title: "Vocabulary jumps in surges, not steadily",
    body: "Plateaus are normal between bursts. Naming what your toddler points to, even briefly, is the cheapest, best vocabulary-builder there is.",
    category: "milestones",
    ageMinMonths: 14,
    ageMaxMonths: 24,
    goalsHit: ["milestones"],
  },
  {
    slug: "milestones-pretend-play",
    title: "Pretend play is cognitive heavy lifting",
    body: "Pouring imaginary tea or pretending a block is a phone shows your toddler is holding two ideas in mind at once. It's a sign of brain growth, not just play.",
    category: "milestones",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["milestones"],
  },

  // ── Self-care (8) ─────────────────────────────────────────────────────────
  {
    slug: "selfcare-sleep-when-baby-sleeps",
    title: "\"Sleep when baby sleeps\" is mostly unrealistic",
    body: "Most moms get one or two windows that actually work. Naming yours — and protecting it — beats trying to nap on every schedule.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-five-minutes-outside",
    title: "Five minutes outside resets a long day",
    body: "Light on your face and a different view does more than its sounds. The bar is low and the return is real.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 8,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-ask-for-help",
    title: "Asking for help is the bravest skill",
    body: "\"Can you hold him for ten minutes?\" is a sentence worth practising. People who love you usually want a job.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 12,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-hydration-is-not-vanity",
    title: "Hydration is mom-care, not vanity",
    body: "Breastfeeding, broken sleep, and skipped meals all dehydrate you. A bottle of water within arm's reach during every feed compounds.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 12,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-mom-guilt-not-a-feature",
    title: "Mom guilt isn't a parenting feature",
    body: "Guilt and care often run together — but the guilt isn't doing the caring. Noticing it without obeying it is its own skill.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-one-adult-thing",
    title: "One adult thing a day stays",
    body: "A coffee that's still hot. A walk. A page of a book. The choice itself — that this was for you — matters as much as the thing.",
    category: "self_care",
    ageMinMonths: 6,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-no-protects-yes",
    title: "Saying no to one thing protects a yes to another",
    body: "Every yes is a no to something else. Choosing the no on purpose — instead of by default — leaves more room for the things that count.",
    category: "self_care",
    ageMinMonths: 12,
    ageMaxMonths: 36,
    goalsHit: ["self_care"],
  },
  {
    slug: "selfcare-friend-checkins",
    title: "Friend check-ins matter more, not less",
    body: "The temptation is to hibernate. A five-minute voice note to a friend tends to do more for your week than a perfectly clean house.",
    category: "self_care",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["self_care"],
  },

  // ── Safety (4) ────────────────────────────────────────────────────────────
  {
    slug: "safety-back-to-sleep",
    title: "Back to sleep, every sleep",
    body: "Placing babies on their backs for every sleep — naps included — is the strongest single thing you can do for sleep safety in the first year.",
    category: "safety",
    ageMinMonths: 0,
    ageMaxMonths: 12,
    goalsHit: ["sleep"],
    sources: ["AAP safe sleep guidance (placeholder pending review)"],
  },
  {
    slug: "safety-stair-gates-before-talks",
    title: "Stairs get gates before they get safety talks",
    body: "Mobile babies and toddlers can't be reasoned with about stairs. Physical barriers carry the load until the talks land.",
    category: "safety",
    ageMinMonths: 6,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
  },
  {
    slug: "safety-eye-level-audit",
    title: "An eye-level home audit catches a lot",
    body: "Crawling around your floor for two minutes shows you what your toddler sees: cords, magnets, the underside of the couch. Pick the worst one and fix it.",
    category: "safety",
    ageMinMonths: 9,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
  },
  {
    slug: "safety-water-constant",
    title: "Water safety is constant, not seasonal",
    body: "Bathtubs, mop buckets, pet bowls — a few inches is enough at this age. Never \"just for a second.\"",
    category: "safety",
    ageMinMonths: 12,
    ageMaxMonths: 36,
    goalsHit: ["self_care"],
  },
];

async function main() {
  console.log(`Seeding ${TIPS.length} placeholder tips…`);
  const now = new Date();
  for (const t of TIPS) {
    await prisma.tip.upsert({
      where: { slug: t.slug },
      create: {
        slug: t.slug,
        title: t.title,
        body: t.body,
        category: t.category,
        ageMinMonths: t.ageMinMonths,
        ageMaxMonths: t.ageMaxMonths,
        goalsHit: t.goalsHit,
        sources: t.sources ?? [PLACEHOLDER_SOURCE],
        publishedAt: now,
      },
      update: {
        title: t.title,
        body: t.body,
        category: t.category,
        ageMinMonths: t.ageMinMonths,
        ageMaxMonths: t.ageMaxMonths,
        goalsHit: t.goalsHit,
        sources: t.sources ?? [PLACEHOLDER_SOURCE],
        publishedAt: now,
      },
    });
  }
  const count = await prisma.tip.count({ where: { publishedAt: { not: null } } });
  console.log(`Done. ${count} published tips in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
