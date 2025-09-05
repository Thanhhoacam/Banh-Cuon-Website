"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Upload, ChefHat, DollarSign } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Food, FirestoreFood, Category, FirestoreCategory } from "@/types";

const foodSchema = z.object({
  name: z.string().min(1, "Tên món ăn không được để trống"),
  price: z.number().min(0, "Giá phải lớn hơn 0"),
  category: z.string().optional(),
  isBestSeller: z.boolean().optional(),
  imageUrl: z.string().optional(),
});

type FoodFormData = z.infer<typeof foodSchema>;

export default function ModernFoodsView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Food>>({});
  const [uploading, setUploading] = useState(false);

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

  const form = useForm<FoodFormData>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: "",
      price: 0,
      category: "",
      isBestSeller: false,
      imageUrl: "",
    },
  });

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
      form.setValue("imageUrl", imageUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const createFood = useMutation({
    mutationFn: async (data: FoodFormData) => {
      await addDoc(collection(db, "foods"), {
        ...data,
        isAvailable: true,
        createdAt: new Date(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foods"] });
      form.reset();
      setEditing({});
    },
  });

  const updateFood = useMutation({
    mutationFn: async (data: FoodFormData & { _id: string }) => {
      await updateDoc(doc(db, "foods", data._id), {
        name: data.name,
        price: data.price,
        category: data.category,
        isBestSeller: data.isBestSeller,
        imageUrl: data.imageUrl,
        isAvailable: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foods"] });
      form.reset();
      setEditing({});
    },
  });

  const deleteFood = useMutation({
    mutationFn: async (id: string) => deleteDoc(doc(db, "foods", id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });

  const onSubmit = (data: FoodFormData) => {
    if (editing._id) {
      updateFood.mutate({ ...data, _id: editing._id });
    } else {
      createFood.mutate(data);
    }
  };

  const handleEdit = (food: Food) => {
    setEditing(food);
    form.reset({
      name: food.name,
      price: food.price,
      category: food.category || "",
      isBestSeller: food.isBestSeller || false,
      imageUrl: food.imageUrl || "",
    });
  };

  // Group foods by category
  const groupedFoods = foods.reduce((acc, food) => {
    const category = food.category || "Chưa phân loại";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(food);
    return acc;
  }, {} as Record<string, Food[]>);

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <ChefHat className="h-10 w-10 text-blue-600" />
          Quản lý món ăn
        </h1>
        <p className="text-gray-600">Thêm, sửa, xóa món ăn trong menu</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Food List by Categories */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-blue-600" />
                Danh sách món ăn ({foods.length})
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            {Object.entries(groupedFoods).map(
              ([category, categoryFoods], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                >
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-blue-600 font-bold">
                          {category}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          {categoryFoods.length} món
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 pr-2">
                        {categoryFoods.map((f, index) => (
                          <motion.div
                            key={f._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Card className="hover:shadow-md transition-all duration-200 bg-gray-50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  {f.imageUrl && (
                                    <Image
                                      src={f.imageUrl}
                                      alt={f.name}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                                      {f.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <DollarSign className="h-3 w-3 text-orange-600" />
                                      <span className="text-orange-600 font-bold text-base sm:text-lg">
                                        {f.price.toLocaleString()} đ
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      <Badge
                                        variant={
                                          f.isAvailable
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={`text-xs ${
                                          f.isAvailable
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {f.isAvailable
                                          ? "✅ Có sẵn"
                                          : "❌ Hết hàng"}
                                      </Badge>
                                      {f.isBestSeller && (
                                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                          ⭐ Best Seller
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(f)}
                                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => deleteFood.mutate(f._id)}
                                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              {editing._id ? "Sửa món ăn" : "Thêm món ăn mới"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên món ăn</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên món ăn..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá (VNĐ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Nhập giá món ăn..."
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại món</FormLabel>
                      <FormControl>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                          {...field}
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
                      </FormControl>
                      <FormMessage />
                      {categories.length === 0 && (
                        <p className="text-sm text-orange-600 flex items-center gap-2">
                          ⚠️ Chưa có loại món nào. Vui lòng tạo loại món trước
                          tại trang{" "}
                          <a
                            href="/admin/categories"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            Quản lý loại món
                          </a>
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isBestSeller"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          ⭐ Đánh dấu là Best Seller
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Ảnh món ăn</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <Upload className="h-4 w-4 animate-spin" />
                      Đang upload ảnh...
                    </p>
                  )}
                  {form.watch("imageUrl") && (
                    <div className="mt-3">
                      <Label className="text-sm text-gray-600 mb-2 block">
                        Preview:
                      </Label>
                      <Image
                        src={form.watch("imageUrl")!}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createFood.isPending || updateFood.isPending}
                  >
                    {editing._id ? "💾 Cập nhật" : "✨ Tạo món"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setEditing({});
                    }}
                  >
                    🔄 Reset
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
