import React, { useEffect, useState } from "react"
import { toDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Search,
  RefreshCw,
  MoreVertical,
  FileText,
  Activity as ActivityIcon,
  Target,
  Calendar,
} from "lucide-react"
import {
  GetAllActivities,
  CreateActivity,
  GetActivityByID,
  UpdateActivity,
  DeleteActivity,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { toast } from "sonner"

interface ActivityStats {
  total_activities: number
  most_used_activity: string
  average_duration: number
  last_created: string
}

export function ActivityLibrary() {
  // Core state
  const [activities, setActivities] = useState<model.Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState<model.Activity | null>(
    null
  )
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(15)
  const [category, setCategory] = useState("")
  const [objectives, setObjectives] = useState("")

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")

  // Stats
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    loadActivities()
    // eslint-disable-next-line
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await GetAllActivities()
      setActivities(data)
      calculateActivityStats(data)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError("Gagal memuat daftar aktivitas")
    } finally {
      setLoading(false)
    }
  }

  const calculateActivityStats = (activitiesData: model.Activity[]) => {
    if (activitiesData.length === 0) {
      setActivityStats(null)
      return
    }
    const totalActivities = activitiesData.length
    const averageDuration = Math.round(
      activitiesData.reduce(
        (sum, activity) => sum + activity.DefaultDurationMinutes,
        0
      ) / totalActivities
    )
    const sortedByDate = [...activitiesData].sort(
      (a, b) =>
        toDate(b.CreatedAt).getTime() -
        toDate(a.CreatedAt).getTime()
    )
    const lastCreated = sortedByDate[0]?.CreatedAt
      ? toDate(sortedByDate[0].CreatedAt).toLocaleDateString("id-ID")
      : "Tidak diketahui"
    setActivityStats({
      total_activities: totalActivities,
      most_used_activity: sortedByDate[0]?.Name || "Tidak ada",
      average_duration: averageDuration,
      last_created: lastCreated,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim()) {
      toast.error("Validasi Error", {
        description: "Nama dan deskripsi aktivitas wajib diisi",
      })
      return
    }
    try {
      setSaving(true)
      if (editingActivity) {
        await UpdateActivity(
          editingActivity.ID,
          name.trim(),
          description.trim(),
          defaultDurationMinutes,
          category.trim(),
          objectives.trim()
        )
        toast.success("Aktivitas Diperbarui", {
          description: `Aktivitas "${name}" berhasil diperbarui`,
        })
      } else {
        await CreateActivity(
          name.trim(),
          description.trim(),
          defaultDurationMinutes,
          category.trim(),
          objectives.trim()
        )
        toast.success("Aktivitas Ditambahkan", {
          description: `Aktivitas "${name}" berhasil ditambahkan`,
        })
      }
      resetForm()
      await loadActivities()
    } catch (err) {
      toast.error("Gagal Menyimpan", {
        description: editingActivity
          ? "Gagal memperbarui aktivitas"
          : "Gagal menambahkan aktivitas baru",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id: number) => {
    try {
      setLoading(true)
      const activity = await GetActivityByID(id)
      setEditingActivity(activity)
      setName(activity.Name)
      setDescription(activity.Description)
      setDefaultDurationMinutes(activity.DefaultDurationMinutes)
      setCategory(activity.Category || "")
      setObjectives(activity.Objectives || "")
      setShowAddForm(true)
      setError(null)
      toast.info("Mode Edit", {
        description: `Mengedit aktivitas "${activity.Name}"`,
      })
    } catch (err) {
      toast.error("Gagal Memuat", {
        description: "Gagal memuat detail aktivitas untuk diedit",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, activityName: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus aktivitas "${activityName}"?\n\nTindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return
    }
    try {
      setDeleting(id)
      await DeleteActivity(id)
      toast.success("Aktivitas Dihapus", {
        description: `Aktivitas "${activityName}" berhasil dihapus`,
      })
      await loadActivities()
    } catch (err) {
      toast.error("Gagal Menghapus", {
        description:
          "Gagal menghapus aktivitas. Mungkin aktivitas sedang digunakan dalam sesi.",
      })
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setEditingActivity(null)
    setName("")
    setDescription("")
    setDefaultDurationMinutes(15)
    setCategory("")
    setObjectives("")
    setShowAddForm(false)
  }

  const handleManualRefresh = async () => {
    await loadActivities()
    toast.success("Data Diperbarui", {
      description: "Daftar aktivitas telah diperbarui",
    })
  }

  // Filter and sort activities
  const filteredAndSortedActivities = activities
    .filter((activity) => {
      const matchesSearch =
        activity.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.Category &&
          activity.Category.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory =
        filterCategory === "all" ||
        (activity.Category &&
          activity.Category.toLowerCase() === filterCategory.toLowerCase())
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      let valueA: any, valueB: any
      switch (sortBy) {
        case "name":
          valueA = a.Name.toLowerCase()
          valueB = b.Name.toLowerCase()
          break
        case "duration":
          valueA = a.DefaultDurationMinutes
          valueB = b.DefaultDurationMinutes
          break
        case "category":
          valueA = (a.Category || "").toLowerCase()
          valueB = (b.Category || "").toLowerCase()
          break
        case "created":
          valueA = toDate(a.CreatedAt).getTime()
          valueB = toDate(b.CreatedAt).getTime()
          break
        default:
          valueA = a.Name.toLowerCase()
          valueB = b.Name.toLowerCase()
      }
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
      }
    })

  // Get unique categories for filter
  const categories = Array.from(
    new Set(
      activities
        .map((activity) => activity.Category)
        .filter((category) => category && category.trim() !== "")
    )
  )

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return "Belum pernah"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 1) return "Baru saja"
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
    return date.toLocaleTimeString("id-ID")
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">
          Pustaka Aktivitas Terapi
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Memperbarui..." : "Perbarui"}</span>
          </button>
          <button
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowAddForm(true)}
            disabled={loading || saving}
          >
            <Plus size={16} />
            <span>Tambah Aktivitas</span>
          </button>
        </div>
      </div>

      {/* Last Refresh Info */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>Terakhir diperbarui: {formatLastRefresh(lastRefresh)}</div>
      </div>

      {/* Activity Stats Cards */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Aktivitas
              </CardTitle>
              <ActivityIcon className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activityStats.total_activities}
              </div>
              <p className="text-xs text-muted-foreground">
                Jumlah aktivitas terapi yang tersedia
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Aktivitas Terbaru
              </CardTitle>
              <Calendar className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold">
                {activityStats.last_created}
              </div>
              <p className="text-xs text-muted-foreground">
                Tanggal aktivitas terakhir ditambahkan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Durasi Rata-rata
              </CardTitle>
              <Clock className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activityStats.average_duration} menit
              </div>
              <p className="text-xs text-muted-foreground">
                Durasi rata-rata aktivitas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Aktivitas Populer
              </CardTitle>
              <Target className="w-5 h-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold">
                {activityStats.most_used_activity}
              </div>
              <p className="text-xs text-muted-foreground">
                Aktivitas yang paling sering digunakan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search, Filter, and Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              className="w-full sm:w-64 pl-8 pr-3 py-2 border rounded-md text-sm"
              placeholder="Cari aktivitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <select
            className="border rounded-md px-2 py-2 text-sm max-w-full sm:max-w-[200px]"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            disabled={loading}
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat || ""}>
                {cat || "(Tanpa Kategori)"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Urutkan:</label>
          <select
            className="border rounded-md px-2 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            disabled={loading}
          >
            <option value="name">Nama</option>
            <option value="duration">Durasi</option>
            <option value="category">Kategori</option>
            <option value="created">Tanggal Dibuat</option>
          </select>
          <button
            className="border rounded-md px-2 py-2 text-sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            disabled={loading}
            title="Urutan"
          >
            {sortOrder === "asc" ? "⬆️" : "⬇️"}
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <CardTitle>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                </CardTitle>
                <CardDescription>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-28"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredAndSortedActivities.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Tidak ada aktivitas ditemukan</p>
          </div>
        ) : (
          filteredAndSortedActivities.map((activity) => (
            <Card key={activity.ID}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-blue-600" />
                  {activity.Name}
                </CardTitle>
                <CardDescription>
                  {activity.Category || (
                    <span className="italic text-muted-foreground">
                      Tanpa Kategori
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-2">{activity.Description}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4" />{" "}
                  {activity.DefaultDurationMinutes} menit
                  <MoreVertical className="w-4 h-4 mx-2" />
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(activity.ID)}
                    disabled={loading || saving}
                  >
                    <Pencil className="w-4 h-4 inline" /> Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline ml-2"
                    onClick={() => handleDelete(activity.ID, activity.Name)}
                    disabled={loading || saving || deleting === activity.ID}
                  >
                    <Trash2 className="w-4 h-4 inline" />{" "}
                    {deleting === activity.ID ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Activity Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>
                {editingActivity ? "Edit Aktivitas" : "Tambah Aktivitas"}
              </CardTitle>
              <CardDescription>
                {editingActivity
                  ? "Ubah detail aktivitas terapi di bawah ini."
                  : "Isi detail untuk menambahkan aktivitas baru."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nama Aktivitas
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Durasi Default (menit)
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-2"
                      value={defaultDurationMinutes}
                      onChange={(e) =>
                        setDefaultDurationMinutes(Number(e.target.value))
                      }
                      min={1}
                      max={180}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Kategori
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-md px-3 py-2"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tujuan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={saving}
                  >
                    {saving
                      ? editingActivity
                        ? "Menyimpan..."
                        : "Menambah..."
                      : editingActivity
                      ? "Simpan Perubahan"
                      : "Tambah Aktivitas"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
