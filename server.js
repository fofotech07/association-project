import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000; // Render يحدد هذا تلقائيًا

// إعداد مجلد public للملفات الثابتة
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مسار ملف البيانات
const DATA_FILE = path.join(process.cwd(), "data.json");

// POST endpoint لتسجيل البيانات
app.post("/register", (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: "الرجاء ملء جميع الحقول" });
  }

  const newEntry = { name, email, phone, date: new Date().toISOString() };

  let entries = [];
  if (fs.existsSync(DATA_FILE)) {
    const fileData = fs.readFileSync(DATA_FILE, "utf8");
    if (fileData) entries = JSON.parse(fileData);
  }

  entries.push(newEntry);

  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));

  console.log("✅ تم حفظ تسجيل جديد:", newEntry);
  res.json({ message: "تم التسجيل بنجاح ✅" });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
