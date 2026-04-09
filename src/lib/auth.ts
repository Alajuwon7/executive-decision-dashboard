export interface MockUser {
  email: string;
  name: string;
  initials: string;
}

export function login(email: string): MockUser {
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const user: MockUser = { email, name, initials };

  localStorage.setItem("edi_user", JSON.stringify(user));
  document.cookie = "edi_session=active; path=/; max-age=86400";
  return user;
}

export function logout() {
  localStorage.removeItem("edi_user");
  document.cookie = "edi_session=; path=/; max-age=0";
}

export function getUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("edi_user");
  return raw ? JSON.parse(raw) : null;
}
