import { toDate } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, FileText, Activity as ActivityIcon } from "lucide-react"
import { GetSessionActivityHistoryByChild } from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

interface Props {
  childId: number
  childName: string
}

export function ChildSessionActivityHistory({ childId, childName }: Props) {
  const [activities, setActivities] = useState<model.SessionActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line
  }, [childId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await GetSessionActivityHistoryByChild(childId)
      setActivities(data)
      setError(null)
    } catch (err) {
      setError("Gagal memuat riwayat aktivitas sesi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <ActivityIcon size={20} /> Riwayat Aktivitas Sesi: {childName}
      </h2>
      {loading ? (
        <p>Memuat riwayat aktivitas...</p>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      ) : activities.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <FileText size={32} className="mx-auto mb-2" />
          <p>Belum ada riwayat aktivitas untuk anak ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.ID} className="hover:shadow transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ActivityIcon size={16} className="text-blue-600" />
                    <span className="font-semibold">
                      {activity.Activity?.Name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sesi:{" "}
                    {activity.Session?.StartTime
                      ? toDate(activity.Session.StartTime).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"}{" "}
                    {activity.Session?.StartTime
                      ? toDate(activity.Session.StartTime).toLocaleTimeString(
                          "id-ID"
                        )
                      : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mulai:{" "}
                    {activity.StartTime
                      ? toDate(activity.StartTime).toLocaleTimeString("id-ID")
                      : "-"}
                    {activity.EndTime && (
                      <>
                        {" | "}Selesai:{" "}
                        {toDate(activity.EndTime).toLocaleTimeString("id-ID")}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Durasi:{" "}
                    {activity.StartTime
                      ? `${Math.round(
                          (toDate(activity.EndTime || new Date()).getTime() -
                            toDate(activity.StartTime).getTime()) /
                            60000 || 0
                        )} menit`
                      : "-"}
                  </div>
                  {activity.Notes && (
                    <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                      <strong>Catatan:</strong> {activity.Notes}
                    </div>
                  )}
                </div>
                <div className="mt-2 md:mt-0 md:ml-6 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {activity.CreatedAt
                      ? toDate(activity.CreatedAt).toLocaleString("id-ID")
                      : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
