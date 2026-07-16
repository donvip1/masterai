"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { academyData } from "../lib/academyData";
import { calculateStudentEngagement } from "../lib/studentEngagement";

const celebrationDuration = 5200;

function motivationFor(engagement, quizState) {
  if (engagement.completedCycles > 0) {
    return "You have completed a full learning cycle. Keep sharpening your skills and building stronger portfolio work.";
  }

  if (engagement.passedAttempts >= Math.ceil((quizState.totalModules || 15) / 2)) {
    return "You are beyond the halfway point. Consistency now turns your learning into a professional skill set.";
  }

  if (engagement.passedAttempts > 0) {
    return "Your momentum is building. Complete the next available module to grow your XP and unlock another badge.";
  }

  return "Your first quiz unlocks XP, starts your learning streak, and earns your first achievement badge.";
}

export default function StudentEngagement({ quizState, studentId, ready = false }) {
  const engagement = useMemo(
    () => calculateStudentEngagement(quizState, { timeZone: academyData.academy.liveClasses.timeZone }),
    [quizState]
  );
  const [celebration, setCelebration] = useState(null);

  useEffect(() => {
    if (!ready || !studentId) {
      return undefined;
    }

    const storageKey = `eff-academy-engagement-${studentId}`;
    let previous = null;

    try {
      previous = JSON.parse(window.localStorage.getItem(storageKey) || "null");
    } catch (error) {
      previous = null;
    }

    if (previous) {
      if (engagement.level > Number(previous.level || 0)) {
        setCelebration({
          label: "Level up",
          title: `You reached Level ${engagement.level}: ${engagement.levelTitle}`,
          detail: `${engagement.xp.toLocaleString("en-NG")} total XP earned.`
        });
      } else if (engagement.passedAttempts > Number(previous.passedAttempts || 0)) {
        setCelebration({
          label: "Milestone unlocked",
          title: "Another module completed!",
          detail: `You now have ${engagement.passedAttempts} passed module${engagement.passedAttempts === 1 ? "" : "s"}.`
        });
      } else if (engagement.unlockedBadges > Number(previous.unlockedBadges || 0)) {
        setCelebration({
          label: "New achievement",
          title: "A new badge has been unlocked.",
          detail: `You have earned ${engagement.unlockedBadges} achievement badge${engagement.unlockedBadges === 1 ? "" : "s"}.`
        });
      }
    }

    window.localStorage.setItem(storageKey, JSON.stringify({
      level: engagement.level,
      passedAttempts: engagement.passedAttempts,
      unlockedBadges: engagement.unlockedBadges
    }));

    return undefined;
  }, [engagement.level, engagement.levelTitle, engagement.passedAttempts, engagement.unlockedBadges, engagement.xp, ready, studentId]);

  useEffect(() => {
    if (!celebration) {
      return undefined;
    }

    const timer = window.setTimeout(() => setCelebration(null), celebrationDuration);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  const nextAction = quizState.canAttempt
    ? "Your current module quiz is available now."
    : "Review your last lesson while the next assessment unlocks.";

  return (
    <>
      {celebration && (
        <aside className="milestone-celebration" role="status" aria-live="polite">
          <div className="celebration-spark spark-one" />
          <div className="celebration-spark spark-two" />
          <div className="celebration-spark spark-three" />
          <span>{celebration.label}</span>
          <strong>{celebration.title}</strong>
          <p>{celebration.detail}</p>
          <button type="button" onClick={() => setCelebration(null)} aria-label="Close celebration">×</button>
        </aside>
      )}

      <section className="engagement-hub">
        <div className="dashboard-card-heading engagement-heading">
          <div>
            <span>Learning Momentum</span>
            <h2>Your XP, streak, and achievements</h2>
          </div>
          <strong className="engagement-level-pill">Level {engagement.level} · {engagement.levelTitle}</strong>
        </div>

        <div className="engagement-overview">
          <article className="level-progress-card">
            <div
              className="level-progress-ring"
              style={{ "--level-progress": `${engagement.levelProgress * 3.6}deg` }}
              aria-label={`${engagement.levelProgress}% progress to the next level`}
            >
              <span>Level</span>
              <strong>{engagement.level}</strong>
            </div>
            <div>
              <span>Total Experience</span>
              <strong>{engagement.xp.toLocaleString("en-NG")} XP</strong>
              <p>{engagement.xpToNextLevel} XP until Level {engagement.level + 1}</p>
              <div className="engagement-progress-track" aria-hidden="true">
                <span style={{ width: `${engagement.levelProgress}%` }} />
              </div>
            </div>
          </article>

          <article className="engagement-stat-card streak-card">
            <span>Learning Streak</span>
            <strong>{engagement.streak} day{engagement.streak === 1 ? "" : "s"}</strong>
            <p>Activity within each three-day class rhythm keeps the streak alive.</p>
          </article>

          <article className="engagement-stat-card milestone-card">
            <span>Next Milestone</span>
            <strong>{engagement.milestone.target} modules</strong>
            <p>{engagement.milestone.remaining} more pass{engagement.milestone.remaining === 1 ? "" : "es"} to unlock it.</p>
            <div className="engagement-progress-track" aria-hidden="true">
              <span style={{ width: `${engagement.milestone.progress}%` }} />
            </div>
          </article>

          <article className="engagement-stat-card achievement-count-card">
            <span>Achievements</span>
            <strong>{engagement.unlockedBadges}/{engagement.badges.length}</strong>
            <p>{nextAction}</p>
            <Link className="mini-link" href="/quiz">Continue learning</Link>
          </article>
        </div>

        <div className="engagement-motivation">
          <span>Coach&apos;s note</span>
          <p>{motivationFor(engagement, quizState)}</p>
        </div>

        <div className="achievement-grid" aria-label="Student achievement badges">
          {engagement.badges.map((badge) => (
            <article key={badge.id} className={badge.unlocked ? "is-unlocked" : "is-locked"}>
              <div className="achievement-icon">{badge.icon}</div>
              <div>
                <span>{badge.unlocked ? "Unlocked" : "Locked"}</span>
                <strong>{badge.title}</strong>
                <p>{badge.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
