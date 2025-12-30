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
} from "lucide-react";
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
  { name: 'Coffee', icon: Coffee },
  { name: 'Pizza', icon: Pizza },
  { name: 'Utensils', icon: Utensils },
  { name: 'Cookie', icon: Cookie },
  { name: 'IceCream', icon: IceCream },
  { name: 'Sandwich', icon: Sandwich },
  { name: 'Soup', icon: Soup },
  { name: 'Wine', icon: Wine },
  { name: 'Cake', icon: Cake },
  { name: 'Apple', icon: Apple },
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

  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Coffee");

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    baseName: "",
    sizes: [{ size: "Regular", price: "" }],
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);

  const [editingProductGroup, setEditingProductGroup] = useState(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  const [recentEdits, setRecentEdits] = useState([]);

  // Load categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get("/categories/", { params: { skip: 0, limit: 100 } }),
          api.get("/products", { params: { skip: 0, limit: 100 } }),
        ]);

        const catData = catRes.data.data || [];
        setCategories(catData);
        const byId = {};
        catData.forEach((c) => {
          byId[c.id] = c;
        });
        setCategoriesById(byId);

        setSelectedCategoryId(catData[0]?.id || null);

        const prodData = prodRes.data.data || [];
        setRawProducts(prodData);
      } catch (err) {
        console.error("LOAD MENU DATA ERROR:", err?.response?.data || err);
        alert("Failed to load menu data.");
      }
    };

    fetchData();
  }, []);

  const groupedProducts = useMemo(
    () => groupProducts(rawProducts, categoriesById),
    [rawProducts, categoriesById]
  );

  const filteredGroups = useMemo(() => {
    let list = groupedProducts.filter(
      (g) => g.categoryId === selectedCategoryId
    );

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((g) => g.baseName.toLowerCase().includes(s));
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
  }, [groupedProducts, selectedCategoryId, searchTerm, sortBy]);

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const addRecentEdit = (action) => {
    setRecentEdits((prev) => [
      { action, time: new Date() },
      ...prev.slice(0, 9),
    ]);
  };

  // Export functionality
  const handleExport = () => {
    const csvRows = [];
    csvRows.push(['Category', 'Product Name', 'Size', 'Price'].join(','));
    
    Object.values(categoriesById).forEach(category => {
      const categoryProducts = rawProducts.filter(p => p.category_id === category.id);
      categoryProducts.forEach(product => {
        const match = product.name.match(/^(.*)\s\(([^)]+)\)$/);
        const baseName = match ? match[1] : product.name;
        const size = match ? match[2] : "Regular";
        
        csvRows.push([
          `"${category.name}"`,
          `"${baseName}"`,
          `"${size}"`,
          product.price
        ].join(','));
      });
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `menu_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Menu exported successfully! CSV file downloaded.');
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
    
    const exists = categories.some(cat => cat.name.toLowerCase() === categorySearchTerm.toLowerCase());
    if (exists) {
      alert('Category already exists!');
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
      icon_name: cat.icon_name || "Coffee"
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
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
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
      setRawProducts((prev) =>
        prev.filter((p) => p.category_id !== cat.id)
      );
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
  const handleAddProduct = async () => {
    if (!selectedCategoryId) {
      alert("Select a category first");
      return;
    }
    const baseName = newProductData.baseName.trim();
    const validSizes = newProductData.sizes.filter(
      (s) => s.size.trim() && s.price
    );
    if (!baseName || validSizes.length === 0) {
      alert("Enter product name and at least one size with price");
      return;
    }

    try {
      const createdProducts = [];
      for (const s of validSizes) {
        const name = `${baseName} (${s.size})`;
        const body = {
          sku: `${baseName}-${s.size}`.toUpperCase().replace(/\s+/g, '-').slice(0, 50),
          name,
          description: null,
          barcode: null,
          price: Number(s.price),
          cost_price: null,
          min_stock_level: 0,
          category_id: selectedCategoryId,
          image_url: null,
          stock_quantity: 0,
        };
        const res = await api.post("/products", body);
        createdProducts.push(res.data);
      }
      setRawProducts((prev) => [...prev, ...createdProducts]);
      addRecentEdit(`Added product: ${baseName} (${validSizes.length} sizes)`);
      setNewProductData({ baseName: "", sizes: [{ size: "Regular", price: "" }] });
      setShowNewProductModal(false);
      alert("Product added successfully!");
    } catch (err) {
      console.error("ADD PRODUCT ERROR:", err?.response?.data || err);
      alert("Failed to add product(s)");
    }
  };

  const handleEditProduct = (group) => {
    setEditingProductGroup({
      ...group,
      sizes: group.sizes.map((s) => ({ ...s })),
    });
    setEditingRowIndex(null);
    setShowEditProductModal(true);
  };

  const handleSaveEditProduct = async () => {
    if (!editingProductGroup) return;
    const validSizes = editingProductGroup.sizes.filter(
      (s) => s.size.trim() && s.price
    );
    if (validSizes.length === 0) {
      alert("Need at least one size with price");
      return;
    }
    try {
      const updatedProducts = [];
      const createdProducts = [];
      
      // Separate existing products from new ones
      for (const s of validSizes) {
        const name = `${editingProductGroup.baseName} (${s.size})`;
        
        if (s.productId) {
          // Update existing product
          const body = {
            name,
            price: Number(s.price),
          };
          const res = await api.put(`/products/${s.productId}`, body);
          updatedProducts.push(res.data);
        } else {
          // Create new product
          const body = {
            sku: `${editingProductGroup.baseName}-${s.size}`.toUpperCase().replace(/\s+/g, '-').slice(0, 50),
            name,
            description: null,
            barcode: null,
            price: Number(s.price),
            cost_price: null,
            min_stock_level: 0,
            category_id: editingProductGroup.categoryId,
            image_url: null,
            stock_quantity: 0,
          };
          const res = await api.post("/products", body);
          createdProducts.push(res.data);
        }
      }
      
      // Update the products list
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
    if (
      !window.confirm(`Delete all sizes of product "${group.baseName}"?`)
    )
      return;
    try {
      for (const s of group.sizes) {
        await api.delete(`/products/${s.productId}`);
      }
      setRawProducts((prev) =>
        prev.filter(
          (p) => !group.sizes.some((s) => s.productId === p.id)
        )
      );
      addRecentEdit(`Deleted product: ${group.baseName} (all sizes)`);
    } catch (err) {
      console.error("DELETE GROUP ERROR:", err?.response?.data || err);
      alert("Failed to delete product group");
    }
  };

  // Toggle edit mode for a specific row
  const handleToggleEditRow = (index) => {
    if (editingRowIndex === index) {
      setEditingRowIndex(null);
    } else {
      setEditingRowIndex(index);
    }
  };

  // Add new size row in edit product modal
  const handleAddSizeRow = () => {
    if (editingProductGroup) {
      const newIndex = editingProductGroup.sizes.length;
      setEditingProductGroup({
        ...editingProductGroup,
        sizes: [...editingProductGroup.sizes, { productId: null, size: '', price: '' }]
      });
      setEditingRowIndex(newIndex);
    }
  };

  // Delete size row in edit product modal
  const handleDeleteSizeRow = (index) => {
    if (editingProductGroup.sizes.length > 1) {
      const sizeToDelete = editingProductGroup.sizes[index];
      if (sizeToDelete.productId) {
        handleDeleteProductSize(sizeToDelete);
      } else {
        const updatedSizes = editingProductGroup.sizes.filter((_, idx) => idx !== index);
        setEditingProductGroup({
          ...editingProductGroup,
          sizes: updatedSizes
        });
      }
      if (editingRowIndex === index) {
        setEditingRowIndex(null);
      }
    } else {
      alert('Product must have at least one size');
    }
  };

  // Delete size row in new product modal
  const handleDeleteNewProductSizeRow = (index) => {
    if (newProductData.sizes.length > 1) {
      const updatedSizes = newProductData.sizes.filter((_, idx) => idx !== index);
      setNewProductData({
        ...newProductData,
        sizes: updatedSizes
      });
    } else {
      alert('Product must have at least one size');
    }
  };

  // UI helpers
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

  if (!categories.length) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl font-semibold">Menu Categories</h1>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-card border border-teal-500 text-teal-500 hover:bg-muted transition-colors px-3 sm:px-4 py-2 rounded-lg text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
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
        <h2 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">Categories</h2>
        
        {/* Category Search */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Search categories (or add custom)</p>
          <div className="relative">
            <Search className="text-foreground absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
            <input
              type="text"
              placeholder="Type to search or add new category..."
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
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
                className="bg-muted rounded-lg cursor-pointer hover:bg-secondary transition-colors p-4"
                style={{ border: isSelected ? '1px solid #1ABC9C' : '1px solid transparent' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="text-foreground" size={18} />
                  <h3 className="text-foreground font-medium text-sm sm:text-base flex-1">{cat.name}</h3>
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
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {cat.is_active ? "Active" : "Inactive"}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    className="border border-red-500 text-red-500 bg-transparent hover:bg-red-50 transition-colors px-2 sm:px-3 py-1 text-xs rounded"
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
      </div>

      {/* Products for selected category */}
      <div className="bg-card border border-border rounded-xl mb-4 sm:mb-6">
        <div className="border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">
            Category:{" "}
            {categoriesById[selectedCategoryId]?.name || "Select a category"}
          </h2>
          <button
            onClick={() => setShowNewProductModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white transition-colors px-3 sm:px-4 py-2 rounded-lg text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {/* search + sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Product search</p>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search in ${categoriesById[selectedCategoryId]?.name || 'category'}`}
                className="w-full bg-muted text-foreground border-none outline-none px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sort</p>
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
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Tax</p>
              <div className="bg-secondary text-muted-foreground text-center font-medium px-3 py-2 rounded-lg text-sm">
                GST 5%
              </div>
            </div>
          </div>

          {/* grouped products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredGroups.map((g) => (
              <div key={`${g.categoryId}:${g.baseName}`} className="bg-muted border border-border rounded-lg p-4">
                <h3 className="text-foreground font-medium mb-3 text-sm sm:text-base">{g.baseName}</h3>
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
                    onClick={() => handleEditProduct(g)}
                    className="flex-1 border border-teal-500 text-teal-500 bg-transparent hover:bg-secondary transition-colors px-3 py-1.5 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWholeProductGroup(g)}
                    className="flex-1 border border-red-500 text-red-500 bg-transparent hover:bg-red-50 transition-colors px-3 py-1.5 rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredGroups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found in {categoriesById[selectedCategoryId]?.name || 'this category'}
            </div>
          )}
        </div>
      </div>

      {/* Recent edits */}
      <div className="bg-card border border-border rounded-xl"><div className="border-b border-border p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Recently Edited</h2>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          {recentEdits.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent edits.</p>
          )}
          {recentEdits.map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-muted border border-border rounded-full px-4 py-3 flex-wrap gap-2"
            >
              <span className="text-foreground text-xs sm:text-sm">{e.action}</span>
              <span className="text-muted-foreground text-xs">
                {formatTimeAgo(e.time)}
              </span>
            </div>
          ))}
        </div>
      </div>{/* NEW CATEGORY MODAL */}
  {showNewCategoryModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">Add New Category</h3>
          <button
            onClick={() => setShowNewCategoryModal(false)}
            className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Category Name*</label>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Beverages"
              className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Description</label>
            <textarea
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Category Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {availableIcons.map((iconObj) => {
                const IconComp = iconObj.icon;
                const isSelected = newCategoryIcon === iconObj.name;
                return (
                  <button
                    key={iconObj.name}
                    onClick={() => setNewCategoryIcon(iconObj.name)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/20'
                        : 'border-border bg-muted hover:bg-teal-500/10 hover:border-teal-400'
                    }`}
                  >
                    <IconComp 
                      size={20} 
                      className={`mx-auto transition-colors ${
                        isSelected ? 'text-teal-600' : 'text-foreground'
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
          <h3 className="text-lg font-semibold text-card-foreground">Edit Category</h3>
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
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Category Name*</label>
            <input
              value={editingCategory.name}
              onChange={(e) =>
                setEditingCategory({ ...editingCategory, name: e.target.value })
              }
              className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Description</label>
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
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Category Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {availableIcons.map((iconObj) => {
                const IconComp = iconObj.icon;
                const isSelected = editingCategory.icon_name === iconObj.name;
                return (
                  <button
                    key={iconObj.name}
                    onClick={() => setEditingCategory({ ...editingCategory, icon_name: iconObj.name })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/20'
                        : 'border-border bg-muted hover:bg-teal-500/10 hover:border-teal-400'
                    }`}
                  >
                    <IconComp 
                      size={20} 
                      className={`mx-auto transition-colors ${
                        isSelected ? 'text-teal-600' : 'text-foreground'
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

  {/* NEW PRODUCT MODAL */}
  {showNewProductModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">Add New Product</h3>
          <button
            onClick={() => {
              setShowNewProductModal(false);
              setNewProductData({
                baseName: "",
                sizes: [{ size: "Regular", price: "" }],
              });
            }}
            className="bg-transparent border-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Product name"
            value={newProductData.baseName}
            onChange={(e) =>
              setNewProductData({ ...newProductData, baseName: e.target.value })
            }
            className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm mb-4 outline-none"
          />
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Sizes & Prices</label>
              <button
                onClick={() =>
                  setNewProductData({
                    ...newProductData,
                    sizes: [...newProductData.sizes, { size: "", price: "" }],
                  })
                }
                className="text-teal-500 hover:text-teal-600 transition-colors p-1"
              >
                <Plus size={18} />
              </button>
            </div>
            {newProductData.sizes.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Size (e.g., Regular)"
                  value={s.size}
                  onChange={(e) => {
                    const copy = [...newProductData.sizes];
                    copy[idx].size = e.target.value;
                    setNewProductData({ ...newProductData, sizes: copy });
                  }}
                  className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                />
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
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowNewProductModal(false);
                setNewProductData({
                  baseName: "",
                  sizes: [{ size: "Regular", price: "" }],
                });
              }}
              className="flex-1 bg-muted border border-border text-foreground hover:bg-secondary transition-colors px-4 py-2.5 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProduct}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors border-none px-4 py-2.5 rounded-lg text-sm"
            >
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* EDIT PRODUCT MODAL - WITH PENCIL EDIT BEFORE DELETE */}
  {showEditProductModal && editingProductGroup && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">Edit Product</h3>
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
          className="w-full bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 text-sm mb-4 outline-none"
        />

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Sizes & Prices</label>
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
                // EDIT MODE - Show input fields
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Size (e.g., Regular)"
                    value={s.size}
                    onChange={(e) => {
                      const copy = [...editingProductGroup.sizes];
                      copy[idx].size = e.target.value;
                      setEditingProductGroup({
                        ...editingProductGroup,
                        sizes: copy,
                      });
                    }}
                    className="flex-1 bg-muted text-foreground border border-border rounded-lg px-3 py-2 text-sm outline-none"
                  />
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
                // VIEW MODE - Show display with pencil edit button
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
                  <div className="flex-1">
                    <span className="text-foreground text-sm font-medium">{s.size}</span>
                    <span className="text-foreground text-sm ml-2">₹{s.price}</span>
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
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white transition-colors border-none px-4 py-2.5 rounded-lg text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )}
</div>);
};
export default Menu;