export type GroupSource = "HISTORICAL" | "SELF_COLLECTED" | "MIXED";
export type SendMode = "ROUNDS" | "DURATION";
export type StartMode = "IMMEDIATE" | "SCHEDULED";
export type ThresholdMode = "COUNT" | "RATE";
export type UnmetAction =
  | "CONTINUE"
  | "REPLACE_PULLER"
  | "REPLACE_WATER_ARMY"
  | "SUPPLY_TARGET"
  | "RETRY"
  | "PAUSE_GROUP"
  | "PARTIAL_COMPLETE"
  | "MANUAL"
  | "ABANDON_GROUP";

export interface TargetDataMetrics {
  raw: number | null;
  valid: number | null;
  duplicate: number | null;
  malformed: number | null;
  invalidPhone: number | null;
  unregistered: number | null;
  used: number | null;
  reserved: number | null;
  available: number | null;
}

export interface GroupPullMarketingCreateDraft {
  taskName: string;
  groupSource: GroupSource;
  remark: string;
  targetPackageId: number | "";
  targetFile: File | null;
  resourceSource: GroupSource;
  clearMembers: boolean;
  muted: boolean;
  groupMaxMembers: number;
  groupNameMode: "KEEP" | "UNIFIED" | "TEMPLATE_SEQUENCE";
  groupAvatarFile: File | null;
  groupDescriptionMode: "KEEP" | "UNIFIED";
  groupInfoPermission: string;
  joinApproval: string;
  memberInvitePermission: string;
  targetGroupTab: "CANDIDATES" | "WAITING_POOL";
  continent: string;
  countries: string[];
  currentRole: string;
  groupNameKeyword: string;
  groupStatus: string;
  managerPhone: string;
  groupJid: string;
  showRegularGroups: boolean;
  occupancy: string;
  speakPermission: string;
  filterJoinApproval: string;
  filterInvitePermission: string;
  groupAgeRange: [number, number];
  memberCountRange: [number, number];
  selectedGroupIds: number[];
  pullerCountPerGroup: number;
  maxPeoplePerPuller: number;
  maxPeoplePerPull: number;
  pullIntervalMs: number;
  maxPullers: number;
  maxGroups: number;
  abnormalGroupLimit: number;
  pullerRetryLimit: number;
  pullerCircuitBreakCount: number;
  pullerExitAfterCompletion: boolean;
  upperLimitAction: "PAUSE" | "STOP";
  waterArmyPerGroup: number;
  waterArmyTaskGroupLimit: number;
  waterArmyDailyGroupLimit: number;
  allowCrossTaskReuse: boolean;
  waterArmyShortageAction: string;
  allowReducePlan: boolean;
  allowWaterArmyReplacement: boolean;
  marketingIntervalMinutes: number;
  marketingTemplateId: number | "";
  sendFirstImmediately: boolean;
  sendMode: SendMode;
  sendRounds: number;
  sendDurationMinutes: number;
  messageLimit: number;
  sendRetryLimit: number;
  groupFailureAction: string;
  marketingStartMode: string;
  waterArmyThresholdMode: ThresholdMode;
  waterArmyThreshold: number;
  targetThresholdMode: ThresholdMode;
  targetThreshold: number;
  unmetActions: UnmetAction[];
  startMode: StartMode;
  scheduledAt: string;
}

export function emptyTargetDataMetrics(): TargetDataMetrics {
  return {
    raw: null,
    valid: null,
    duplicate: null,
    malformed: null,
    invalidPhone: null,
    unregistered: null,
    used: null,
    reserved: null,
    available: null
  };
}

export function createEmptyGroupPullDraft(): GroupPullMarketingCreateDraft {
  return {
    taskName: "",
    groupSource: "HISTORICAL",
    remark: "",
    targetPackageId: "",
    targetFile: null,
    resourceSource: "HISTORICAL",
    clearMembers: false,
    muted: false,
    groupMaxMembers: 300,
    groupNameMode: "KEEP",
    groupAvatarFile: null,
    groupDescriptionMode: "KEEP",
    groupInfoPermission: "ADMIN_ONLY",
    joinApproval: "ENABLED",
    memberInvitePermission: "ADMIN_ONLY",
    targetGroupTab: "CANDIDATES",
    continent: "",
    countries: [],
    currentRole: "",
    groupNameKeyword: "",
    groupStatus: "",
    managerPhone: "",
    groupJid: "",
    showRegularGroups: false,
    occupancy: "",
    speakPermission: "",
    filterJoinApproval: "",
    filterInvitePermission: "",
    groupAgeRange: [0, 3650],
    memberCountRange: [0, 1024],
    selectedGroupIds: [],
    pullerCountPerGroup: 2,
    maxPeoplePerPuller: 60,
    maxPeoplePerPull: 20,
    pullIntervalMs: 1000,
    maxPullers: 0,
    maxGroups: 0,
    abnormalGroupLimit: 0,
    pullerRetryLimit: 2,
    pullerCircuitBreakCount: 3,
    pullerExitAfterCompletion: true,
    upperLimitAction: "PAUSE",
    waterArmyPerGroup: 10,
    waterArmyTaskGroupLimit: 20,
    waterArmyDailyGroupLimit: 8,
    allowCrossTaskReuse: false,
    waterArmyShortageAction: "PAUSE_GROUP",
    allowReducePlan: false,
    allowWaterArmyReplacement: true,
    marketingIntervalMinutes: 10,
    marketingTemplateId: "",
    sendFirstImmediately: true,
    sendMode: "ROUNDS",
    sendRounds: 10,
    sendDurationMinutes: 60,
    messageLimit: 100,
    sendRetryLimit: 2,
    groupFailureAction: "PAUSE_GROUP",
    marketingStartMode: "MINIMUM_REACHED",
    waterArmyThresholdMode: "COUNT",
    waterArmyThreshold: 8,
    targetThresholdMode: "RATE",
    targetThreshold: 70,
    unmetActions: [],
    startMode: "IMMEDIATE",
    scheduledAt: ""
  };
}

export function showScheduledStart(mode: StartMode): boolean {
  return mode === "SCHEDULED";
}

export function showSendRounds(mode: SendMode): boolean {
  return mode === "ROUNDS";
}
