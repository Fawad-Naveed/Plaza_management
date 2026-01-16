"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getExpenseDashboardStats } from "@/lib/expense-actions"
import { Loader2, ArrowRight, Users, Receipt, Wallet, Calendar } from "lucide-react"

export default function ExpenseDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const result = await getExpenseDashboardStats()
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        // Set default values if query fails
        setStats({
          totalFixed: 0,
          totalVariable: 0,
          totalExpenses: 0,
          totalPaid: 0,
          totalPending: 0,
          activeStaffCount: 0,
          pendingRemindersCount: 0,
          breakdown: { salaries: 0, utilities: 0, variable: 0 }
        })
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      setStats({
        totalFixed: 0,
        totalVariable: 0,
        totalExpenses: 0,
        totalPaid: 0,
        totalPending: 0,
        activeStaffCount: 0,
        pendingRemindersCount: 0,
        breakdown: { salaries: 0, utilities: 0, variable: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-medium">Expense Dashboard</h1>
          <p className="text-md text-muted-foreground mt-1">Overview of fixed and variable expenses</p>
        </div>
        <div className="flex gap-2">
          <Link href="/expenses/variable">
            <Button variant="outline">
              Add Variable Expense
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/expenses/fixed">
            <Button>
              Manage Fixed Expenses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
            <CardTitle className="text-sm font-medium">Total Expenses (This Month)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Fixed + Variable</p>
          </CardContent>
        </Card>
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed Expenses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalFixed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Salaries + Utilities</p>
          </CardContent>
        </Card>
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variable Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalVariable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="rounded-4xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaffCount}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingRemindersCount} pending reminders</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card className="rounded-4xl">
        <CardHeader>
          <CardTitle>Breakdown (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Salaries</div>
              <div className="text-2xl font-semibold">PKR {stats.breakdown.salaries.toLocaleString()}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Utilities</div>
              <div className="text-2xl font-semibold">PKR {stats.breakdown.utilities.toLocaleString()}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Variable</div>
              <div className="text-2xl font-semibold">PKR {stats.breakdown.variable.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
