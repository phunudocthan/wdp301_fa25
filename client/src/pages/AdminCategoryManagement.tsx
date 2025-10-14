// import React, { useState, useEffect } from "react";
// import {
//   Plus,
//   Edit,
//   Trash2,
//   Search,
//   Filter,
//   ChevronDown,
//   ChevronRight,
//   Power,
// } from "lucide-react";
// import categoryAdminAPI, {
//   Category,
//   CategoryStats,
// } from "../api/categoryAdmin";
// import CategoryForm from "../components/CategoryForm";
// import "../styles/AdminCategoryManagement.css";

// import { useNavigate } from "react-router-dom";

// const AdminCategoryManagement: React.FC = () => {
//   const navigate = useNavigate();
//   // ...existing code...
// // 
//   const fetchCategories = async () => {
//     try {
//       setLoading(true);
//       const params = {
//         page: currentPage,
//         limit: itemsPerPage,
//         search: searchTerm || undefined,
//         isActive:
//           statusFilter === "all" ? undefined : statusFilter === "active",
//         parentId: "", // Chỉ lấy danh mục cha (không có parentId)
//       };

//       const response = await categoryAdminAPI.getCategories(params);
//       // Lọc chỉ lấy danh mục cha và gọi API riêng để lấy danh mục con khi cần
//       const parentCategories = response.data.filter((cat) => !cat.parentId);
//       setCategories(parentCategories);
//       setTotalPages(response.pagination.pages);
//       setTotalCategories(response.pagination.total);
//     } catch (error) {
//       console.error("Error fetching categories:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const response = await categoryAdminAPI.getCategoryStats();
//       setStats(response.data);
//     } catch (error) {
//       console.error("Error fetching stats:", error);
//     }
//   };

//   const handleToggleStatus = async (id: string, currentStatus: boolean) => {
//     try {
//       await categoryAdminAPI.toggleCategoryStatus(id, !currentStatus);
//       fetchCategories();
//       fetchStats();
//     } catch (error) {
//       console.error("Error toggling status:", error);
//     }
//   };

//   const handleDeleteCategory = async (id: string) => {
//     if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
//       try {
//         await categoryAdminAPI.deleteCategory(id);
//         fetchCategories();
//         fetchStats();
//       } catch (error) {
//         console.error("Error deleting category:", error);
//         alert("Không thể xóa danh mục này. Có thể nó đang được sử dụng.");
//       }
//     }
//   };

//   // Load subcategories for a parent category
//   const loadSubcategories = async (parentId: string) => {
//     try {
//       const response = await categoryAdminAPI.getCategories({
//         parentId: parentId,
//         limit: 100, // Lấy nhiều subcategories
//       });

//       // Cập nhật categories để thêm subcategories
//       setCategories((prev) =>
//         prev.map((cat) =>
//           cat._id === parentId ? { ...cat, subcategories: response.data } : cat
//         )
//       );
//     } catch (error) {
//       console.error("Error loading subcategories:", error);
//     }
//   };

//   const toggleExpanded = async (categoryId: string) => {
//     const newExpanded = new Set(expandedCategories);
//     if (newExpanded.has(categoryId)) {
//       newExpanded.delete(categoryId);
//      return (
//        <div className="flex min-h-screen">
//          <AdminSidebar />
//          <div className="flex-1">
//            <div className="admin-categories">
//              {/* Back Button */}
//              <div className="mb-4">
//                <button
//                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
//                  onClick={() => navigate('/admin/dashboard')}
//                >
//                  ← Quay về Admin Dashboard
//                </button>
//              </div>
//              {/* Header */}
//              <div className="admin-categories-header">
//                <div>
//                  <h1>Quản lý danh mục</h1>
//                  <p style={{ margin: "5px 0 0 0", color: "#666" }}>
//                    Quản lý danh mục sản phẩm và cấu trúc phân cấp
//                  </p>
//                </div>
//                <button
//                  onClick={() => setShowCreateForm(true)}
//                  className="btn btn-primary"
//                >
//                  <Plus size={16} />
//                  Thêm danh mục mới
//                </button>
//              </div>
//           <td style={{ paddingLeft: `${level * 20 + 12}px` }}>
//             <div className="category-info">
//               {mightHaveSubcategories && (
//                 <button
//                   onClick={() => toggleExpanded(category._id)}
//                   className="expand-btn"
//                   title={
//                     hasSubcategories
//                       ? `${
//                           hasSubcategories ? category.subcategories?.length : 0
//                         } danh mục con`
//                       : "Xem danh mục con"
//                   }
//                 >
//                   {isExpanded ? (
//                     <ChevronDown size={16} />
//                   ) : (
//                     <ChevronRight size={16} />
//                   )}
//                 </button>
//               )}
//               {category.image && (
//                 <img
//                   src={`http://localhost:5000${category.image}`}
//                   alt={category.name}
//                   className="category-image"
//                 />
//               )}
//               <div className="category-details">
//                 <h4>
//                   {category.name}
//                   {level === 0 && hasSubcategories && (
//                     <span className="subcategory-count">
//                       {category.subcategories?.length} con
//                     </span>
//                   )}
//                 </h4>
//                 <p>{category.slug}</p>
//               </div>
//             </div>
//           </td>
//           <td>{category.description || "Không có mô tả"}</td>
//           <td>
//             <span
//               className={`status-badge ${
//                 category.isActive ? "status-active" : "status-inactive"
//               }`}
//             >
//               {category.isActive ? "Hoạt động" : "Tạm dừng"}
//             </span>
//           </td>
//           <td>{category.productCount || 0}</td>
//           <td>{category.order}</td>
//           <td>{new Date(category.createdAt).toLocaleDateString("vi-VN")}</td>
//           <td>
//             <div className="actions">
//               <button
//                 onClick={() =>
//                   handleToggleStatus(category._id, category.isActive)
//                 }
//                 className={`action-btn btn-toggle ${
//                   category.isActive ? "active" : "inactive"
//                 }`}
//                 title={category.isActive ? "Tắt hoạt động" : "Bật hoạt động"}
//               >
//                 {category.isActive ? (
//                   <Power color="green" size={14} />
//                 ) : (
//                   <Power color="gray" size={14} />
//                 )}
//               </button>
//               <button
//                 onClick={() => setEditingCategory(category)}
//                 className="action-btn btn-edit"
//                 title="Chỉnh sửa"
//               >
//                 <Edit size={14} />
//               </button>
//               <button
//                 onClick={() => handleDeleteCategory(category._id)}
//                 className="action-btn btn-delete"
//                 title="Xóa"
//               >
//                 <Trash2 size={14} />
//               </button>
//             </div>
//           </td>
//         </tr>
//         {hasSubcategories &&
//           isExpanded &&
//           category.subcategories?.map((subcategory) =>
//             renderCategoryRow(subcategory, level + 1)
//           )}
//       </React.Fragment>
//     );
//   };

//   if (loading && categories.length === 0) {
//     return (
//       <div className="admin-categories-loading">
//         <div className="loading-spinner"></div>
//         <p>Đang tải danh mục...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="admin-categories">
//       {/* Header */}
//       <div className="admin-categories-header">
//         <div>
//           <h1>Quản lý danh mục</h1>
//           <p style={{ margin: "5px 0 0 0", color: "#666" }}>
//             Quản lý danh mục sản phẩm và cấu trúc phân cấp
//           </p>
//         </div>
//         <button
//           onClick={() => setShowCreateForm(true)}
//           className="btn btn-primary"
//         >
//           <Plus size={16} />
//           Thêm danh mục mới
//         </button>
//       </div>

//       {/* Stats Cards */}
//       {stats && (
//         <div className="category-stats">
//           <div className="stat-card stat-total">
//             <div className="stat-icon">📋</div>
//             <div className="stat-content">
//               <h3>Tổng danh mục</h3>
//               <p>{stats.totalCategories}</p>
//             </div>
//           </div>

//           <div className="stat-card stat-active">
//             <div className="stat-icon">✅</div>
//             <div className="stat-content">
//               <h3>Đang hoạt động</h3>
//               <p>{stats.activeCategories}</p>
//             </div>
//           </div>

//           <div className="stat-card stat-parent">
//             <div className="stat-icon">📁</div>
//             <div className="stat-content">
//               <h3>Danh mục cha</h3>
//               <p>{stats.parentCategories}</p>
//             </div>
//           </div>

//           <div className="stat-card stat-sub">
//             <div className="stat-icon">📂</div>
//             <div className="stat-content">
//               <h3>Danh mục con</h3>
//               <p>{stats.subcategories}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="filters-container">
//         <div className="filters-grid">
//           <div className="filter-group">
//             <label>Tìm kiếm danh mục</label>
//             <div className="search-container">
//               <input
//                 type="text"
//                 placeholder="Nhập tên hoặc mô tả danh mục..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="search-input"
//               />
//               <Search className="search-icon" size={16} />
//             </div>
//           </div>

//           <div className="filter-group">
//             <label>Trạng thái</label>
//             <select
//               value={statusFilter}
//               onChange={(e) =>
//                 setStatusFilter(e.target.value as "all" | "active" | "inactive")
//               }
//               className="filter-select"
//             >
//               <option value="all">Tất cả trạng thái</option>
//               <option value="active">Đang hoạt động</option>
//               <option value="inactive">Tạm dừng</option>
//             </select>
//           </div>

//           <div className="filter-group">
//             <label>Sắp xếp</label>
//             <select className="sort-select">
//               <option value="name_asc">Tên A-Z</option>
//               <option value="name_desc">Tên Z-A</option>
//               <option value="createdAt_desc">Mới nhất</option>
//               <option value="createdAt_asc">Cũ nhất</option>
//             </select>
//           </div>

//           <div className="filter-group">
//             <button
//               onClick={() => {
//                 setSearchTerm("");
//                 setStatusFilter("all");
//                 setCurrentPage(1);
//               }}
//               className="btn btn-secondary"
//             >
//               <Filter size={16} />
//               Xóa bộ lọc
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Categories Table */}
//       <div className="categories-table">
//         <div className="table-container">
//           <table>
//             <thead>
//               <tr>
//                 <th>Tên danh mục</th>
//                 <th>Mô tả</th>
//                 <th>Trạng thái</th>
//                 <th>Số sản phẩm</th>
//                 <th>Thứ tự</th>
//                 <th>Ngày tạo</th>
//                 <th>Thao tác</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={7} className="categories-loading">
//                     <div className="loading-spinner"></div>
//                     <p>Đang tải dữ liệu...</p>
//                   </td>
//                 </tr>
//               ) : categories.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={7}
//                     style={{ textAlign: "center", padding: "40px" }}
//                   >
//                     <p style={{ color: "#666", fontSize: "16px" }}>
//                       Không tìm thấy danh mục nào
//                     </p>
//                   </td>
//                 </tr>
//               ) : (
//                 categories.map((category) => renderCategoryRow(category))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="pagination">
//           <button
//             disabled={currentPage === 1}
//             onClick={() => setCurrentPage(currentPage - 1)}
//             className="btn btn-secondary"
//           >
//             Trước
//           </button>

//           <span className="pagination-info">
//             Trang {currentPage} / {totalPages} (Tổng: {totalCategories} danh
//             mục)
//           </span>

//           <button
//             disabled={currentPage === totalPages}
//             onClick={() => setCurrentPage(currentPage + 1)}
//             className="btn btn-secondary"
//           >
//             Sau
//           </button>
//         </div>
//       )}

//       {/* Create/Edit Form Modal */}
//       {(showCreateForm || editingCategory) && (
//         <CategoryForm
//           category={editingCategory}
//           onClose={() => {
//             setShowCreateForm(false);
//             setEditingCategory(null);
//           }}
//           onSuccess={() => {
//             fetchCategories();
//             fetchStats();
//             setShowCreateForm(false);
//             setEditingCategory(null);
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default AdminCategoryManagement;
