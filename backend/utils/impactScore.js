// Impact Score & Volunteer Points calculation logic

/**
 * Impact Score = Volunteers x Tasks Completed x (Completion Percentage / 100)
 * Scaled by 10 so the number feels rewarding on the dashboard/leaderboard.
 */
function calculateImpactScore({ volunteersCount = 0, tasksCompleted = 0, completionPercentage = 0 }) {
  const base = volunteersCount * tasksCompleted * (completionPercentage / 100);
  const score = Math.round(base * 10);
  return score;
}

const POINTS = {
  JOIN_PROJECT: 10,
  COMPLETE_TASK: 20,
  COMPLETE_PROJECT: 100,
  HELP_MEMBER: 15,
  POSITIVE_REVIEW: 25,
};

function calculateCompletionPercentage(totalTasks, completedTasks) {
  if (!totalTasks) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

module.exports = { calculateImpactScore, POINTS, calculateCompletionPercentage };
