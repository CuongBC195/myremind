"use client";

export default function TestPage() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1 style={{ color: "red", fontSize: "24px" }}>Test Page</h1>
      <p>Nếu bạn thấy trang này với chữ đỏ, CSS đang hoạt động!</p>
      <button
        onClick={() => alert("JavaScript hoạt động!")}
        style={{
          padding: "10px 20px",
          backgroundColor: "blue",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Test JavaScript
      </button>
    </div>
  );
}

