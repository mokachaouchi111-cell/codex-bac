
import { corners, tracks } from "./data.js";

const BAC_EXAM_DATE = "2026-06-14";
const BUILD_ID = "2026-03-29-v9";

const STORAGE_KEYS = {
  page: "codex_bac_page",
  theme: "codex_bac_theme",
  track: "codex_bac_track",
  subject: "codex_bac_subject",
  completed: "codex_bac_completed_units",
  lastRead: "codex_bac_last_read",
  quiz: "codex_bac_quiz_results",
  quizHistory: "codex_bac_quiz_history",
  profile: "codex_bac_profile",
  activity: "codex_bac_activity_minutes",
  seenAchievements: "codex_bac_seen_achievements",
  xp: "codex_bac_xp_state",
  eventClaims: "codex_bac_event_claims",
  dailyTasks: "codex_bac_daily_tasks",
  recoveryMission: "codex_bac_recovery_mission",
  weeklyBoss: "codex_bac_weekly_boss",
  challengeBoardMode: "codex_bac_challenge_board_mode"
};

const XP_RULES = {
  daily_login: { xp: 10 },
  lesson_read_complete: { xp: 20, minSeconds: 120 },
  summary_view: { xp: 10 },
  exercise_solved: { xp: 30 },
  quiz_100: { xp: 100 },
  quiz_80: { xp: 50 },
  unit_complete: { xp: 250 },
  streak_multiplier: { thresholdDays: 5, multiplier: 1.2 }
};

const DAILY_TASK_RULES = {
  baseReward: 35,
  weaknessReward: 45,
  eliteReward: 55
};

const RECOVERY_RULES = {
  minStreakToTrigger: 3,
  requiredActions: 2,
  minPenalty: 30,
  maxPenalty: 120,
  rewardXp: 90
};

const WEEKLY_BOSS_RULES = {
  baseReward: 320,
  epicReward: 460,
  legendaryReward: 620
};

const LEADERBOARD_MODES = {
  weekly: {
    id: "weekly",
    label: "ترتيب هذا الأسبوع",
    icon: "⏳"
  },
  alltime: {
    id: "alltime",
    label: "الترتيب العام",
    icon: "🌍"
  }
};

const RANK_BADGE_ASSETS = [
  "./assets/ranks/rank-1-novice.svg",
  "./assets/ranks/rank-2-rising.svg",
  "./assets/ranks/rank-3-discipline.svg",
  "./assets/ranks/rank-4-warrior.svg",
  "./assets/ranks/rank-5-elite.svg",
  "./assets/ranks/rank-6-legend.svg"
];

const LEAGUE_BADGE_BY_ID = {
  bronze: RANK_BADGE_ASSETS[1],
  silver: RANK_BADGE_ASSETS[2],
  gold: RANK_BADGE_ASSETS[4],
  elite: RANK_BADGE_ASSETS[5]
};

const BACKEND_XP_ENDPOINT = window.CODEX_XP_ENDPOINT || "";

const WILAYAS = [
  "الجزائر",
  "وهران",
  "قسنطينة",
  "عنابة",
  "سطيف",
  "تيزي وزو",
  "بجاية",
  "بليدة",
  "تلمسان",
  "باتنة",
  "سيدي بلعباس",
  "ورقلة"
];

const state = {
  page: load(STORAGE_KEYS.page, "home"),
  theme: load(STORAGE_KEYS.theme, "dark"),
  trackId: load(STORAGE_KEYS.track, tracks[0].id),
  selectedSubject: load(STORAGE_KEYS.subject, null),
  selectedUnitId: null,
  activeCorner: "core",
  completed: new Set(load(STORAGE_KEYS.completed, [])),
  lastRead: load(STORAGE_KEYS.lastRead, {}),
  quizResults: load(STORAGE_KEYS.quiz, {}),
  quizHistory: load(STORAGE_KEYS.quizHistory, []),
  xp: load(STORAGE_KEYS.xp, {
    current: 0,
    lastLoginDate: "",
    boostDate: ""
  }),
  eventClaims: load(STORAGE_KEYS.eventClaims, {}),
  profile: load(STORAGE_KEYS.profile, {
    wilaya: "الجزائر",
    branchByTrack: {
      science: "علوم تجريبية",
      math: "رياضيات"
    },
    targetScore: 17,
    title: "",
    notes: ""
  }),
  activity: load(STORAGE_KEYS.activity, {}),
  dailyTasks: load(STORAGE_KEYS.dailyTasks, { date: "", items: [] }),
  recoveryMission: load(STORAGE_KEYS.recoveryMission, {
    active: false,
    progress: 0,
    target: RECOVERY_RULES.requiredActions,
    createdDate: "",
    breakDate: "",
    penaltyXp: 0,
    rewardXp: RECOVERY_RULES.rewardXp,
    completed: false,
    claimed: false
  }),
  weeklyBoss: load(STORAGE_KEYS.weeklyBoss, null),
  challengeBoardMode: load(STORAGE_KEYS.challengeBoardMode, "weekly"),
  seenAchievements: new Set(load(STORAGE_KEYS.seenAchievements, [])),
  searchQuery: "",
  userName: "طالب CODEX-BAC",
  userPhoto: "",
  sessionStartedAt: Date.now(),
  hasRenderedProfileOnce: false,
  activeCoreSession: null,
  challengeLeagueTipOpen: false
};

let coreReadTimer = null;
let challengesAnimContext = null;

const el = {
  topbarSubtitle: document.getElementById("topbar-subtitle"),
  userChip: document.getElementById("user-chip"),
  homeUsername: document.getElementById("home-username"),
  bacCountdown: document.getElementById("bac-countdown"),
  homeStats: document.getElementById("home-stats"),
  homeLastRead: document.getElementById("home-last-read"),
  stage: document.getElementById("spa-stage"),
  pageProfile: document.getElementById("page-profile"),
  bottomNav: document.getElementById("bottom-nav"),
  trackSwitcher: document.getElementById("track-switcher"),
  trackSubtitle: document.getElementById("track-subtitle"),
  subjectsGrid: document.getElementById("subjects-grid"),
  unitsTitle: document.getElementById("units-title"),
  unitsSubtitle: document.getElementById("units-subtitle"),
  backToSubjects: document.getElementById("back-to-subjects"),
  unitsTree: document.getElementById("units-tree"),
  detail: document.getElementById("detail-view"),
  searchInput: document.getElementById("search-input"),
  searchResults: document.getElementById("search-results"),
  leaderboard: document.getElementById("leaderboard"),
  notificationsList: document.getElementById("notifications-list"),
  profileIdentity: document.getElementById("profile-identity"),
  streakPill: document.getElementById("streak-pill"),
  activityHeatmap: document.getElementById("activity-heatmap"),
  achievementsGrid: document.getElementById("achievements-grid"),
  targetActual: document.getElementById("target-actual"),
  skillRadar: document.getElementById("skill-radar"),
  dailyTasks: document.getElementById("daily-tasks"),
  recoveryMission: document.getElementById("recovery-mission"),
  weeklyBoss: document.getElementById("weekly-boss"),
  personalNotes: document.getElementById("personal-notes"),
  themeToggle: document.getElementById("theme-toggle"),
  toast: document.getElementById("toast")
};

const PAGE_TITLES = {
  home: "The Digital Codex",
  curriculum: "Curriculum Navigator",
  challenges: "Challenges Arena",
  notifications: "Notifications Hub",
  profile: "Profile Hub"
};

initTelegram();
initState();
bindEvents();
render();
registerServiceWorker();

function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.setHeaderColor("#0e1624");
  tg.setBackgroundColor("#0a111d");

  const first = tg.initDataUnsafe?.user?.first_name || "";
  const last = tg.initDataUnsafe?.user?.last_name || "";
  const fullName = `${first} ${last}`.trim();
  if (fullName) state.userName = fullName;
  state.userPhoto = tg.initDataUnsafe?.user?.photo_url || "";
}

function initState() {
  if (!state.profile.branchByTrack) {
    state.profile.branchByTrack = { science: "علوم تجريبية", math: "رياضيات" };
  }
  if (!state.profile.wilaya) state.profile.wilaya = "الجزائر";
  if (!state.profile.targetScore) state.profile.targetScore = 17;
  if (!state.profile.title) state.profile.title = "";
  if (!state.profile.notes) state.profile.notes = "";
  if (!state.xp || typeof state.xp.current !== "number") {
    state.xp = { current: 0, lastLoginDate: "", boostDate: "" };
  }
  if (!state.eventClaims || typeof state.eventClaims !== "object") {
    state.eventClaims = {};
  }
  if (!state.dailyTasks || !Array.isArray(state.dailyTasks.items)) {
    state.dailyTasks = { date: "", items: [] };
  }
  if (!state.recoveryMission || typeof state.recoveryMission !== "object") {
    state.recoveryMission = {
      active: false,
      progress: 0,
      target: RECOVERY_RULES.requiredActions,
      createdDate: "",
      breakDate: "",
      penaltyXp: 0,
      rewardXp: RECOVERY_RULES.rewardXp,
      completed: false,
      claimed: false
    };
  }
  if (typeof state.recoveryMission.target !== "number") {
    state.recoveryMission.target = RECOVERY_RULES.requiredActions;
  }
  if (!state.weeklyBoss || typeof state.weeklyBoss !== "object") {
    state.weeklyBoss = null;
  }
  if (!LEADERBOARD_MODES[state.challengeBoardMode]) {
    state.challengeBoardMode = "weekly";
  }
  const todayKey = getTodayKey();
  if (
    state.recoveryMission.active &&
    !state.recoveryMission.completed &&
    state.recoveryMission.createdDate &&
    state.recoveryMission.createdDate !== todayKey
  ) {
    state.recoveryMission.active = false;
    state.recoveryMission.claimed = true;
    save(STORAGE_KEYS.recoveryMission, state.recoveryMission);
  }

  if (!getTrack()) {
    state.trackId = tracks[0].id;
  }

  if (!state.selectedSubject || !groupUnitsByDomain(getTrack())[state.selectedSubject]) {
    state.selectedSubject = Object.keys(groupUnitsByDomain(getTrack()))[0] || null;
  }

  state.selectedUnitId = state.lastRead[state.trackId] || firstUnlockedUnit(getTrack())?.id || getTrack().units[0]?.id || null;
  save(STORAGE_KEYS.profile, state.profile);
  applyDailyLoginXP();
  ensureWeeklyBossState();
  ensureDailyTasksState();
  syncCurrentXpVar();
  applyTheme();
}

function bindEvents() {
  el.bottomNav.addEventListener("click", onBottomNavClick);
  el.trackSwitcher.addEventListener("click", onTrackClick);
  el.subjectsGrid.addEventListener("click", onSubjectClick);
  el.unitsTree.addEventListener("click", onUnitClick);
  el.detail.addEventListener("click", onDetailClick);
  el.backToSubjects.addEventListener("click", onBackToSubjects);
  el.searchInput.addEventListener("input", onSearchInput);
  el.searchResults.addEventListener("click", onSearchResultClick);
  el.leaderboard.addEventListener("click", onChallengesClick);
  el.homeLastRead.addEventListener("click", onHomeActionClick);
  el.themeToggle.addEventListener("click", onThemeToggleClick);
  el.personalNotes.addEventListener("input", onNotesInput);
  el.profileIdentity.addEventListener("click", onProfileIdentityClick);
  el.profileIdentity.addEventListener("change", onProfileChange);
  el.pageProfile.addEventListener("click", onProfileActionClick);
  el.pageProfile.addEventListener("pointermove", onProfilePointerMove);
  el.pageProfile.addEventListener("pointerleave", onProfilePointerLeave);
  window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("beforeunload", onBeforeUnload);
}
function onBottomNavClick(event) {
  const button = event.target.closest("[data-page-target]");
  if (!button) return;
  const nextPage = button.dataset.pageTarget;
  if (!nextPage || nextPage === state.page) return;

  state.page = nextPage;
  if (state.page !== "challenges" && challengesAnimContext?.revert) {
    challengesAnimContext.revert();
    challengesAnimContext = null;
  }
  save(STORAGE_KEYS.page, state.page);
  if (state.page === "profile") {
    playTierSound(getUserTier().id);
  }
  if (state.page !== "curriculum") {
    finalizeCoreReadSession();
  }
  render();
}

function onTrackClick(event) {
  const btn = event.target.closest("button[data-track-id]");
  if (!btn) return;

  state.trackId = btn.dataset.trackId;
  finalizeCoreReadSession();
  save(STORAGE_KEYS.track, state.trackId);

  const grouped = groupUnitsByDomain(getTrack());
  state.selectedSubject = Object.keys(grouped)[0] || null;
  state.selectedUnitId = state.lastRead[state.trackId] || firstUnlockedUnit(getTrack())?.id || null;
  state.activeCorner = "core";
  save(STORAGE_KEYS.subject, state.selectedSubject);
  renderCurriculum();
  renderHome();
  renderProfile();
}

function onSubjectClick(event) {
  const card = event.target.closest("[data-subject]");
  if (!card) return;

  state.selectedSubject = card.dataset.subject;
  state.selectedUnitId = null;
  state.activeCorner = "core";
  save(STORAGE_KEYS.subject, state.selectedSubject);
  renderCurriculum();
}

function onUnitClick(event) {
  const card = event.target.closest("article[data-unit-id]");
  if (!card) return;

  const unitId = card.dataset.unitId;
  const index = Number(card.dataset.unitIndex);
  const unlocked = isUnitUnlocked(index);

  if (!unlocked) {
    showToast("هذه الوحدة مقفولة. أكمل الوحدات السابقة أولاً.");
    return;
  }

  finalizeCoreReadSession();
  state.selectedUnitId = unitId;
  state.activeCorner = "core";
  state.lastRead[state.trackId] = unitId;
  save(STORAGE_KEYS.lastRead, state.lastRead);
  renderDetail();
  renderHome();
}

function onDetailClick(event) {
  const tabBtn = event.target.closest("button[data-corner]");
  if (tabBtn) {
    const prevCorner = state.activeCorner;
    state.activeCorner = tabBtn.dataset.corner;
    if (prevCorner === "core" && state.activeCorner !== "core") {
      finalizeCoreReadSession();
    }
    if (state.activeCorner === "core") {
      startCoreReadSession();
    }
    if (state.activeCorner === "flash") {
      const currentUnit = getSelectedUnit();
      if (currentUnit) {
        const gained = claimEventXP("summary_view", currentUnit.id);
        if (gained > 0) {
          showToast(`+${gained} XP مراجعة الملخص`);
          registerProgressEvent("summary_view", { unitId: currentUnit.id, trackId: state.trackId });
        }
      }
    }
    renderDetail();
    return;
  }

  const doneBtn = event.target.closest("button[data-action='toggle-complete']");
  if (doneBtn) {
    const unit = getSelectedUnit();
    if (!unit) return;

    if (state.completed.has(unit.id)) {
      state.completed.delete(unit.id);
      showToast("تم إلغاء علامة الإتقان.");
    } else {
      state.completed.add(unit.id);
      const gained = claimEventXP("unit_complete", unit.id, { windowMode: "lifetime" });
      if (gained > 0) {
        showToast(`ممتاز. +${gained} XP لإكمال الوحدة`);
        triggerColorBurst();
        registerProgressEvent("unit_complete", { unitId: unit.id, trackId: state.trackId });
      } else {
        showToast("ممتاز. تم حفظ التقدم.");
      }
    }

    save(STORAGE_KEYS.completed, [...state.completed]);
    renderHome();
    renderCurriculum();
    renderChallenges();
    renderProfile();
    return;
  }

  const quizBtn = event.target.closest("button[data-action='check-quiz']");
  if (quizBtn) {
    checkQuiz();
  }

  const exerciseBtn = event.target.closest("button[data-action='complete-exercise']");
  if (exerciseBtn) {
    const unit = getSelectedUnit();
    if (!unit) return;
    const gained = claimEventXP("exercise_solved", unit.id);
    if (gained > 0) {
      showToast(`تم احتساب +${gained} XP للتمرين ✅`);
      registerProgressEvent("exercise_solved", { unitId: unit.id, trackId: state.trackId });
    } else {
      showToast("تم احتساب تمرين هذا اليوم مسبقاً");
    }
    renderProfile();
    renderHome();
    renderChallenges();
  }
}

function onBackToSubjects() {
  finalizeCoreReadSession();
  state.selectedUnitId = null;
  renderDetail();
}

function onSearchInput(event) {
  state.searchQuery = event.target.value.trim().toLowerCase();
  renderSearchResults();
}

function onSearchResultClick(event) {
  const button = event.target.closest(".search-item");
  if (!button) return;

  finalizeCoreReadSession();
  state.trackId = button.dataset.track;
  state.selectedSubject = button.dataset.subject;
  state.selectedUnitId = button.dataset.unit;
  state.activeCorner = "core";
  state.page = "curriculum";
  save(STORAGE_KEYS.track, state.trackId);
  save(STORAGE_KEYS.subject, state.selectedSubject);
  save(STORAGE_KEYS.page, state.page);
  state.lastRead[state.trackId] = state.selectedUnitId;
  save(STORAGE_KEYS.lastRead, state.lastRead);
  state.searchQuery = "";
  el.searchInput.value = "";
  el.searchResults.innerHTML = "";
  render();
}

function onChallengesClick(event) {
  const boardBtn = event.target.closest("[data-board-mode]");
  if (boardBtn) {
    const mode = boardBtn.dataset.boardMode;
    if (LEADERBOARD_MODES[mode] && mode !== state.challengeBoardMode) {
      state.challengeBoardMode = mode;
      state.challengeLeagueTipOpen = false;
      save(STORAGE_KEYS.challengeBoardMode, state.challengeBoardMode);
      renderChallenges();
    }
    return;
  }

  const leagueBtn = event.target.closest("[data-action='toggle-league-tip']");
  if (leagueBtn) {
    state.challengeLeagueTipOpen = !state.challengeLeagueTipOpen;
    renderChallenges();
    return;
  }

  const duelBtn = event.target.closest("[data-action='start-duel']");
  if (duelBtn) {
    const rival = duelBtn.dataset.rival || "المنافس";
    showToast(`تم تجهيز تحدي 1v1 ضد ${rival} (قريباً).`);
    state.challengeLeagueTipOpen = false;
  }
}

function onHomeActionClick(event) {
  const btn = event.target.closest("[data-action='resume-last']");
  if (!btn) return;

  const unitId = btn.dataset.unitId;
  const trackId = btn.dataset.trackId;
  const unit = findUnitById(trackId, unitId);
  if (!unit) return;

  state.page = "curriculum";
  state.trackId = trackId;
  state.selectedSubject = unit.domain;
  state.selectedUnitId = unit.id;
  state.activeCorner = "core";
  save(STORAGE_KEYS.page, state.page);
  save(STORAGE_KEYS.track, state.trackId);
  save(STORAGE_KEYS.subject, state.selectedSubject);
  render();
}

function onThemeToggleClick() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save(STORAGE_KEYS.theme, state.theme);
  applyTheme();
  render();
}

function onNotesInput(event) {
  state.profile.notes = event.target.value;
  save(STORAGE_KEYS.profile, state.profile);
}

function onProfileIdentityClick(event) {
  const badgeBtn = event.target.closest("[data-action='quick-edit']");
  if (!badgeBtn) return;

  const field = badgeBtn.dataset.field;
  if (!field) return;

  if (field === "branch") {
    const current = state.profile.branchByTrack[state.trackId] || "علوم تجريبية";
    const next = current === "علوم تجريبية" ? "رياضيات" : "علوم تجريبية";
    state.profile.branchByTrack[state.trackId] = next;
    showToast(`تم تعديل الشعبة إلى ${next}`);
  }

  if (field === "wilaya") {
    const currentIndex = Math.max(0, WILAYAS.indexOf(state.profile.wilaya));
    const nextIndex = (currentIndex + 1) % WILAYAS.length;
    state.profile.wilaya = WILAYAS[nextIndex];
    showToast(`تم تعديل الولاية إلى ${state.profile.wilaya}`);
  }

  save(STORAGE_KEYS.profile, state.profile);
  renderProfile();
}

function onProfileActionClick(event) {
  const claimDailyBtn = event.target.closest("button[data-action='claim-daily-task']");
  if (claimDailyBtn) {
    claimDailyTaskReward(claimDailyBtn.dataset.taskId);
    return;
  }

  const claimRecoveryBtn = event.target.closest("button[data-action='claim-recovery']");
  if (claimRecoveryBtn) {
    claimRecoveryMission();
    return;
  }

  const claimBossBtn = event.target.closest("button[data-action='claim-weekly-boss']");
  if (claimBossBtn) {
    claimWeeklyBossReward();
  }
}

function onProfilePointerMove(event) {
  const tier = getUserTier();
  if (tier.id !== "legendary") return;

  const card = el.profileIdentity.querySelector(".identity-shell");
  if (!card) return;

  const bounds = card.getBoundingClientRect();
  const px = (event.clientX - bounds.left) / bounds.width;
  const py = (event.clientY - bounds.top) / bounds.height;
  const rx = (py - 0.5) * -9;
  const ry = (px - 0.5) * 9;

  el.pageProfile.style.setProperty("--cursor-x", `${(px * 100).toFixed(2)}%`);
  el.pageProfile.style.setProperty("--cursor-y", `${(py * 100).toFixed(2)}%`);
  card.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
  card.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
  card.classList.add("tilt-live");
}

function onProfilePointerLeave() {
  const card = el.profileIdentity.querySelector(".identity-shell");
  if (!card) return;
  el.pageProfile.style.removeProperty("--cursor-x");
  el.pageProfile.style.removeProperty("--cursor-y");
  card.style.setProperty("--tilt-x", "0deg");
  card.style.setProperty("--tilt-y", "0deg");
  card.classList.remove("tilt-live");
}

function onDeviceOrientation(event) {
  const tier = getUserTier();
  if (tier.id !== "legendary") return;
  const card = el.profileIdentity.querySelector(".identity-shell");
  if (!card) return;

  const gamma = Math.max(-20, Math.min(20, Number(event.gamma) || 0));
  const beta = Math.max(-20, Math.min(20, Number(event.beta) || 0));
  const tiltX = (-beta * 0.3).toFixed(2);
  const tiltY = (gamma * 0.3).toFixed(2);

  card.style.setProperty("--tilt-x", `${tiltX}deg`);
  card.style.setProperty("--tilt-y", `${tiltY}deg`);
}

function onProfileChange(event) {
  const target = event.target;
  if (target.id === "profile-track-select") {
    const selectedTrack = target.value;
    state.trackId = selectedTrack;
    if (!state.profile.branchByTrack[state.trackId]) {
      state.profile.branchByTrack[state.trackId] = state.trackId === "science" ? "علوم تجريبية" : "رياضيات";
    }
    save(STORAGE_KEYS.track, state.trackId);
  }

  if (target.id === "profile-branch-select") {
    state.profile.branchByTrack[state.trackId] = target.value;
  }

  if (target.id === "profile-wilaya-select") {
    state.profile.wilaya = target.value;
  }

  if (target.id === "profile-target-score") {
    const value = Number(target.value);
    state.profile.targetScore = Number.isFinite(value) ? Math.min(20, Math.max(10, value)) : 17;
  }

  if (target.id === "profile-title-input") {
    state.profile.title = target.value.trim().slice(0, 32);
  }

  save(STORAGE_KEYS.profile, state.profile);
  renderCurriculum();
  renderHome();
  renderProfile();
}

function onDocumentClick(event) {
  if (!event.target.closest(".search-wrap")) {
    el.searchResults.innerHTML = "";
  }
}

function onVisibilityChange() {
  if (document.hidden) {
    finalizeCoreReadSession();
    flushActivitySession();
  } else {
    state.sessionStartedAt = Date.now();
  }
}

function onBeforeUnload() {
  finalizeCoreReadSession();
  flushActivitySession();
}

function flushActivitySession() {
  const now = Date.now();
  const elapsedMs = now - state.sessionStartedAt;
  if (elapsedMs < 15000) return;

  const minutes = Math.max(1, Math.round(elapsedMs / 60000));
  const key = getTodayKey();
  state.activity[key] = (state.activity[key] || 0) + minutes;
  save(STORAGE_KEYS.activity, state.activity);
  state.sessionStartedAt = now;
}
function render() {
  renderPageOnly();
  renderHome();
  renderCurriculum();
  renderChallenges();
  renderNotifications();
  renderProfile();
}

function renderPageOnly() {
  el.stage.querySelectorAll(".page").forEach((page) => {
    const active = page.dataset.page === state.page;
    page.classList.toggle("active", active);
  });

  el.bottomNav.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.pageTarget === state.page);
  });

  el.topbarSubtitle.textContent = PAGE_TITLES[state.page] || PAGE_TITLES.home;
  el.userChip.textContent = state.userName;
  el.homeUsername.textContent = state.userName;
}

function renderHome() {
  const track = getTrack();
  const totalAll = tracks.reduce((sum, t) => sum + t.units.length, 0);
  const doneAll = [...state.completed].length;
  const totalTrack = track.units.length;
  const doneTrack = track.units.filter((unit) => state.completed.has(unit.id)).length;
  const progressTrack = Math.round((doneTrack / totalTrack) * 100);
  const streak = getStreakDays();
  const points = calculateUserPoints();
  const days = daysRemaining(BAC_EXAM_DATE);

  el.bacCountdown.textContent = days > 0 ? `${days} يوم` : "بدأت فترة الامتحان";

  el.homeStats.innerHTML = `
    <article class="glass stat-card">
      <h3>التقدم العام</h3>
      <strong>${Math.round((doneAll / totalAll) * 100)}%</strong>
      <small>${doneAll} / ${totalAll} وحدة</small>
    </article>
    <article class="glass stat-card">
      <h3>مسار ${escapeHtml(track.name)}</h3>
      <strong>${progressTrack}%</strong>
      <small>${doneTrack} / ${totalTrack}</small>
    </article>
    <article class="glass stat-card">
      <h3>نقاطك الحالية</h3>
      <strong>${points}</strong>
      <small>XP</small>
    </article>
    <article class="glass stat-card">
      <h3>سلسلة المراجعة</h3>
      <strong>${streak}</strong>
      <small>أيام متتالية</small>
    </article>
  `;

  const lastTrackId = Object.keys(state.lastRead).find((trackId) => state.lastRead[trackId]) || state.trackId;
  const lastUnitId = state.lastRead[lastTrackId];
  const lastUnit = findUnitById(lastTrackId, lastUnitId);

  if (!lastUnit) {
    el.homeLastRead.innerHTML = `
      <h3>آخر درس</h3>
      <p>لم تبدأ بعد. افتح صفحة المنهج واختر أول وحدة.</p>
    `;
    return;
  }

  const t = tracks.find((x) => x.id === lastTrackId);
  el.homeLastRead.innerHTML = `
    <h3>استكمل من حيث توقفت</h3>
    <p><strong>${escapeHtml(lastUnit.title)}</strong> • ${escapeHtml(t.name)}</p>
    <button class="primary-btn" data-action="resume-last" data-track-id="${t.id}" data-unit-id="${lastUnit.id}" type="button">متابعة الآن</button>
  `;
}

function renderCurriculum() {
  const track = getTrack();
  const grouped = groupUnitsByDomain(track);
  const subjects = Object.keys(grouped);

  if (!state.selectedSubject || !grouped[state.selectedSubject]) {
    state.selectedSubject = subjects[0] || null;
  }

  document.documentElement.style.setProperty("--track-accent", track.accent);
  document.documentElement.style.setProperty("--track-accent-soft", track.accentSoft);
  el.trackSubtitle.textContent = `${track.name} | ${track.subtitle}`;

  el.trackSwitcher.innerHTML = tracks
    .map(
      (t) => `
      <button class="track-btn ${t.id === state.trackId ? "active" : ""}" style="--btn-accent:${t.accent}" data-track-id="${t.id}">
        <span>${escapeHtml(t.name)}</span>
        <small>${escapeHtml(t.subtitle)}</small>
      </button>
    `
    )
    .join("");

  el.subjectsGrid.innerHTML = subjects
    .map((subject) => {
      const items = grouped[subject];
      const done = items.filter((unit) => state.completed.has(unit.id)).length;
      const pct = Math.round((done / items.length) * 100);
      const selected = state.selectedSubject === subject;
      const icon = iconForSubject(subject);

      return `
        <button class="subject-card ${selected ? "active" : ""}" data-subject="${escapeAttr(subject)}" type="button">
          <div class="subject-head">
            <span class="subject-icon">${icon}</span>
            <strong>${escapeHtml(subject)}</strong>
          </div>
          <small>${done}/${items.length} مكتمل • ${pct}%</small>
        </button>
      `;
    })
    .join("");

  renderUnitsList();
  renderDetail();
  renderSearchResults();
}

function renderUnitsList() {
  const track = getTrack();
  const grouped = groupUnitsByDomain(track);
  const subject = state.selectedSubject;
  const units = grouped[subject] || [];

  el.unitsTitle.textContent = subject ? `وحدات: ${subject}` : "الوحدات";
  el.unitsSubtitle.textContent = units.length ? "تسلسل الوحدات داخل المادة المختارة" : "لا توجد وحدات";
  el.backToSubjects.classList.toggle("hidden", !subject);

  el.unitsTree.innerHTML = units
    .map((unit) => {
      const index = track.units.findIndex((u) => u.id === unit.id);
      const unlocked = isUnitUnlocked(index);
      const completed = state.completed.has(unit.id);
      const selected = state.selectedUnitId === unit.id;
      const nodeClass = [
        "unit-card",
        unlocked ? "unlocked" : "locked",
        completed ? "completed" : "",
        selected ? "selected" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <article class="${nodeClass}" data-unit-id="${unit.id}" data-unit-index="${index}">
          <div class="unit-top">
            <span class="node-index">${index + 1}</span>
            <div class="unit-text">
              <h3>${escapeHtml(unit.title)}</h3>
              <p>${escapeHtml(unit.domain)}</p>
            </div>
          </div>
          <div class="unit-bottom">
            <span class="badge ${completed ? "ok" : "work"}">${completed ? "متقنة" : "قيد المراجعة"}</span>
            <span class="badge neutral">${unit.progress}% جاهز</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDetail() {
  const unit = getSelectedUnit();
  const track = getTrack();

  if (!unit) {
    el.detail.innerHTML = `
      <div class="empty-state">
        <h3>اختر وحدة</h3>
        <p>ستظهر الأركان الأربعة مباشرة هنا مع الاختبار الذاتي.</p>
      </div>
    `;
    return;
  }

  const done = state.completed.has(unit.id);
  const tabs = corners
    .map(
      (corner) => `
      <button class="tab-btn ${state.activeCorner === corner.id ? "active" : ""}" data-corner="${corner.id}">
        <span>${escapeHtml(corner.label)}</span>
        <small>${escapeHtml(corner.en)}</small>
      </button>
    `
    )
    .join("");

  el.detail.innerHTML = `
    <header class="detail-header">
      <div>
        <h2>${escapeHtml(unit.title)}</h2>
        <p>${escapeHtml(unit.domain)}</p>
      </div>
      <button class="complete-btn ${done ? "done" : ""}" data-action="toggle-complete" type="button">
        ${done ? "✅ تم الإتقان" : "وضع علامة: تمت المراجعة"}
      </button>
    </header>

    <nav class="corner-tabs">${tabs}</nav>

    <section class="corner-content">
      ${renderCornerContent(unit, state.activeCorner)}
    </section>

    <section class="methodology glass">
      <h3>منهجية الإجابة</h3>
      <ul>
        ${track.methodology.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
      </ul>
    </section>
  `;

  if (state.activeCorner === "core") {
    startCoreReadSession();
  }
}
function renderCornerContent(unit, cornerId) {
  const waiting = unit.placeholderFor?.includes(cornerId);
  if (waiting) return renderPlaceholder(unit, cornerId);

  if (cornerId === "core") {
    return `
      <div class="corner-panel">
        <h3>شرح أكاديمي مركز</h3>
        ${(unit.content.core || []).map((point) => `<p>${escapeHtml(point)}</p>`).join("")}
        <small class="hint-text">سيتم احتساب +20 XP تلقائياً بعد قضاء دقيقتين في هذا الركن.</small>
      </div>
    `;
  }

  if (cornerId === "flash") {
    const data = unit.content.flash || [];
    if (!data.length) return renderPlaceholder(unit, cornerId);
    return `
      <div class="corner-panel">
        <h3>ملخص فلاش</h3>
        <ul>${data.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    `;
  }

  if (cornerId === "training") {
    const data = unit.content.training || [];
    if (!data.length) return renderPlaceholder(unit, cornerId);
    return `
      <div class="corner-panel">
        <h3>أرضية التمرين</h3>
        <ul>${data.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <button class="quiz-btn" type="button" data-action="complete-exercise">أنهيت تمريناً نموذجياً</button>
      </div>
    `;
  }

  if (cornerId === "boss") {
    const questions = unit.content.boss?.questions || [];
    if (!questions.length) return renderPlaceholder(unit, cornerId);
    const last = state.quizResults[unit.id];
    return `
      <div class="corner-panel quiz">
        <h3>Final Boss Quiz</h3>
        <form id="quiz-form">
          ${questions
            .map(
              (question, index) => `
            <fieldset>
              <legend>${index + 1}. ${escapeHtml(question.q)}</legend>
              ${question.options
                .map(
                  (option, oi) => `
                <label>
                  <input type="radio" name="q-${index}" value="${oi}" />
                  <span>${escapeHtml(option)}</span>
                </label>
              `
                )
                .join("")}
            </fieldset>
          `
            )
            .join("")}
          <button type="button" class="quiz-btn" data-action="check-quiz">احسب نتيجتي</button>
        </form>
        ${last ? `<p class="quiz-result">آخر نتيجة: <strong>${last.score}/${last.total}</strong> (${last.percent}%)</p>` : ""}
      </div>
    `;
  }

  return `<div class="corner-panel"><p>قيد التحضير.</p></div>`;
}

function renderPlaceholder(unit, cornerId) {
  const days = daysRemaining(unit.releaseDate);
  const cornerName = corners.find((c) => c.id === cornerId)?.label || "هذا الركن";
  const hint = days > 0 ? `متوقع الفتح خلال ${days} يوم` : "سيُفتح قريباً جداً";

  return `
    <div class="placeholder-card">
      <div class="progress-ring" style="--progress:${unit.progress}">
        <span>${unit.progress}%</span>
      </div>
      <div>
        <h3>${escapeHtml(cornerName)} قيد البناء</h3>
        <p>Smart Placeholder: القسم واضح ويعرض نسبة الإتاحة بدل الصفحة الفارغة.</p>
        <p class="placeholder-hint">${hint}</p>
      </div>
    </div>
  `;
}

function renderSearchResults() {
  if (!state.searchQuery) {
    el.searchResults.innerHTML = "";
    return;
  }

  const query = state.searchQuery;
  const results = [];
  tracks.forEach((track) => {
    track.units.forEach((unit) => {
      const haystack = [unit.title, unit.domain, ...(unit.tags || [])].join(" ").toLowerCase();
      if (haystack.includes(query)) {
        results.push({
          trackId: track.id,
          trackName: track.name,
          subject: unit.domain,
          unitId: unit.id,
          title: unit.title,
          accent: track.accent
        });
      }
    });
  });

  if (!results.length) {
    el.searchResults.innerHTML = `<p class="search-empty">لا توجد نتائج الآن.</p>`;
    return;
  }

  el.searchResults.innerHTML = results
    .slice(0, 8)
    .map(
      (item) => `
      <button class="search-item" data-track="${item.trackId}" data-unit="${item.unitId}" data-subject="${escapeAttr(item.subject)}" type="button">
        <span class="search-tag" style="--tag-color:${item.accent}">${escapeHtml(item.trackName)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.subject)}</small>
      </button>
    `
    )
    .join("");
}

function renderChallenges() {
  const modeKey = LEADERBOARD_MODES[state.challengeBoardMode] ? state.challengeBoardMode : "weekly";
  const modeMeta = LEADERBOARD_MODES[modeKey];
  const ranked = buildLeaderboard()
    .map((entry) => ({
      ...entry,
      score: getLeaderboardScore(entry, modeKey)
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));

  const meIndex = ranked.findIndex((entry) => entry.isMe);
  if (meIndex < 0) {
    el.leaderboard.innerHTML = `<p class="empty-text">تعذر تحميل الترتيب حالياً.</p>`;
    return;
  }

  const me = ranked[meIndex];
  const top3 = ranked.slice(0, 3);
  const podiumOrder = [1, 0, 2].map((idx) => top3[idx]).filter(Boolean);
  const above = meIndex > 0 ? ranked[meIndex - 1] : null;
  const below = meIndex < ranked.length - 1 ? ranked[meIndex + 1] : null;
  const gapAbove = above ? Math.max(0, above.score - me.score) : 0;
  const gapBelow = below ? Math.max(0, me.score - below.score) : 0;
  const pressure = buildPressureHint(above, below, gapAbove, gapBelow, "XP");
  const league = getLeagueFromXP(me.points);
  const leagueProgress = getLeagueProgressHint(me.points);
  const visibleStart = Math.max(0, meIndex - 3);
  const visibleEnd = Math.min(ranked.length, meIndex + 4);
  const focusedRows = ranked.slice(visibleStart, visibleEnd);
  const chaseTarget = above
    ? `أنت متأخر بـ ${formatXP(gapAbove)} فقط عن ${escapeHtml(above.name)}. أكمل كويز اليوم لتتجاوزه.`
    : "أنت في القمة حالياً، دافع عن مركزك!";

  const modesHtml = Object.entries(LEADERBOARD_MODES)
    .map(
      ([key, meta]) => `
      <button class="board-tab ${modeKey === key ? "active" : ""}" type="button" data-board-mode="${key}">
        <span>${meta.icon}</span>
        <small>${escapeHtml(meta.label)}</small>
      </button>
    `
    )
    .join("");

  const leagueBadge = LEAGUE_BADGE_BY_ID[league.id] || RANK_BADGE_ASSETS[0];

  const podiumHtml = podiumOrder
    .map((entry) => {
      const placeClass = `place-${entry.rank}`;
      const entryBadge = getRankBadgeAssetByPoints(entry.points);
      const avatar = entry.isMe && state.userPhoto
        ? `<img class="podium-avatar" src="${escapeAttr(state.userPhoto)}" alt="${escapeAttr(entry.name)}" />`
        : `<div class="podium-avatar initials">${escapeHtml(initialsFromName(entry.name))}</div>`;
      const wingsHtml = `
        <div class="podium-aura"></div>
        <div class="podium-wings ${entry.rank === 1 ? "hero" : "soft"}" aria-hidden="true">
          <span class="wing wing-left"></span>
          <span class="wing wing-right"></span>
        </div>
        <div class="podium-sparks" aria-hidden="true">
          <span class="podium-spark"></span>
          <span class="podium-spark"></span>
          <span class="podium-spark"></span>
          <span class="podium-spark"></span>
        </div>
      `;
      return `
        <article class="podium-card ${placeClass} ${entry.isMe ? "me" : ""}" data-podium-rank="${entry.rank}">
          ${wingsHtml}
          <div class="podium-medal">${entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</div>
          <img class="rank-badge podium-rank-badge" src="${escapeAttr(entryBadge)}" alt="Rank badge ${entry.rank}" loading="lazy" />
          ${avatar}
          <strong>${escapeHtml(entry.name)}</strong>
          <small>${formatXP(entry.score)}</small>
        </article>
      `;
    })
    .join("");

  const rowsHtml = focusedRows
    .map((entry) => {
      const diff = entry.score - me.score;
      const deltaClass = diff > 0 ? "ahead" : diff < 0 ? "behind" : "same";
      const deltaText = diff === 0 ? "أنت" : `${diff > 0 ? "↑" : "↓"} ${formatXP(Math.abs(diff))}`;
      const rowBadge = getRankBadgeAssetByPoints(entry.points);
      return `
        <article class="leader-item ${entry.isMe ? "me" : ""}">
          <div class="leader-rank">${entry.rank}</div>
          <div class="leader-info">
            <strong class="leader-title">
              <img class="rank-badge leader-rank-badge" src="${escapeAttr(rowBadge)}" alt="Rank badge" loading="lazy" />
              <span>${escapeHtml(entry.name)}</span>
            </strong>
            <small>${escapeHtml(entry.note)}</small>
          </div>
          <div class="leader-meta">
            <strong class="leader-score">${formatXP(entry.score)}</strong>
            <small class="leader-delta ${deltaClass}">${deltaText}</small>
          </div>
        </article>
      `;
    })
    .join("");

  el.leaderboard.innerHTML = `
    <section class="challenge-shell">
      <div class="challenge-toolbar">
        <div class="board-tabs">${modesHtml}</div>
        <div class="league-stack">
          <button class="league-pill ${league.id}" type="button" data-action="toggle-league-tip" aria-expanded="${state.challengeLeagueTipOpen ? "true" : "false"}">
            <img class="rank-badge league-badge" src="${escapeAttr(leagueBadge)}" alt="League badge" loading="lazy" />
            <span>League: ${escapeHtml(league.label)}</span>
          </button>
          <div class="league-tip ${state.challengeLeagueTipOpen ? "show" : ""}">
            ${
              leagueProgress
                ? `اجمع <strong>${formatXP(leagueProgress.remaining)}</strong> للترقية إلى دوري <strong>${escapeHtml(leagueProgress.nextLabel)}</strong>.`
                : "أنت في أعلى دوري حالياً. استمر للحفاظ على موقعك."
            }
          </div>
        </div>
      </div>

      <p class="challenge-mode-note">${escapeHtml(modeMeta.label)} • الترتيب يعتمد على XP فقط</p>

      <section class="podium-grid">
        ${podiumHtml}
      </section>

      <section class="focus-zone">
        <div class="focus-main">
          <h3>🎯 ترتيبك الآن: #${me.rank}</h3>
          <p class="rival-line">${chaseTarget}</p>
          <p class="focus-pressure ${pressure.className}">${escapeHtml(pressure.message)}</p>
        </div>
        <div class="focus-stats">
          <div>
            <small>قيمة الترتيب الحالية</small>
            <strong>${formatXP(me.score)}</strong>
          </div>
          <div>
            <small>الفارق للأعلى</small>
            <strong>${above ? formatXP(gapAbove) : "0 XP"}</strong>
          </div>
          <div>
            <small>الفارق للأسفل</small>
            <strong>${below ? formatXP(gapBelow) : "0 XP"}</strong>
          </div>
        </div>
        <button class="quiz-btn duel-btn" type="button" data-action="start-duel" data-rival="${escapeAttr(above?.name || "")}">
          ${above ? `من ستهزمه اليوم؟ ${escapeHtml(above.name)}` : "أنت المتصدر اليوم"}
        </button>
      </section>

      <section class="challenge-list-wrap">
        <header class="list-head">
          <h3>📋 القائمة المحيطة بك</h3>
          <small>3 فوقك + أنت + 3 تحتك</small>
        </header>
        <div class="leaderboard nearby">
          ${rowsHtml}
        </div>
      </section>
    </section>
  `;

  if (state.page === "challenges") {
    requestAnimationFrame(() => {
      animateChallengePodium();
    });
  }
}

function getLeaderboardScore(entry, modeKey) {
  if (modeKey === "alltime") return Math.max(0, Math.round(Number(entry.points) || 0));
  return Math.max(0, Math.round(Number(entry.weeklyPoints ?? entry.points) || 0));
}

function formatXP(value) {
  return `${Math.max(0, Math.round(Number(value) || 0))} XP`;
}

function getLeagueProgressHint(points) {
  const xp = Math.max(0, Number(points) || 0);
  if (xp < 700) return { nextLabel: "Silver", remaining: 700 - xp };
  if (xp < 1400) return { nextLabel: "Gold", remaining: 1400 - xp };
  if (xp < 2200) return { nextLabel: "Elite", remaining: 2200 - xp };
  return null;
}

function animateChallengePodium() {
  if (challengesAnimContext?.revert) {
    challengesAnimContext.revert();
    challengesAnimContext = null;
  }

  const gsap = window.gsap;
  if (!gsap || !el.leaderboard) return;

  challengesAnimContext = gsap.context(() => {
    const cards = gsap.utils.toArray(".podium-card");
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 26, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.85, stagger: 0.12, ease: "power3.out" }
    );

    cards.forEach((card, idx) => {
      const floatAmp = card.classList.contains("place-1") ? -5 : -2;
      gsap.to(card, {
        y: floatAmp,
        duration: 2 + idx * 0.25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    gsap.utils.toArray(".podium-rank-badge").forEach((badge, idx) => {
      gsap.fromTo(
        badge,
        { rotate: -5, y: -1, scale: 0.97 },
        {
          rotate: 5,
          y: -3,
          scale: 1.03,
          duration: 1.6 + idx * 0.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        }
      );
    });

    const wings = gsap.utils.toArray(".podium-card .wing");
    wings.forEach((wing) => {
      const isLeft = wing.classList.contains("wing-left");
      const fromRot = isLeft ? -8 : 8;
      const toRot = isLeft ? -21 : 21;
      gsap.fromTo(
        wing,
        { rotation: fromRot, scaleY: 1, transformOrigin: "50% 10%" },
        {
          rotation: toRot,
          scaleY: 1.08,
          duration: wing.closest(".podium-card")?.classList.contains("place-1") ? 0.9 : 1.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        }
      );
    });

    gsap.utils.toArray(".podium-aura").forEach((aura) => {
      gsap.fromTo(
        aura,
        { opacity: 0.28, scale: 0.92 },
        { opacity: 0.9, scale: 1.18, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" }
      );
    });

    gsap.utils.toArray(".podium-spark").forEach((spark, idx) => {
      const driftX = idx % 2 === 0 ? -10 - idx * 2 : 10 + idx * 2;
      gsap.fromTo(
        spark,
        { x: 0, y: 0, autoAlpha: 0.24 },
        {
          x: driftX,
          y: -16 - (idx % 3) * 8,
          autoAlpha: 0.95,
          duration: 1.15 + (idx % 2) * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: idx * 0.08
        }
      );
    });
  }, el.leaderboard);
}

function renderNotifications() {
  const upcoming = tracks
    .flatMap((track) =>
      track.units
        .filter((unit) => unit.releaseDate)
        .map((unit) => ({
          track: track.name,
          title: unit.title,
          domain: unit.domain,
          releaseDate: unit.releaseDate
        }))
    )
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
    .slice(0, 8);

  if (!upcoming.length) {
    el.notificationsList.innerHTML = `
      <p class="empty-text">لا توجد إشعارات جديدة حالياً.</p>
    `;
    return;
  }

  el.notificationsList.innerHTML = upcoming
    .map((item) => {
      const days = daysRemaining(item.releaseDate);
      return `
        <article class="notice-item">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.track)} • ${escapeHtml(item.domain)}</small>
          <span>${days > 0 ? `بعد ${days} يوم` : "اليوم"}</span>
        </article>
      `;
    })
    .join("");
}

function renderProfile() {
  const track = getTrack();
  const branch = state.profile.branchByTrack[state.trackId] || track.name;
  const tier = getUserTier();
  const profileXP = calculateUserPoints();
  const level = getUserLevel(profileXP);
  const rankBadge = getRankBadgeAssetByLevel(level);
  const currentBandStart = level <= 1 ? 0 : xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const xpInBand = Math.max(0, profileXP - currentBandStart);
  const bandSize = Math.max(1, nextLevelXP - currentBandStart);
  const xpBandPercent = Math.round((xpInBand / bandSize) * 100);
  const title = state.profile.title || tier.defaultTitle;
  const avatar = state.userPhoto
    ? `<img src="${state.userPhoto}" alt="avatar" class="profile-avatar ${tier.id}" />`
    : `<div class="profile-avatar initials ${tier.id}">${escapeHtml(initialsFromName(state.userName))}</div>`;

  el.pageProfile.classList.remove("tier-basic", "tier-rare", "tier-epic", "tier-legendary");
  el.pageProfile.classList.add(`tier-${tier.id}`);

  el.profileIdentity.innerHTML = `
    <div class="identity-shell ${tier.id}">
      <div class="profile-head">
        ${avatar}
        <div>
          <h3>${escapeHtml(state.userName)}</h3>
          <div class="profile-rank-row">
            <img class="rank-badge profile-rank-badge" src="${escapeAttr(rankBadge)}" alt="Rank badge" loading="lazy" />
            <p class="rank-line">${escapeHtml(tier.label)} • Level ${level} • ${profileXP} XP</p>
          </div>
          <p class="rank-line">XP المطلوب للمستوى التالي: ${nextLevelXP}</p>
          <div class="xp-track">
            <div class="xp-fill" style="width:${xpBandPercent}%"></div>
            <span>${xpBandPercent}%</span>
          </div>
          <p class="title-line">${escapeHtml(title)}</p>
        </div>
      </div>
      <div class="floating-badges">
        <button class="floating-badge" type="button" data-action="quick-edit" data-field="branch">${escapeHtml(branch)}</button>
        <button class="floating-badge" type="button" data-action="quick-edit" data-field="wilaya">${escapeHtml(state.profile.wilaya)}</button>
      </div>
      <div class="profile-form">
        <label>
          المسار
          <select id="profile-track-select">
            ${tracks
              .map((t) => `<option value="${t.id}" ${t.id === state.trackId ? "selected" : ""}>${escapeHtml(t.name)}</option>`)
              .join("")}
          </select>
        </label>
        <label>
          الشعبة
          <select id="profile-branch-select">
            <option value="علوم تجريبية" ${branch === "علوم تجريبية" ? "selected" : ""}>علوم تجريبية</option>
            <option value="رياضيات" ${branch === "رياضيات" ? "selected" : ""}>رياضيات</option>
          </select>
        </label>
        <label>
          الولاية
          <select id="profile-wilaya-select">
            ${WILAYAS.map((w) => `<option value="${w}" ${w === state.profile.wilaya ? "selected" : ""}>${w}</option>`).join("")}
          </select>
        </label>
        <label>
          المعدل المستهدف
          <input id="profile-target-score" type="number" min="10" max="20" step="0.5" value="${Number(state.profile.targetScore || 17)}" />
        </label>
        <label class="${tier.id !== "basic" ? "" : "locked-field"}">
          اللقب
          <input id="profile-title-input" type="text" maxlength="32" value="${escapeAttr(state.profile.title || "")}" ${tier.id !== "basic" ? "" : "disabled"} />
        </label>
      </div>
    </div>
  `;

  const unlocked = renderAchievements();
  renderConsistencyMatrix();
  renderPerformanceAnalytics();
  renderDailyTasks();
  renderRecoveryMission();
  renderWeeklyBoss();
  el.personalNotes.value = state.profile.notes || "";
  el.themeToggle.textContent = `الوضع الحالي: ${state.theme === "dark" ? "Dark" : "Light"} (اضغط للتبديل)`;

  if (!state.hasRenderedProfileOnce) {
    unlocked.forEach((id) => state.seenAchievements.add(id));
    save(STORAGE_KEYS.seenAchievements, [...state.seenAchievements]);
    state.hasRenderedProfileOnce = true;
  }
}

function renderConsistencyMatrix() {
  const streak = getStreakDays();
  const last30 = getLastDays(30);
  const maxMinutes = Math.max(60, ...last30.map((d) => state.activity[d] || 0));
  const multiplier = getDailyMultiplier();
  const flameScale = (1 + Math.min(0.85, streak * 0.04)).toFixed(2);

  el.streakPill.innerHTML = `
    <span class="flame" style="--flame-scale:${flameScale}">🔥</span>
    <div>
      <strong>${streak}</strong>
      <small>أيام متتالية</small>
    </div>
    <div>
      <strong>${multiplier.toFixed(1)}x</strong>
      <small>مضاعف اليوم</small>
    </div>
  `;

  el.activityHeatmap.innerHTML = last30
    .map((day) => {
      const minutes = state.activity[day] || 0;
      const ratio = Math.min(1, minutes / maxMinutes);
      const level = minutes === 0 ? 0 : Math.ceil(ratio * 4);
      return `<button class="heat-cell level-${level}" type="button" title="${day} • ${minutes} دقيقة"></button>`;
    })
    .join("");
}

function getAchievementDefinitions() {
  const totalCompleted = [...state.completed].length;
  const perfectStreak = getPerfectQuizStreakCount();
  const streak = getStreakDays();
  const seen = state.seenAchievements;

  return [
    { id: "disciplined", name: "وسام المنضبط", desc: "7 أيام دراسة متتالية", icon: "🧠", unlocked: streak >= 7 || seen.has("disciplined") },
    { id: "expert", name: "وسام الخبير", desc: "إكمال 10 وحدات بنسبة 100%", icon: "🏆", unlocked: totalCompleted >= 10 || seen.has("expert") },
    { id: "bug_hunter", name: "صياد الثغرات", desc: "5 كويزات متتالية بعلامة كاملة", icon: "🎯", unlocked: perfectStreak >= 5 || seen.has("bug_hunter") }
  ];
}

function renderAchievements() {
  const badges = getAchievementDefinitions();
  const unlocked = badges.filter((badge) => badge.unlocked).map((badge) => badge.id);
  const newlyUnlocked = unlocked.filter((id) => !state.seenAchievements.has(id));

  if (newlyUnlocked.length && state.hasRenderedProfileOnce) {
    newlyUnlocked.forEach((id) => state.seenAchievements.add(id));
    save(STORAGE_KEYS.seenAchievements, [...state.seenAchievements]);
    triggerRewardFeedback("achievement");
    const first = badges.find((b) => b.id === newlyUnlocked[0]);
    if (first) showToast(`إنجاز جديد: ${first.name}`);
  }

  el.achievementsGrid.innerHTML = badges
    .map(
      (badge) => `
      <article class="badge-card ${badge.unlocked ? "on" : "off"}">
        <span class="badge-icon">${badge.icon}</span>
        <strong>${escapeHtml(badge.name)}</strong>
        <small>${escapeHtml(badge.desc)}</small>
      </article>
    `
    )
    .join("");

  return unlocked;
}

function renderPerformanceAnalytics() {
  const target = Number(state.profile.targetScore || 17);
  const current = calculateCurrentScoreFromXP();
  const ratio = Math.max(0, Math.min(1, current / target));

  el.targetActual.innerHTML = `
    <div class="score-ring" style="--score-pct:${Math.round(ratio * 100)}">
      <strong>${current.toFixed(1)}/20</strong>
      <small>الحالي</small>
    </div>
    <div class="target-copy">
      <p>المستهدف: <strong>${target}/20</strong></p>
      <p>الفجوة الحالية: <strong>${Math.max(0, (target - current)).toFixed(1)}</strong></p>
    </div>
  `;

  const radar = buildSkillRadar();
  el.skillRadar.innerHTML = renderRadarSvg(radar.labels, radar.values);
}

function renderDailyTasks() {
  if (!el.dailyTasks) return;
  ensureDailyTasksState();
  if (!state.dailyTasks.items.length) {
    el.dailyTasks.innerHTML = `<p class="empty-text">لا توجد مهام حالياً.</p>`;
    return;
  }

  el.dailyTasks.innerHTML = state.dailyTasks.items
    .map((task) => {
      const pct = Math.min(100, Math.round((task.progress / task.target) * 100));
      const done = task.done || task.progress >= task.target;
      const canClaim = done && !task.claimed;
      return `
        <article class="mission-item ${done ? "done" : ""}">
          <div class="mission-head">
            <strong>${escapeHtml(task.title)}</strong>
            <span class="mission-reward">+${task.rewardXp} XP</span>
          </div>
          <p>${escapeHtml(task.description)}</p>
          <div class="mission-progress">
            <div class="mission-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="mission-meta">
            <small>${task.progress}/${task.target}</small>
            ${
              task.claimed
                ? `<span class="mission-chip claimed">تم الاستلام</span>`
                : canClaim
                  ? `<button class="quiz-btn mission-btn" data-action="claim-daily-task" data-task-id="${task.id}" type="button">استلام المكافأة</button>`
                  : `<span class="mission-chip">قيد التنفيذ</span>`
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRecoveryMission() {
  if (!el.recoveryMission) return;
  const mission = state.recoveryMission;
  if (!mission.active) {
    el.recoveryMission.innerHTML = `<p class="empty-text">لا توجد مهمة تعويض نشطة. استمر على السلسلة الحالية.</p>`;
    return;
  }

  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  const readyToClaim = mission.completed && !mission.claimed;
  const status = mission.claimed ? "تمت المعالجة" : mission.completed ? "جاهزة للاستلام" : "قيد الإصلاح";

  el.recoveryMission.innerHTML = `
    <article class="recovery-item ${mission.completed ? "done" : "pending"}">
      <p>انكسرت سلسلة انضباطك يوم ${escapeHtml(mission.breakDate || "-")} وتم خصم <strong>${mission.penaltyXp} XP</strong>.</p>
      <p>أنهِ <strong>${mission.target}</strong> نشاطات دراسية اليوم لاستعادة توازنك.</p>
      <div class="mission-progress">
        <div class="mission-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="mission-meta">
        <small>${mission.progress}/${mission.target}</small>
        <span class="mission-chip">${status}</span>
      </div>
      ${
        readyToClaim
          ? `<button class="quiz-btn mission-btn" data-action="claim-recovery" type="button">استرجاع +${mission.rewardXp} XP</button>`
          : ""
      }
    </article>
  `;
}

function renderWeeklyBoss() {
  if (!el.weeklyBoss) return;
  ensureWeeklyBossState();
  const boss = state.weeklyBoss;
  if (!boss) {
    el.weeklyBoss.innerHTML = `<p class="empty-text">سيتم توليد Boss الأسبوع تلقائياً.</p>`;
    return;
  }

  const unitPct = Math.min(100, Math.round((boss.unitsDone / boss.unitsTarget) * 100));
  const quizPct = Math.min(100, Math.round((boss.quizDone / boss.quizTarget) * 100));
  const totalPct = Math.round((unitPct + quizPct) / 2);
  const deadline = boss.endsAt || boss.weekKey;

  el.weeklyBoss.innerHTML = `
    <article class="boss-item ${boss.completed ? "done" : ""}">
      <div class="mission-head">
        <strong>${escapeHtml(boss.title)}</strong>
        <span class="mission-reward">+${boss.rewardXp} XP</span>
      </div>
      <p>${escapeHtml(boss.description)}</p>
      <ul class="boss-checks">
        <li>وحدات مكتملة: ${boss.unitsDone}/${boss.unitsTarget}</li>
        <li>كويزات +80%: ${boss.quizDone}/${boss.quizTarget}</li>
        <li>آخر موعد: ${escapeHtml(deadline)}</li>
      </ul>
      <div class="mission-progress">
        <div class="mission-progress-fill" style="width:${totalPct}%"></div>
      </div>
      ${
        boss.claimed
          ? `<span class="mission-chip claimed">تم استلام مكافأة الـBoss</span>`
          : boss.completed
            ? `<button class="quiz-btn mission-btn" data-action="claim-weekly-boss" type="button">استلام مكافأة الـBoss</button>`
            : `<span class="mission-chip">قيد التحدي</span>`
      }
    </article>
  `;
}

function applyDailyLoginXP() {
  const today = getTodayKey();
  if (state.xp.lastLoginDate === today) {
    ensureDailyTasksState();
    return;
  }
  const penalty = maybeTriggerStreakPenalty(today);
  state.xp.lastLoginDate = today;
  claimEventXP("daily_login", "global", { windowMode: "daily", enforceClaimWindow: true, silent: true });
  if (getStreakDays() >= XP_RULES.streak_multiplier.thresholdDays) {
    state.xp.boostDate = today;
  } else {
    state.xp.boostDate = "";
  }
  save(STORAGE_KEYS.xp, state.xp);
  if (penalty > 0) {
    showToast(`انقطعت السلسلة: -${penalty} XP. تم فتح مهمة تعويض.`);
  }
  ensureDailyTasksState();
}

function claimEventXP(eventName, scope = "global", options = {}) {
  const rule = XP_RULES[eventName];
  if (!rule) return 0;

  const windowMode = options.windowMode || "daily";
  const claimKey = windowMode === "lifetime" ? `${eventName}:${scope}` : `${eventName}:${scope}:${getTodayKey()}`;
  const enforceClaimWindow = options.enforceClaimWindow ?? true;
  if (enforceClaimWindow && state.eventClaims[claimKey]) {
    return 0;
  }

  const multiplier = getDailyMultiplier();
  const xpGained = Math.round((rule.xp || 0) * multiplier);
  state.xp.current += xpGained;
  state.eventClaims[claimKey] = true;
  save(STORAGE_KEYS.eventClaims, state.eventClaims);
  save(STORAGE_KEYS.xp, state.xp);
  syncCurrentXpVar();
  sendXpEventToBackend({
    event: eventName,
    scope,
    xp_gained: xpGained,
    total_xp: state.xp.current,
    level: getUserLevel(state.xp.current),
    timestamp: new Date().toISOString()
  });
  if (!options.silent) {
    triggerRewardFeedback("xp");
  }
  return xpGained;
}

function grantBonusXP(amount, eventName, scope = "bonus", options = {}) {
  const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
  if (!safeAmount) return 0;
  state.xp.current += safeAmount;
  save(STORAGE_KEYS.xp, state.xp);
  syncCurrentXpVar();
  sendXpEventToBackend({
    event: eventName,
    scope,
    xp_gained: safeAmount,
    total_xp: state.xp.current,
    level: getUserLevel(state.xp.current),
    timestamp: new Date().toISOString(),
    source: "bonus"
  });
  if (!options.silent) {
    triggerRewardFeedback("achievement");
  }
  return safeAmount;
}

function registerProgressEvent(eventName, meta = {}) {
  updateDailyTaskProgress(eventName, meta);
  updateRecoveryMissionProgress(eventName, meta);
  updateWeeklyBossProgress(eventName, meta);
}

function getDailyMultiplier() {
  const today = getTodayKey();
  return state.xp.boostDate === today ? XP_RULES.streak_multiplier.multiplier : 1;
}

function startCoreReadSession() {
  const unit = getSelectedUnit();
  if (!unit || state.activeCorner !== "core") return;

  if (state.activeCoreSession?.unitId !== unit.id) {
    state.activeCoreSession = { unitId: unit.id, startedAt: Date.now() };
  }

  if (coreReadTimer) clearTimeout(coreReadTimer);
  const elapsed = Date.now() - state.activeCoreSession.startedAt;
  const remaining = Math.max(0, XP_RULES.lesson_read_complete.minSeconds * 1000 - elapsed);
  coreReadTimer = setTimeout(() => {
    finalizeCoreReadSession();
  }, remaining + 200);
}

function finalizeCoreReadSession() {
  if (!state.activeCoreSession) return;
  if (coreReadTimer) {
    clearTimeout(coreReadTimer);
    coreReadTimer = null;
  }

  const elapsed = Date.now() - state.activeCoreSession.startedAt;
  if (elapsed >= XP_RULES.lesson_read_complete.minSeconds * 1000) {
    const gained = claimEventXP("lesson_read_complete", state.activeCoreSession.unitId);
    if (gained > 0) {
      showToast(`+${gained} XP قراءة درس مكتملة`);
      registerProgressEvent("lesson_read_complete", { unitId: state.activeCoreSession.unitId, trackId: state.trackId });
      renderHome();
      renderProfile();
      renderChallenges();
    }
  }

  state.activeCoreSession = null;
}

function checkQuiz() {
  const unit = getSelectedUnit();
  if (!unit) return;
  const questions = unit.content.boss?.questions || [];
  if (!questions.length) return;

  const form = document.getElementById("quiz-form");
  if (!form) return;

  let score = 0;
  questions.forEach((question, index) => {
    const selected = form.querySelector(`input[name="q-${index}"]:checked`);
    if (selected && Number(selected.value) === question.answer) score += 1;
  });

  const percent = Math.round((score / questions.length) * 100);
  state.quizResults[unit.id] = { score, total: questions.length, percent };
  save(STORAGE_KEYS.quiz, state.quizResults);
  state.quizHistory.push({ unitId: unit.id, percent, at: new Date().toISOString() });
  if (state.quizHistory.length > 120) {
    state.quizHistory = state.quizHistory.slice(-120);
  }
  save(STORAGE_KEYS.quizHistory, state.quizHistory);
  if (percent === 100) {
    claimEventXP("quiz_100", unit.id, { enforceClaimWindow: false });
    registerProgressEvent("quiz_80_plus", { unitId: unit.id, trackId: state.trackId, percent });
  } else if (percent >= 80) {
    claimEventXP("quiz_80", unit.id, { enforceClaimWindow: false });
    registerProgressEvent("quiz_80_plus", { unitId: unit.id, trackId: state.trackId, percent });
  } else {
    registerProgressEvent("quiz_attempt", { unitId: unit.id, trackId: state.trackId, percent });
  }
  showToast(`نتيجتك ${score}/${questions.length} (${percent}%)`);
  renderChallenges();
  renderProfile();
  renderHome();
  renderDetail();
}

function ensureDailyTasksState() {
  const today = getTodayKey();
  if (state.dailyTasks.date === today && Array.isArray(state.dailyTasks.items) && state.dailyTasks.items.length) {
    return;
  }
  state.dailyTasks = {
    date: today,
    items: generateDailyTasks()
  };
  save(STORAGE_KEYS.dailyTasks, state.dailyTasks);
}

function generateDailyTasks() {
  const level = getUserLevel(calculateUserPoints());
  const budget = getStudyBudgetMinutes();
  const weakest = getWeakestSkillLabel();
  const remainingUnits = getTrack().units.filter((unit) => !state.completed.has(unit.id)).length;
  const deepWorkTarget = budget >= 45 ? 2 : 1;
  const exerciseTarget = level >= 16 ? 2 : 1;
  const tasks = [
    {
      id: "deep_core",
      title: "جلسة فهم عميق",
      description: `أكمل ${deepWorkTarget} قراءة مركزة في ركن المفاهيم اليوم.`,
      eventType: "lesson_read_complete",
      target: deepWorkTarget,
      progress: 0,
      rewardXp: DAILY_TASK_RULES.baseReward,
      done: false,
      claimed: false
    },
    {
      id: "training_ground",
      title: "أرضية التطبيق",
      description: `أنهِ ${exerciseTarget} تمرين نموذجي لتعزيز التثبيت العملي.`,
      eventType: "exercise_solved",
      target: exerciseTarget,
      progress: 0,
      rewardXp: DAILY_TASK_RULES.baseReward + 5,
      done: false,
      claimed: false
    },
    {
      id: "weakness_focus",
      title: "سد الثغرة",
      description: `ركز على نقطة ضعفك (${weakest}) عبر نشاط واحد موجّه.`,
      eventType: "weakness_focus",
      skillLabel: weakest,
      target: 1,
      progress: 0,
      rewardXp: DAILY_TASK_RULES.weaknessReward,
      done: false,
      claimed: false
    }
  ];

  if (level >= 16 && remainingUnits > 0) {
    tasks.push({
      id: "elite_push",
      title: "دفعة المحارب",
      description: "أكمل وحدة كاملة اليوم للحفاظ على الرتم العالي.",
      eventType: "unit_complete",
      target: 1,
      progress: 0,
      rewardXp: DAILY_TASK_RULES.eliteReward,
      done: false,
      claimed: false
    });
  } else if (level >= 16) {
    tasks.push({
      id: "elite_quiz",
      title: "Boss صغير يومي",
      description: "احصل على +80% في كويزين اليوم.",
      eventType: "quiz_80_plus",
      target: 2,
      progress: 0,
      rewardXp: DAILY_TASK_RULES.eliteReward,
      done: false,
      claimed: false
    });
  }
  return tasks;
}

function updateDailyTaskProgress(eventName, meta = {}) {
  ensureDailyTasksState();
  let changed = false;
  state.dailyTasks.items = state.dailyTasks.items.map((task) => {
    if (task.claimed || task.done) return task;
    if (!taskMatchesEvent(task, eventName, meta)) return task;
    const nextProgress = Math.min(task.target, (task.progress || 0) + 1);
    const done = nextProgress >= task.target;
    changed = changed || nextProgress !== task.progress || done !== task.done;
    return {
      ...task,
      progress: nextProgress,
      done
    };
  });

  if (changed) {
    save(STORAGE_KEYS.dailyTasks, state.dailyTasks);
    if (state.page === "profile") renderDailyTasks();
  }
}

function claimDailyTaskReward(taskId) {
  if (!taskId) return;
  ensureDailyTasksState();
  const idx = state.dailyTasks.items.findIndex((task) => task.id === taskId);
  if (idx < 0) return;
  const task = state.dailyTasks.items[idx];
  if (!task.done || task.claimed) return;
  const gained = grantBonusXP(task.rewardXp, "daily_task_reward", task.id);
  state.dailyTasks.items[idx] = { ...task, claimed: true };
  save(STORAGE_KEYS.dailyTasks, state.dailyTasks);
  showToast(`مهمة مكتملة: +${gained} XP`);
  renderProfile();
  renderHome();
  renderChallenges();
}

function taskMatchesEvent(task, eventName, meta = {}) {
  if (task.eventType === eventName) return true;
  if (task.eventType === "weakness_focus") {
    const accepts = eventName === "lesson_read_complete" || eventName === "summary_view" || eventName === "exercise_solved" || eventName === "quiz_80_plus";
    if (!accepts) return false;
    const unit = findUnitById(meta.trackId || state.trackId, meta.unitId) || findUnitAcrossTracks(meta.unitId);
    if (!unit) return false;
    return isUnitInSkillLabel(unit, task.skillLabel);
  }
  return false;
}

function maybeTriggerStreakPenalty(todayKey) {
  const lastLogin = state.xp.lastLoginDate;
  if (!lastLogin) return 0;
  const gap = daysBetweenDateKeys(lastLogin, todayKey);
  if (gap <= 1) return 0;

  const previousStreak = getStreakEndingAt(lastLogin);
  if (previousStreak < RECOVERY_RULES.minStreakToTrigger) return 0;
  if (state.recoveryMission.active && !state.recoveryMission.claimed) return 0;

  const penalty = Math.min(
    RECOVERY_RULES.maxPenalty,
    Math.max(RECOVERY_RULES.minPenalty, Math.round(calculateUserPoints() * 0.06))
  );

  state.xp.current = Math.max(0, state.xp.current - penalty);
  save(STORAGE_KEYS.xp, state.xp);
  syncCurrentXpVar();
  sendXpEventToBackend({
    event: "streak_break_penalty",
    scope: lastLogin,
    xp_gained: -penalty,
    total_xp: state.xp.current,
    level: getUserLevel(state.xp.current),
    timestamp: new Date().toISOString()
  });

  state.recoveryMission = {
    active: true,
    progress: 0,
    target: RECOVERY_RULES.requiredActions,
    createdDate: todayKey,
    breakDate: lastLogin,
    penaltyXp: penalty,
    rewardXp: RECOVERY_RULES.rewardXp,
    completed: false,
    claimed: false
  };
  save(STORAGE_KEYS.recoveryMission, state.recoveryMission);
  return penalty;
}

function updateRecoveryMissionProgress(eventName) {
  const mission = state.recoveryMission;
  if (!mission.active || mission.completed || mission.claimed) return;
  const valid = ["lesson_read_complete", "exercise_solved", "quiz_80_plus", "unit_complete"];
  if (!valid.includes(eventName)) return;
  mission.progress = Math.min(mission.target, (mission.progress || 0) + 1);
  mission.completed = mission.progress >= mission.target;
  save(STORAGE_KEYS.recoveryMission, mission);
  if (mission.completed) {
    showToast("مهمة التعويض جاهزة للاستلام.");
  }
  if (state.page === "profile") renderRecoveryMission();
}

function claimRecoveryMission() {
  const mission = state.recoveryMission;
  if (!mission.active || !mission.completed || mission.claimed) return;
  const gained = grantBonusXP(mission.rewardXp, "recovery_mission_reward", mission.createdDate);
  state.recoveryMission = {
    ...mission,
    claimed: true,
    active: false
  };
  save(STORAGE_KEYS.recoveryMission, state.recoveryMission);
  showToast(`استعادة ناجحة: +${gained} XP`);
  renderProfile();
  renderHome();
  renderChallenges();
}

function ensureWeeklyBossState() {
  const today = new Date();
  const weekKey = getWeekKey(today);
  if (state.weeklyBoss?.weekKey === weekKey) return;
  state.weeklyBoss = buildWeeklyBoss(today, weekKey);
  save(STORAGE_KEYS.weeklyBoss, state.weeklyBoss);
}

function buildWeeklyBoss(today, weekKey) {
  const level = getUserLevel(calculateUserPoints());
  const unitsTarget = level >= 30 ? 5 : level >= 16 ? 4 : 3;
  const quizTarget = level >= 30 ? 4 : level >= 16 ? 3 : 2;
  const rewardXp = level >= 30 ? WEEKLY_BOSS_RULES.legendaryReward : level >= 16 ? WEEKLY_BOSS_RULES.epicReward : WEEKLY_BOSS_RULES.baseReward;
  const weekEnd = getWeekEndDate(today);
  const weakest = getWeakestSkillLabel();
  return {
    weekKey,
    title: "Boss الأسبوع",
    description: `أنهِ ${unitsTarget} وحدات و${quizTarget} كويزات +80% مع تركيز على ${weakest}.`,
    unitsTarget,
    quizTarget,
    unitsDone: 0,
    quizDone: 0,
    rewardXp,
    endsAt: dateKey(weekEnd),
    completed: false,
    claimed: false
  };
}

function updateWeeklyBossProgress(eventName) {
  if (!state.weeklyBoss || state.weeklyBoss.claimed) return;
  let changed = false;
  if (eventName === "unit_complete" && state.weeklyBoss.unitsDone < state.weeklyBoss.unitsTarget) {
    state.weeklyBoss.unitsDone += 1;
    changed = true;
  }
  if (eventName === "quiz_80_plus" && state.weeklyBoss.quizDone < state.weeklyBoss.quizTarget) {
    state.weeklyBoss.quizDone += 1;
    changed = true;
  }
  if (!changed) return;
  state.weeklyBoss.completed =
    state.weeklyBoss.unitsDone >= state.weeklyBoss.unitsTarget && state.weeklyBoss.quizDone >= state.weeklyBoss.quizTarget;
  save(STORAGE_KEYS.weeklyBoss, state.weeklyBoss);
  if (state.weeklyBoss.completed) {
    showToast("Boss الأسبوع جاهز للاستلام.");
  }
  if (state.page === "profile") renderWeeklyBoss();
}

function claimWeeklyBossReward() {
  if (!state.weeklyBoss || !state.weeklyBoss.completed || state.weeklyBoss.claimed) return;
  const gained = grantBonusXP(state.weeklyBoss.rewardXp, "weekly_boss_reward", state.weeklyBoss.weekKey);
  state.weeklyBoss.claimed = true;
  save(STORAGE_KEYS.weeklyBoss, state.weeklyBoss);
  showToast(`Boss مكتمل: +${gained} XP`);
  renderProfile();
  renderHome();
  renderChallenges();
}

function getStudyBudgetMinutes() {
  const last7 = getLastDays(7).map((d) => state.activity[d] || 0);
  const avg = last7.reduce((sum, m) => sum + m, 0) / Math.max(1, last7.length);
  if (avg >= 45) return 55;
  if (avg >= 25) return 40;
  return 25;
}

function getWeakestSkillLabel() {
  const radar = buildSkillRadar();
  if (!radar.values.length) return "التحليل";
  let minIndex = 0;
  radar.values.forEach((value, idx) => {
    if (value < radar.values[minIndex]) minIndex = idx;
  });
  return radar.labels[minIndex] || "التحليل";
}

function findUnitAcrossTracks(unitId) {
  if (!unitId) return null;
  for (const track of tracks) {
    const unit = track.units.find((item) => item.id === unitId);
    if (unit) return unit;
  }
  return null;
}

function isUnitInSkillLabel(unit, label) {
  const d = unit.domain;
  if (label === "التحليل") return d.includes("التحليل");
  if (label === "الجبر") return d.includes("الجبر") || d.includes("الحصن");
  if (label === "الأحياء") return d.includes("البروتينات") || d.includes("العصبي");
  if (label === "الجيولوجيا") return d.includes("الجيولوجيا") || d.includes("الطاقة");
  if (label === "الاحتمالات") return unit.title.includes("الاحتمالات");
  return false;
}

function getStreakEndingAt(key) {
  if (!key) return 0;
  let streak = 0;
  let cursor = new Date(`${key}T00:00:00`);
  while (true) {
    const dayKey = dateKey(cursor);
    const loginKey = `daily_login:global:${dayKey}`;
    if (state.eventClaims[loginKey]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}

function daysBetweenDateKeys(a, b) {
  if (!a || !b) return 0;
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  const diff = db.getTime() - da.getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function getWeekKey(date = new Date()) {
  const start = getWeekStartDate(date);
  return dateKey(start);
}

function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEndDate(date = new Date()) {
  const start = getWeekStartDate(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function getTrack() {
  return tracks.find((track) => track.id === state.trackId) || tracks[0];
}

function getSelectedUnit() {
  return getTrack().units.find((unit) => unit.id === state.selectedUnitId) || null;
}

function findUnitById(trackId, unitId) {
  if (!trackId || !unitId) return null;
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return null;
  return track.units.find((u) => u.id === unitId) || null;
}

function firstUnlockedUnit(track) {
  return track.units.find((_, index) => isUnitUnlocked(index));
}

function isUnitUnlocked(index) {
  if (index <= 0) return true;
  const units = getTrack().units;
  return units.slice(0, index).every((unit) => state.completed.has(unit.id));
}

function groupUnitsByDomain(track) {
  return track.units.reduce((acc, unit) => {
    if (!acc[unit.domain]) acc[unit.domain] = [];
    acc[unit.domain].push(unit);
    return acc;
  }, {});
}

function buildLeaderboard() {
  const userPoints = calculateUserPoints();
  const userWeeklyPoints = calculateWeeklyXPFromClaims();
  const me = {
    id: "me",
    name: state.userName,
    points: userPoints,
    weeklyPoints: userWeeklyPoints,
    note: "تركيزك اليومي يحدد صعودك",
    isMe: true
  };

  const mockBase = [
    { name: "Aya_BacPro", delta: 430, note: "ثبات كبير في التحديات" },
    { name: "Hamza_Math", delta: 250, note: "متفوق في الجبر" },
    { name: "Lina_Science", delta: 170, note: "تقدم ممتاز في المناعة" },
    { name: "Nassim_2026", delta: 100, note: "رفع السلسلة هذا الأسبوع" },
    { name: "Imene_Elite", delta: 35, note: "قريبة جداً منك" },
    { name: "Younes_Brain", delta: -25, note: "يطاردك بقوة" },
    { name: "Sara_Codex", delta: -70, note: "حاضرة يومياً" },
    { name: "Riad_Pro", delta: -140, note: "تحسن ملحوظ في الكويز" },
    { name: "Maya_Bac", delta: -210, note: "تبدأ موجة صعود جديدة" }
  ];

  const mock = mockBase.map((entry, idx) => ({
    id: `mock-${idx}`,
    name: entry.name,
    points: Math.max(80, userPoints + entry.delta),
    weeklyPoints: calculateMockWeeklyXP(entry.name, Math.max(80, userPoints + entry.delta)),
    note: entry.note,
    isMe: false
  }));

  return [me, ...mock];
}

function calculateWeeklyXPFromClaims() {
  const start = getWeekKey();
  const end = getTodayKey();
  let total = 0;
  Object.keys(state.eventClaims || {}).forEach((claimKey) => {
    const parts = claimKey.split(":");
    if (parts.length < 3) return;
    const maybeDate = parts[parts.length - 1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) return;
    if (maybeDate < start || maybeDate > end) return;
    const eventName = parts[0];
    const baseXP = XP_RULES[eventName]?.xp || 0;
    total += baseXP;
  });
  if (total > 0) return Math.round(total);
  return Math.max(20, Math.round(calculateUserPoints() * 0.18));
}

function calculateMockWeeklyXP(name, allTimePoints) {
  const seed = hashString(`${name}:${getWeekKey()}`);
  const ratio = 0.22 + (seed % 24) / 100;
  const bonus = 30 + (seed % 95);
  return Math.max(40, Math.round(allTimePoints * ratio + bonus));
}

function hashString(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getLeagueFromXP(points) {
  const xp = Math.max(0, Number(points) || 0);
  if (xp >= 2200) return { id: "elite", label: "Elite" };
  if (xp >= 1400) return { id: "gold", label: "Gold" };
  if (xp >= 700) return { id: "silver", label: "Silver" };
  return { id: "bronze", label: "Bronze" };
}

function getRankBadgeIndexByLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  if (safeLevel >= 30) return 5;
  if (safeLevel >= 23) return 4;
  if (safeLevel >= 16) return 3;
  if (safeLevel >= 11) return 2;
  if (safeLevel >= 6) return 1;
  return 0;
}

function getRankBadgeAssetByLevel(level) {
  return RANK_BADGE_ASSETS[getRankBadgeIndexByLevel(level)] || RANK_BADGE_ASSETS[0];
}

function getRankBadgeAssetByPoints(points) {
  return getRankBadgeAssetByLevel(getUserLevel(points));
}

function buildPressureHint(above, below, gapAbove, gapBelow, unit) {
  if (below && gapBelow <= 90) {
    return {
      className: "danger",
      message: `🔥 ${below.name} يقترب منك (${Math.round(gapBelow)} ${unit})`
    };
  }
  if (above && gapAbove <= 130) {
    return {
      className: "push",
      message: `🚀 فرصة صعود: ${above.name} أمامك بفارق ${Math.round(gapAbove)} ${unit}`
    };
  }
  if (!above) {
    return {
      className: "top",
      message: "👑 أنت المتصدر، حافظ على الفارق."
    };
  }
  return {
    className: "calm",
    message: "📈 تقدمك مستقر، ركز على مهام اليوم لتسريع الصعود."
  };
}

function calculateUserPoints() {
  return Math.max(0, Math.round(state.xp.current || 0));
}

function averageQuizPercent() {
  const all = Object.values(state.quizResults);
  if (!all.length) return 0;
  const sum = all.reduce((acc, x) => acc + (x.percent || 0), 0);
  return Math.round(sum / all.length);
}

function getPerfectQuizStreakCount() {
  if (!state.quizHistory.length) return 0;
  let streak = 0;
  for (let i = state.quizHistory.length - 1; i >= 0; i -= 1) {
    if ((state.quizHistory[i].percent || 0) === 100) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function calculateCurrentScoreFromXP() {
  const xp = calculateUserPoints();
  const score = 10 + Math.min(10, xp / 1700);
  return Math.min(20, Math.max(10, score));
}

function getUserLevel(xp) {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (safeXp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

function getUserTier() {
  const level = getUserLevel(calculateUserPoints());
  if (level >= 30) {
    return { id: "legendary", label: "أسطورة", defaultTitle: "الكوديكس الأعظم" };
  }
  if (level >= 16) {
    return { id: "epic", label: "محارب دراسة", defaultTitle: "محارب دراسة" };
  }
  if (level >= 6) {
    return { id: "rare", label: "منضبط", defaultTitle: "الطالب المنضبط" };
  }
  return { id: "basic", label: "مبتدئ", defaultTitle: "طالب مبتدئ" };
}

function xpRequiredForLevel(level) {
  const safeLevel = Math.max(1, level);
  return Math.ceil(100 * Math.pow(safeLevel, 1.5));
}

function buildSkillRadar() {
  const track = getTrack();
  const labels = ["التحليل", "الجبر", "الأحياء", "الجيولوجيا", "الاحتمالات"];

  const scores = labels.map((label) => {
    const related = track.units.filter((unit) => {
      const d = unit.domain;
      if (label === "التحليل") return d.includes("التحليل");
      if (label === "الجبر") return d.includes("الجبر") || d.includes("الحصن");
      if (label === "الأحياء") return d.includes("البروتينات") || d.includes("العصبي");
      if (label === "الجيولوجيا") return d.includes("الجيولوجيا") || d.includes("الطاقة");
      if (label === "الاحتمالات") return unit.title.includes("الاحتمالات");
      return false;
    });

    if (!related.length) return 20;
    const completed = related.filter((u) => state.completed.has(u.id)).length;
    const completionPct = (completed / related.length) * 100;
    const quizPct = related
      .map((u) => state.quizResults[u.id]?.percent || 0)
      .reduce((a, b) => a + b, 0) / related.length;
    return Math.round(completionPct * 0.7 + quizPct * 0.3);
  });

  return { labels, values: scores };
}

function renderRadarSvg(labels, values) {
  const size = 250;
  const center = size / 2;
  const radius = 88;
  const points = values
    .map((value, i) => {
      const angle = (-Math.PI / 2) + ((Math.PI * 2) * i) / values.length;
      const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const axis = labels
    .map((label, i) => {
      const angle = (-Math.PI / 2) + ((Math.PI * 2) * i) / labels.length;
      const x = center + Math.cos(angle) * (radius + 24);
      const y = center + Math.sin(angle) * (radius + 24);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${escapeHtml(label)}</text>`;
    })
    .join("");

  const webs = [20, 40, 60, 80, 100]
    .map((step) => {
      const poly = labels
        .map((_, i) => {
          const angle = (-Math.PI / 2) + ((Math.PI * 2) * i) / labels.length;
          const r = (step / 100) * radius;
          return `${(center + Math.cos(angle) * r).toFixed(2)},${(center + Math.sin(angle) * r).toFixed(2)}`;
        })
        .join(" ");
      return `<polygon points="${poly}" />`;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${size} ${size}" class="radar-svg" role="img" aria-label="Skill Radar">
      <g class="radar-web">${webs}</g>
      <polygon class="radar-shape" points="${points}" />
      <g class="radar-axis">${axis}</g>
    </svg>
  `;
}

function triggerRewardFeedback(type = "xp") {
  triggerHaptic(type === "achievement" ? "heavy" : "medium");
  playRewardTone(type);
}

function triggerHaptic(level = "medium") {
  const tgHaptic = window.Telegram?.WebApp?.HapticFeedback;
  if (tgHaptic?.impactOccurred) {
    tgHaptic.impactOccurred(level);
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate(level === "heavy" ? 80 : 35);
  }
}

function playRewardTone(type = "xp") {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type === "achievement" ? "triangle" : "sine";
    osc.frequency.value = type === "achievement" ? 660 : 520;
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {}
}

function playTierSound(tierId) {
  if (tierId !== "legendary") return;
  triggerHaptic("heavy");
  playRewardTone("achievement");
}

function triggerColorBurst() {
  el.pageProfile.classList.add("burst-active");
  setTimeout(() => el.pageProfile.classList.remove("burst-active"), 900);
}
function getStreakDays() {
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = dateKey(cursor);
    const loginKey = `daily_login:global:${key}`;
    if (state.eventClaims[loginKey]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}

function daysRemaining(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getLastDays(count) {
  const arr = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(dateKey(d));
  }
  return arr;
}

function getTodayKey() {
  return dateKey(new Date());
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(key) {
  const date = new Date(`${key}T00:00:00`);
  return date.toLocaleDateString("ar-DZ", { weekday: "short" });
}

function iconForSubject(subject) {
  if (subject.includes("الطاقة")) return "⚡";
  if (subject.includes("الجيولوجيا")) return "🪨";
  if (subject.includes("البروتينات")) return "🧬";
  if (subject.includes("التحليل")) return "📈";
  if (subject.includes("الجبر")) return "🧠";
  if (subject.includes("الحصن")) return "🛡️";
  if (subject.includes("الهندسة")) return "📐";
  return "📚";
}

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((x) => x.charAt(0)).join("").toUpperCase() || "CB";
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    el.toast.classList.remove("show");
  }, 2100);
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(text = "") {
  return text
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(text = "") {
  return escapeHtml(text).replaceAll('"', "&quot;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", async () => {
    try {
      const swUrl = `./sw.js?v=${encodeURIComponent(BUILD_ID)}`;
      const registration = await navigator.serviceWorker.register(swUrl, { updateViaCache: "none" });
      registration.update().catch(() => {});

      let refreshed = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshed) return;
        refreshed = true;
        window.location.reload();
      });
    } catch {
      // noop
    }
  });
}

function sendXpEventToBackend(payload) {
  if (!BACKEND_XP_ENDPOINT) return;
  fetch(BACKEND_XP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

function syncCurrentXpVar() {
  window.current_xp = calculateUserPoints();
}
