// Type declarations for services/api.js — kept as plain JS at runtime
// (other .jsx files depend on its current shape). Response payloads
// come from a separate Node/FastAPI backend with no shared schema in
// this repo, so `Promise<any>` is an honest type, not a placeholder.

export const authAPI: {
  register: (data: Record<string, any>) => Promise<any>
  login: (data: { email: string; password: string }) => Promise<any>
  logout: () => Promise<any>
}

export const advisoryAPI: {
  predict: (payload: Record<string, any>) => Promise<any>
  history: (page?: number, limit?: number) => Promise<any>
  getSession: (id: string | number) => Promise<any>
  experienceSearch: (q?: string) => Promise<any>
}

export const consultantAPI: {
  analyze: (payload: Record<string, any>) => Promise<any>
}

export const microfinanceAPI: {
  list: (riskTier: string) => Promise<any>
}

export const userAPI: {
  me: () => Promise<any>
  update: (data: Record<string, any>) => Promise<any>
  upgrade: (data: Record<string, any>) => Promise<any>
  stats: () => Promise<any>
}

export const modelAPI: {
  districts: () => Promise<any>
  activities: (sector?: string) => Promise<any>
}
