import { toDate } from "@/lib/utils"
import React, { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Clock,
  FileText,
  Activity as ActivityIcon,
  Award,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import {
  GetSessionActivities,
  GetSessionNotes,
  GetSessionProgress,
  GenerateSessionSummary,
  AutoPauseInactiveActivities,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { ActivitySection } from "./ActivitySection"
import { NotesSection } from "./NotesSection"
import { RewardSection } from "./RewardSection"
import { SessionSummaryModal } from "./SessionSummaryModal"

interface SessionViewProps {
  session: model.Session
  childName: string
  onSessionUpdate?: () => void
}

export function SessionView({
  session,
  childName,
  onSessionUpdate,
}: SessionViewProps) {
  const [activeTab, setActiveTab] = useState("activities")
  const [activities, setActivities] = useState<model.SessionActivity[]>([])
  const [notes, setNotes] = useState<model.Note[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionProgress, setSessionProgress] = useState<any>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [longRunningActivities, setLongRunningActivities] = useState<
    model.SessionActivity[]
  >([])

  // Auto-refresh session progress every 30 seconds
  useEffect(() => {
    if (session) {
      loadSessionProgress()
      const interval = setInterval(loadSessionProgress, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      loadActivities()
      loadNotes()
      checkLongRunningActivities()
    }
  }, [session])

  const loadSessionProgress = useCallback(async () => {
    try {
      const progress = await GetSessionProgress(session.ID)
      setSessionProgress(progress)
    } catch (err) {
      console.error("Error loading session progress:", err)
    }
  }, [session.ID])

  const loadActivities = async () => {
    try {
      setLoadingActivities(true)
      const data = await GetSessionActivities(session.ID)
      setActivities(data)
    } catch (err) {
      console.error("Error loading activities:", err)
      setError("Gagal memuat aktivitas")
    } finally {
      setLoadingActivities(false)
    }
  }

  const loadNotes = async () => {
    try {
      setLoadingNotes(true)
      const data = await GetSessionNotes(session.ID)
      setNotes(data)
    } catch (err) {
      console.error("Error loading notes:", err)
      setError("Gagal memuat catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const checkLongRunningActivities = async () => {
    try {
      const pausedActivities = await AutoPauseInactiveActivities(session.ID, 60) // 60 minutes max
      if (Array.isArray(pausedActivities) && pausedActivities.length > 0) {
        setLongRunningActivities(pausedActivities)
        loadActivities() // Refresh activities
      }
    } catch (err) {
      console.error("Error checking long running activities:", err)
    }
  }

  const handleGenerateSummary = async () => {
    try {
      setLoadingSummary(true)
      const summary = await GenerateSessionSummary(session.ID)
      setSessionSummary(summary)
      setShowSummary(true)
    } catch (err) {
      console.error("Error generating summary:", err)
      setError("Gagal membuat ringkasan sesi")
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleDataUpdate = useCallback(() => {
    loadActivities()
    loadNotes()
    loadSessionProgress()
    onSessionUpdate?.()
  }, [loadSessionProgress, onSessionUpdate])

  // Calculate session duration
  const startTime = toDate(session.StartTime)
  const currentTime = new Date()
  const durationMs = currentTime.getTime() - startTime.getTime()
  const durationMinutes = Math.floor(durationMs / 60000)
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  // Get statistics
  const totalActivities = activities.length
  const activeActivities = activities.filter((a) => !a.EndTime).length
  const completedActivities = activities.filter((a) => a.EndTime).length
  const totalNotes = notes.length

  return (
    <div className="space-y-4">
      {/* Session Header */}
      <Card className="border-t-4 border-t-green-500">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Sesi Aktif: {childName}</CardTitle>
              <CardDescription className="flex items-center space-x-2 mt-2">
                <Clock size={16} />
                <span>
                  Mulai: {startTime.toLocaleString("id-ID")} ({hours}j {minutes}
                  m)
                </span>
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <FileText size={14} />
                <span>{loadingSummary ? "Membuat..." : "Buat Ringkasan"}</span>
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Session Statistics */}
      {sessionProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-600 mb-1">
                  <ActivityIcon size={16} />
                  <span className="text-sm font-medium">Total Aktivitas</span>
                </div>
                <div className="text-2xl font-bold">{totalActivities}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-orange-600 mb-1">
                  <Play size={16} />
                  <span className="text-sm font-medium">
                    Sedang Berlangsung
                  </span>
                </div>
                <div className="text-2xl font-bold">{activeActivities}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-1">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-medium">Selesai</span>
                </div>
                <div className="text-2xl font-bold">{completedActivities}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-purple-600 mb-1">
                  <FileText size={16} />
                  <span className="text-sm font-medium">Catatan</span>
                </div>
                <div className="text-2xl font-bold">{totalNotes}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Long Running Activities Alert */}
      {longRunningActivities.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle size={16} />
              <span className="font-medium">
                {longRunningActivities.length} aktivitas dihentikan otomatis
                karena berjalan terlalu lama
              </span>
            </div>
            <div className="mt-2 text-sm text-yellow-700">
              {longRunningActivities.map((activity, index) => (
                <div key={activity.ID}>• {activity.Activity?.Name}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              className={`px-4 py-3 flex-1 ${
                activeTab === "activities"
                  ? "border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("activities")}
            >
              <div className="flex items-center justify-center space-x-2">
                <ActivityIcon size={16} />
                <span>Aktivitas</span>
                {activeActivities > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeActivities}
                  </span>
                )}
              </div>
            </button>
            <button
              className={`px-4 py-3 flex-1 ${
                activeTab === "notes"
                  ? "border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("notes")}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText size={16} />
                <span>Catatan</span>
                {totalNotes > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {totalNotes}
                  </span>
                )}
              </div>
            </button>
            <button
              className={`px-4 py-3 flex-1 ${
                activeTab === "rewards"
                  ? "border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("rewards")}
            >
              <div className="flex items-center justify-center space-x-2">
                <Award size={16} />
                <span>Reward</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <div className="p-4">
            {activeTab === "activities" && (
              <ActivitySection
                sessionId={session.ID}
                activities={activities}
                loading={loadingActivities}
                onActivityAdded={handleDataUpdate}
              />
            )}

            {activeTab === "notes" && (
              <NotesSection
                sessionId={session.ID}
                notes={notes}
                loading={loadingNotes}
                onNoteAdded={handleDataUpdate}
              />
            )}

            {activeTab === "rewards" && (
              <RewardSection sessionId={session.ID} childId={session.ChildID} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Summary Modal */}
      {showSummary && sessionSummary && (
        <SessionSummaryModal
          summary={sessionSummary}
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={(summaryNotes) => {
            // Handle saving summary notes
            console.log("Save summary notes:", summaryNotes)
            setShowSummary(false)
          }}
        />
      )}
    </div>
  )
}
