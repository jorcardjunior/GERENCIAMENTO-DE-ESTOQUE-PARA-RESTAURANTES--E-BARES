export type ProfileRole = "admin" | "funcionario"

export interface Profile {
  id: string
  name: string | null
  email: string | null
  role: ProfileRole
  avatar_url: string | null
  created_at: string | null
}

export interface Stat {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
}
