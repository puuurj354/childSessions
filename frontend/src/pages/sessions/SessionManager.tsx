import { toDate } from "@/lib/utils"
import React, { useEffect, useState, useCallback, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  Clock,
  PlayCircle,
  StopCircle,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Wifi,
  WifiOff,
  Timer,
  Activity,
  User,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react"
import {
  GetAllChildren,
  GetActiveSession,
  StartSession,
  EndSession,
  GetSessionProgress,
  UpdateSessionSummaryNotes,
  GenerateSessionSummary,
  AutoPauseInactiveActivities,
} from "../../../wailsjs/go/main/App"
import { EventsOn } from "../../../wailsjs/runtime/runtime"
import { model } from "../../../wailsjs/go/models"
import { SessionView } from "./SessionView"
import { toast } from "sonner"
import { useIsMobile } from "../../hooks/use-mobile"

export function SessionManager() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [activeSession, setActiveSession] = useState<model.Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summaryNotes, setSummaryNotes] = useState("")
  const [sessionProgress, setSessionProgress] = useState<any>(null)
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [showQuickSummary, setShowQuickSummary] = useState(false)
  const [quickSummary, setQuickSummary] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadingQuickSummary, setLoadingQuickSummary] = useState(false)

  // Real-time features
  const [isOnline, setIsOnline] = useState(true)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [autoSaveInterval, setAutoSaveInterval] = useState(60) // seconds
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const isMobile = useIsMobile()
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Real-time event listeners
  useEffect(() => {
    // Check if there's template data in sessionStorage from template selection
    const templateData = sessionStorage.getItem('templateForNewSession')
    if (templateData) {
      try {
        const { childId } = JSON.parse(templateData)
        if (childId) {
          setSelectedChildId(childId)
          toast.info("Template sesi siap digunakan untuk anak yang dipilih")
        }
        // Clear after reading
        sessionStorage.removeItem('templateForNewSession')
      } catch (err) {
        console.error("Error parsing template data:", err)
      }
    }
  }, [])

  // Real-time event listeners
  useEffect(() => {
    loadChildren()

    const unsubscribeSessionStarted = EventsOn(
      "session_started",
      (sessionData) => {
        if (sessionData && mountedRef.current) {
          setActiveSession(sessionData)
          setSessionDuration(0)
          startDurationTimer()
          toast.success("Sesi dimulai secara real-time")
          refreshSessionProgress()
        }
      }
    )

    const unsubscribeSessionEnded = EventsOn("session_ended", (sessionData) => {
      if (mountedRef.current) {
        setActiveSession(null)
        setSessionProgress(null)
        clearAllTimers()
        toast.success("Sesi berakhir secara real-time")
        refreshData()
      }
    })

    const unsubscribeSessionUpdate = EventsOn(
      "session_updated",
      (sessionData) => {
        if (sessionData && mountedRef.current) {
          setActiveSession(sessionData)
          refreshSessionProgress()
          toast.success("Sesi diperbarui secara real-time")
        }
      }
    )

    const unsubscribeActivityStarted = EventsOn(
      "activity_started",
      (activityData) => {
        if (activityData && mountedRef.current) {
          refreshSessionProgress()
          toast.success("Aktivitas dimulai secara real-time")
        }
      }
    )

    const unsubscribeActivityEnded = EventsOn(
      "activity_ended",
      (activityData) => {
        if (activityData && mountedRef.current) {
          refreshSessionProgress()
          toast.success("Aktivitas selesai secara real-time")
        }
      }
    )

    const unsubscribeActivityUpdate = EventsOn(
      "activity_updated",
      (activityData) => {
        if (activityData && mountedRef.current) {
          refreshSessionProgress()
        }
      }
    )

    const unsubscribeChildAdded = EventsOn("child_added", () => {
      if (mountedRef.current) {
        loadChildren()
        toast.success("Anak baru ditambahkan secara real-time")
      }
    })

    return () => {
      mountedRef.current = false
      clearAllTimers()
      if (unsubscribeSessionStarted) unsubscribeSessionStarted()
      if (unsubscribeSessionEnded) unsubscribeSessionEnded()
      if (unsubscribeSessionUpdate) unsubscribeSessionUpdate()
      if (unsubscribeActivityStarted) unsubscribeActivityStarted()
      if (unsubscribeActivityEnded) unsubscribeActivityEnded()
      if (unsubscribeActivityUpdate) unsubscribeActivityUpdate()
      if (unsubscribeChildAdded) unsubscribeChildAdded()
    }
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      checkActiveSession(selectedChildId)
    } else {
      setActiveSession(null)
      setSessionProgress(null)
      clearAllTimers()
    }
  }, [selectedChildId])

  // Real-time session progress updates
  useEffect(() => {
    if (activeSession && mountedRef.current) {
      startProgressUpdates()
      startDurationTimer()
      startAutoSave()
    } else {
      clearAllTimers()
    }

    return () => clearAllTimers()
  }, [activeSession])

  // Auto-save notes
  useEffect(() => {
    if (activeSession && summaryNotes !== (activeSession.SummaryNotes || "")) {
      setUnsavedChanges(true)
    } else {
      setUnsavedChanges(false)
    }
  }, [summaryNotes, activeSession])

  const clearAllTimers = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
  }

  const startProgressUpdates = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
    }

    progressTimerRef.current = setInterval(async () => {
      if (mountedRef.current && activeSession) {
        try {
          await loadSessionProgress(activeSession.ID)
        } catch (err) {
          console.error("Error updating session progress:", err)
        }
      }
    }, 5000) // Update every 5 seconds
  }

  const startDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
    }

    durationTimerRef.current = setInterval(() => {
      if (mountedRef.current && activeSession) {
        setSessionDuration((prev) => prev + 1)
      }
    }, 1000)
  }

  const startAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setInterval(async () => {
      if (mountedRef.current && activeSession && unsavedChanges) {
        try {
          await UpdateSessionSummaryNotes(activeSession.ID, summaryNotes)
          setLastAutoSave(new Date())
          setUnsavedChanges(false)
          toast.success("Catatan tersimpan otomatis")
        } catch (err) {
          console.error("Auto-save failed:", err)
        }
      }
    }, autoSaveInterval * 1000)
  }

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await GetAllChildren()
      setChildren(data)
      setError(null)
      setIsOnline(true)
    } catch (err) {
      console.error("Error loading children:", err)
      setError("Gagal memuat data anak")
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await loadChildren()
      if (selectedChildId) {
        await checkActiveSession(selectedChildId)
      }
      toast.success("Data berhasil diperbarui")
    } catch (err) {
      toast.error("Gagal memperbarui data")
    } finally {
      setIsRefreshing(false)
    }
  }

  const refreshSessionProgress = async () => {
    if (activeSession) {
      await loadSessionProgress(activeSession.ID)
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}j ${minutes}m ${secs}d`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}d`
    } else {
      return `${secs}d`
    }
  }

  const filteredChildren = children.filter((child: model.Child) =>
    child.Name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const checkActiveSession = async (childId: number) => {
    try {
      setLoading(true)
      const session = await GetActiveSession(childId)
      setActiveSession(session)
      if (session) {
        loadSessionProgress(session.ID)
        setSummaryNotes(session.SummaryNotes || "")

        // Calculate initial duration
        const now = new Date()
        const start = toDate(session.StartTime)
        const durationMs = now.getTime() - start.getTime()
        setSessionDuration(Math.floor(durationMs / 1000))
      }
      setError(null)
      setIsOnline(true)
    } catch (err) {
      console.error("Error checking active session:", err)
      setActiveSession(null)
      setSessionProgress(null)
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const loadSessionProgress = async (sessionId: number) => {
    try {
      const progress = await GetSessionProgress(sessionId)
      if (mountedRef.current) {
        setSessionProgress(progress)
        setIsOnline(true)
      }
    } catch (err) {
      console.error("Error loading session progress:", err)
      setIsOnline(false)
    }
  }

  const handleStartSession = async () => {
    if (!selectedChildId) return

    try {
      setLoading(true)
      const session = await StartSession(selectedChildId)
      setActiveSession(session)
      setSessionDuration(0)
      setSummaryNotes("")
      setError(null)
      toast.success("Sesi berhasil dimulai!")
      // Event will be emitted by backend
    } catch (err) {
      console.error("Error starting session:", err)
      setError("Gagal memulai sesi")
      toast.error("Gagal memulai sesi")
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    try {
      setLoading(true)
      await EndSession(activeSession.ID, summaryNotes)
      setActiveSession(null)
      setSessionProgress(null)
      setSummaryNotes("")
      setShowEndConfirmation(false)
      setError(null)
      toast.success("Sesi berhasil diakhiri!")
      // Event will be emitted by backend
    } catch (err) {
      console.error("Error ending session:", err)
      setError("Gagal mengakhiri sesi")
      toast.error("Gagal mengakhiri sesi")
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuickSummary = async () => {
    if (!activeSession) return

    try {
      setLoadingQuickSummary(true)
      const summary = await GenerateSessionSummary(activeSession.ID)
      setQuickSummary(summary)
      setShowQuickSummary(true)
      toast.success("Ringkasan berhasil dibuat!")
    } catch (err) {
      console.error("Error generating summary:", err)
      toast.error("Gagal membuat ringkasan")
    } finally {
      setLoadingQuickSummary(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            Manajemen Sesi Terapi
          </h1>
          <p className="text-gray-600 text-sm">
            Kelola sesi terapi dengan pembaruan real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span className={isOnline ? "text-green-600" : "text-red-600"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* Auto-save Status */}
          {activeSession && (
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 text-blue-500" />
              <span
                className={
                  unsavedChanges ? "text-orange-600" : "text-green-600"
                }
              >
                {unsavedChanges ? "Belum tersimpan" : "Tersimpan"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active Session Status */}
      {activeSession && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Timer className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 text-sm sm:text-base">
                    Sesi Aktif -{" "}
                    {children.find((c) => c.ID === selectedChildId)?.Name}
                  </p>
                  <p className="text-xs sm:text-sm text-green-600">
                    Dimulai:{" "}
                    {toDate(activeSession.StartTime).toLocaleTimeString(
                      "id-ID"
                    )}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xl sm:text-2xl font-bold text-green-700">
                  {formatDuration(sessionDuration)}
                </p>
                <p className="text-xs text-green-600">
                  {sessionProgress?.active_activities || 0} aktivitas aktif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Child Selection with Search */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                Pilih Anak untuk Sesi Terapi
              </CardTitle>
              <CardDescription className="text-sm">
                Pilih anak yang akan menjalani sesi terapi
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-2 py-2 text-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {!isMobile && "Perbarui"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari anak berdasarkan nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Child Selection - Mobile Responsive */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Pilih Anak ({filteredChildren.length} anak)
            </label>

            {isMobile ? (
              /* Mobile: Card-based selection */
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))
                ) : filteredChildren.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada anak yang ditemukan</p>
                  </div>
                ) : (
                  filteredChildren.map((child) => (
                    <Card
                      key={child.ID}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedChildId === child.ID
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      } ${
                        !!activeSession ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => {
                        if (!activeSession) {
                          setSelectedChildId(child.ID)
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                              {child.Name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{child.Name}</p>
                              <p className="text-sm text-gray-500">
                                {child.Gender} •{" "}
                                {new Date().getFullYear() -
                                  toDate(
                                    child.DateOfBirth
                                  ).getFullYear()}{" "}
                                tahun
                              </p>
                            </div>
                          </div>
                          {selectedChildId === child.ID && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              /* Desktop: Dropdown selection */
              <select
                className="w-full border rounded-md p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedChildId || ""}
                onChange={(e) =>
                  setSelectedChildId(Number(e.target.value) || null)
                }
                disabled={loading || !!activeSession}
              >
                <option value="">Pilih anak...</option>
                {filteredChildren.map((child) => (
                  <option key={child.ID} value={child.ID}>
                    {child.Name} ({child.Gender})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Child Info */}
          {selectedChildId && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {filteredChildren
                    .find((c) => c.ID === selectedChildId)
                    ?.Name.charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {
                      filteredChildren.find((c) => c.ID === selectedChildId)
                        ?.Name
                    }
                  </h3>
                  <p className="text-sm text-blue-700">
                    {
                      filteredChildren.find((c) => c.ID === selectedChildId)
                        ?.Gender
                    }{" "}
                    • Umur:{" "}
                    {new Date().getFullYear() -
                      toDate(
                        filteredChildren.find((c) => c.ID === selectedChildId)
                          ?.DateOfBirth || new Date()
                      ).getFullYear()}{" "}
                    tahun
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Mobile Responsive */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {!activeSession ? (
              <Button
                onClick={handleStartSession}
                disabled={!selectedChildId || loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size={isMobile ? "lg" : "default"}
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                {loading ? "Memulai Sesi..." : "Mulai Sesi"}
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  onClick={handleGenerateQuickSummary}
                  disabled={loadingQuickSummary}
                  variant="outline"
                  className="flex-1"
                  size={isMobile ? "lg" : "default"}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {loadingQuickSummary ? "Membuat..." : "Ringkasan Cepat"}
                </Button>

                <Button
                  onClick={() => setShowEndConfirmation(true)}
                  variant="destructive"
                  className="flex-1"
                  size={isMobile ? "lg" : "default"}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Akhiri Sesi
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session View - Only show if active session */}
      {activeSession && selectedChildId && (
        <SessionView
          session={activeSession}
          childName={
            filteredChildren.find((c) => c.ID === selectedChildId)?.Name || ""
          }
          onSessionUpdate={() => {
            refreshSessionProgress()
          }}
        />
      )}

      {/* End Session Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Konfirmasi Akhiri Sesi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Apakah Anda yakin ingin mengakhiri sesi ini?</p>
              <p className="text-sm text-gray-600">
                Durasi sesi: {formatDuration(sessionDuration)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEndConfirmation(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEndSession}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Mengakhiri..." : "Ya, Akhiri Sesi"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Summary Modal */}
      {showQuickSummary && quickSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ringkasan Sesi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                {JSON.stringify(quickSummary, null, 2)}
              </pre>
              <Button
                onClick={() => setShowQuickSummary(false)}
                className="w-full"
              >
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
