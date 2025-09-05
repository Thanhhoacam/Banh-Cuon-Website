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
import Image from "next/image";

import { Food, FirestoreFood, Category, FirestoreCategory } from "@/types";

export default function FoodsView() {
  const qc = useQueryClient();
  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "foods"));
      return snap.docs.map((d) => ({
        _id: d.id,
        ...(d.data() as FirestoreFood),
      })) as Food[];
    },
  });

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

  const [editing, setEditing] = useState<Partial<Food>>({});
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setEditing({ ...editing, imageUrl });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const createFood = useMutation({
    mutationFn: async (f: Partial<Food>) => {
      await addDoc(collection(db, "foods"), f);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
  const updateFood = useMutation({
    mutationFn: async (f: Partial<Food>) => {
      await updateDoc(doc(db, "foods", String(f._id)), {
        name: f.name,
        price: f.price,
        isAvailable: (f as Food).isAvailable ?? true,
        category: f.category,
        isBestSeller: f.isBestSeller ?? false,
        imageUrl: f.imageUrl,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
  const deleteFood = useMutation({
    mutationFn: async (id: string) => deleteDoc(doc(db, "foods", id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🍽️ Quản lý món ăn
        </h1>
        <p className="text-gray-600">Thêm, sửa, xóa món ăn trong menu</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Food List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📋 Danh sách món ăn
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {foods.map((f) => (
              <div
                key={f._id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {f.imageUrl && (
                    <Image
                      src={f.imageUrl}
                      alt={f.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      unoptimized
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-lg">
                      {f.name}
                    </div>
                    <div className="text-orange-600 font-bold text-xl">
                      {f.price.toLocaleString()} đ
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>{f.isAvailable ? "✅ Có sẵn" : "❌ Hết hàng"}</div>
                      <div className="flex items-center gap-2">
                        {f.category && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {f.category}
                          </span>
                        )}
                        {f.isBestSeller && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            ⭐ Best Seller
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      onClick={() => setEditing(f)}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      onClick={() => deleteFood.mutate(f._id)}
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
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            {editing._id ? "✏️ Sửa món ăn" : "➕ Thêm món ăn mới"}
          </h2>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên món ăn
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nhập tên món ăn..."
                  value={editing.name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ)
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nhập giá món ăn..."
                  type="number"
                  value={editing.price ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, price: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại món
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  value={editing.category || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">Chọn loại món...</option>
                  {categories.length === 0 ? (
                    <option value="" disabled>
                      Chưa có loại món nào. Vui lòng tạo loại món trước.
                    </option>
                  ) : (
                    categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                {categories.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2 flex items-center gap-2">
                    ⚠️ Chưa có loại món nào. Vui lòng tạo loại món trước tại
                    trang{" "}
                    <a
                      href="/admin/categories"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Quản lý loại món
                    </a>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isBestSeller"
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  checked={editing.isBestSeller || false}
                  onChange={(e) =>
                    setEditing({ ...editing, isBestSeller: e.target.checked })
                  }
                />
                <label
                  htmlFor="isBestSeller"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  ⭐ Đánh dấu là Best Seller
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh món ăn
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && (
                  <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Đang upload ảnh...
                  </p>
                )}
                {editing.imageUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <Image
                      src={editing.imageUrl}
                      alt="Preview"
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg"
                  onClick={() =>
                    editing._id
                      ? updateFood.mutate(editing)
                      : createFood.mutate(editing)
                  }
                >
                  {editing._id ? "💾 Cập nhật món" : "✨ Tạo món mới"}
                </button>
                <button
                  className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-200"
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
