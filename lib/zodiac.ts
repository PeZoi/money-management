/**
 * Helper tính toán Cung hoàng đạo, Con giáp và Tuổi từ ngày sinh.
 */

export interface ZodiacInfo {
  name: string;
  emoji: string;
}

export interface LunarAnimalInfo {
  name: string;
  emoji: string;
}

/**
 * Xác định cung hoàng đạo dựa trên ngày & tháng sinh dương lịch.
 */
export function getZodiacSign(birthdateStr: string | null | undefined): ZodiacInfo | null {
  if (!birthdateStr) return null;
  const date = new Date(birthdateStr);
  if (isNaN(date.getTime())) return null;

  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() trả về 0-11

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: "Bạch Dương", emoji: "♈" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: "Kim Ngưu", emoji: "♉" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { name: "Song Tử", emoji: "♊" };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { name: "Cự Giải", emoji: "♋" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: "Sư Tử", emoji: "♌" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: "Xử Nữ", emoji: "♍" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: "Thiên Bình", emoji: "♎" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: "Bọ Cạp", emoji: "♏" };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: "Nhân Mã", emoji: "♐" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "Ma Kết", emoji: "♑" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "Bảo Bình", emoji: "♒" };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: "Song Ngư", emoji: "♓" };

  return null;
}

const LUNAR_ANIMALS: LunarAnimalInfo[] = [
  { name: "Tý", emoji: "🐭" },
  { name: "Sửu", emoji: "🐮" },
  { name: "Dần", emoji: "🐯" },
  { name: "Mão", emoji: "🐱" }, // Con giáp Việt Nam là Mèo
  { name: "Thìn", emoji: "🐲" },
  { name: "Tỵ", emoji: "🐍" },
  { name: "Ngọ", emoji: "🐴" },
  { name: "Mùi", emoji: "🐐" },
  { name: "Thân", emoji: "🐵" },
  { name: "Dậu", emoji: "🐔" },
  { name: "Tuất", emoji: "🐶" },
  { name: "Hợi", emoji: "🐷" }
];

/**
 * Xác định con giáp dựa trên năm sinh dương lịch bằng công thức: (năm - 4) % 12.
 */
export function getLunarAnimal(birthdateStr: string | null | undefined): LunarAnimalInfo | null {
  if (!birthdateStr) return null;
  const date = new Date(birthdateStr);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  let index = (year - 4) % 12;
  if (index < 0) {
    index += 12;
  }
  return LUNAR_ANIMALS[index];
}

/**
 * Tính toán tuổi hiện tại dựa trên ngày sinh dương lịch.
 */
export function getAge(birthdateStr: string | null | undefined): number | null {
  if (!birthdateStr) return null;
  const birthDate = new Date(birthdateStr);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
