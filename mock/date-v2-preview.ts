import type {
  DateV2Country,
  DateV2Profile
} from "../src/views/buyer/date-v2-preview/domain/date-v2-preview";

export const dateV2MockCountries: DateV2Country[] = [
  { code: "US", name: "美国", dialCode: "+1", minLength: 10, maxLength: 10 },
  { code: "IN", name: "印度", dialCode: "+91", minLength: 10, maxLength: 10 },
  { code: "AF", name: "阿富汗", dialCode: "+93", minLength: 9, maxLength: 9 },
  { code: "AE", name: "阿联酋", dialCode: "+971", minLength: 9, maxLength: 9 },
  { code: "AD", name: "安道尔", dialCode: "+376", minLength: 6, maxLength: 9 },
  {
    code: "AL",
    name: "阿尔巴尼亚",
    dialCode: "+355",
    minLength: 8,
    maxLength: 9
  },
  {
    code: "DZ",
    name: "阿尔及利亚",
    dialCode: "+213",
    minLength: 9,
    maxLength: 9
  },
  { code: "AO", name: "安哥拉", dialCode: "+244", minLength: 9, maxLength: 9 },
  { code: "AR", name: "阿根廷", dialCode: "+54", minLength: 10, maxLength: 11 },
  { code: "AU", name: "澳大利亚", dialCode: "+61", minLength: 9, maxLength: 9 },
  { code: "AT", name: "奥地利", dialCode: "+43", minLength: 10, maxLength: 13 },
  {
    code: "AZ",
    name: "阿塞拜疆",
    dialCode: "+994",
    minLength: 9,
    maxLength: 9
  },
  { code: "GB", name: "英国", dialCode: "+44", minLength: 10, maxLength: 10 },
  { code: "BR", name: "巴西", dialCode: "+55", minLength: 10, maxLength: 11 }
];

export const dateV2MockProfiles: DateV2Profile[] = [
  {
    id: "mia",
    name: "Mia",
    age: 25,
    city: "Miami",
    emoji: "🌸",
    gradient: "linear-gradient(145deg, #ffb3c7, #703c75)"
  },
  {
    id: "emma",
    name: "Emma",
    age: 27,
    city: "London",
    emoji: "✨",
    gradient: "linear-gradient(145deg, #f9d4a8, #b34a68)"
  },
  {
    id: "sophia",
    name: "Sophia",
    age: 23,
    city: "Sydney",
    emoji: "💫",
    gradient: "linear-gradient(145deg, #b6d9ff, #6f68aa)"
  },
  {
    id: "olivia",
    name: "Olivia",
    age: 26,
    city: "Toronto",
    emoji: "🌙",
    gradient: "linear-gradient(145deg, #ffd0b5, #994f75)"
  },
  {
    id: "lily",
    name: "Lily",
    age: 25,
    city: "New York",
    emoji: "💗",
    gradient: "linear-gradient(145deg, #dfc4ff, #6e4b9e)"
  },
  {
    id: "ava",
    name: "Ava",
    age: 24,
    city: "Dubai",
    emoji: "🦋",
    gradient: "linear-gradient(145deg, #bdebd4, #437c7b)"
  }
];
