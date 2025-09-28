import { AppRouter } from "@/components/app-router"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Home() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}
