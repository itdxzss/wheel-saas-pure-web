export type BasicPartyManPage = "landing" | "matches" | "profile" | "chat";

export interface BasicPartyManProfile {
  id: string;
  name: string;
  handle: string;
  age: number;
  city: string;
  bio: string;
  activeText: string;
  accent: string;
  photoTones: string[];
}

export interface BasicPartyManFlowState {
  page: BasicPartyManPage;
  accessVisible: boolean;
  loginVisible: boolean;
  selectedProfileId: string;
}

export type BasicPartyManFlowAction =
  | "REQUEST_ACCESS"
  | "OPEN_LOGIN"
  | "CLOSE_OVERLAYS"
  | "PAIRING_SUCCEEDED"
  | "BACK_TO_MATCHES"
  | "OPEN_CHAT"
  | "BACK_TO_PROFILE"
  | "RESET"
  | { type: "OPEN_PROFILE"; profileId: string };

export const basicPartyManProfiles: BasicPartyManProfile[] = [
  {
    id: "enakshi",
    name: "埃纳克希·佩雷拉 🎀",
    handle: "@enakshi",
    age: 27,
    city: "孟买",
    bio: "✨ 活出我最好的生活",
    activeText: "现已活跃 · 10幅帖子",
    accent: "#f8a7bb",
    photoTones: ["#a6c9d9", "#e8c59e", "#c08a6e"]
  },
  {
    id: "cassidy",
    name: "罗塞纳·卡西迪",
    handle: "@cassidy",
    age: 25,
    city: "德里",
    bio: "Coffee, sunsets and good conversations.",
    activeText: "现已活跃 · 7个岗位",
    accent: "#efb5a2",
    photoTones: ["#efd4c4", "#b8a184", "#d97875"]
  },
  {
    id: "lina",
    name: "🦋 拉蕾 🦋",
    handle: "@lina",
    age: 24,
    city: "班加罗尔",
    bio: "Music, travel and spontaneous weekends.",
    activeText: "现已活跃 · 6个岗位",
    accent: "#d9a070",
    photoTones: ["#a56b4a", "#d0a280", "#8a6f5f"]
  },
  {
    id: "kanmani",
    name: "Kanmani_🤎!",
    handle: "@kanmani",
    age: 28,
    city: "金奈",
    bio: "Here for genuine connections.",
    activeText: "现已活跃 · 9个岗位",
    accent: "#b3c58d",
    photoTones: ["#a8c17e", "#83a168", "#d0b49f"]
  },
  {
    id: "citygirl",
    name: "是我，城市",
    handle: "@citygirl",
    age: 26,
    city: "海得拉巴",
    bio: "City lights and slow mornings.",
    activeText: "现已活跃 · 9个岗位",
    accent: "#e4a3b1",
    photoTones: ["#d8b7a1", "#79564b", "#d5859f"]
  }
];

export function createBasicPartyManFlowState(): BasicPartyManFlowState {
  return {
    page: "landing",
    accessVisible: false,
    loginVisible: false,
    selectedProfileId: basicPartyManProfiles[0].id
  };
}

export function transitionBasicPartyManFlow(
  state: BasicPartyManFlowState,
  action: BasicPartyManFlowAction
): BasicPartyManFlowState {
  if (typeof action === "object") {
    return {
      ...state,
      page: "profile",
      selectedProfileId: action.profileId
    };
  }

  switch (action) {
    case "REQUEST_ACCESS":
      return { ...state, accessVisible: true };
    case "OPEN_LOGIN":
      return { ...state, accessVisible: false, loginVisible: true };
    case "CLOSE_OVERLAYS":
      return { ...state, accessVisible: false, loginVisible: false };
    case "PAIRING_SUCCEEDED":
      return {
        ...state,
        page: "matches",
        accessVisible: false,
        loginVisible: false
      };
    case "BACK_TO_MATCHES":
      return { ...state, page: "matches" };
    case "OPEN_CHAT":
      return { ...state, page: "chat" };
    case "BACK_TO_PROFILE":
      return { ...state, page: "profile" };
    case "RESET":
      return createBasicPartyManFlowState();
  }
}
