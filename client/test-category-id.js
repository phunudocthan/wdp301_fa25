console.log("🧪 Testing category update issue...");

// Kiểm tra xem categories có được load đúng không
fetch("/api/categories/tree")
  .then((response) => response.json())
  .then((data) => {
    console.log("Categories loaded:", data.data);

    if (data.data && data.data.length > 0) {
      const testCategory = data.data[0];
      console.log("Test category:", testCategory);
      console.log("Category ID:", testCategory._id);
      console.log("ID type:", typeof testCategory._id);
      console.log("ID length:", testCategory._id.length);

      // Test URL construction
      const testUrl = `/api/categories/${testCategory._id}`;
      console.log("Test URL:", testUrl);

      // Test individual category fetch
      return fetch(testUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  })
  .then((response) => {
    if (response) {
      console.log("Individual category fetch status:", response.status);
      return response.json();
    }
  })
  .then((categoryData) => {
    if (categoryData) {
      console.log("Individual category data:", categoryData);
    }
  })
  .catch((error) => {
    console.error("Test error:", error);
  });
