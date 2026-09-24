import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Brand({ href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Button
      variant="ghost"
      render={<Link href={href} />}
      nativeButton={false}
      aria-label="SIGA — Página inicial"
    >
      <GraduationCap /> SIGA · Inscrições
    </Button>
  )
}
