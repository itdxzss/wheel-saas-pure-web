export type BasicEarnPage =
  | "landing"
  | "reward-unlocked"
  | "devices"
  | "device-detail";

export interface BasicEarnFlowState {
  page: BasicEarnPage;
  finalStepVisible: boolean;
  loginVisible: boolean;
  logoutConfirmVisible: boolean;
}

export type BasicEarnFlowAction =
  | "PAIRING_SUCCEEDED"
  | "OPEN_REWARD"
  | "LINK_ANOTHER_ACCOUNT"
  | "OPEN_DEVICES"
  | "OPEN_DEVICE_DETAIL"
  | "BACK_TO_REWARD"
  | "BACK_TO_DEVICES"
  | "REQUEST_LOGOUT"
  | "CANCEL_LOGOUT"
  | "CONFIRM_LOGOUT";

export function createBasicEarnFlowState(): BasicEarnFlowState {
  return {
    page: "landing",
    finalStepVisible: false,
    loginVisible: false,
    logoutConfirmVisible: false
  };
}

export function transitionBasicEarnFlow(
  current: BasicEarnFlowState,
  action: BasicEarnFlowAction
): BasicEarnFlowState {
  switch (action) {
    case "PAIRING_SUCCEEDED":
      return {
        ...current,
        page: "landing",
        finalStepVisible: true,
        loginVisible: false,
        logoutConfirmVisible: false
      };
    case "OPEN_REWARD":
      return {
        ...current,
        page: "reward-unlocked",
        finalStepVisible: false
      };
    case "LINK_ANOTHER_ACCOUNT":
      return {
        ...current,
        page: "landing",
        loginVisible: true,
        logoutConfirmVisible: false
      };
    case "OPEN_DEVICES":
      return {
        ...current,
        page: "devices",
        logoutConfirmVisible: false
      };
    case "OPEN_DEVICE_DETAIL":
      return {
        ...current,
        page: "device-detail",
        logoutConfirmVisible: false
      };
    case "BACK_TO_REWARD":
      return {
        ...current,
        page: "reward-unlocked",
        logoutConfirmVisible: false
      };
    case "BACK_TO_DEVICES":
      return {
        ...current,
        page: "devices",
        logoutConfirmVisible: false
      };
    case "REQUEST_LOGOUT":
      return { ...current, logoutConfirmVisible: true };
    case "CANCEL_LOGOUT":
      return { ...current, logoutConfirmVisible: false };
    case "CONFIRM_LOGOUT":
      return createBasicEarnFlowState();
  }
}
