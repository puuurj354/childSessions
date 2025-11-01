import { toDate } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Plus,
  Play,
  Square,
  Clock,
  CheckCircle,
  Edit3,
  Pause,
} from "lucide-react"
import {
  GetAllActivities,
  StartActivityInSession,
  EndActivityInSession,
  UpdateActivityInSession,
  GetActiveActivitiesInSession,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

interface ActivitySectionProps {
  sessionId: number
  activities: model.SessionActivity[]
  loading: boolean
  onActivityAdded: () => void
}

export function ActivitySection({
  sessionId,
  activities,
  loading,
  onActivityAdded,
}: ActivitySectionProps) {
  const [availableActivities, setAvailableActivities] = useState<
    model.Activity[]
  >([])
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  )
  const [activityNotes, setActivityNotes] = useState("")
  const [endingActivityId, setEndingActivityId] = useState<number | null>(null)
  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null
  )
  const [endNotes, setEndNotes] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeActivities, setActiveActivities] = useState<
    model.SessionActivity[]
  >([])

  useEffect(() => {
    loadAvailableActivities()
    loadActiveActivities()
  }, [sessionId])

  const loadAvailableActivities = async () => {
    try {
      setLoadingActivities(true)
      const data = await GetAllActivities()
      setAvailableActivities(data)
      setError(null)
    } catch (err) {
      console.error("Error loading available activities:", err)
      setError("Gagal memuat daftar aktivitas")
    } finally {
      setLoadingActivities(false)
    }
  }

  const loadActiveActivities = async () => {
    try {
      const data = await GetActiveActivitiesInSession(sessionId)
      setActiveActivities(data)
    } catch (err) {
      console.error("Error loading active activities:", err)
    }
  }

  const handleStartActivity = async () => {
    if (!selectedActivityId) return

    try {
      setLoadingActivities(true)
      await StartActivityInSession(sessionId, selectedActivityId, activityNotes)
      setShowAddActivity(false)
      setSelectedActivityId(null)
      setActivityNotes("")
      onActivityAdded()
      loadActiveActivities()
      setError(null)
    } catch (err) {
      console.error("Error starting activity:", err)
      setError("Gagal memulai aktivitas")
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleEndActivity = async (sessionActivityId: number) => {
    try {
      setLoadingActivities(true)
      await EndActivityInSession(sessionActivityId, endNotes)
      setEndingActivityId(null)
      setEndNotes("")
      onActivityAdded()
      loadActiveActivities()
      setError(null)
    } catch (err) {
      console.error("Error ending activity:", err)
      setError("Gagal mengakhiri aktivitas")
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleUpdateActivity = async (sessionActivityId: number) => {
    try {
      setLoadingActivities(true)
      await UpdateActivityInSession(sessionActivityId, editNotes)
      setEditingActivityId(null)
      setEditNotes("")
      onActivityAdded()
      setError(null)
    } catch (err) {
      console.error("Error updating activity:", err)
      setError("Gagal memperbarui catatan aktivitas")
    } finally {
      setLoadingActivities(false)
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const durationMs = end.getTime() - start.getTime()
    const minutes = Math.floor(durationMs / 60000)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}j ${mins}m`
    }
    return `${mins}m`
  }

  const getActivityStatus = (activity: model.SessionActivity) => {
    return activity.EndTime ? "Selesai" : "Berlangsung"
  }

  const getStatusColor = (activity: model.SessionActivity) => {
    return activity.EndTime ? "text-green-600" : "text-blue-600"
  }

  const getStatusBadgeColor = (activity: model.SessionActivity) => {
    return activity.EndTime
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800"
  }

  const startEdit = (activity: model.SessionActivity) => {
    setEditingActivityId(activity.ID)
    setEditNotes(activity.Notes || "")
  }

  const cancelEdit = () => {
    setEditingActivityId(null)
    setEditNotes("")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Aktivitas Sesi</h3>
          {activeActivities.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {activeActivities.length} aktivitas sedang berlangsung
            </p>
          )}
        </div>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddActivity(true)}
          disabled={loadingActivities}
        >
          <Plus size={14} />
          <span>Tambah Aktivitas</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Active Activities Alert */}
      {activeActivities.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Pause size={16} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Aktivitas Sedang Berlangsung:
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {activeActivities.map((activity) => (
                <div key={activity.ID} className="text-sm text-orange-700">
                  • {activity.Activity?.Name} -{" "}
                  {formatDuration(toDate(activity.StartTime || new Date()).toISOString() || "")}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showAddActivity && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mulai Aktivitas Baru</CardTitle>
            <CardDescription>
              Pilih aktivitas yang akan dimulai dalam sesi ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Pilih Aktivitas <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedActivityId || ""}
                onChange={(e) =>
                  setSelectedActivityId(Number(e.target.value) || null)
                }
                className="w-full border rounded-md p-2"
                required
              >
                <option value="">Pilih aktivitas...</option>
                {availableActivities.map((activity) => (
                  <option key={activity.ID} value={activity.ID}>
                    {activity.Name} ({activity.DefaultDurationMinutes} menit)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Catatan Awal (Opsional)
              </label>
              <textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Tambahkan catatan untuk aktivitas ini..."
                className="w-full border rounded-md p-2"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddActivity(false)
                  setSelectedActivityId(null)
                  setActivityNotes("")
                }}
                className="px-4 py-2 border rounded-md text-sm"
                disabled={loadingActivities}
              >
                Batal
              </button>
              <button
                onClick={handleStartActivity}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                disabled={!selectedActivityId || loadingActivities}
              >
                <Play size={14} />
                <span>Mulai Aktivitas</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center py-4 text-muted-foreground">
          Memuat aktivitas sesi...
        </p>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="space-y-2">
            <Clock size={32} className="mx-auto opacity-50" />
            <p>Belum ada aktivitas dalam sesi ini</p>
            <p className="text-sm">Klik "Tambah Aktivitas" untuk memulai</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card
              key={activity.ID}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{activity.Activity?.Name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(
                          activity
                        )}`}
                      >
                        {getActivityStatus(activity)}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1 mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} />
                        <span>
                          Mulai:{" "}
                          {activity.StartTime
                            ? toDate(activity.StartTime).toLocaleTimeString(
                                "id-ID"
                              )
                            : "-"}
                        </span>
                        {activity.EndTime && (
                          <span>
                            | Selesai:{" "}
                            {toDate(activity.EndTime).toLocaleTimeString(
                              "id-ID"
                            )}
                          </span>
                        )}
                      </div>
                      <div>
                        Durasi:{" "}
                        {activity.StartTime
                          ? formatDuration(toDate(activity.StartTime).toISOString(), activity.EndTime ? toDate(activity.EndTime).toISOString() : undefined)
                          : "-"}
                      </div>
                    </div>

                    {/* Notes Section */}
                    {editingActivityId === activity.ID ? (
                      <div className="space-y-3 border-t pt-3">
                        <label className="block text-sm font-medium">
                          Edit Catatan Aktivitas
                        </label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full border rounded-md p-2 text-sm"
                          rows={3}
                          placeholder="Tambahkan atau edit catatan untuk aktivitas ini..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateActivity(activity.ID)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm"
                            disabled={loadingActivities}
                          >
                            <CheckCircle size={12} />
                            <span>Simpan</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 border rounded text-sm"
                            disabled={loadingActivities}
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      activity.Notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs border-t">
                          <strong>Catatan:</strong> {activity.Notes}
                        </div>
                      )
                    )}
                  </div>

                  <div className="ml-4">
                    {!activity.EndTime ? (
                      <div className="space-y-2">
                        {endingActivityId === activity.ID ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Catatan akhir aktivitas..."
                              value={endNotes}
                              onChange={(e) => setEndNotes(e.target.value)}
                              className="w-48 border rounded-md p-2 text-xs"
                              rows={2}
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEndActivity(activity.ID)}
                                className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-xs"
                                disabled={loadingActivities}
                              >
                                <CheckCircle size={12} />
                                <span>Selesai</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEndingActivityId(null)
                                  setEndNotes("")
                                }}
                                className="px-2 py-1 border rounded text-xs"
                                disabled={loadingActivities}
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => startEdit(activity)}
                              className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-xs"
                              disabled={editingActivityId !== null}
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setEndingActivityId(activity.ID)}
                              className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-xs"
                            >
                              <Square size={12} />
                              <span>Akhiri</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-xs">Selesai</span>
                        </div>
                        {editingActivityId !== activity.ID && (
                          <button
                            onClick={() => startEdit(activity)}
                            className="flex items-center space-x-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs"
                          >
                            <Edit3 size={12} />
                            <span>Edit Catatan</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
