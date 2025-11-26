"use client"

import ExpenseDashboardPage from "@/app/expenses/page"
import StaffListPage from "@/app/expenses/staff/page"
import VariableExpensesPage from "@/app/expenses/variable/page"
import FixedExpensesPage from "@/app/expenses/fixed/page"

interface ExpenseManagementProps {
  activeSubSection: string
}

export function ExpenseManagement({ activeSubSection }: ExpenseManagementProps) {
  const renderContent = () => {
    switch (activeSubSection) {
      case "expenses-staff":
        return <StaffListPage />
      case "expenses-variable":
        return <VariableExpensesPage />
      case "expenses-dashboard":
        return <ExpenseDashboardPage />
      case "expenses-fixed":
        return <FixedExpensesPage />
      default:
        return <StaffListPage />
    }
  }

  return <>{renderContent()}</>
}
