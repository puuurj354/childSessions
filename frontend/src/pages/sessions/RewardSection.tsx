import { toDate } from "@/lib/utils"
import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Star, Gift, Trophy, Plus } from "lucide-react"
import { AddReward, GetChildRewards } from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

interface RewardSectionProps {
  sessionId: number
  childId: number
}

export function RewardSection({ sessionId, childId }: RewardSectionProps) {
  const [childRewards, setChildRewards] = useState<model.Reward[]>([])
  const [showAddReward, setShowAddReward] = useState(false)
  const [rewardType, setRewardType] = useState("")
  const [rewardValue, setRewardValue] = useState(1)
  const [rewardNotes, setRewardNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rewardTypes = [
    { name: "Sticker", icon: <Star size={16} />, defaultValue: 1 },
    { name: "Bintang", icon: <Trophy size={16} />, defaultValue: 1 },
    { name: "Poin", icon: <Award size={16} />, defaultValue: 5 },
    { name: "Hadiah Kecil", icon: <Gift size={16} />, defaultValue: 1 },
  ]

  useEffect(() => {
    loadChildRewards()
  }, [childId])

  const loadChildRewards = async () => {
    try {
      setLoading(true)
      const data = await GetChildRewards(childId)
      setChildRewards(data)
      setError(null)
    } catch (err) {
      console.error("Error loading child rewards:", err)
      setError("Gagal memuat reward anak")
    } finally {
      setLoading(false)
    }
  }

  const handleAddReward = async () => {
    if (!rewardType) return

    try {
      setLoading(true)
      await AddReward(childId, sessionId, rewardType, rewardValue, rewardNotes)
      setRewardType("")
      setRewardValue(1)
      setRewardNotes("")
      setShowAddReward(false)
      loadChildRewards()
      setError(null)
    } catch (err) {
      console.error("Error adding reward:", err)
      setError("Gagal memberikan reward")
    } finally {
      setLoading(false)
    }
  }

  const handleRewardTypeSelect = (type: string, defaultValue: number) => {
    setRewardType(type)
    setRewardValue(defaultValue)
  }

  const getRewardIcon = (type: string) => {
    const reward = rewardTypes.find((r) => r.name === type)
    return reward?.icon || <Award size={16} />
  }

  const getRewardColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Sticker: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Bintang: "bg-blue-100 text-blue-800 border-blue-200",
      Poin: "bg-green-100 text-green-800 border-green-200",
      "Hadiah Kecil": "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const todayRewards = childRewards.filter((reward) => {
    const rewardDate = toDate(reward.Timestamp).toDateString()
    const today = new Date().toDateString()
    return rewardDate === today
  })

  const sessionRewards = childRewards.filter(
    (reward) => reward.SessionID === sessionId
  )

  const totalRewardsByType = childRewards.reduce((acc, reward) => {
    acc[reward.Type] = (acc[reward.Type] || 0) + reward.Value
    return acc
  }, {} as { [key: string]: number })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sistem Reward</h3>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddReward(true)}
          disabled={loading}
        >
          <Plus size={14} />
          <span>Beri Reward</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {rewardTypes.map((type) => (
          <Card key={type.name} className="text-center">
            <CardContent className="p-3">
              <div className="flex flex-col items-center space-y-1">
                <div className="text-primary">{type.icon}</div>
                <div className="text-lg font-bold">
                  {totalRewardsByType[type.name] || 0}
                </div>
                <div className="text-xs text-muted-foreground">{type.name}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddReward && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Berikan Reward</h4>
              <button
                onClick={() => {
                  setShowAddReward(false)
                  setRewardType("")
                  setRewardValue(1)
                  setRewardNotes("")
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Jenis Reward <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {rewardTypes.map((type) => (
                    <button
                      key={type.name}
                      onClick={() =>
                        handleRewardTypeSelect(type.name, type.defaultValue)
                      }
                      className={`flex items-center space-x-2 p-3 border rounded-md text-sm transition-colors ${
                        rewardType === type.name
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {type.icon}
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Jumlah/Nilai
                </label>
                <input
                  type="number"
                  value={rewardValue}
                  onChange={(e) => setRewardValue(Number(e.target.value))}
                  min="1"
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={rewardNotes}
                  onChange={(e) => setRewardNotes(e.target.value)}
                  placeholder="Alasan pemberian reward..."
                  className="w-full border rounded-md p-2"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddReward(false)
                  setRewardType("")
                  setRewardValue(1)
                  setRewardNotes("")
                }}
                className="px-4 py-2 border rounded-md text-sm"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleAddReward}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                disabled={!rewardType || loading}
              >
                <Award size={14} />
                <span>Berikan Reward</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Rewards */}
      {sessionRewards.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Reward Sesi Ini</h4>
            <div className="space-y-2">
              {sessionRewards.map((reward) => (
                <div
                  key={reward.ID}
                  className={`flex items-center justify-between p-2 rounded-md border ${getRewardColor(
                    reward.Type
                  )}`}
                >
                  <div className="flex items-center space-x-2">
                    {getRewardIcon(reward.Type)}
                    <span className="font-medium">{reward.Type}</span>
                    <span className="text-sm">×{reward.Value}</span>
                  </div>
                  <div className="text-xs">
                    {toDate(reward.Timestamp).toLocaleTimeString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Rewards Summary */}
      {todayRewards.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Reward Hari Ini</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(
                todayRewards.reduce((acc, reward) => {
                  acc[reward.Type] = (acc[reward.Type] || 0) + reward.Value
                  return acc
                }, {} as { [key: string]: number })
              ).map(([type, total]) => (
                <div
                  key={type}
                  className={`flex items-center justify-between p-2 rounded-md ${getRewardColor(
                    type
                  )}`}
                >
                  <div className="flex items-center space-x-2">
                    {getRewardIcon(type)}
                    <span className="text-sm font-medium">{type}</span>
                  </div>
                  <span className="font-bold">{total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <p className="text-center py-4 text-muted-foreground">
          Memuat data reward...
        </p>
      )}
    </div>
  )
}
