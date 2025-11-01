import { toDate } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { model } from "../../../wailsjs/go/models"
import {
  GetAllChildren,
  GetChildProgressSummary,
  GetSessionsByChild,
  GetChildActivityFrequency,
  GetChildNoteKeywordFrequency,
  GetChildRewardTrends,
  GetChildRewards,
  ExportCSVFile,
  ExportPDFFile,
  OpenFileInExplorer,
  ShowNotification,
} from "../../../wailsjs/go/main/App"
import { EventsOn } from "../../../wailsjs/runtime/runtime"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Papa from "papaparse"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  CheckCircle2,
  Download,
  FileText,
  BarChart3,
  ExternalLink,
  Loader2,
} from "lucide-react"

const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#f59e42", // orange-400
  "#eab308", // yellow-500
  "#a21caf", // purple-800
  "#dc2626", // red-600
]

const OKLCH_VARIABLES = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
]

// Map your variables to safe colors (adjust as needed for your theme)
const SAFE_COLORS: Record<string, string> = {
  "--background": "#fff",
  "--foreground": "#222",
  "--card": "#fff",
  "--card-foreground": "#222",
  "--popover": "#fff",
  "--popover-foreground": "#222",
  "--primary": "#2563eb",
  "--primary-foreground": "#fff",
  "--secondary": "#e5e7eb",
  "--secondary-foreground": "#222",
  "--muted": "#f3f4f6",
  "--muted-foreground": "#6b7280",
  "--accent": "#e0e7ff",
  "--accent-foreground": "#222",
  "--destructive": "#ef4444",
  "--border": "#e5e7eb",
  "--input": "#e5e7eb",
  "--ring": "#2563eb",
  "--chart-1": "#2563eb",
  "--chart-2": "#16a34a",
  "--chart-3": "#f59e42",
  "--chart-4": "#eab308",
  "--chart-5": "#a21caf",
  "--sidebar": "#fff",
  "--sidebar-foreground": "#222",
  "--sidebar-primary": "#2563eb",
  "--sidebar-primary-foreground": "#fff",
  "--sidebar-accent": "#e0e7ff",
  "--sidebar-accent-foreground": "#222",
  "--sidebar-border": "#e5e7eb",
  "--sidebar-ring": "#2563eb",
}

export function ChildProgressDashboard() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [progress, setProgress] = useState<any>(null)
  const [sessions, setSessions] = useState<model.Session[]>([])
  const [rewards, setRewards] = useState<model.Reward[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activityFreq, setActivityFreq] = useState<
    { name: string; count: number }[]
  >([])
  const [keywordFreq, setKeywordFreq] = useState<
    { word: string; count: number }[]
  >([])
  const [rewardTrends, setRewardTrends] = useState<any[]>([])
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)

  // Listen for notifications from backend
  useEffect(() => {
    const unsubscribe = EventsOn("notification", (data: any) => {
      if (data.type === "success") {
        toast.success(data.title, {
          description: data.message,
        })
      } else if (data.type === "error") {
        toast.error(data.title, {
          description: data.message,
        })
      } else {
        toast(data.title, {
          description: data.message,
        })
      }
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadProgress(selectedChildId)
      loadSessions(selectedChildId)
      loadRewards(selectedChildId)
      loadActivityFreq(selectedChildId)
      loadKeywordFreq(selectedChildId)
      loadRewardTrends(selectedChildId)
    } else {
      setProgress(null)
      setSessions([])
      setRewards([])
      setActivityFreq([])
      setKeywordFreq([])
      setRewardTrends([])
    }
  }, [selectedChildId])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await GetAllChildren()
      setChildren(data)
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].ID)
      }
      setError(null)
    } catch (err) {
      setError("Gagal memuat daftar anak")
      toast.error("Error", {
        description: "Gagal memuat daftar anak",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async (childId: number) => {
    try {
      setLoading(true)
      const data = await GetChildProgressSummary(childId)
      setProgress(data)
      setError(null)
    } catch (err) {
      setError("Gagal memuat ringkasan progres")
      toast.error("Error", {
        description: "Gagal memuat ringkasan progres",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async (childId: number) => {
    try {
      const data = await GetSessionsByChild(childId)
      setSessions(data)
    } catch (err) {
      console.error("Error loading sessions:", err)
    }
  }

  const loadRewards = async (childId: number) => {
    try {
      const data = await GetChildRewards(childId)
      setRewards(data)
    } catch (err) {
      console.error("Error loading rewards:", err)
    }
  }

  const loadActivityFreq = async (childId: number) => {
    try {
      const data = await GetChildActivityFrequency(childId)
      setActivityFreq(
        Object.entries(data).map(([name, count]) => ({ name, count }))
      )
    } catch (err) {
      console.error("Error loading activity frequency:", err)
    }
  }

  const loadKeywordFreq = async (childId: number) => {
    try {
      const data = await GetChildNoteKeywordFrequency(childId)
      setKeywordFreq(
        Object.entries(data)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)
      )
    } catch (err) {
      console.error("Error loading keyword frequency:", err)
    }
  }

  const loadRewardTrends = async (childId: number) => {
    try {
      const data = await GetChildRewardTrends(childId)
      setRewardTrends(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading reward trends:", err)
      setRewardTrends([])
    }
  }

  // Prepare data for charts
  const sessionDurations = sessions
    .filter((s) => s.EndTime)
    .map((s) => ({
      tanggal: toDate(s.StartTime).toLocaleDateString("id-ID"),
      durasi: Math.round(
        (toDate(s.EndTime!).getTime() - toDate(s.StartTime).getTime()) /
          60000
      ),
    }))

  const rewardTypes = progress?.reward_summary?.rewards_by_type
    ? Object.entries(progress.reward_summary.rewards_by_type).map(
        ([type, count], i) => ({
          name: type,
          value: Number(count),
          color: COLORS[i % COLORS.length],
        })
      )
    : []

  const goalsData = [
    {
      name: "Tercapai",
      value: progress?.achieved_goals || 0,
      color: "#16a34a",
    },
    {
      name: "Belum Tercapai",
      value: (progress?.total_goals || 0) - (progress?.achieved_goals || 0),
      color: "#dc2626",
    },
  ]

  const selectedChild = children.find((c) => c.ID === selectedChildId)

  const handleExportPDF = async () => {
    if (!selectedChild) {
      toast.error("Error", {
        description: "Pilih anak terlebih dahulu",
      })
      return
    }

    try {
      setExportingPDF(true)
      toast.loading("Membuat PDF...", {
        description: "Mohon tunggu, sedang memproses dashboard",
      })

      const dashboard = document.getElementById("progress-dashboard-export")
      if (!dashboard) throw new Error("Dashboard element tidak ditemukan")

      // 1. Inject style to override all oklch variables and classes
      const style = document.createElement("style")
      let cssVars = ":root {"
      OKLCH_VARIABLES.forEach((v) => {
        cssVars += `${v}: ${SAFE_COLORS[v] || "#fff"} !important;`
      })
      cssVars += "}"
      style.textContent =
        cssVars +
        `
        #progress-dashboard-export * {
          background-color: #fff !important;
          color: #222 !important;
          border-color: #e5e7eb !important;
        }
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }
        .bg-orange-50 { background-color: #fff7ed !important; }
        .bg-purple-50 { background-color: #faf5ff !important; }
        .bg-yellow-50 { background-color: #fefce8 !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-green-600 { color: #16a34a !important; }
        .text-purple-600 { color: #9333ea !important; }
        .text-yellow-600 { color: #ca8a04 !important; }
        .text-blue-700 { color: #1d4ed8 !important; }
        .text-green-700 { color: #15803d !important; }
        .text-orange-700 { color: #c2410c !important; }
        .text-purple-700 { color: #7c3aed !important; }
        .text-yellow-700 { color: #a16207 !important; }
        .text-muted-foreground { color: #6b7280 !important; }
        .border { border-color: #e5e7eb !important; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important; }
      `
      document.head.appendChild(style)

      // 2. Wait for style to apply
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 3. Render with html2canvas
      const canvas = await html2canvas(dashboard, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#fff",
        width: dashboard.scrollWidth,
        height: dashboard.scrollHeight,
        removeContainer: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        logging: false,
      })

      // 4. Remove style override
      document.head.removeChild(style)

      // 5. Generate PDF
      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageWidth = canvas.width
      const imageHeight = canvas.height
      const margin = 10
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2
      const ratio = Math.min(
        availableWidth / imageWidth,
        availableHeight / imageHeight
      )
      const finalWidth = imageWidth * ratio
      const finalHeight = imageHeight * ratio
      const xOffset = (pageWidth - finalWidth) / 2
      const yOffset = (pageHeight - finalHeight) / 2

      pdf.setFontSize(16)
      pdf.text(`Progres Terapi - ${selectedChild.Name}`, margin, margin)
      pdf.setFontSize(10)
      pdf.text(
        `Digenerated pada: ${new Date().toLocaleDateString("id-ID")}`,
        margin,
        margin + 6
      )
      pdf.addImage(
        imgData,
        "PNG",
        xOffset,
        yOffset + 10,
        finalWidth,
        finalHeight - 10
      )

      const pdfBytes = pdf.output("arraybuffer")
      const uint8Array = new Uint8Array(pdfBytes)
      const filename = `progres_${selectedChild.Name.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf`
      const savedPath = await ExportPDFFile(Array.from(uint8Array), filename)

      toast.dismiss()
      toast.success("PDF Berhasil Diekspor!", {
        description: `File disimpan di: ${savedPath}`,
        action: {
          label: "Buka Folder",
          onClick: () => OpenFileInExplorer(savedPath),
        },
      })
      await ShowNotification(
        "Export Berhasil",
        `PDF progres ${selectedChild.Name} telah disimpan`
      )
    } catch (err) {
      console.error("Error exporting PDF:", err)
      toast.dismiss()
      toast.error("Gagal Ekspor PDF", {
        description: `Terjadi kesalahan: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message
            : "Unknown error"
        }`,
      })
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportCSV = async () => {
    if (!selectedChild) {
      toast.error("Error", {
        description: "Pilih anak terlebih dahulu",
      })
      return
    }

    try {
      setExportingCSV(true)
      const loadingToastId = toast.loading("Membuat CSV...", {
        description: "Mengumpulkan data sesi",
      })

      // Prepare comprehensive CSV data with explicit structure
      const csvData = []

      // Add session data with proper error handling
      if (sessions && Array.isArray(sessions) && sessions.length > 0) {
        sessions.forEach((session, index) => {
          try {
            const startTime = toDate(session.StartTime)
            const endTime = session.EndTime ? toDate(session.EndTime) : null
            const duration = endTime
              ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
              : ""

            csvData.push({
              no: index + 1,
              tipe: "SESI",
              tanggal: startTime.toLocaleDateString("id-ID"),
              waktu_mulai: startTime.toLocaleTimeString("id-ID"),
              waktu_selesai: endTime ? endTime.toLocaleTimeString("id-ID") : "",
              durasi_menit: duration,
              kategori: "Sesi Terapi",
              deskripsi: session.SummaryNotes || "Tidak ada catatan",
              nilai: "",
              id_referensi: session.ID || "",
            })
          } catch (sessionError) {
            console.error("Error processing session:", sessionError)
          }
        })
      }

      // Add reward data with proper error handling
      if (rewards && Array.isArray(rewards) && rewards.length > 0) {
        rewards.forEach((reward, index) => {
          try {
            const rewardTime = toDate(reward.Timestamp)
            csvData.push({
              no: sessions.length + index + 1,
              tipe: "REWARD",
              tanggal: rewardTime.toLocaleDateString("id-ID"),
              waktu_mulai: rewardTime.toLocaleTimeString("id-ID"),
              waktu_selesai: "",
              durasi_menit: "",
              kategori: reward.Type || "Unknown",
              deskripsi: reward.Notes || "Tidak ada catatan",
              nilai: reward.Value || 0,
              id_referensi: reward.ID || "",
            })
          } catch (rewardError) {
            console.error("Error processing reward:", rewardError)
          }
        })
      }

      // Add activity frequency data with proper error handling
      if (
        activityFreq &&
        Array.isArray(activityFreq) &&
        activityFreq.length > 0
      ) {
        activityFreq.forEach((activity, index) => {
          try {
            csvData.push({
              no: sessions.length + rewards.length + index + 1,
              tipe: "AKTIVITAS",
              tanggal: new Date().toLocaleDateString("id-ID"),
              waktu_mulai: "",
              waktu_selesai: "",
              durasi_menit: "",
              kategori: activity.name || "Unknown Activity",
              deskripsi: `Frekuensi aktivitas yang dilakukan`,
              nilai: activity.count || 0,
              id_referensi: "",
            })
          } catch (activityError) {
            console.error("Error processing activity:", activityError)
          }
        })
      }

      // Add summary data with proper error handling
      if (progress) {
        try {
          const summaryStartIndex =
            sessions.length + rewards.length + activityFreq.length

          csvData.push({
            no: summaryStartIndex + 1,
            tipe: "RINGKASAN",
            tanggal: new Date().toLocaleDateString("id-ID"),
            waktu_mulai: "",
            waktu_selesai: "",
            durasi_menit: "",
            kategori: "Total Sesi",
            deskripsi: "Jumlah total sesi yang pernah dilakukan",
            nilai: progress.total_sessions || 0,
            id_referensi: "",
          })

          csvData.push({
            no: summaryStartIndex + 2,
            tipe: "RINGKASAN",
            tanggal: new Date().toLocaleDateString("id-ID"),
            waktu_mulai: "",
            waktu_selesai: "",
            durasi_menit: "",
            kategori: "Sesi Selesai",
            deskripsi: "Jumlah sesi yang berhasil diselesaikan",
            nilai: progress.completed_sessions || 0,
            id_referensi: "",
          })

          csvData.push({
            no: summaryStartIndex + 3,
            tipe: "RINGKASAN",
            tanggal: new Date().toLocaleDateString("id-ID"),
            waktu_mulai: "",
            waktu_selesai: "",
            durasi_menit: "",
            kategori: "Rata-rata Durasi",
            deskripsi: "Rata-rata durasi sesi dalam menit",
            nilai: Math.round(progress.avg_duration || 0),
            id_referensi: "",
          })

          csvData.push({
            no: summaryStartIndex + 4,
            tipe: "RINGKASAN",
            tanggal: new Date().toLocaleDateString("id-ID"),
            waktu_mulai: "",
            waktu_selesai: "",
            durasi_menit: "",
            kategori: "Total Reward",
            deskripsi: "Total reward yang diberikan",
            nilai: progress.reward_summary?.total_rewards || 0,
            id_referensi: "",
          })
        } catch (summaryError) {
          console.error("Error processing summary:", summaryError)
        }
      }

      // If no data, add a placeholder row
      if (csvData.length === 0) {
        csvData.push({
          no: 1,
          tipe: "INFO",
          tanggal: new Date().toLocaleDateString("id-ID"),
          waktu_mulai: "",
          waktu_selesai: "",
          durasi_menit: "",
          kategori: "Tidak Ada Data",
          deskripsi: "Belum ada data untuk anak ini",
          nilai: "",
          id_referensi: "",
        })
      }

      // Generate CSV with proper configuration
      const csv = Papa.unparse(csvData, {
        header: true,
        delimiter: ",",
        skipEmptyLines: true,
      })

      // Create a clean filename
      const cleanChildName = selectedChild.Name.replace(/[^a-zA-Z0-9]/g, "_")
      const filename = `data_${cleanChildName}_${
        new Date().toISOString().split("T")[0]
      }.csv`

      // Use Wails export function
      const savedPath = await ExportCSVFile(csv, filename)

      // Dismiss loading toast
      toast.dismiss(loadingToastId)

      // Show success toast
      toast.success("CSV Berhasil Diekspor!", {
        description: `File disimpan di: ${savedPath}`,
        action: {
          label: "Buka Folder",
          onClick: () => OpenFileInExplorer(savedPath),
        },
      })

      // Show system notification
      await ShowNotification(
        "Export Berhasil",
        `Data CSV ${selectedChild.Name} telah disimpan`
      )
    } catch (err) {
      console.error("Error exporting CSV:", err)
      toast.dismiss() // Dismiss any existing toasts
      toast.error("Gagal Ekspor CSV", {
        description: `Terjadi kesalahan: ${
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message
            : "Unknown error"
        }`,
      })
    } finally {
      setExportingCSV(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp size={24} /> Progres Anak
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <select
              className="w-full border rounded-md p-2"
              value={selectedChildId || ""}
              onChange={(e) =>
                setSelectedChildId(Number(e.target.value) || null)
              }
              disabled={loading}
            >
              <option value="">Pilih anak...</option>
              {children.map((child) => (
                <option key={child.ID} value={child.ID}>
                  {child.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Buttons */}
          {selectedChild && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingCSV ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                <span>{exportingCSV ? "Mengekspor..." : "Ekspor CSV"}</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF || loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPDF ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>{exportingPDF ? "Mengekspor..." : "Ekspor PDF"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      )}

      {!selectedChild ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Pilih anak untuk melihat progres</p>
        </div>
      ) : (
        <>
          <div id="progress-dashboard-export" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <Users size={28} className="text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{selectedChild.Name}</div>
                  <div className="text-xs text-muted-foreground text-center">
                    {selectedChild.Gender} • {selectedChild.ParentGuardianName}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <Clock size={28} className="text-green-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {progress?.total_sessions || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Sesi
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <CheckCircle2 size={28} className="text-purple-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {progress?.completed_sessions || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sesi Selesai
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <Award size={28} className="text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold">
                    {progress?.reward_summary?.total_rewards || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Reward
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Duration Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Durasi Sesi</CardTitle>
                  <CardDescription>
                    Grafik durasi setiap sesi (menit)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionDurations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Belum ada data sesi selesai
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={sessionDurations}>
                        <XAxis dataKey="tanggal" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="durasi" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Reward Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Reward</CardTitle>
                  <CardDescription>
                    Proporsi reward berdasarkan tipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rewardTypes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Belum ada data reward
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={rewardTypes}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {rewardTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Goals Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progres Tujuan Terapi</CardTitle>
                  <CardDescription>
                    Jumlah tujuan yang tercapai vs belum tercapai
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={goalsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {goalsData.map((entry, index) => (
                          <Cell key={`cell-goal-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Rata-rata Durasi Sesi</CardTitle>
                  <CardDescription>
                    Rata-rata waktu sesi selesai (menit)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-4xl font-bold text-blue-700">
                      {progress?.avg_duration
                        ? Math.round(progress.avg_duration)
                        : 0}
                    </span>
                    <span className="text-muted-foreground mt-2">
                      menit per sesi
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle>Aktivitas Paling Sering</CardTitle>
                  <CardDescription>
                    Aktivitas yang paling sering dilakukan anak ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activityFreq.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Tidak ada data aktivitas
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={activityFreq}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Reward Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Tren Reward per Bulan</CardTitle>
                  <CardDescription>
                    Jumlah reward yang diberikan setiap bulan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!rewardTrends || rewardTrends.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Tidak ada data reward bulanan
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={Object.values(
                          rewardTrends.reduce((acc, cur) => {
                            const key = `${cur.month}-${cur.type}`
                            acc[key] = {
                              month: cur.month,
                              type: cur.type,
                              total: cur.total,
                            }
                            return acc
                          }, {} as any)
                        )}
                      >
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#eab308" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Keyword Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Kata Kunci Catatan Terbanyak</CardTitle>
                <CardDescription>
                  Kata yang paling sering muncul di catatan sesi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {keywordFreq.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Tidak ada data kata kunci
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {keywordFreq.map((kw) => (
                      <span
                        key={kw.word}
                        className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        style={{
                          fontSize: `${
                            Math.max(1, Math.min(kw.count, 6)) + 0.75
                          }em`,
                        }}
                      >
                        {kw.word} ({kw.count})
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
