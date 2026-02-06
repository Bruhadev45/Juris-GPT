"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { complianceApi, type ComplianceDeadline } from "@/lib/api";

function urgencyDotColor(urgency: ComplianceDeadline["urgency"]) {
  switch (urgency) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-gray-400";
  }
}

function urgencyBadgeStyle(urgency: ComplianceDeadline["urgency"]) {
  switch (urgency) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300";
    case "low":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function statusBadgeStyle(status: ComplianceDeadline["status"]) {
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300";
    case "upcoming":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300";
    default:
      return "";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCalendarDays(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // getDay() returns 0 for Sunday. We want Monday = 0.
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill remaining cells (up to 42 for 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  return days;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await complianceApi.getDeadlines({ limit: 500 });
        setDeadlines(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deadlines");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Group deadlines by date key
  const deadlinesByDate = useMemo(() => {
    const map: Record<string, ComplianceDeadline[]> = {};
    deadlines.forEach((d) => {
      const key = d.due_date.split("T")[0]; // yyyy-mm-dd
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [deadlines]);

  // Upcoming this week
  const upcomingThisWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    return deadlines
      .filter((d) => {
        const due = new Date(d.due_date);
        due.setHours(0, 0, 0, 0);
        return due >= today && due <= endOfWeek;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [deadlines]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(null);
  };

  const selectedDeadlines = selectedDate ? deadlinesByDate[selectedDate] || [] : [];

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Compliance Calendar</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Compliance Calendar</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">Failed to load calendar data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Compliance Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold text-foreground min-w-[160px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-medium">Urgency:</span>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Critical
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                High
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                Medium
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                Low
              </div>
            </div>

            {/* Calendar Grid */}
            <Card className="shadow-sm border-border">
              <CardContent className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-px mb-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
                  {calendarDays.map((dayInfo, idx) => {
                    const key = dateKey(dayInfo.date);
                    const dayDeadlines = deadlinesByDate[key] || [];
                    const hasDeadlines = dayDeadlines.length > 0;
                    const today = isToday(dayInfo.date);
                    const isSelected = selectedDate === key;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (hasDeadlines) {
                            setSelectedDate(isSelected ? null : key);
                          }
                        }}
                        className={`min-h-[80px] p-2 text-left transition-colors bg-card ${
                          dayInfo.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                        } ${hasDeadlines ? "cursor-pointer hover:bg-muted/50" : "cursor-default"} ${
                          isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-medium leading-none ${
                              today
                                ? "bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center rounded-full text-xs"
                                : ""
                            }`}
                          >
                            {dayInfo.date.getDate()}
                          </span>
                          {dayDeadlines.length > 1 && (
                            <span className="text-xs text-muted-foreground">
                              {dayDeadlines.length}
                            </span>
                          )}
                        </div>
                        {hasDeadlines && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dayDeadlines.slice(0, 4).map((dl, dlIdx) => (
                              <span
                                key={dlIdx}
                                className={`h-2 w-2 rounded-full ${urgencyDotColor(dl.urgency)}`}
                                title={`${dl.title} (${dl.urgency})`}
                              />
                            ))}
                            {dayDeadlines.length > 4 && (
                              <span className="text-[10px] text-muted-foreground leading-none">
                                +{dayDeadlines.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Day Deadlines Panel */}
            {selectedDate && selectedDeadlines.length > 0 && (
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Deadlines for{" "}
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedDeadlines.map((deadline) => (
                      <div
                        key={deadline.id}
                        className={`p-4 rounded-lg border border-border border-l-4 ${
                          deadline.urgency === "critical"
                            ? "border-l-red-500"
                            : deadline.urgency === "high"
                            ? "border-l-orange-500"
                            : deadline.urgency === "medium"
                            ? "border-l-yellow-500"
                            : "border-l-green-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground">
                              {deadline.title}
                            </h4>
                            {deadline.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {deadline.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={urgencyBadgeStyle(deadline.urgency)}>
                                {deadline.urgency.charAt(0).toUpperCase() +
                                  deadline.urgency.slice(1)}
                              </Badge>
                              <Badge className={statusBadgeStyle(deadline.status)}>
                                {deadline.status.charAt(0).toUpperCase() +
                                  deadline.status.slice(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {deadline.category}
                              </span>
                            </div>
                          </div>
                          {deadline.penalty && (
                            <Badge variant="destructive" className="text-xs flex-shrink-0">
                              Penalty
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming This Week */}
            <Card className="shadow-sm border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming This Week
                  {upcomingThisWeek.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {upcomingThisWeek.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingThisWeek.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No deadlines coming up this week.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingThisWeek.map((deadline) => (
                      <div
                        key={deadline.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <span
                          className={`h-3 w-3 rounded-full flex-shrink-0 ${urgencyDotColor(
                            deadline.urgency
                          )}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {deadline.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deadline.category} &middot; Due {formatDate(deadline.due_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={urgencyBadgeStyle(deadline.urgency)}>
                            {deadline.urgency.charAt(0).toUpperCase() +
                              deadline.urgency.slice(1)}
                          </Badge>
                          <span
                            className={`text-xs font-medium ${
                              deadline.days_remaining <= 2
                                ? "text-red-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {deadline.days_remaining === 0
                              ? "Today"
                              : deadline.days_remaining === 1
                              ? "Tomorrow"
                              : `${deadline.days_remaining}d`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
