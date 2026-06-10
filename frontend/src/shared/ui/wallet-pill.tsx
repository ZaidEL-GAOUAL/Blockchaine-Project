import { Wallet } from 'lucide-react'

import { truncateAddress } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

export function WalletPill({
  account,
  network,
}: {
  account: string
  network: string
}) {
  return (
    <Badge className="gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-2 text-[var(--accent)]">
      <Wallet className="h-3.5 w-3.5" />
      {truncateAddress(account)} · {network}
    </Badge>
  )
}
