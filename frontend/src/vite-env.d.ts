/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_TICKET_CHAIN_ID?: string
  readonly VITE_CONTRACT_AURORA_GENERAL?: string
  readonly VITE_CONTRACT_AURORA_LOUNGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
