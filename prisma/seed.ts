/**
 * MomDaily seed data — Content Lead v1.
 *
 * Status: 50 source-backed tips, drafted by the content lead against current
 * (2022–2024) guidance from AAP, CDC, WHO, NHS, and other established
 * organizations. Each tip cites at least one source URL.
 *
 * ⚠️ Still requires clinical review before public launch.
 *    A registered pediatric clinician or RDN should sign off on every tip
 *    before it goes to real users — especially the nutrition, safety, and
 *    allergen-introduction tips. The content here reflects published guidance,
 *    not individualized medical advice, and the in-app footer must say so.
 *
 * Conventions:
 *   - Tone: warm, second-person ("your baby"), specific, never alarmist.
 *   - Sources: 1–2 URLs per tip, pointing to consumer-facing guidance pages
 *     (HealthyChildren.org, CDC, WHO, NHS, womenshealth.gov) rather than
 *     primary journal articles, so a curious mom clicking through lands
 *     somewhere she can actually use.
 *   - Slugs are stable — seed is idempotent (upsert by slug).
 *
 * To run:
 *   npm run db:seed
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
  sources: string[];
}

const TIPS: SeedTip[] = [
  // ── Nutrition (20) ────────────────────────────────────────────────────────
  {
    slug: "nutrition-trust-hunger-cues",
    title: "Watch for early hunger cues, not the clock",
    body: "Rooting, putting hands to the mouth, sucking on fingers, and turning toward your chest are early hunger signs. Crying is a late one — it's harder to feed a crying baby than one who's just stirring. The AAP recommends feeding on cue in the early months rather than by a fixed schedule.",
    category: "nutrition",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Making-Sure-Your-Baby-is-Getting-Enough-Milk.aspx",
    ],
  },
  {
    slug: "nutrition-cluster-feeding-normal",
    title: "Cluster feeding is normal, especially in growth spurts",
    body: "It's common for newborns to feed every 30–60 minutes for a stretch — often in the evening, often during growth spurts around 2–3 weeks, 6 weeks, and 3 months. It doesn't mean your supply is low. Set up a snack, water, and your phone within arm's reach and ride it out.",
    category: "nutrition",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["feeding", "self_care"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Making-Sure-Your-Baby-is-Getting-Enough-Milk.aspx",
    ],
  },
  {
    slug: "nutrition-wet-diaper-check",
    title: "Wet diapers are the most reliable intake check",
    body: "From about day five onward, expect at least six wet diapers in 24 hours, plus three or more soft, yellow stools in the early weeks. This is a more dependable signal than how long any individual feed lasted or how full your breast feels.",
    category: "nutrition",
    ageMinMonths: 0,
    ageMaxMonths: 6,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Making-Sure-Your-Baby-is-Getting-Enough-Milk.aspx",
    ],
  },
  {
    slug: "nutrition-solids-readiness-signs",
    title: "Solids readiness shows up in the body, not the calendar",
    body: "The AAP suggests starting solids around 6 months, but the real go-signal is your baby: sitting with little support, holding their head steady, opening their mouth when food comes near, and no longer pushing food out with the tongue. If those aren't there yet, waiting a week or two is fine.",
    category: "nutrition",
    ageMinMonths: 4,
    ageMaxMonths: 7,
    goalsHit: ["feeding", "milestones"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Bite-Sized-Milestones-Signs-of-Solid-Food-Readiness-.aspx",
      "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html",
    ],
  },
  {
    slug: "nutrition-iron-around-six-months",
    title: "Iron stores start to dip around six months",
    body: "Babies are born with iron stores that gradually deplete over the first half-year. From about six months, WHO recommends iron-rich complementary foods alongside breast milk or formula — soft-cooked meats, iron-fortified infant cereals, lentils, and beans are good starting points.",
    category: "nutrition",
    ageMinMonths: 5,
    ageMaxMonths: 9,
    goalsHit: ["feeding"],
    sources: [
      "https://www.ncbi.nlm.nih.gov/books/NBK596423/",
      "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx",
    ],
  },
  {
    slug: "nutrition-first-foods-simple",
    title: "First foods can be one ingredient at a time",
    body: "There's no rule about starting with rice cereal — you can start with mashed avocado, sweet potato, banana, or iron-fortified infant cereal. Introducing one new food every two to three days makes it easier to spot reactions, and keeps the first week of solids low-stakes.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 9,
    goalsHit: ["feeding"],
    sources: [
      "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html",
    ],
  },
  {
    slug: "nutrition-texture-over-variety",
    title: "Repeat a new texture for a few days before moving on",
    body: "A new texture is its own skill. Letting one food repeat for two to three days while your baby learns to manage it on the tongue and palate isn't fussiness — it's chewing development. The variety can build over weeks, not days.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 10,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx",
    ],
  },
  {
    slug: "nutrition-touching-food-is-learning",
    title: "Letting your baby touch food is part of the lesson",
    body: "Squishing, smearing, dropping — it looks like play but it's how babies learn what food is. Letting them explore with their hands at every meal supports later self-feeding and tends to make for less picky eaters. A wipeable mat under the chair pays for itself quickly.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 14,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx",
    ],
  },
  {
    slug: "nutrition-reactions-time-to-spot",
    title: "Most food reactions show up within two hours",
    body: "Hives, swelling, vomiting, or wheezing after a new food usually appears within minutes to two hours. Introducing new allergens earlier in the day — and at home, not at a restaurant — gives you the best chance to spot anything and respond. Call 911 for any breathing difficulty.",
    category: "nutrition",
    ageMinMonths: 6,
    ageMaxMonths: 12,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/news/Pages/Early-Introduction-of-Peanut-based-Foods-to-Prevent-Allergies.aspx",
    ],
  },
  {
    slug: "nutrition-allergens-one-at-a-time",
    title: "Early allergen introduction is now recommended",
    body: "Guidelines changed in 2017: the AAP now recommends introducing common allergens — peanut, egg, dairy, wheat, soy, fish, tree nuts — between 4 and 6 months for high-risk babies, and around 6 months for others. Earlier introduction has been shown to lower the risk of peanut allergy by over 80% in high-risk infants. Whole peanuts are a choking hazard; use thinned peanut butter, peanut puffs, or peanut powder mixed into food.",
    category: "nutrition",
    ageMinMonths: 4,
    ageMaxMonths: 12,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/news/Pages/Early-Introduction-of-Peanut-based-Foods-to-Prevent-Allergies.aspx",
      "https://www.foodallergy.org/resources/peanut-early-introduction-guidelines",
    ],
  },
  {
    slug: "nutrition-self-feeding-mess",
    title: "Self-feeding is messy and worth it",
    body: "Handing your baby a pre-loaded spoon, or letting them pick up soft finger foods, builds pincer grasp, oral coordination, and independence. Expect more food on the floor than in the mouth for weeks — that's the work. The CDC notes that learning to self-feed is one of the most important feeding skills of the first year.",
    category: "nutrition",
    ageMinMonths: 8,
    ageMaxMonths: 14,
    goalsHit: ["feeding", "milestones"],
    sources: [
      "https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/finger-foods.html",
    ],
  },
  {
    slug: "nutrition-iron-rich-brain",
    title: "Iron-rich foods support brain development",
    body: "Iron deficiency in the first two years can affect cognitive development. Pediatricians recommend iron-rich foods most days — meat, eggs, beans, lentils, fortified cereals — alongside vitamin-C foods (peppers, citrus, tomatoes) which roughly double iron absorption. A routine doesn't have to be elaborate to hit the mark.",
    category: "nutrition",
    ageMinMonths: 9,
    ageMaxMonths: 14,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Iron-Needed-by-Toddlers.aspx",
    ],
  },
  {
    slug: "nutrition-cup-transition-slow",
    title: "Cup transitions take weeks, not a day",
    body: "The AAP recommends introducing a cup around 6 months and weaning off bottles by 18 months. Open cups and straw cups both build mouth coordination better than sippy cups with hard spouts. Practising at one meal a day — water, small amounts, no pressure — is enough to make the change stick.",
    category: "nutrition",
    ageMinMonths: 10,
    ageMaxMonths: 18,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Discontinuing-the-Bottle.aspx",
    ],
  },
  {
    slug: "nutrition-toddler-appetite-slowdown",
    title: "Appetite slows down after the first birthday",
    body: "Growth rate drops sharply after twelve months, and so does appetite. A toddler eating a quarter of what they ate at nine months is usually fine. Offer balanced meals on a schedule, let them decide how much to eat from what's offered, and don't pressure clean plates — this is the Satter Division of Responsibility, the most widely-recommended toddler feeding framework.",
    category: "nutrition",
    ageMinMonths: 12,
    ageMaxMonths: 20,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Selecting-Snacks-for-Toddlers.aspx",
      "https://www.ellynsatterinstitute.org/how-to-feed/the-division-of-responsibility-in-feeding/",
    ],
  },
  {
    slug: "nutrition-repeated-exposure",
    title: "Repeated exposure beats one-shot tries",
    body: "Research suggests it can take 10–15 exposures before a young child accepts a new food. Putting it on the plate alongside familiar foods, without pressure or commentary, is the work. Refusing today doesn't mean refusing forever — sometimes the breakthrough is the eighth offer.",
    category: "nutrition",
    ageMinMonths: 12,
    ageMaxMonths: 24,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx",
    ],
  },
  {
    slug: "nutrition-family-meals-teach",
    title: "Family meals teach more than the food itself",
    body: "Eating together — even ten minutes, even just one parent — improves toddler diet quality, vocabulary, and emotional regulation in the long run. Sitting at the same surface and naming what's on the plate matters more than candlelight or three courses.",
    category: "nutrition",
    ageMinMonths: 12,
    ageMaxMonths: 36,
    goalsHit: ["feeding", "self_care"],
    sources: [
      "https://www.healthychildren.org/English/healthy-living/nutrition/Pages/The-Benefits-of-Eating-Together-as-a-Family.aspx",
    ],
  },
  {
    slug: "nutrition-saying-no-is-okay",
    title: "Letting a toddler refuse food is part of healthy eating",
    body: "Toddlers learning to say \"no\" to food are practising autonomy, not rejecting you. Pediatric feeding experts consistently advise against pressuring, bribing, or making a separate meal. Calm offering — \"this is what's for dinner, you can choose how much\" — supports better long-term eating than a battle won at the table.",
    category: "nutrition",
    ageMinMonths: 15,
    ageMaxMonths: 30,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx",
    ],
  },
  {
    slug: "nutrition-snack-windows",
    title: "Structured snack windows beat all-day grazing",
    body: "Predictable meal and snack times — typically three meals and two to three snacks — build appetite for actual eating. A toddler who's been nibbling all morning rarely shows up hungry at lunch. Water (not milk or juice) between scheduled times helps.",
    category: "nutrition",
    ageMinMonths: 15,
    ageMaxMonths: 36,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Selecting-Snacks-for-Toddlers.aspx",
    ],
  },
  {
    slug: "nutrition-two-textures-widen-palate",
    title: "Pair a familiar food with something new",
    body: "Putting one new food next to two or three already-loved foods lowers the bar for trying it. The new food sits next to a friend. Over time, this neutral exposure — without commentary or pressure — does more than any \"three more bites\" rule.",
    category: "nutrition",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["feeding"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/Picky-Eaters.aspx",
    ],
  },
  {
    slug: "nutrition-cooking-together",
    title: "Cooking together is a real learning channel",
    body: "Toddlers who help in the kitchen — pouring, stirring, washing produce, naming colours — eat a wider variety of foods in studies, and pick up vocabulary, sequencing, and motor skills along the way. Five minutes counts. A stool, a wooden spoon, and a bowl is enough setup.",
    category: "nutrition",
    ageMinMonths: 24,
    ageMaxMonths: 36,
    goalsHit: ["feeding", "milestones"],
    sources: [
      "https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Cooking-with-your-Children.aspx",
    ],
  },

  // ── Sleep (10) ────────────────────────────────────────────────────────────
  {
    slug: "sleep-day-night-rhythm-later",
    title: "Day-night rhythm shows up later than you'd think",
    body: "Newborn sleep is genuinely random across 24 hours — they don't have circadian rhythm yet. Most babies start consolidating night sleep around 8–12 weeks. Bright light and activity by day, dim and quiet by night, helps the rhythm form — but you can't rush biology.",
    category: "sleep",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/Getting-Your-Baby-to-Sleep.aspx",
    ],
  },
  {
    slug: "sleep-short-naps-typical",
    title: "Short naps are typical in the early months",
    body: "Twenty- to forty-minute naps are normal for newborns through about four months — they're sleeping through one sleep cycle and waking. It doesn't mean something is broken. Naps tend to consolidate into longer chunks somewhere between four and six months.",
    category: "sleep",
    ageMinMonths: 0,
    ageMaxMonths: 5,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/Getting-Your-Baby-to-Sleep.aspx",
    ],
  },
  {
    slug: "sleep-four-month-shift",
    title: "The 4-month \"regression\" is sleep maturing, not regressing",
    body: "Around three to four months, infant sleep cycles mature into something closer to adult sleep — with more brief wakings between cycles. It's biological, not a step backward. Many babies who slept well at six weeks wake more at four months, then settle again.",
    category: "sleep",
    ageMinMonths: 3,
    ageMaxMonths: 6,
    goalsHit: ["sleep"],
    sources: [
      "https://www.zerotothree.org/resource/4-month-sleep-regression-what-it-is-and-what-to-do-about-it/",
    ],
  },
  {
    slug: "sleep-wake-windows",
    title: "Overtired sleeps worse, not more",
    body: "An overtired baby is harder to put down, wakes more, and naps shorter. Watching for tired cues — staring off, rubbing eyes, getting fussy — and starting wind-down before the meltdown often saves the nap. Typical wake windows lengthen from ~45 minutes at 1 month to ~2.5 hours at 6 months.",
    category: "sleep",
    ageMinMonths: 3,
    ageMaxMonths: 9,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/Getting-Your-Baby-to-Sleep.aspx",
    ],
  },
  {
    slug: "sleep-routines-over-schedules",
    title: "Routines matter more than schedules",
    body: "A consistent bedtime sequence — bath, book, lights down, last feed, song — signals \"sleep is coming\" more reliably than a strict clock-based schedule. Research links predictable bedtime routines to faster sleep onset and fewer night wakings in babies and toddlers.",
    category: "sleep",
    ageMinMonths: 4,
    ageMaxMonths: 24,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/healthy-living/sleep/Pages/healthy-sleep-habits-how-many-hours-does-your-child-need.aspx",
    ],
  },
  {
    slug: "sleep-associations-are-okay",
    title: "Sleep associations form fast — choose ones you can live with",
    body: "Whatever your baby falls asleep with — rocking, feeding, white noise, your hand on their chest — is what they'll look for at every wake. Pick associations you can sustain at 3 a.m. Some, like consistent white noise or a sleep sack, are easy to keep. Others, like a 40-minute rock, may not be.",
    category: "sleep",
    ageMinMonths: 6,
    ageMaxMonths: 14,
    goalsHit: ["sleep"],
    sources: [
      "https://www.zerotothree.org/resource/healthy-sleep-habits-for-young-children/",
    ],
  },
  {
    slug: "sleep-object-permanence-wakes",
    title: "Night waking often spikes around object permanence",
    body: "When your baby realises you exist even when out of sight (around 7–9 months), you might suddenly get called back at 2 a.m. to prove it. This developmental burst — combined with new mobility — explains a lot of \"regressions\" around this age. It typically settles within a few weeks.",
    category: "sleep",
    ageMinMonths: 7,
    ageMaxMonths: 12,
    goalsHit: ["sleep"],
    sources: [
      "https://www.zerotothree.org/resource/healthy-sleep-habits-for-young-children/",
    ],
  },
  {
    slug: "sleep-two-to-one-nap",
    title: "Two-to-one nap shift has no single right age",
    body: "Most toddlers move from two naps to one between 13 and 18 months. Signs: long stalls before the second nap, shorter night sleep, or skipping nap two altogether. The transition is bumpy for a couple of weeks — an earlier bedtime helps bridge it.",
    category: "sleep",
    ageMinMonths: 11,
    ageMaxMonths: 20,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/Pages/Naps-Are-Important-Toddlers.aspx",
    ],
  },
  {
    slug: "sleep-toddler-stalling",
    title: "Toddler bedtime stalling is age-appropriate, not manipulation",
    body: "Water, one more book, a hug, the bathroom — toddler stalling at bedtime is developmentally normal. Calm, repeated boundaries usually do more than negotiation. A predictable count of \"one book, two songs, lights out\" gives them control inside structure.",
    category: "sleep",
    ageMinMonths: 18,
    ageMaxMonths: 30,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/Pages/Sleep-Problems-in-Children.aspx",
    ],
  },
  {
    slug: "sleep-crib-to-bed-vary",
    title: "Crib-to-bed transitions vary widely",
    body: "Most kids move to a bed between 18 months and 3.5 years. The usual trigger is climbing out (a safety issue), expecting a new baby, or potty training. If none of those apply, there's no rush — the crib is the safer sleep space as long as it's working.",
    category: "sleep",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/toddler/Pages/Moving-from-Crib-to-Bed.aspx",
    ],
  },

  // ── Milestones (8) ────────────────────────────────────────────────────────
  {
    slug: "milestones-tummy-time-builds-neck",
    title: "Tummy time starts at hospital discharge",
    body: "The AAP recommends starting supervised, awake tummy time as soon as you get home, building to 15–30 minutes total per day by about 7 weeks. Short bursts spread through the day count. Chest-to-chest counts. A mirror or your face inches away helps.",
    category: "milestones",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["milestones"],
    sources: [
      "https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/Sleep-Related-Infant-Deaths-Updated-2022",
      "https://www.healthychildren.org/English/ages-stages/baby/Pages/The-Importance-of-Tummy-Time.aspx",
    ],
  },
  {
    slug: "milestones-rolling-can-surprise",
    title: "Rolling can happen suddenly — never leave baby on a raised surface",
    body: "The CDC milestone for rolling moved from 4 months to 6 months in the 2022 update, but plenty of babies surprise their parents earlier. From the first roll on, never leave your baby on a bed, couch, or changing table — even \"just for a second.\" The floor is the safest place.",
    category: "milestones",
    ageMinMonths: 3,
    ageMaxMonths: 7,
    goalsHit: ["milestones"],
    sources: [
      "https://www.cdc.gov/act-early/milestones/index.html",
    ],
  },
  {
    slug: "milestones-babbling-is-conversation",
    title: "Babbling is conversation practice — pause to \"reply\"",
    body: "When your baby babbles, looking at them and replying — even with nonsense back — builds the rhythm of turn-taking that real conversation needs. Studies of \"serve and return\" interactions show this is one of the most powerful things you can do for language development.",
    category: "milestones",
    ageMinMonths: 4,
    ageMaxMonths: 10,
    goalsHit: ["milestones"],
    sources: [
      "https://developingchild.harvard.edu/resources/serve-and-return/",
    ],
  },
  {
    slug: "milestones-sitting-core-strength",
    title: "Sitting independently builds core strength",
    body: "Free sitting takes weeks of wobble before it sticks. The CDC milestone is sitting without support by 9 months. A U-shaped pillow or your hand at the hips while they reach forward is enough scaffolding — propped sitting in seats for long stretches actually slows the skill down.",
    category: "milestones",
    ageMinMonths: 6,
    ageMaxMonths: 10,
    goalsHit: ["milestones"],
    sources: [
      "https://www.cdc.gov/act-early/milestones/milestones-9mo.html",
    ],
  },
  {
    slug: "milestones-pull-to-stand",
    title: "Pulling to stand precedes walking by months",
    body: "Most babies pull to stand and \"cruise\" along furniture before they walk independently. A clear, low path along couches and tables makes the practice safer and more inviting. Falls are part of the learning curve — a rug under the practice zone is more useful than hovering.",
    category: "milestones",
    ageMinMonths: 8,
    ageMaxMonths: 14,
    goalsHit: ["milestones"],
    sources: [
      "https://www.cdc.gov/act-early/milestones/milestones-12mo.html",
    ],
  },
  {
    slug: "milestones-first-steps-timeline",
    title: "First steps land between 9 and 18 months",
    body: "The CDC's updated milestone (2022) is independent walking by 15 months — that's the 75th percentile. Healthy walkers show up anywhere from 9 to 18 months. If your child isn't walking by 18 months, mention it at the next check-up; before then, you're inside the normal window.",
    category: "milestones",
    ageMinMonths: 11,
    ageMaxMonths: 18,
    goalsHit: ["milestones"],
    sources: [
      "https://www.cdc.gov/act-early/milestones/milestones-15mo.html",
    ],
  },
  {
    slug: "milestones-vocab-surges",
    title: "Vocabulary jumps in surges, not steadily",
    body: "Plateaus between word bursts are normal. The CDC 2022 milestones expect three or more words other than \"mama\" or \"dada\" by 15 months, and a small phrase (two-word combinations) by 24 months. Naming what your toddler points to is the cheapest, most powerful vocabulary tool.",
    category: "milestones",
    ageMinMonths: 14,
    ageMaxMonths: 24,
    goalsHit: ["milestones"],
    sources: [
      "https://www.cdc.gov/act-early/milestones/milestones-2yr.html",
    ],
  },
  {
    slug: "milestones-pretend-play",
    title: "Pretend play is cognitive heavy lifting",
    body: "Pouring imaginary tea, feeding a stuffed animal, or pretending a block is a phone shows your toddler is holding two ideas in mind at once. It's a major sign of cognitive growth and an early building block for empathy and language. Joining in — briefly — is plenty.",
    category: "milestones",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["milestones"],
    sources: [
      "https://www.cdc.gov/act-early/milestones/milestones-2yr.html",
      "https://www.zerotothree.org/resource/the-power-of-play-pretend-play/",
    ],
  },

  // ── Self-care (8) ─────────────────────────────────────────────────────────
  {
    slug: "selfcare-sleep-when-baby-sleeps",
    title: "\"Sleep when baby sleeps\" is mostly unrealistic — find what works",
    body: "Most moms get one or two windows that actually let them rest. Identifying yours — and protecting it from chores, scrolling, or visitors — beats trying to nap on every schedule. Even a 20-minute rest with eyes closed lowers fatigue measurably.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 4,
    goalsHit: ["self_care"],
    sources: [
      "https://www.womenshealth.gov/mental-health/mental-health-conditions/postpartum-depression",
    ],
  },
  {
    slug: "selfcare-five-minutes-outside",
    title: "Five minutes of daylight resets a long day",
    body: "Morning light exposure is one of the best-studied mood and sleep regulators we have. Five to ten minutes outside in natural light — even on a cloudy day — supports your own circadian rhythm and your baby's. The bar is low and the return is real.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 8,
    goalsHit: ["self_care"],
    sources: [
      "https://www.womenshealth.gov/mental-health/mental-health-conditions/postpartum-depression",
    ],
  },
  {
    slug: "selfcare-ask-for-help",
    title: "Postpartum mood symptoms past two weeks deserve a call",
    body: "Baby blues — mood swings, weepiness, anxiety — usually resolve within two weeks of birth. If sadness, hopelessness, intrusive thoughts, or anxiety stick around longer than that, or feel severe at any point, that's postpartum depression or anxiety (PMAD). It's common, treatable, and not your fault. Call your provider or 1-833-852-6262 (US Maternal Mental Health Hotline).",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 12,
    goalsHit: ["self_care"],
    sources: [
      "https://www.womenshealth.gov/mental-health/mental-health-conditions/postpartum-depression",
      "https://mchb.hrsa.gov/programs-impact/national-maternal-mental-health-hotline",
    ],
  },
  {
    slug: "selfcare-hydration-is-not-vanity",
    title: "Hydration is mom-care, not vanity",
    body: "Breastfeeding adds roughly 700 ml/day to your fluid needs. Broken sleep and skipped meals compound dehydration, which makes everything — mood, milk supply, energy — harder. A water bottle within arm's reach at every feed is a small habit that compounds.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 12,
    goalsHit: ["self_care"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Nutrition-and-Hydration-While-Breastfeeding.aspx",
    ],
  },
  {
    slug: "selfcare-mom-guilt-not-a-feature",
    title: "Mom guilt isn't a parenting feature — it's a feeling to notice",
    body: "Guilt and care often run together, but the guilt isn't doing the caring. Noticing it (\"this is guilt, not information\") without obeying it is its own skill. Persistent, overwhelming guilt — especially when it's about being a \"bad mom\" — can be a sign of PMAD and is worth bringing up with a provider.",
    category: "self_care",
    ageMinMonths: 0,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
    sources: [
      "https://www.womenshealth.gov/mental-health/mental-health-conditions/postpartum-depression",
    ],
  },
  {
    slug: "selfcare-one-adult-thing",
    title: "One adult thing a day stays",
    body: "Coffee that's still hot. A walk. A page of a book. The choice itself — that this was for you, on purpose — matters as much as the activity. Tiny rituals of self-direction are linked to lower burnout in caregivers.",
    category: "self_care",
    ageMinMonths: 6,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
    sources: [
      "https://www.zerotothree.org/resource/taking-care-of-yourself/",
    ],
  },
  {
    slug: "selfcare-no-protects-yes",
    title: "Saying no to one thing protects a yes to another",
    body: "Every yes is a no to something else. Choosing the no on purpose — instead of by default — leaves more room for what counts. Boundary practice in the toddler years is often the first time many parents do it with adults, too.",
    category: "self_care",
    ageMinMonths: 12,
    ageMaxMonths: 36,
    goalsHit: ["self_care"],
    sources: [
      "https://www.zerotothree.org/resource/taking-care-of-yourself/",
    ],
  },
  {
    slug: "selfcare-friend-checkins",
    title: "Friend check-ins matter more, not less",
    body: "Social connection is one of the strongest protective factors against postpartum depression and burnout. The hibernation impulse is real and worth resisting — a five-minute voice note to a friend tends to do more for your week than a perfectly clean house.",
    category: "self_care",
    ageMinMonths: 18,
    ageMaxMonths: 36,
    goalsHit: ["self_care"],
    sources: [
      "https://www.womenshealth.gov/mental-health/mental-health-conditions/postpartum-depression",
    ],
  },

  // ── Safety (4) ────────────────────────────────────────────────────────────
  {
    slug: "safety-back-to-sleep",
    title: "Back to sleep, every sleep, until age 1 (AAP 2022)",
    body: "Place your baby on their back for every sleep — naps included — until their first birthday. Use a firm, flat (not inclined) surface in a crib, bassinet, or playard, with a fitted sheet and nothing else: no blankets, pillows, bumpers, or stuffed animals. Room-sharing without bed-sharing for the first 6 months reduces SIDS risk by up to 50%.",
    category: "safety",
    ageMinMonths: 0,
    ageMaxMonths: 12,
    goalsHit: ["sleep"],
    sources: [
      "https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx",
      "https://publications.aap.org/pediatrics/article/150/1/e2022057990/188304/Sleep-Related-Infant-Deaths-Updated-2022",
    ],
  },
  {
    slug: "safety-stair-gates-before-talks",
    title: "Stairs get gates before they get safety talks",
    body: "Mobile babies and toddlers can't be reasoned with about stairs. Install hardware-mounted gates at the top of stairs (pressure-mounted gates can fail) and a gate at the bottom too. Falls down stairs are one of the most common injury hospitalizations in this age group.",
    category: "safety",
    ageMinMonths: 6,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
    sources: [
      "https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Safety-Around-The-House.aspx",
    ],
  },
  {
    slug: "safety-eye-level-audit",
    title: "An eye-level home audit catches a lot",
    body: "Crawling around your floor for two minutes shows you what your toddler sees: small magnets, button batteries, cords, dishwasher tablets, the underside of the couch. Button batteries and high-powered magnets are two of the most dangerous household hazards for under-3s — both warrant an ER visit if swallowed.",
    category: "safety",
    ageMinMonths: 9,
    ageMaxMonths: 24,
    goalsHit: ["self_care"],
    sources: [
      "https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Button-Battery-Injuries-in-Children-A-Growing-Risk.aspx",
    ],
  },
  {
    slug: "safety-water-constant",
    title: "Water safety needs constant, close supervision",
    body: "Drowning is the leading cause of injury death for children ages 1–4 in the US. A few inches of water — bathtub, mop bucket, pet bowl, kiddie pool — is enough. \"Touch supervision\" (an adult within arm's reach, eyes on the child, no phone) is the standard around water, even briefly.",
    category: "safety",
    ageMinMonths: 12,
    ageMaxMonths: 36,
    goalsHit: ["self_care"],
    sources: [
      "https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx",
    ],
  },
];

async function main() {
  console.log(`Seeding ${TIPS.length} tips…`);
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
        sources: t.sources,
        publishedAt: now,
      },
      update: {
        title: t.title,
        body: t.body,
        category: t.category,
        ageMinMonths: t.ageMinMonths,
        ageMaxMonths: t.ageMaxMonths,
        goalsHit: t.goalsHit,
        sources: t.sources,
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
