import { toDate } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Award,
  Search,
  Star,
  Gift,
  Trophy,
  User,
  ChevronDown,
  ChevronRight,
  Plus,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Sparkles,
  Filter,
  BarChart3,
  CheckCircle,
  Clock,
  Trash2,
  X,
} from "lucide-react"
import {
  GetAllChildren,
  GetChildRewards,
  GetRewardSummary,
  AddReward,
  DeleteReward,
} from "../../../wailsjs/go/main/App"
import { EventsOn } from "../../../wailsjs/runtime/runtime"
import { model } from "../../../wailsjs/go/models"
import { toast } from "sonner"

export function RewardsSystem() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [childRewards, setChildRewards] = useState<model.Reward[]>([])
  const [rewardSummary, setRewardSummary] = useState<any | null>(null)
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean
  }>({
    overview: true,
    history: true,
    analytics: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [showAddReward, setShowAddReward] = useState(false)
  const [rewardForm, setRewardForm] = useState({
    type: "Sticker",
    value: 1,
    notes: "",
    sessionId: null as number | null,
  })
  const [savingReward, setSavingReward] = useState(false)
  const [deletingRewardId, setDeletingRewardId] = useState<number | null>(null)

  useEffect(() => {
    loadChildren()

    // Listen for real-time reward updates
    const unsubscribeRewardUpdate = EventsOn("reward_updated", (data: any) => {
      if (selectedChildId && data.child_id === selectedChildId) {
        loadChildRewards(selectedChildId)
        loadRewardSummary(selectedChildId)

        if (data.action === "added") {
          toast.success("Reward Diberikan!", {
            description: `${data.type} berhasil diberikan kepada anak`,
          })
        } else if (data.action === "deleted") {
          toast.success("Reward Dihapus", {
            description: `${data.type} telah dihapus dari riwayat`,
          })
        }
      }
    })

    return () => {
      if (unsubscribeRewardUpdate) unsubscribeRewardUpdate()
    }
  }, [selectedChildId])

  useEffect(() => {
    if (selectedChildId) {
      loadChildRewards(selectedChildId)
      loadRewardSummary(selectedChildId)
    } else {
      setChildRewards([])
      setRewardSummary(null)
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
      console.error("Error loading children:", err)
      setError("Gagal memuat daftar anak")
    } finally {
      setLoading(false)
    }
  }

  const loadChildRewards = async (childId: number) => {
    try {
      setLoading(true)
      const data = await GetChildRewards(childId)
      setChildRewards(data)
      setError(null)
    } catch (err) {
      console.error("Error loading child rewards:", err)
      setError("Gagal memuat data reward anak")
    } finally {
      setLoading(false)
    }
  }

  const loadRewardSummary = async (childId: number) => {
    try {
      setLoading(true)
      const data = await GetRewardSummary(childId)
      setRewardSummary(data)
      setError(null)
    } catch (err) {
      console.error("Error loading reward summary:", err)
      setError("Gagal memuat ringkasan reward")
    } finally {
      setLoading(false)
    }
  }

  const handleAddReward = async () => {
    if (!selectedChildId) return

    try {
      setSavingReward(true)
      await AddReward(
        selectedChildId,
        rewardForm.sessionId,
        rewardForm.type,
        rewardForm.value,
        rewardForm.notes
      )

      setShowAddReward(false)
      setRewardForm({
        type: "Sticker",
        value: 1,
        notes: "",
        sessionId: null,
      })

      // Data will refresh via event listener
      toast.success("Reward Berhasil Diberikan!", {
        description: `${rewardForm.type} (${rewardForm.value}x) telah diberikan`,
      })
    } catch (err) {
      console.error("Error adding reward:", err)
      toast.error("Gagal Memberikan Reward", {
        description: "Terjadi kesalahan saat memberikan reward",
      })
    } finally {
      setSavingReward(false)
    }
  }

  const handleDeleteReward = async (rewardId: number, rewardType: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus reward ${rewardType}?`)) {
      return
    }

    try {
      setDeletingRewardId(rewardId)
      await DeleteReward(rewardId)
      // Data will refresh via event listener
    } catch (err) {
      console.error("Error deleting reward:", err)
      toast.error("Gagal Menghapus Reward", {
        description: "Terjadi kesalahan saat menghapus reward",
      })
    } finally {
      setDeletingRewardId(null)
    }
  }

  const rewardTypes = [
    {
      value: "Sticker",
      label: "Sticker ⭐",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      value: "Bintang",
      label: "Bintang 🏆",
      icon: Trophy,
      color: "text-blue-500",
    },
    { value: "Poin", label: "Poin 🎯", icon: Target, color: "text-green-500" },
    {
      value: "Hadiah Kecil",
      label: "Hadiah Kecil 🎁",
      icon: Gift,
      color: "text-purple-500",
    },
    {
      value: "Sertifikat",
      label: "Sertifikat 📜",
      icon: Award,
      color: "text-orange-500",
    },
  ]

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getRewardIcon = (type: string) => {
    const rewardType = rewardTypes.find((r) => r.value === type)
    if (rewardType) {
      const IconComponent = rewardType.icon
      return <IconComponent className={rewardType.color} size={16} />
    }
    return <Award className="text-gray-500" size={16} />
  }

  const getRewardColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Sticker: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Bintang: "bg-blue-100 text-blue-800 border-blue-200",
      Poin: "bg-green-100 text-green-800 border-green-200",
      "Hadiah Kecil": "bg-purple-100 text-purple-800 border-purple-200",
      Sertifikat: "bg-orange-100 text-orange-800 border-orange-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Filter and group rewards
  const filteredRewards = childRewards.filter((reward) => {
    const matchesSearch =
      searchTerm === "" ||
      reward.Type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reward.Notes &&
        reward.Notes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === "all" || reward.Type === filterType

    return matchesSearch && matchesType
  })

  // Group rewards by month
  const groupedRewards = filteredRewards.reduce((acc, reward) => {
    const date = toDate(reward.Timestamp)
    const monthYear = `${date.toLocaleString("id-ID", {
      month: "long",
    })} ${date.getFullYear()}`

    if (!acc[monthYear]) {
      acc[monthYear] = []
    }

    acc[monthYear].push(reward)
    return acc
  }, {} as { [key: string]: model.Reward[] })

  const selectedChild = children.find((child) => child.ID === selectedChildId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="text-yellow-500" />
            Sistem Reward
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan lacak pencapaian reward anak-anak
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Child Selection */}
          <div className="w-full sm:w-64">
            <select
              className="w-full border rounded-md p-2 bg-white"
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
        </div>
      </div>

      {/* Add Reward Modal */}
      {showAddReward && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Beri Reward untuk {selectedChild.Name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddReward(false)}
                >
                  <X size={18} />
                </Button>
              </CardTitle>
              <CardDescription>
                Pilih jenis reward dan jumlah yang akan diberikan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Jenis Reward
                </label>
                <select
                  value={rewardForm.type}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, type: e.target.value })
                  }
                  className="w-full border rounded-md p-2"
                >
                  {rewardTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jumlah</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={rewardForm.value}
                  onChange={(e) =>
                    setRewardForm({
                      ...rewardForm,
                      value: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Catatan (Opsional)
                </label>
                <Input
                  placeholder="Alasan pemberian reward..."
                  value={rewardForm.notes}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleAddReward}
                  disabled={savingReward}
                  className="flex-1"
                >
                  {savingReward ? (
                    <>
                      <Clock className="animate-spin mr-2" size={16} />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2" size={16} />
                      Beri Reward
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddReward(false)}
                  disabled={savingReward}
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <X size={18} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !selectedChild ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock
              className="animate-spin mx-auto mb-4 text-blue-500"
              size={32}
            />
            <p className="text-lg">Memuat data...</p>
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Pilih Anak Terlebih Dahulu
            </p>
            <p className="text-sm text-muted-foreground">
              Pilih anak dari dropdown di atas untuk melihat data reward
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Child Info Card with Actions */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User size={20} className="text-blue-600" />
                    <span className="text-xl">{selectedChild.Name}</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manajemen reward dan statistik pencapaian
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowAddReward(true)}
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Plus size={16} className="mr-2" />
                    Beri Reward
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      loadChildRewards(selectedChildId!)
                      loadRewardSummary(selectedChildId!)
                    }}
                    disabled={loading}
                  >
                    <BarChart3 size={16} className="mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Search and Filter Bar */}
          {childRewards.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      placeholder="Cari berdasarkan jenis reward atau catatan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="all">Semua Jenis</option>
                      {rewardTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Card */}
          <Card>
            <CardContent className="p-6">
              {/* Rewards Overview */}
              <div className="border-b pb-4 mb-4">
                <button
                  className="flex w-full items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2"
                  onClick={() => toggleSection("overview")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-500" />
                    Ringkasan Reward
                  </h3>
                  {expandedSections.overview ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {expandedSections.overview && rewardSummary && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <Award
                            className="text-blue-600 mx-auto mb-2"
                            size={24}
                          />
                          <div className="text-3xl font-bold text-blue-800">
                            {rewardSummary.total_rewards || 0}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            Total Reward
                          </div>
                        </CardContent>
                      </Card>

                      {rewardSummary.rewards_by_type &&
                        Object.entries(rewardSummary.rewards_by_type).map(
                          ([type, count]) => {
                            const rewardType = rewardTypes.find(
                              (r) => r.value === type
                            )
                            const IconComponent = rewardType?.icon || Award
                            return (
                              <Card
                                key={type}
                                className={`bg-gradient-to-br ${getRewardColor(
                                  type
                                )}`}
                              >
                                <CardContent className="p-4 text-center">
                                  <IconComponent
                                    className={
                                      rewardType?.color || "text-gray-500"
                                    }
                                    size={24}
                                  />
                                  <div className="text-3xl font-bold mt-2">
                                    {String(count)}
                                  </div>
                                  <div className="text-sm font-medium">
                                    {type}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          }
                        )}
                    </div>

                    {rewardSummary.recent_rewards > 0 && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-green-700">
                            <Zap size={18} />
                            <span className="font-medium">
                              {rewardSummary.recent_rewards} reward diberikan
                              dalam 30 hari terakhir
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Rewards History */}
              <div className="border-b pb-4 mb-4">
                <button
                  className="flex w-full items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2"
                  onClick={() => toggleSection("history")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar size={20} className="text-purple-500" />
                    Riwayat Reward
                    {filteredRewards.length > 0 && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {filteredRewards.length}
                      </span>
                    )}
                  </h3>
                  {expandedSections.history ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {expandedSections.history && (
                  <div className="mt-4 space-y-4">
                    {Object.keys(groupedRewards).length > 0 ? (
                      Object.entries(groupedRewards)
                        .sort(
                          ([a], [b]) =>
                            new Date(b).getTime() - new Date(a).getTime()
                        )
                        .map(([monthYear, rewards]) => (
                          <div key={monthYear} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-700">
                                {monthYear}
                              </h4>
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                {rewards.length} reward
                              </span>
                            </div>
                            <div className="grid gap-3">
                              {rewards.map((reward) => {
                                const rewardType = rewardTypes.find(
                                  (r) => r.value === reward.Type
                                )
                                const IconComponent = rewardType?.icon || Award
                                return (
                                  <Card
                                    key={reward.ID}
                                    className="hover:shadow-md transition-shadow"
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <div
                                            className={`p-3 rounded-full ${getRewardColor(
                                              reward.Type
                                            )}`}
                                          >
                                            <IconComponent size={20} />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-lg">
                                              {reward.Type}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                              <Calendar size={14} />
                                              <span>
                                                {toDate(
                                                  reward.Timestamp
                                                ).toLocaleDateString("id-ID", {
                                                  weekday: "long",
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                })}
                                              </span>
                                            </div>
                                            {reward.Notes && (
                                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md">
                                                💬 {reward.Notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-600">
                                              ×{reward.Value}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {toDate(
                                                reward.Timestamp
                                              ).toLocaleTimeString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteReward(
                                                reward.ID,
                                                reward.Type
                                              )
                                            }
                                            disabled={
                                              deletingRewardId === reward.ID
                                            }
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          >
                                            {deletingRewardId === reward.ID ? (
                                              <Clock
                                                className="animate-spin"
                                                size={16}
                                              />
                                            ) : (
                                              <Trash2 size={16} />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        ))
                    ) : filteredRewards.length === 0 &&
                      childRewards.length > 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <Filter
                            className="mx-auto mb-4 text-gray-400"
                            size={48}
                          />
                          <p className="text-lg font-medium text-gray-600 mb-2">
                            Tidak ada hasil yang cocok
                          </p>
                          <p className="text-sm text-gray-500">
                            Coba ubah kata kunci pencarian atau filter jenis
                            reward
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <Gift
                            className="mx-auto mb-4 text-gray-400"
                            size={48}
                          />
                          <p className="text-lg font-medium text-gray-600 mb-2">
                            Belum ada riwayat reward
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            Mulai berikan reward untuk anak ini
                          </p>
                          <Button
                            onClick={() => setShowAddReward(true)}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          >
                            <Plus size={16} className="mr-2" />
                            Beri Reward Pertama
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Analytics */}
              <div className="py-2">
                <button
                  className="flex w-full items-center justify-between py-2 hover:bg-gray-50 rounded-md px-2"
                  onClick={() => toggleSection("analytics")}
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 size={20} className="text-green-500" />
                    Analisis Pencapaian
                  </h3>
                  {expandedSections.analytics ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {expandedSections.analytics && (
                  <div className="mt-4">
                    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                      <CardContent className="p-6 text-center">
                        <BarChart3
                          className="mx-auto mb-4 text-green-500"
                          size={48}
                        />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Analisis Mendalam Segera Hadir
                        </p>
                        <p className="text-sm text-gray-600">
                          Grafik trend, statistik pencapaian, dan insight
                          mendalam akan tersedia di versi mendatang.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
