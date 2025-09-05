"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { Category, FirestoreCategory } from "@/types";

export default function CategoriesView() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "categories"));
      return snap.docs.map((d) => ({
        _id: d.id,
        ...(d.data() as FirestoreCategory),
      })) as Category[];
    },
  });

  const [editing, setEditing] = useState<Partial<Category>>({});

  const createCategory = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      await addDoc(collection(db, "categories"), {
        name: c.name,
        createdAt: Date.now(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const updateCategory = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      await updateDoc(doc(db, "categories", String(c._id)), {
        name: c.name,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => deleteDoc(doc(db, "categories", id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
          🏷️ Quản lý loại món ăn
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Thêm, sửa, xóa các loại món ăn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Categories List */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            📋 Danh sách loại món
          </h2>
          <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 pr-2">
            {categories.map((c) => (
              <div
                key={c._id}
                className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-base sm:text-lg">
                      {c.name}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
                      onClick={() => setEditing(c)}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="flex-1 sm:flex-none px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm font-medium"
                      onClick={() => deleteCategory.mutate(c._id)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
            {editing._id ? "✏️ Sửa loại món" : "➕ Thêm loại món mới"}
          </h2>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên loại món
                </label>
                <input
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                  placeholder="Ví dụ: Món chính, Nước uống, Tráng miệng..."
                  value={editing.name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg text-sm sm:text-base"
                  onClick={() =>
                    editing._id
                      ? updateCategory.mutate(editing)
                      : createCategory.mutate(editing)
                  }
                >
                  {editing._id ? "💾 Cập nhật loại" : "✨ Tạo loại mới"}
                </button>
                <button
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm sm:text-base"
                  onClick={() => setEditing({})}
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
