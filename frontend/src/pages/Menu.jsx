import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  Coffee,
  Cookie,
  Utensils,
  Pizza,
  X,
  Pencil,
  Trash2,
  Check,
  IceCream,
  Sandwich,
  Soup,
  Wine,
  Cake,
  Apple,
  Upload,
  ChevronDown,
  FileText,
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from "../api/axios";

const iconMap = {
  Coffee,
  Cookie,
  Utensils,
  Pizza,
  IceCream,
  Sandwich,
  Soup,
  Wine,
  Cake,
  Apple,
};

// Available icons for categories
const availableIcons = [
  { name: "Coffee", icon: Coffee },
  { name: "Pizza", icon: Pizza },
  { name: "Utensils", icon: Utensils },
  { name: "Cookie", icon: Cookie },
  { name: "IceCream", icon: IceCream },
  { name: "Sandwich", icon: Sandwich },
  { name: "Soup", icon: Soup },
  { name: "Wine", icon: Wine },
  { name: "Cake", icon: Cake },
  { name: "Apple", icon: Apple },
];

const getIconComponent = (iconName) => iconMap[iconName] || Coffee;

// Group backend products into UI "items" with multiple sizes
function groupProducts(rawProducts, categoriesById) {
  const groups = {};

  rawProducts.forEach((p) => {
    const category = categoriesById[p.category_id];
    if (!category) return;

    // baseName: everything before last " (" to allow "Tea (Small)", "Tea (Medium)" grouping
    let baseName = p.name;
    const match = p.name.match(/^(.*)\s\(([^)]+)\)$/);
    const sizeLabel = match ? match[2] : "Regular";
    if (match) baseName = match[1];

    const key = `${category.id}:${baseName}`;
    if (!groups[key]) {
      groups[key] = {
        baseName,
        categoryId: category.id,
        categoryName: category.name,
        sizes: [],
        ingredients: p.ingredients || [],
        imageUrl: p.image_url,
        food_type: p.food_type || 'veg',
        is_time_restricted: p.is_time_restricted || false,
        available_from: p.available_from || "00:00",
        available_to: p.available_to || "23:59",
      };
    }
    groups[key].sizes.push({
      productId: p.id,
      size: sizeLabel,
      price: p.price,
      sku: p.sku,
    });
  });

  return Object.values(groups);
}

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesById, setCategoriesById] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [rawProducts, setRawProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [foodTypeFilter, setFoodTypeFilter] = useState("all");

  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = React.useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    if (isExportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportOpen]);
  const [newCategoryIcon, setNewCategoryIcon] = useState("Coffee");

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    baseName: "",
    sizes: [{ size: "Regular", price: "" }],
    ingredients: [],
    imageUrl: null,
    food_type: "veg",
    is_time_restricted: false,
    available_from: "00:00",
    available_to: "23:59",
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);

  const [editingProductGroup, setEditingProductGroup] = useState(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  // CSV Upload States
  const [showCSVUploadModal, setShowCSVUploadModal] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const fileInputRef = React.useRef(null);

  const [recentEdits, setRecentEdits] = useState(() => {
    try {
      const stored = localStorage.getItem("menu_recent_edits");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showAllEditsModal, setShowAllEditsModal] = useState(false);

  // Tax state
  const taxOptions = [0, 5, 12, 18, 28];
  const [selectedTax, setSelectedTax] = useState(5);

  // CONSTANTS for Sizes
  const AVAILABLE_SIZES = [
    "Regular",
    "Medium",
    "Small",
    "Large",
    "Special",
    "Custom"
  ];

  // NEW STATE FOR DISH LIBRARY
  const [dishTemplates, setDishTemplates] = useState([]);
  const [showDishLibrary, setShowDishLibrary] = useState(false);

  // NEW STATE FOR AUTOCOMPLETE
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredDishes, setFilteredDishes] = useState([]);

  // NEW STATE FOR IMAGE UPLOAD
  const [uploadingImage, setUploadingImage] = useState(false);

  const [loading, setLoading] = useState(true);

  const [allIngredients, setAllIngredients] = useState([]);

  // Load categories, products, and ingredients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes, ingRes] = await Promise.all([
          api.get("/categories", { params: { skip: 0, limit: 100 } }),
          api.get("/products", { params: { skip: 0, limit: 100 } }),
          api.get("/ingredients", { params: { skip: 0, limit: 100 } }),
        ]);

        const catData = catRes.data.data || [];
        setCategories(catData);
        const byId = {};
        catData.forEach((c) => {
          byId[c.id] = c;
        });
        setCategoriesById(byId);

        if (catData.length > 0) {
          setSelectedCategoryId(catData[0].id);
        }

        const prodData = prodRes.data.data || [];
        setRawProducts(prodData);
        
        setAllIngredients(ingRes.data || []);
      } catch (err) {
        console.error("LOAD MENU DATA ERROR:", err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // LOAD DISH TEMPLATES WHEN NEW PRODUCT MODAL OPENS
  useEffect(() => {
    if (!showNewProductModal) return;
    (async () => {
      try {
        const res = await api.get("/upload/dish-library");
        setDishTemplates(res.data);
      } catch (err) {
        console.error("LOAD DISH LIBRARY ERROR:", err?.response?.data || err);
      }
    })();
  }, [showNewProductModal]);

  // LOAD DISH TEMPLATES WHEN LIBRARY OPENS
  useEffect(() => {
    if (!showDishLibrary) return;
    (async () => {
      try {
        const res = await api.get("/upload/dish-library");
        setDishTemplates(res.data);
      } catch (err) {
        console.error("LOAD DISH LIBRARY ERROR:", err?.response?.data || err);
        alert("Failed to load dish library images");
      }
    })();
  }, [showDishLibrary]);

  // FILTER DISHES BASED ON PRODUCT NAME INPUT - UPDATED TO ALWAYS SHOW IF MATCHES
  useEffect(() => {
    if (newProductData.baseName.trim().length > 0 && dishTemplates.length > 0) {
      const searchTerm = newProductData.baseName.toLowerCase();
      const matches = dishTemplates.filter((dish) =>
        dish.name.toLowerCase().includes(searchTerm)
      );
      setFilteredDishes(matches);
      // Always show autocomplete if there are matches, regardless of previous selections
      setShowAutocomplete(matches.length > 0);
    } else {
      setFilteredDishes([]);
      setShowAutocomplete(false);
    }
  }, [newProductData.baseName, dishTemplates]);

  const groupedProducts = useMemo(
    () => groupProducts(rawProducts, categoriesById),
    [rawProducts, categoriesById]
  );

  const filteredGroups = useMemo(() => {
    let list = groupedProducts.filter((g) => g.categoryId === selectedCategoryId);

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((g) => g.baseName.toLowerCase().includes(s));
    }

    if (foodTypeFilter !== "all") {
      list = list.filter((g) => g.food_type === foodTypeFilter);
    }

    if (sortBy === "name") {
      list.sort((a, b) => a.baseName.localeCompare(b.baseName));
    } else if (sortBy === "price-low") {
      list.sort((a, b) => {
        const minA = Math.min(...a.sizes.map((s) => s.price));
        const minB = Math.min(...b.sizes.map((s) => s.price));
        return minA - minB;
      });
    } else if (sortBy === "price-high") {
      list.sort((a, b) => {
        const maxA = Math.max(...a.sizes.map((s) => s.price));
        const maxB = Math.max(...b.sizes.map((s) => s.price));
        return maxB - maxA;
      });
    }

    return list;
  }, [groupedProducts, selectedCategoryId, searchTerm, sortBy, foodTypeFilter]);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const addRecentEdit = (action) => {
    setRecentEdits((prev) => {
      const updated = [
        { action, time: new Date().toISOString() },
        ...prev,
      ].slice(0, 20);
      try {
        localStorage.setItem("menu_recent_edits", JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const handleExportExcel = () => {
    const data = [];
    Object.values(categoriesById).forEach((category) => {
      const categoryProducts = rawProducts.filter(
        (p) => p.category_id === category.id
      );
      categoryProducts.forEach((product) => {
        const match = product.name.match(/^(.*)\s\(([^)]+)\)$/);
        const baseName = match ? match[1] : product.name;
        const size = match ? match[2] : "Regular";
        data.push({
          'Category': category.name,
          'Product Name': baseName,
          'Size': size,
          'Price': product.price,
          'SKU': product.sku || '-'
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MenuData');
    XLSX.writeFile(wb, `menu_export_${new Date().toISOString().split("T")[0]}.xlsx`);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text('VayuPOS - Restaurant Menu', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Category", "Product", "Size", "Price"];
    const tableRows = [];

    Object.values(categoriesById).forEach((category) => {
      const categoryProducts = rawProducts.filter(
        (p) => p.category_id === category.id
      );
      categoryProducts.forEach((product) => {
        const match = product.name.match(/^(.*)\s\(([^)]+)\)$/);
        const baseName = match ? match[1] : product.name;
        const size = match ? match[2] : "Regular";
        tableRows.push([category.name, baseName, size, `Rs. ${product.price}`]);
      });
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      margin: { top: 40 },
    });

    doc.save(`menu_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExportOpen(false);
  };

  // HANDLE IMAGE UPLOAD - UPDATED
  const handleImageUpload = async (event, isEditMode = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Pass dish name so the file gets a meaningful name in S3
      const dishName = isEditMode
        ? editingProductGroup?.baseName
        : newProductData.baseName;
      if (dishName) {
        formData.append("dish_name", dishName);
      }

      console.log("📤 Uploading image:", file.name);

      const res = await api.post("/upload/image", formData, {
        headers: {
          // Let the browser auto-set Content-Type with the correct boundary
          // Do NOT set 'multipart/form-data' manually — it breaks parsing
          "Content-Type": undefined,
        },
        timeout: 60000, // 60s timeout for large files
      });

      console.log("✅ Upload response:", res.data);

      // Get the image URL (axios interceptor already made it absolute)
      const imageUrl = res.data.image_url || res.data.url;

      console.log("🖼️ Final image URL:", imageUrl);

      if (isEditMode) {
        setEditingProductGroup((prev) => ({
          ...prev,
          imageUrl: imageUrl,
        }));
      } else {
        setNewProductData((prev) => ({
          ...prev,
          imageUrl: imageUrl,
        }));
      }

      alert("Image uploaded successfully!");
    } catch (err) {
      console.error("❌ IMAGE UPLOAD ERROR:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      alert(`Failed to upload image: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("Please upload a CSV file");
      return;
    }

    setUploadingCSV(true);
    setCsvResult(null);
    setShowCSVUploadModal(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/products/csv-upload", formData, {
        headers: {
          "Content-Type": undefined,
        }
      });

      setCsvResult(res.data);
      if (res.data.success_count > 0) {
        // Refresh products
        const prodRes = await api.get("/products", { params: { skip: 0, limit: 100 } });
        setRawProducts(prodRes.data.data || []);
        addRecentEdit(`Imported ${res.data.success_count} products via CSV`);
      }
    } catch (err) {
      console.error("❌ CSV UPLOAD ERROR:", err);
      alert(`Failed to upload CSV: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
      setShowCSVUploadModal(false);
    } finally {
      setUploadingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // HANDLE DISH SELECTION FROM AUTOCOMPLETE - UPDATED TO NOT CLOSE DROPDOWN
  const handleSelectDishFromAutocomplete = (dish) => {
    setNewProductData({
      ...newProductData,
      baseName: dish.name,
      imageUrl: dish.image_url,
    });
    // Don't close autocomplete - let it naturally close/reopen based on user input
    // setShowAutocomplete(false); // REMOVED THIS LINE
  };

  // CATEGORY ACTIONS
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter category name");
      return;
    }
    try {
      const res = await api.post("/categories", {
        name: newCategoryName,
        description: newCategoryDescription || null,
        icon_name: newCategoryIcon,
      });
      const created = res.data;
      setCategories((prev) => [...prev, created]);
      setCategoriesById((prev) => ({ ...prev, [created.id]: created }));
      setSelectedCategoryId(created.id);
      addRecentEdit(`Added category: ${created.name}`);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryIcon("Coffee");
      setShowNewCategoryModal(false);
      alert("Category added successfully!");
    } catch (err) {
      console.error("ADD CATEGORY ERROR:", err?.response?.data || err);
      alert("Failed to add category");
    }
  };

  const handleAddCategoryFromSearch = async () => {
    if (!categorySearchTerm.trim()) {
      alert("Please enter a category name");
      return;
    }

    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === categorySearchTerm.toLowerCase()
    );
    if (exists) {
      alert("Category already exists!");
      return;
    }

    try {
      const res = await api.post("/categories", {
        name: categorySearchTerm,
        description: null,
        icon_name: "Coffee",
      });
      const created = res.data;
      setCategories((prev) => [...prev, created]);
      setCategoriesById((prev) => ({ ...prev, [created.id]: created }));
      setSelectedCategoryId(created.id);
      addRecentEdit(`Added category: ${created.name}`);
      setCategorySearchTerm("");
      alert(`Category "${created.name}" added successfully!`);
    } catch (err) {
      console.error("ADD CATEGORY ERROR:", err?.response?.data || err);
      alert("Failed to add category");
    }
  };

  const handleEditCategoryClick = (cat) => {
    setEditingCategory({
      ...cat,
      originalName: cat.name,
      icon_name: cat.icon_name || "Coffee",
    });
    setShowEditCategoryModal(true);
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategory || !editingCategory.name?.trim()) {
      alert("Name is required");
      return;
    }
    try {
      const { id, name, description, is_active, icon_name } = editingCategory;
      const res = await api.put(`/categories/${id}`, {
        name,
        description,
        is_active,
        icon_name: icon_name || "Coffee",
      });
      const updated = res.data;
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setCategoriesById((prev) => ({ ...prev, [id]: updated }));
      addRecentEdit(`Updated category: ${name}`);
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      alert("Changes saved successfully!");
    } catch (err) {
      console.error("UPDATE CATEGORY ERROR:", err?.response?.data || err);
      alert("Failed to update category");
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setCategoriesById((prev) => {
        const copy = { ...prev };
        delete copy[cat.id];
        return copy;
      });
      setRawProducts((prev) => prev.filter((p) => p.category_id !== cat.id));
      addRecentEdit(`Deleted category: ${cat.name}`);
      if (selectedCategoryId === cat.id) {
        const remainingCats = categories.filter((c) => c.id !== cat.id);
        setSelectedCategoryId(remainingCats[0]?.id || null);
      }
    } catch (err) {
      console.error("DELETE CATEGORY ERROR:", err?.response?.data || err);
      alert("Failed to delete category");
    }
  };

  // PRODUCT / SIZE ACTIONS
  const handleAddNewIngredientRow = () => {
    setNewProductData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_id: "", quantity: "" }],
    }));
  };

  const handleDeleteNewIngredientRow = (idx) => {
    setNewProductData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };
  const handleAddProduct = async () => {
    if (!selectedCategoryId) {
      alert("Select a category first");
      return;
    }
    const currentCategory = categoriesById[selectedCategoryId];
    if (currentCategory && !currentCategory.is_active) {
      alert(`Category "${currentCategory.name}" is Inactive. Please activate it first to add products.`);
      return;
    }

    const baseName = newProductData.baseName.trim();
    const incompleteSizes = newProductData.sizes.filter(
      (s) => s.size.trim() && !s.price
    );
    if (incompleteSizes.length > 0) {
      alert("All entered sizes must have a price.");
      return;
    }

    const validSizes = newProductData.sizes.filter(
      (s) => s.size.trim() && s.price
    );
    if (!baseName || validSizes.length === 0) {
      alert("Enter product name and at least one size with a valid price");
      return;
    }

    const invalidIngredients = newProductData.ingredients.filter(
      (ing) => !ing.ingredient_id || !ing.quantity || Number(ing.quantity) <= 0
    );
    if (invalidIngredients.length > 0) {
      alert("All ingredients must have a valid selection and a positive quantity.");
      return;
    }

    try {
      const createdProducts = [];
      for (const s of validSizes) {
        const name = `${baseName} (${s.size})`;
        const body = {
          sku: `${baseName}-${s.size}`
            .toUpperCase()
            .replace(/\s+/g, "-")
            .slice(0, 50),
          name,
          description: null,
          barcode: null,
          price: Number(s.price),
          cost_price: null,
          min_stock_level: 0,
          category_id: selectedCategoryId,
          image_url: newProductData.imageUrl || null,
          stock_quantity: 0,
          ingredients: newProductData.ingredients, // NEW
          food_type: newProductData.food_type,
          is_time_restricted: newProductData.is_time_restricted,
          available_from: newProductData.available_from || null,
          available_to: newProductData.available_to || null,
        };
        const res = await api.post("/products", body);
        createdProducts.push(res.data);
      }
      setRawProducts((prev) => [...prev, ...createdProducts]);
      addRecentEdit(`Added product: ${baseName} (${validSizes.length} sizes)`);
      setNewProductData({
        baseName: "",
        sizes: [{ size: "Regular", price: "" }],
        ingredients: [],
        imageUrl: null,
        food_type: "veg",
      });
      setShowNewProductModal(false);
      setShowAutocomplete(false);
      alert("Product added successfully!");
    } catch (err) {
      console.error("ADD PRODUCT ERROR:", err?.response?.data || err);
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err.message || "Unknown error";
      alert(`Failed to add product(s): ${errorMsg}`);
    }
  };

  const handleEditProduct = (group) => {
    setEditingProductGroup({
      ...group,
      sizes: group.sizes.map((s) => ({ ...s })),
      ingredients: (group.ingredients || []).map((i) => ({ ...i })),
      is_time_restricted: group.is_time_restricted,
      available_from: group.available_from ? group.available_from.slice(0, 5) : "00:00",
      available_to: group.available_to ? group.available_to.slice(0, 5) : "23:59",
    });
    setEditingRowIndex(null);
    setShowEditProductModal(true);
  };

  const handleAddNewEditIngredientRow = () => {
    setEditingProductGroup((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_id: "", quantity: "" }],
    }));
  };

  const handleDeleteEditIngredientRow = (idx) => {
    setEditingProductGroup((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveEditProduct = async () => {
    if (!editingProductGroup) return;
    const validSizes = editingProductGroup.sizes.filter(
      (s) => s.size.trim() && s.price
    );
    const incompleteSizes = editingProductGroup.sizes.filter(
      (s) => s.size.trim() && !s.price
    );
    if (incompleteSizes.length > 0) {
      alert("All sizes must have a valid price.");
      return;
    }

    if (validSizes.length === 0) {
      alert("Need at least one size with price");
      return;
    }

    const invalidIngredients = editingProductGroup.ingredients.filter(
      (ing) => !ing.ingredient_id || !ing.quantity || Number(ing.quantity) <= 0
    );
    if (invalidIngredients.length > 0) {
      alert("All ingredients must have a valid selection and a positive quantity.");
      return;
    }

    try {
      const updatedProducts = [];
      const createdProducts = [];

      for (const s of validSizes) {
        const name = `${editingProductGroup.baseName} (${s.size})`;

        if (s.productId) {
          const body = {
            name,
            price: Number(s.price),
            ingredients: editingProductGroup.ingredients, // NEW
            food_type: editingProductGroup.food_type,
            is_time_restricted: editingProductGroup.is_time_restricted,
            available_from: editingProductGroup.available_from || null,
            available_to: editingProductGroup.available_to || null,
          };
          const res = await api.put(`/products/${s.productId}`, body);
          updatedProducts.push(res.data);
        } else {
          const body = {
            sku: `${editingProductGroup.baseName}-${s.size}`
              .toUpperCase()
              .replace(/\s+/g, "-")
              .slice(0, 50),
            name,
            description: null,
            barcode: null,
            price: Number(s.price),
            cost_price: null,
            min_stock_level: 0,
            category_id: editingProductGroup.categoryId,
            image_url: editingProductGroup.imageUrl || null,
            stock_quantity: 0,
            ingredients: editingProductGroup.ingredients, // NEW
            food_type: editingProductGroup.food_type,
            is_time_restricted: editingProductGroup.is_time_restricted,
            available_from: editingProductGroup.available_from || null,
            available_to: editingProductGroup.available_to || null,
          };
          const res = await api.post("/products", body);
          createdProducts.push(res.data);
        }
      }

      setRawProducts((prev) => {
        const filtered = prev.map((p) => {
          const found = updatedProducts.find((u) => u.id === p.id);
          return found || p;
        });
        return [...filtered, ...createdProducts];
      });

      addRecentEdit(`Updated product: ${editingProductGroup.baseName}`);
      setShowEditProductModal(false);
      setEditingProductGroup(null);
      setEditingRowIndex(null);
      alert("Changes saved successfully!");
    } catch (err) {
      console.error("UPDATE PRODUCT ERROR:", err?.response?.data || err);
      alert("Failed to update product");
    }
  };

  const handleDeleteProductSize = async (sizeItem) => {
    if (
      !window.confirm(
        `Delete size "${sizeItem.size}" of ${editingProductGroup.baseName}?`
      )
    )
      return;
    try {
      await api.delete(`/products/${sizeItem.productId}`);
      setRawProducts((prev) =>
        prev.filter((p) => p.id !== sizeItem.productId)
      );
      setEditingProductGroup((prev) => ({
        ...prev,
        sizes: prev.sizes.filter((s) => s.productId !== sizeItem.productId),
      }));
      addRecentEdit(
        `Deleted size ${sizeItem.size} of ${editingProductGroup.baseName}`
      );
    } catch (err) {
      console.error("DELETE PRODUCT ERROR:", err?.response?.data || err);
      alert("Failed to delete size/product");
    }
  };

  const handleDeleteWholeProductGroup = async (group) => {
    if (!window.confirm(`Delete all sizes of product "${group.baseName}"?`))
      return;
    try {
      for (const s of group.sizes) {
        await api.delete(`/products/${s.productId}`);
      }
      setRawProducts((prev) =>
        prev.filter((p) => !group.sizes.some((s) => s.productId === p.id))
      );
      addRecentEdit(`Deleted product: ${group.baseName} (all sizes)`);
    } catch (err) {
      console.error("DELETE GROUP ERROR:", err?.response?.data || err);
      alert("Failed to delete product group");
    }
  };

  const handleToggleEditRow = (index) => {
    if (editingRowIndex === index) {
      setEditingRowIndex(null);
    } else {
      setEditingRowIndex(index);
    }
  };

  const handleAddSizeRow = () => {
    if (editingProductGroup) {
      const newIndex = editingProductGroup.sizes.length;
      setEditingProductGroup({
        ...editingProductGroup,
        sizes: [
          ...editingProductGroup.sizes,
          { productId: null, size: "", price: "" },
        ],
      });
      setEditingRowIndex(newIndex);
    }
  };

  const handleDeleteSizeRow = (index) => {
    if (editingProductGroup.sizes.length > 1) {
      const sizeToDelete = editingProductGroup.sizes[index];
      if (sizeToDelete.productId) {
        handleDeleteProductSize(sizeToDelete);
      } else {
        const updatedSizes = editingProductGroup.sizes.filter(
          (_, idx) => idx !== index
        );
        setEditingProductGroup({
          ...editingProductGroup,
          sizes: updatedSizes,
        });
      }
      if (editingRowIndex === index) {
        setEditingRowIndex(null);
      }
    } else {
      alert("Product must have at least one size");
    }
  };

  const handleDeleteNewProductSizeRow = (index) => {
    if (newProductData.sizes.length > 1) {
      const updatedSizes = newProductData.sizes.filter((_, idx) => idx !== index);
      setNewProductData({
        ...newProductData,
        sizes: updatedSizes,
      });
    } else {
      alert("Product must have at least one size");
    }
  };

  const formatTimeAgo = (date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground animate-pulse font-medium">Preparing your menu...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl font-semibold">Menu Categories</h1>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white transition-colors px-3 sm:px-4 py-2 rounded-lg text-sm border-none"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <div className="relative flex-1 sm:flex-none" ref={exportRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white transition-colors px-3 sm:px-4 py-2 rounded-lg text-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-1">
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors border-none bg-transparent"
                  >
                    <FileText size={16} className="text-red-500" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full  flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors border-none bg-transparent"
                  >
                    <Download size={16} className="text-green-500" />
                    <span>Export as Excel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowNewCategoryModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white transition-colors px-3 sm:px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Category</span>
          </button>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">
          Categories
        </h2>

        {/* Category Search */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Search categories (or add custom)
          </p>
          <div className="relative">
            <Search
              className="text-foreground absolute left-3 top-1/2 transform -translate-y-1/2"
              size={16}
            />
            <input
              type="text"
              placeholder="Type to search or add new category..."
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddCategoryFromSearch();
                }
              }}
              className="w-full bg-muted text-foreground border-none outline-none pl-10 pr-16 py-2 sm:py-2.5 rounded-lg text-sm"
            />
            <button
              onClick={handleAddCategoryFromSearch}
              className="text-teal-500 font-medium bg-transparent border-none cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-sm hover:text-teal-600 transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredCategories.map((cat) => {
            const Icon = getIconComponent(cat.icon_name || "Coffee");
            const isSelected = selectedCategoryId === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-all p-4 ${!cat.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
                style={{
                  border: isSelected
                    ? "2px solid #1ABC9C"
                    : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`${cat.is_active ? 'text-teal-500' : 'text-muted-foreground'}`} size={18} />
                  <h3 className="text-foreground font-semibold text-sm sm:text-base flex-1">
                    {cat.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategoryClick(cat);
                    }}
                    className="text-teal-500 hover:text-teal-600 transition-colors p-1"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tight ${cat.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    className="border border-red-500/30 text-red-500 bg-transparent hover:bg-red-500 hover:text-white transition-all px-2.5 sm:px-3 py-1 text-xs rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No categories found matching "{categorySearchTerm}"
          </div>
        )}
      </div>{/* Products for selected category */}
      <div className="bg-card border border-border rounded-xl mb-4 sm:mb-6">
        <div className="border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">
            Category:{" "}
            {categoriesById[selectedCategoryId]?.name || "Select a category"}
          </h2>
          <button
            onClick={() => {
              const cat = categoriesById[selectedCategoryId];
              if (cat && !cat.is_active) {
                alert(`Cannot add products to Inactive category "${cat.name}". Please activate it first.`);
                return;
              }
              setShowNewProductModal(true);
            }}
            disabled={categoriesById[selectedCategoryId]?.is_active === false}
            className={`flex items-center gap-2 transition-colors px-3 sm:px-4 py-2 rounded-lg text-sm w-full sm:w-auto justify-center ${categoriesById[selectedCategoryId]?.is_active === false
              ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
              : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {/* search + sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Product search
              </p>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search in ${categoriesById[selectedCategoryId]?.name || "category"
                  }`}
                className="w-full bg-muted text-foreground border-none outline-none px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Sort
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-muted text-foreground border-none outline-none cursor-pointer px-3 py-2 rounded-lg text-sm"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Food Type
              </p>
              <select
                value={foodTypeFilter}
                onChange={(e) => setFoodTypeFilter(e.target.value)}
                className="w-full bg-muted text-foreground border-none outline-none cursor-pointer px-3 py-2 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="veg">Veg</option>
                <option value="non_veg">Non-Veg</option>
                <option value="egg">Egg</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Tax
              </p>
              <select
                value={selectedTax}
                onChange={(e) => setSelectedTax(Number(e.target.value))}
                className="w-full bg-secondary text-foreground text-center font-medium border-none outline-none cursor-pointer px-3 py-2 rounded-lg text-sm"
              >
                {taxOptions.map(tax => (
                  <option key={tax} value={tax}>GST {tax}%</option>
                ))}
              </select>
            </div>
          </div>

          {/* grouped products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredGroups.map((g) => (
              <div
                key={`${g.categoryId}:${g.baseName}`}
                className="bg-muted border border-border rounded-lg p-4"
              >
                {g.imageUrl && (
                  <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-3">
                    <img
                      src={g.imageUrl}
                      alt={g.baseName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-foreground font-medium mb-3 text-sm sm:text-base flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 border ${
                    g.food_type === 'non_veg' ? 'bg-red-500 border-red-700' : 
                    g.food_type === 'egg' ? 'bg-yellow-500 border-yellow-700' : 
                    'bg-green-500 border-green-700'
                  }`} title={g.food_type}></span>
                  {g.baseName}
                </h3>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {g.sizes.map((s) => (
                    <div
                      key={s.productId}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-background text-foreground border border-border"
                    >
                      {s.size} ₹{s.price}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (categoriesById[selectedCategoryId]?.is_active === false) {
                        alert("Category is Inactive. Reactivate it to edit products.");
                        return;
                      }
                      handleEditProduct(g);
                    }}
                    disabled={categoriesById[selectedCategoryId]?.is_active === false}
                    className={`flex-1 border transition-all px-3 py-1.5 rounded text-xs ${categoriesById[selectedCategoryId]?.is_active === false
                      ? 'border-border text-muted-foreground cursor-not-allowed'
                      : 'border-teal-500 text-teal-500 bg-transparent hover:bg-teal-500 hover:text-white'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (categoriesById[selectedCategoryId]?.is_active === false) {
                        alert("Category is Inactive. Reactivate it to delete products.");
                        return;
                      }
                      handleDeleteWholeProductGroup(g);
                    }}
                    disabled={categoriesById[selectedCategoryId]?.is_active === false}
                    className={`flex-1 border transition-all px-3 py-1.5 rounded text-xs ${categoriesById[selectedCategoryId]?.is_active === false
                      ? 'border-border text-muted-foreground cursor-not-allowed'
                      : 'border-red-500/30 text-red-500 bg-transparent hover:bg-red-500 hover:text-white'}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredGroups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found in{" "}
              {categoriesById[selectedCategoryId]?.name || "this category"}
            </div>
          )}
        </div>
      </div>

      {/* Recent edits */}
      <div className="bg-card border border-border rounded-xl">
        <div className="border-b border-border p-4 sm:p-5 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">
            Recently Edited
          </h2>
          <button
            className="text-sm text-teal-500 hover:text-teal-400 font-medium transition-colors bg-transparent border-none p-0 cursor-pointer"
            onClick={() => setShowAllEditsModal(true)}
          >
            View All
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          {recentEdits.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent edits.</p>
          )}
          {recentEdits.slice(0, 5).map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-muted border border-border rounded-full px-4 py-3 flex-wrap gap-2"
            >
              <span className="text-foreground text-xs sm:text-sm">
                {e.action}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatTimeAgo(e.time)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ALL EDITS HISTORY MODAL */}
      {showAllEditsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-card-foreground">Edit History</h3>
              <button
                onClick={() => setShowAllEditsModal(false)}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {recentEdits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No edit history yet.</p>
              ) : (
                recentEdits.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-muted border border-border rounded-lg px-4 py-2.5 gap-2"
                  >
                    <span className="text-foreground text-xs sm:text-sm flex-1">{e.action}</span>
                    <span className="text-muted-foreground text-xs flex-shrink-0">{formatTimeAgo(e.time)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-between items-center border-t border-border pt-4">
              <button
                onClick={() => {
                  setRecentEdits([]);
                  try { localStorage.removeItem("menu_recent_edits"); } catch { }
                }}
                className="text-xs text-red-500 hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors"
              >
                Clear History
              </button>
              <button
                onClick={() => setShowAllEditsModal(false)}
                className="bg-teal-600 hover:bg-teal-700 text-white border-none px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-card-foreground">
                Add New Category
              </h3>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Category Name*
                </label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Beverages"
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Description
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Category Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map((iconObj) => {
                    const IconComp = iconObj.icon;
                    const isSelected = newCategoryIcon === iconObj.name;
                    return (
                      <button
                        key={iconObj.name}
                        onClick={() => setNewCategoryIcon(iconObj.name)}
                        className={`p-3 rounded-lg border-2 transition-all ${isSelected
                          ? "border-teal-500 bg-teal-500/20"
                          : "border-border bg-muted hover:bg-teal-500/10 hover:border-teal-400"
                          }`}
                      >
                        <IconComp
                          size={20}
                          className={`mx-auto transition-colors ${isSelected ? "text-teal-600" : "text-foreground"
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewCategoryModal(false)}
                  className="flex-1 bg-muted border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors border-none px-4 py-2.5 rounded-lg text-sm"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {showEditCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-card-foreground">
                Edit Category
              </h3>
              <button
                onClick={() => {
                  setShowEditCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Category Name*
                </label>
                <input
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Description
                </label>
                <textarea
                  value={editingCategory.description || ""}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Category Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableIcons.map((iconObj) => {
                    const IconComp = iconObj.icon;
                    const isSelected = editingCategory.icon_name === iconObj.name;
                    return (
                      <button
                        key={iconObj.name}
                        onClick={() =>
                          setEditingCategory({
                            ...editingCategory,
                            icon_name: iconObj.name,
                          })
                        }
                        className={`p-3 rounded-lg border-2 transition-all ${isSelected
                          ? "border-teal-500 bg-teal-500/20"
                          : "border-border bg-muted hover:bg-teal-500/10 hover:border-teal-400"
                          }`}
                      >
                        <IconComp
                          size={20}
                          className={`mx-auto transition-colors ${isSelected ? "text-teal-600" : "text-foreground"
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingCategory.is_active}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      is_active: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 bg-muted border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditCategory}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors border-none px-4 py-2.5 rounded-lg text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW PRODUCT MODAL WITH AUTOCOMPLETE AND IMAGE UPLOAD */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-card-foreground">
                Add New Product
              </h3>
              <button
                onClick={() => {
                  setShowNewProductModal(false);
                  setNewProductData({
                    baseName: "",
                    sizes: [{ size: "Regular", price: "" }],
                    imageUrl: null,
                  });
                  setShowAutocomplete(false);
                }}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Image Options Section */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide block">
                  Product Image
                </label>

                {/* BUTTON TO OPEN DISH LIBRARY */}
                <button
                  type="button"
                  onClick={() => setShowDishLibrary(true)}
                  className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Pizza size={16} />
                  Choose from Dish Library
                </button>

                {/* UPLOAD IMAGE BUTTON */}
                <label className="w-full px-3 py-2 bg-muted border border-border text-foreground hover:bg-secondary transition-colors rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={16} />
                  {uploadingImage ? "Uploading..." : "Upload Image from Computer"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Show selected dish image preview */}
              {newProductData.imageUrl && (
                <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={newProductData.imageUrl}
                    alt="Selected dish"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() =>
                      setNewProductData({ ...newProductData, imageUrl: null })
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Product Name Input with Autocomplete */}
              <div className="relative">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Product Name*
                </label>
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProductData.baseName}
                  onChange={(e) =>
                    setNewProductData({
                      ...newProductData,
                      baseName: e.target.value,
                    })
                  }
                  className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
                />

                <div className="mb-4 mt-4">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                    Food Type*
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="food_type"
                        value="veg"
                        checked={newProductData.food_type === "veg"}
                        onChange={(e) => setNewProductData({...newProductData, food_type: e.target.value})}
                        className="accent-teal-600"
                      />
                      <span className="text-sm text-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Veg
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="food_type"
                        value="non_veg"
                        checked={newProductData.food_type === "non_veg"}
                        onChange={(e) => setNewProductData({...newProductData, food_type: e.target.value})}
                        className="accent-teal-600"
                      />
                      <span className="text-sm text-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Non-Veg
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="food_type"
                        value="egg"
                        checked={newProductData.food_type === "egg"}
                        onChange={(e) => setNewProductData({...newProductData, food_type: e.target.value})}
                        className="accent-teal-600"
                      />
                      <span className="text-sm text-foreground flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Egg
                      </span>
                    </label>
                  </div>
                </div>

                {/* Autocomplete Dropdown */}
                {showAutocomplete && filteredDishes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredDishes.map((dish) => (
                      <button
                        key={dish.id}
                        onClick={() => handleSelectDishFromAutocomplete(dish)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
                      >
                        {dish.image_url && (
                          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {dish.name}
                          </p>
                          {dish.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Sizes & Prices*
                  </label>
                  <button
                    onClick={() =>
                      setNewProductData({
                        ...newProductData,
                        sizes: [
                          ...newProductData.sizes,
                          { size: "", price: "" },
                        ],
                      })
                    }
                    className="text-teal-500 hover:text-teal-600 transition-colors p-1"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {newProductData.sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-3">
                    {s.size === "Custom" || (s.size !== "" && !AVAILABLE_SIZES.includes(s.size)) ? (
                      <div className="flex-1 flex gap-2">
                        <select
                          value="Custom"
                          onChange={(e) => {
                            const copy = [...newProductData.sizes];
                            if (e.target.value !== "Custom") {
                              copy[idx].size = e.target.value;
                            }
                            setNewProductData({ ...newProductData, sizes: copy });
                          }}
                          className="w-[100px] bg-muted text-foreground border border-border rounded-lg px-2 py-2 text-sm outline-none"
                        >
                          {AVAILABLE_SIZES.map(sizeOption => (
                            <option key={sizeOption} value={sizeOption}>{sizeOption}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Custom size name"
                          value={s.size === "Custom" ? "" : s.size}
                          onChange={(e) => {
                            const copy = [...newProductData.sizes];
                            copy[idx].size = e.target.value;
                            setNewProductData({ ...newProductData, sizes: copy });
                          }}
                          className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    ) : (
                      <select
                        value={s.size || "Regular"}
                        onChange={(e) => {
                          const copy = [...newProductData.sizes];
                          copy[idx].size = e.target.value;
                          setNewProductData({ ...newProductData, sizes: copy });
                        }}
                        className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                      >
                        <option value="" disabled>Select Size</option>
                        {AVAILABLE_SIZES.map(sizeOption => (
                          <option key={sizeOption} value={sizeOption}>{sizeOption}</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="number"
                      placeholder="Price"
                      value={s.price}
                      onChange={(e) => {
                        const copy = [...newProductData.sizes];
                        copy[idx].price = e.target.value;
                        setNewProductData({ ...newProductData, sizes: copy });
                      }}
                      className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => handleDeleteNewProductSizeRow(idx)}
                      className="text-red-500 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* NEW INGREDIENTS SECTION */}
              <div className="mb-5 bg-background p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-card-foreground">
                    Ingredients (Recipe)
                  </h4>
                  <button
                    onClick={handleAddNewIngredientRow}
                    className="text-teal-500 hover:text-teal-400 p-1 bg-teal-500/10 rounded-lg transition-colors"
                    title="Add Ingredient"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {newProductData.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-3">
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) => {
                        const copy = [...newProductData.ingredients];
                        copy[idx].ingredient_id = e.target.value;
                        setNewProductData({ ...newProductData, ingredients: copy });
                      }}
                      className="flex-[2] bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      <option value="" disabled>Select Ingredient</option>
                      {allIngredients.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => {
                        const copy = [...newProductData.ingredients];
                        copy[idx].quantity = e.target.value;
                        setNewProductData({ ...newProductData, ingredients: copy });
                      }}
                      className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => handleDeleteNewIngredientRow(idx)}
                      className="text-red-500 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {newProductData.ingredients.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No ingredients added.</p>
                )}
              </div>

              {/* TIME RESTRICTION SECTION */}
              <div className="mb-5 bg-background p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_time_restricted_new"
                      checked={newProductData.is_time_restricted}
                      onChange={(e) => setNewProductData({ ...newProductData, is_time_restricted: e.target.checked })}
                      className="w-4 h-4 accent-teal-600"
                    />
                    <label htmlFor="is_time_restricted_new" className="text-sm font-semibold text-card-foreground cursor-pointer">
                      Time Restricted Availability
                    </label>
                  </div>
                </div>
                {newProductData.is_time_restricted && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                        Available From
                      </label>
                      <input
                        type="time"
                        value={newProductData.available_from}
                        onChange={(e) => setNewProductData({ ...newProductData, available_from: e.target.value })}
                        className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                        Available To
                      </label>
                      <input
                        type="time"
                        value={newProductData.available_to}
                        onChange={(e) => setNewProductData({ ...newProductData, available_to: e.target.value })}
                        className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                )}
                {!newProductData.is_time_restricted && (
                  <p className="text-xs text-muted-foreground italic">Available 24/7 (POS only shows active categories).</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewProductModal(false);
                    setNewProductData({
                      baseName: "",
                      sizes: [{ size: "Regular", price: "" }],
                      imageUrl: null,
                    });
                    setShowAutocomplete(false);
                  }}
                  className="flex-1 bg-muted border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={uploadingImage}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors border-none px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL WITH IMAGE UPLOAD */}
      {showEditProductModal && editingProductGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-card-foreground">
                Edit Product
              </h3>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProductGroup(null);
                  setEditingRowIndex(null);
                }}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Image Options Section */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-muted-foreground uppercase tracking-wide block">
                Product Image
              </label>

              <button
                type="button"
                onClick={() => setShowDishLibrary(true)}
                className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Pizza size={16} />
                Choose from Dish Library
              </button>

              <label className="w-full px-3 py-2 bg-muted border border-border text-foreground hover:bg-secondary transition-colors rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={16} />
                {uploadingImage ? "Uploading..." : "Upload Image from Computer"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {editingProductGroup.imageUrl && (
              <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-3">
                <img
                  src={editingProductGroup.imageUrl}
                  alt="Selected dish"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setEditingProductGroup({
                      ...editingProductGroup,
                      imageUrl: null,
                    })
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                Product Name*
              </label>
              <input
                type="text"
                placeholder="Product name"
                value={editingProductGroup.baseName}
                onChange={(e) =>
                  setEditingProductGroup({
                    ...editingProductGroup,
                    baseName: e.target.value,
                  })
                }
                className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
              />

              <div className="mb-4 mt-4">
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Food Type*
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_food_type"
                      value="veg"
                      checked={editingProductGroup.food_type === "veg"}
                      onChange={(e) => setEditingProductGroup({...editingProductGroup, food_type: e.target.value})}
                      className="accent-teal-600"
                    />
                    <span className="text-sm text-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Veg
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_food_type"
                      value="non_veg"
                      checked={editingProductGroup.food_type === "non_veg"}
                      onChange={(e) => setEditingProductGroup({...editingProductGroup, food_type: e.target.value})}
                      className="accent-teal-600"
                    />
                    <span className="text-sm text-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Non-Veg
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_food_type"
                      value="egg"
                      checked={editingProductGroup.food_type === "egg"}
                      onChange={(e) => setEditingProductGroup({...editingProductGroup, food_type: e.target.value})}
                      className="accent-teal-600"
                    />
                    <span className="text-sm text-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Egg
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Sizes & Prices
                </label>
                <button
                  onClick={handleAddSizeRow}
                  className="text-teal-500 hover:text-teal-600 transition-colors p-1"
                >
                  <Plus size={18} />
                </button>
              </div>
              {editingProductGroup.sizes.map((s, idx) => (
                <div key={idx} className="mb-3">
                  {editingRowIndex === idx ? (
                    <div className="flex items-center gap-2">
                      {s.size === "Custom" || (s.size !== "" && !AVAILABLE_SIZES.includes(s.size)) ? (
                        <div className="flex-1 flex gap-2">
                          <select
                            value="Custom"
                            onChange={(e) => {
                              const copy = [...editingProductGroup.sizes];
                              if (e.target.value !== "Custom") {
                                copy[idx].size = e.target.value;
                              }
                              setEditingProductGroup({ ...editingProductGroup, sizes: copy });
                            }}
                            className="w-[100px] bg-muted text-foreground border border-border rounded-lg px-2 py-2 text-sm outline-none"
                          >
                            {AVAILABLE_SIZES.map(sizeOption => (
                              <option key={sizeOption} value={sizeOption}>{sizeOption}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Custom size name"
                            value={s.size === "Custom" ? "" : s.size}
                            onChange={(e) => {
                              const copy = [...editingProductGroup.sizes];
                              copy[idx].size = e.target.value;
                              setEditingProductGroup({ ...editingProductGroup, sizes: copy });
                            }}
                            className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                          />
                        </div>
                      ) : (
                        <select
                          value={s.size || "Regular"}
                          onChange={(e) => {
                            const copy = [...editingProductGroup.sizes];
                            copy[idx].size = e.target.value;
                            setEditingProductGroup({ ...editingProductGroup, sizes: copy });
                          }}
                          className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          <option value="" disabled>Select Size</option>
                          {AVAILABLE_SIZES.map(sizeOption => (
                            <option key={sizeOption} value={sizeOption}>{sizeOption}</option>
                          ))}
                        </select>
                      )}
                      <input
                        type="number"
                        placeholder="Price"
                        value={s.price}
                        onChange={(e) => {
                          const copy = [...editingProductGroup.sizes];
                          copy[idx].price = e.target.value;
                          setEditingProductGroup({
                            ...editingProductGroup,
                            sizes: copy,
                          });
                        }}
                        className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                      />
                      <button
                        onClick={() => handleToggleEditRow(idx)}
                        className="text-green-500 hover:text-green-600 transition-colors p-1"
                        title="Done editing"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSizeRow(idx)}
                        className="text-red-500 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
                      <div className="flex-1">
                        <span className="text-foreground text-sm font-medium">
                          {s.size}
                        </span>
                        <span className="text-foreground text-sm ml-2">
                          ₹{s.price}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleEditRow(idx)}
                        className="text-teal-500 hover:text-teal-600 transition-colors p-1"
                        title="Edit this size"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSizeRow(idx)}
                        className="text-red-500 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* EDIT INGREDIENTS SECTION */}
            <div className="mb-5 bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-card-foreground">
                  Ingredients (Recipe)
                </h4>
                <button
                  onClick={handleAddNewEditIngredientRow}
                  className="text-teal-500 hover:text-teal-400 p-1 bg-teal-500/10 rounded-lg transition-colors"
                  title="Add Ingredient"
                >
                  <Plus size={18} />
                </button>
              </div>
              {editingProductGroup.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-3">
                  <select
                    value={ing.ingredient_id}
                    onChange={(e) => {
                      const copy = [...editingProductGroup.ingredients];
                      copy[idx].ingredient_id = e.target.value;
                      setEditingProductGroup({ ...editingProductGroup, ingredients: copy });
                    }}
                    className="flex-[2] bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="" disabled>Select Ingredient</option>
                    {allIngredients.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const copy = [...editingProductGroup.ingredients];
                      copy[idx].quantity = e.target.value;
                      setEditingProductGroup({ ...editingProductGroup, ingredients: copy });
                    }}
                    className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => handleDeleteEditIngredientRow(idx)}
                    className="text-red-500 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {editingProductGroup.ingredients.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No ingredients added.</p>
              )}
            </div>

            {/* EDIT TIME RESTRICTION SECTION */}
            <div className="mb-5 bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_time_restricted_edit"
                    checked={editingProductGroup.is_time_restricted}
                    onChange={(e) => setEditingProductGroup({ ...editingProductGroup, is_time_restricted: e.target.checked })}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <label htmlFor="is_time_restricted_edit" className="text-sm font-semibold text-card-foreground cursor-pointer">
                    Time Restricted Availability
                  </label>
                </div>
              </div>
              {editingProductGroup.is_time_restricted && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                      Available From
                    </label>
                    <input
                      type="time"
                      value={editingProductGroup.available_from}
                      onChange={(e) => setEditingProductGroup({ ...editingProductGroup, available_from: e.target.value })}
                      className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                      Available To
                    </label>
                    <input
                      type="time"
                      value={editingProductGroup.available_to}
                      onChange={(e) => setEditingProductGroup({ ...editingProductGroup, available_to: e.target.value })}
                      className="w-full bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditingProductGroup(null);
                  setEditingRowIndex(null);
                }}
                className="flex-1 bg-muted border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditProduct}
                disabled={uploadingImage}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colorsborder-none px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}{/* DISH LIBRARY MODAL */}
      {showDishLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                Select Dish
              </h3>
              <button
                onClick={() => setShowDishLibrary(false)}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {dishTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No dish library images available.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {dishTemplates.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => {
                      // Only update image, don't change the name
                      if (showNewProductModal) {
                        setNewProductData((prev) => ({
                          ...prev,
                          imageUrl: dish.image_url,
                        }));
                      }
                      if (showEditProductModal) {
                        setEditingProductGroup((prev) =>
                          prev
                            ? {
                              ...prev,
                              imageUrl: dish.image_url,
                            }
                            : prev
                        );
                      }
                      setShowDishLibrary(false);
                    }}
                    className="bg-muted border border-border rounded-lg overflow-hidden text-left hover:border-teal-500 transition-colors"
                  >
                    <div className="w-full h-24 bg-gray-200 overflow-hidden">
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {dish.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showCSVUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-card-foreground">CSV Import Results</h3>
              <button
                onClick={() => setShowCSVUploadModal(false)}
                className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {uploadingCSV ? (
              <div className="flex flex-col items-center py-12">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">Processing CSV file...</p>
              </div>
            ) : csvResult ? (
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-500">{csvResult.success_count}</p>
                    <p className="text-xs text-green-600 uppercase tracking-wide">Successfully Imported</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-500">{csvResult.failed_rows?.length || 0}</p>
                    <p className="text-xs text-red-600 uppercase tracking-wide">Failed Rows</p>
                  </div>
                </div>

                {csvResult.failed_rows && csvResult.failed_rows.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Error Details</h4>
                    <div className="space-y-2">
                      {csvResult.failed_rows.map((fail, i) => (
                        <div key={i} className="bg-muted p-3 rounded-lg text-xs border border-border">
                          <span className="font-bold text-red-500">Row {fail.row}:</span> {fail.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCSVUploadModal(false)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>);
};
export default Menu;/* TEST */
