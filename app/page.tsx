import { PlazaManagementApp } from "@/components/plaza-management-app"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Home() {
  return (
    <ErrorBoundary>
      <PlazaManagementApp />
    </ErrorBoundary>
  )
}
