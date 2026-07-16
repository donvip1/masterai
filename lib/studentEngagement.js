const LEVEL_SIZE = 500;
const STREAK_GAP_DAYS = 3;

const levelTitles = [
  "AI Explorer",
  "Prompt Builder",
  "Creative Maker",
  "Workflow Specialist",
  "AI Professional",
  "Academy Master"
];

function dayNumber(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) / 86400000;
}

function engagementActivityDates(quizState) {
  if (Array.isArray(quizState.activityDates) && quizState.activityDates.length) {
    return quizState.activityDates;
  }

  const resultDates = Object.values(quizState.results || {})
    .map((result) => result?.submittedAt)
    .filter(Boolean);

  if (quizState.latestResult?.submittedAt) {
    resultDates.push(quizState.latestResult.submittedAt);
  }

  return resultDates;
}

function calculateLearningStreak(activityDates, now, timeZone) {
  const today = dayNumber(now, timeZone);
  const activeDays = [...new Set(
    activityDates
      .map((value) => dayNumber(value, timeZone))
      .filter((value) => value !== null)
  )].sort((first, second) => second - first);

  if (!activeDays.length || today - activeDays[0] > STREAK_GAP_DAYS) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < activeDays.length; index += 1) {
    const gap = activeDays[index - 1] - activeDays[index];

    if (gap > STREAK_GAP_DAYS) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function nextMilestone(passedAttempts, totalModules) {
  const standardTargets = [1, 3, 5, 8, 10, totalModules];
  const cycleTarget = Math.ceil((passedAttempts + 1) / totalModules) * totalModules;
  const targets = [...new Set([...standardTargets, cycleTarget])]
    .filter((target) => target > 0)
    .sort((first, second) => first - second);
  const target = targets.find((value) => value > passedAttempts) || passedAttempts + totalModules;
  const previousTarget = [...targets].reverse().find((value) => value <= passedAttempts) || 0;
  const progress = target === previousTarget
    ? 100
    : Math.round(((passedAttempts - previousTarget) / (target - previousTarget)) * 100);

  return {
    target,
    remaining: Math.max(target - passedAttempts, 0),
    progress: Math.max(0, Math.min(progress, 100))
  };
}

export function calculateStudentEngagement(quizState, options = {}) {
  const now = options.now || new Date();
  const timeZone = options.timeZone || "Africa/Lagos";
  const totalModules = Math.max(Number(quizState.totalModules) || 15, 1);
  const completedCycles = Math.max((Number(quizState.cycle) || 1) - 1, 0);
  const completedCurrentCycle = Number(quizState.completedCount) || 0;
  const fallbackPasses = completedCycles * totalModules + completedCurrentCycle;
  const passedAttempts = Math.max(Number(quizState.passedAttemptsCount) || fallbackPasses, fallbackPasses);
  const totalAttempts = Math.max(Number(quizState.totalAttemptsCount) || 0, passedAttempts);
  const perfectScores = Number(quizState.perfectScoresCount) || 0;
  const bestScore = Number(quizState.bestScore) || Number(quizState.latestResult?.percentage) || 0;
  const streak = calculateLearningStreak(engagementActivityDates(quizState), now, timeZone);
  const xp = 50 + passedAttempts * 100 + totalAttempts * 20 + perfectScores * 50 + completedCycles * 250;
  const level = Math.floor(xp / LEVEL_SIZE) + 1;
  const levelProgressXp = xp % LEVEL_SIZE;
  const levelProgress = Math.round((levelProgressXp / LEVEL_SIZE) * 100);
  const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];
  const milestone = nextMilestone(passedAttempts, totalModules);
  const badges = [
    {
      id: "first-step",
      icon: "01",
      title: "First Step",
      description: "Submit your first module quiz.",
      unlocked: totalAttempts >= 1
    },
    {
      id: "module-finisher",
      icon: "02",
      title: "Module Finisher",
      description: "Pass your first academy module.",
      unlocked: passedAttempts >= 1
    },
    {
      id: "persistent-learner",
      icon: "03",
      title: "Persistent Learner",
      description: "Complete at least three quiz attempts.",
      unlocked: totalAttempts >= 3
    },
    {
      id: "streak-builder",
      icon: "04",
      title: "Streak Builder",
      description: "Stay active across three learning days.",
      unlocked: streak >= 3
    },
    {
      id: "halfway-hero",
      icon: "05",
      title: "Halfway Hero",
      description: "Pass half of the academy modules.",
      unlocked: passedAttempts >= Math.ceil(totalModules / 2)
    },
    {
      id: "perfect-score",
      icon: "06",
      title: "Perfect Score",
      description: "Earn 100% in a module quiz.",
      unlocked: perfectScores >= 1 || bestScore >= 100
    },
    {
      id: "course-champion",
      icon: "07",
      title: "Course Champion",
      description: "Complete a full academy quiz cycle.",
      unlocked: completedCycles >= 1
    },
    {
      id: "academy-master",
      icon: "08",
      title: "Academy Master",
      description: "Reach Level 6 through consistent progress.",
      unlocked: level >= 6
    }
  ];

  return {
    xp,
    level,
    levelTitle,
    levelProgress,
    levelProgressXp,
    xpToNextLevel: LEVEL_SIZE - levelProgressXp,
    streak,
    passedAttempts,
    totalAttempts,
    completedCycles,
    bestScore,
    milestone,
    badges,
    unlockedBadges: badges.filter((badge) => badge.unlocked).length
  };
}
