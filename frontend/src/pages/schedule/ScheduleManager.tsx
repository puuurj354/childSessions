import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreateSchedule,
  DeleteSchedule,
  GetSchedulesByChild,
  GetAllChildren,
  GetAllActivities,
  UpdateSchedule,
  CompleteSchedule,
} from '../../../wailsjs/go/main/App';
import { Trash2, Edit, Check, Plus } from 'lucide-react';
import { formatDateIndonesian, formatDateForInput, toDate } from '@/lib/utils';
import * as models from '../../../wailsjs/go/models';

type Schedule = models.model.Schedule;

interface Child {
  ID: number;
  Name: string;
  Gender: string;
}

interface Activity {
  ID: number;
  Name: string;
  Description: string;
}

const ScheduleManager: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    activityId: '',
    notes: '',
    recurrencePattern: 'none',
    durationMinutes: 60,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadSchedules();
    }
  }, [selectedChildId]);

  const loadInitialData = async () => {
    try {
      const [childrenData, activitiesData] = await Promise.all([
        GetAllChildren(),
        GetAllActivities(),
      ]);
      setChildren(childrenData);
      setActivities(activitiesData);
      if (childrenData && childrenData.length > 0) {
        setSelectedChildId(childrenData[0].ID);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    if (!selectedChildId) return;
    try {
      const data = await GetSchedulesByChild(selectedChildId);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId || !formData.scheduledDate || !formData.scheduledTime) {
      alert('Mohon isi semua field yang diperlukan');
      return;
    }

    try {
      const activityId = formData.activityId ? parseInt(formData.activityId) : null;

      if (editingSchedule) {
        // Update existing schedule
        await UpdateSchedule(
          editingSchedule.ID,
          activityId ? activityId : null,
          new Date(formData.scheduledDate),
          formData.scheduledTime,
          formData.notes,
          formData.recurrencePattern,
          formData.durationMinutes
        );
      } else {
        // Create new schedule
        await CreateSchedule(
          selectedChildId,
          activityId ? activityId : null,
          new Date(formData.scheduledDate),
          formData.scheduledTime,
          formData.notes,
          formData.recurrencePattern,
          undefined as any,
          formData.durationMinutes
        );
      }

      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Gagal menyimpan jadwal');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      scheduledDate: formatDateForInput(toDate(schedule.ScheduledDate)),
      scheduledTime: schedule.ScheduledTime,
      activityId: schedule.ActivityID?.toString() || '',
      notes: schedule.Notes,
      recurrencePattern: schedule.RecurrencePattern,
      durationMinutes: schedule.DurationMinutes,
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    try {
      await DeleteSchedule(scheduleId);
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Gagal menghapus jadwal');
    }
  };

  const handleComplete = async (scheduleId: number) => {
    try {
      await CompleteSchedule(scheduleId);
      loadSchedules();
    } catch (error) {
      console.error('Error completing schedule:', error);
      alert('Gagal menyelesaikan jadwal');
    }
  };

  const resetForm = () => {
    setFormData({
      scheduledDate: '',
      scheduledTime: '',
      activityId: '',
      notes: '',
      recurrencePattern: 'none',
      durationMinutes: 60,
    });
    setEditingSchedule(null);
    setShowForm(false);
  };

  const upcomingSchedules = schedules.filter((s) => !s.IsCompleted);
  const completedSchedules = schedules.filter((s) => s.IsCompleted);

  if (loading) {
    return <div className="p-8 text-center">Memuat data...</div>;
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Jadwal</h1>
          <p className="text-gray-600">Kelola jadwal sesi terapi untuk anak</p>
        </div>

        {/* Child Selection */}
        <Card className="mb-8 p-6 shadow-lg">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Pilih Anak
          </label>
          <div className="flex gap-2 flex-wrap">
            {children.map((child) => (
              <Button
                key={child.ID}
                onClick={() => setSelectedChildId(child.ID)}
                variant={selectedChildId === child.ID ? 'default' : 'outline'}
                className="transition-all"
              >
                {child.Name}
              </Button>
            ))}
          </div>
        </Card>

        {selectedChildId && (
          <>
            {/* Add Schedule Button */}
            <div className="mb-8 flex justify-end">
              <Button
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={20} />
                {showForm ? 'Batal' : 'Tambah Jadwal'}
              </Button>
            </div>

            {/* Schedule Form */}
            {showForm && (
              <Card className="mb-8 p-6 shadow-lg bg-white">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {editingSchedule ? 'Edit Jadwal' : 'Jadwal Baru'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledDate: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jam <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledTime: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aktivitas
                      </label>
                      <select
                        value={formData.activityId}
                        onChange={(e) =>
                          setFormData({ ...formData, activityId: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih Aktivitas</option>
                        {activities.map((activity) => (
                          <option key={activity.ID} value={activity.ID}>
                            {activity.Name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Durasi (menit)
                      </label>
                      <Input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            durationMinutes: parseInt(e.target.value),
                          })
                        }
                        min="15"
                        max="180"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pola Pengulangan
                      </label>
                      <select
                        value={formData.recurrencePattern}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrencePattern: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">Tidak Ada</option>
                        <option value="daily">Setiap Hari</option>
                        <option value="weekly">Setiap Minggu</option>
                        <option value="monthly">Setiap Bulan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tambahkan catatan untuk jadwal ini..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingSchedule ? 'Simpan Perubahan' : 'Buat Jadwal'}
                    </Button>
                    <Button
                      type="button"
                      onClick={resetForm}
                      variant="outline"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Upcoming Schedules */}
            <Card className="mb-8 p-6 shadow-lg bg-white">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Jadwal Mendatang ({upcomingSchedules.length})
              </h2>
              {upcomingSchedules.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSchedules.map((schedule) => (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatDateIndonesian(toDate(schedule.ScheduledDate))}
                            </p>
                            <p className="text-gray-600">
                              {schedule.ScheduledTime} ({schedule.DurationMinutes} menit)
                            </p>
                          </div>
                          {schedule.Activity && (
                            <div className="ml-4">
                              <span className="inline-block bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {schedule.Activity.Name}
                              </span>
                            </div>
                          )}
                        </div>
                        {schedule.Notes && (
                          <p className="text-sm text-gray-600 mt-2">Catatan: {schedule.Notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleComplete(schedule.ID)}
                          title="Tandai selesai"
                        >
                          <Check size={18} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(schedule)}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(schedule.ID)}
                          title="Hapus"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada jadwal mendatang</p>
              )}
            </Card>

            {/* Completed Schedules */}
            {completedSchedules.length > 0 && (
              <Card className="p-6 shadow-lg bg-white">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Jadwal Selesai ({completedSchedules.length})
                </h2>
                <div className="space-y-3">
                  {completedSchedules.slice(0, 5).map((schedule) => (
                    <div
                      key={schedule.ID}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 line-through">
                          {formatDateForInput(toDate(schedule.ScheduledDate))} -
                          {schedule.ScheduledTime}
                        </p>
                        {schedule.Activity && (
                          <span className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-sm mt-1">
                            {schedule.Activity.Name}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(schedule.ID)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;
